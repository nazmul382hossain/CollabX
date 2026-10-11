import { collection, doc, setDoc, updateDoc, onSnapshot, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { Message, NotificationItem } from '../types';
import { db } from './firebaseAuth';
import { storage } from './storage';
import { SEED_MESSAGES, SEED_NOTIFICATIONS } from '../data/seedData';

class MessagingService {
  /**
   * Sends a message, saves it locally and in Firestore, and automatically creates
   * notifications for all team collaborators / recipients so they immediately receive it!
   */
  async sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    const newMsg: Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: 'Just now'
    };

    // 1. Save to local storage messages, ensuring seed messages are retained
    const rawMsgs = localStorage.getItem('collabx_messages');
    let allMsgs: Message[] = [];
    if (rawMsgs) {
      try {
        allMsgs = JSON.parse(rawMsgs);
      } catch {
        allMsgs = SEED_MESSAGES;
      }
    } else {
      allMsgs = [...SEED_MESSAGES];
    }

    allMsgs.push(newMsg);
    localStorage.setItem('collabx_messages', JSON.stringify(allMsgs));
    try {
      window.dispatchEvent(new CustomEvent('collabx_storage_change', { detail: { eventType: 'message_sent' } }));
    } catch {
      // no-op
    }

    // 2. Identify all recipients who should receive a notification
    const recipientIds = new Set<string>();

    if (message.recipientId && message.recipientId !== message.senderId) {
      recipientIds.add(message.recipientId);
    } else {
      const project = storage.getProject(message.projectId);
      const team = storage.getTeamMembers(message.projectId);

      // Notify project supervisor if they are not the sender
      if (project && project.supervisorId && project.supervisorId !== message.senderId) {
        recipientIds.add(project.supervisorId);
      }

      // Notify all team collaborators if they are not the sender
      team.forEach(m => {
        if (m.userId && m.userId !== message.senderId) {
          recipientIds.add(m.userId);
        }
      });
    }

    const project = storage.getProject(message.projectId);
    const projectTitle = project?.title || 'Project Workspace';
    const messagePreview = message.body.length > 90 
      ? message.body.substring(0, 90) + '...' 
      : message.body;

    const createdNotifications: NotificationItem[] = [];

    // 3. Create a notification for each recipient
    recipientIds.forEach(targetUserId => {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: targetUserId,
        type: 'new_message',
        title: message.recipientId ? `Direct Message from ${message.senderName}` : `New Message from ${message.senderName}`,
        body: `[${projectTitle}]: ${messagePreview}`,
        link: `/projects/${message.projectId}/discussion`,
        isRead: false,
        createdAt: 'Just now'
      };

      // Add to local notifications
      storage.addNotification(notif);
      createdNotifications.push(notif);

      // Dispatch real-time in-app notification event
      try {
        window.dispatchEvent(new CustomEvent('collabx_new_notification', { detail: notif }));
      } catch {
        // no-op
      }
    });

    // 4. Sync to Firestore if authenticated & available
    if (db) {
      try {
        // Save message document in Firestore
        await setDoc(doc(db, 'messages', newMsg.id), {
          id: newMsg.id,
          projectId: newMsg.projectId,
          senderId: newMsg.senderId,
          senderName: newMsg.senderName,
          senderAvatar: newMsg.senderAvatar,
          recipientId: newMsg.recipientId || null,
          isSupervisor: Boolean(newMsg.isSupervisor),
          body: newMsg.body,
          timestamp: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          attachment: newMsg.attachment || null
        });

        // Save notification documents in Firestore
        for (const notif of createdNotifications) {
          await setDoc(doc(db, 'notifications', notif.id), {
            id: notif.id,
            userId: notif.userId,
            type: notif.type,
            title: notif.title,
            body: notif.body,
            link: notif.link,
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('Notice: Firestore message sync fallback:', err);
      }
    }

    return newMsg;
  }

  /**
   * Real-time subscription to project messages.
   * Merges Firestore messages with local storage to guarantee messages are never missed.
   */
  subscribeToProjectMessages(
    projectId: string, 
    onUpdate: (messages: Message[]) => void
  ): () => void {
    // 1. Initial emit from local storage
    const initialList = storage.getMessages(projectId);
    onUpdate(initialList);

    // 2. Listen to local storage events
    const handleStorageChange = () => {
      const updatedList = storage.getMessages(projectId);
      onUpdate(updatedList);
    };
    window.addEventListener('collabx_storage_change', handleStorageChange);

    // 3. Real-time Firestore onSnapshot if available
    let unsubscribeFirestore: (() => void) | null = null;
    if (db) {
      try {
        const q = query(
          collection(db, 'messages'),
          where('projectId', '==', projectId)
        );
        unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          const remoteMsgs: Message[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            remoteMsgs.push({
              id: data.id || docSnap.id,
              projectId: data.projectId,
              senderId: data.senderId,
              senderName: data.senderName,
              senderAvatar: data.senderAvatar,
              recipientId: data.recipientId || undefined,
              isSupervisor: data.isSupervisor,
              body: data.body,
              timestamp: data.timestamp ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
              attachment: data.attachment
            });
          });

          if (remoteMsgs.length > 0) {
            // Merge with local messages uniquely by ID
            const local = storage.getMessages(projectId);
            const map = new Map<string, Message>();
            local.forEach(m => map.set(m.id, m));
            remoteMsgs.forEach(m => map.set(m.id, m));
            const merged = Array.from(map.values());
            onUpdate(merged);
          }
        }, (err) => {
          console.warn('Firestore messages subscription notice:', err);
        });
      } catch {
        // fallback
      }
    }

    return () => {
      window.removeEventListener('collabx_storage_change', handleStorageChange);
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }

  /**
   * Real-time subscription to user notifications.
   * Automatically updates unread notification counts and receives live notifications.
   */
  subscribeToUserNotifications(
    userId: string, 
    onUpdate: (notifications: NotificationItem[]) => void
  ): () => void {
    // 1. Initial emit from local storage
    const initialList = storage.getNotifications(userId);
    onUpdate(initialList);

    // 2. Listen to local storage events
    const handleStorageChange = () => {
      const updatedList = storage.getNotifications(userId);
      onUpdate(updatedList);
    };
    window.addEventListener('collabx_storage_change', handleStorageChange);

    // 3. Real-time Firestore onSnapshot if available
    let unsubscribeFirestore: (() => void) | null = null;
    if (db) {
      try {
        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId)
        );
        unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          const remoteNotifs: NotificationItem[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            remoteNotifs.push({
              id: data.id || docSnap.id,
              userId: data.userId,
              type: data.type || 'new_message',
              title: data.title || 'Notification',
              body: data.body || '',
              link: data.link || '/notifications',
              isRead: Boolean(data.isRead),
              createdAt: data.createdAt ? 'Recently' : 'Just now'
            });
          });

          if (remoteNotifs.length > 0) {
            const local = storage.getNotifications(userId);
            const map = new Map<string, NotificationItem>();
            local.forEach(n => map.set(n.id, n));
            remoteNotifs.forEach(n => map.set(n.id, n));
            const merged = Array.from(map.values());
            onUpdate(merged);
          }
        }, (err) => {
          console.warn('Firestore notifications subscription notice:', err);
        });
      } catch {
        // fallback
      }
    }

    return () => {
      window.removeEventListener('collabx_storage_change', handleStorageChange);
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }

  /**
   * Mark a notification as read both locally and in Firestore
   */
  async markAsRead(id: string): Promise<void> {
    storage.markNotificationAsRead(id);
    if (db) {
      try {
        await updateDoc(doc(db, 'notifications', id), { isRead: true });
      } catch {
        // no-op
      }
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    storage.markAllNotificationsAsRead(userId);
    if (db) {
      const firestore = db;
      try {
        const q = query(collection(firestore, 'notifications'), where('userId', '==', userId), where('isRead', '==', false));
        const snapshot = await getDocs(q);
        snapshot.forEach(async (d) => {
          await updateDoc(doc(firestore, 'notifications', d.id), { isRead: true }).catch(() => {});
        });
      } catch {
        // no-op
      }
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string): Promise<void> {
    const raw = localStorage.getItem('collabx_notifications');
    if (raw) {
      try {
        const all: NotificationItem[] = JSON.parse(raw);
        const filtered = all.filter(n => n.id !== id);
        localStorage.setItem('collabx_notifications', JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('collabx_storage_change', { detail: { eventType: 'notification_updated' } }));
      } catch {
        // no-op
      }
    }
    if (db) {
      const firestore = db;
      try {
        await deleteDoc(doc(firestore, 'notifications', id));
      } catch {
        // no-op
      }
    }
  }
}

export const messagingService = new MessagingService();
