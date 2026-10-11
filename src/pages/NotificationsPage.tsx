import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Clock, 
  FolderGit2, 
  UserPlus, 
  BookOpen, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { User, NotificationItem } from '../types';
import { storage } from '../services/storage';
import { messagingService } from '../services/messagingService';

interface NotificationsPageProps {
  currentUser: User;
  onNavigate: (path: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ currentUser, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => storage.getNotifications(currentUser.id));

  // Reset scroll position instantly to top when arriving on Notifications page
  // and subscribe to real-time notifications (localStorage + Firestore)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const unsubscribe = messagingService.subscribeToUserNotifications(currentUser.id, (notifs) => {
      setNotifications(notifs);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser.id]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const readCount = notifications.filter(n => n.isRead).length;

  const filtered = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'read') return n.isRead;
    return true;
  });

  const handleMarkAllRead = async () => {
    await messagingService.markAllAsRead(currentUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleItemClick = async (item: NotificationItem) => {
    await messagingService.markAsRead(item.id);
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
    if (item.link) {
      onNavigate(item.link);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await messagingService.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application_approved':
        return { icon: CheckCircle2, color: '#0E9F6E', bg: '#DDF5EA' };
      case 'application_rejected':
        return { icon: XCircle, color: '#E53935', bg: '#FDE3E3' };
      case 'new_message':
        return { icon: MessageSquare, color: '#0D9488', bg: '#D9F3F0' };
      case 'deadline':
        return { icon: Clock, color: '#F05A28', bg: '#FFE9DC' };
      case 'new_project':
        return { icon: FolderGit2, color: '#0B6BE6', bg: '#DEEBFB' };
      case 'team_invite':
        return { icon: UserPlus, color: '#0E9F6E', bg: '#DDF5EA' };
      case 'paper_published':
        return { icon: BookOpen, color: '#5C54E5', bg: '#E9E9FB' };
      default:
        return { icon: Bell, color: '#4B5563', bg: '#E8EAF0' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-2 sm:p-4">
      {/* Header matching Screenshot 16 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B2A55] tracking-tight">Notifications</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Stay up to date with project feedback, deadlines, and team messages
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#E3EAF3] hover:bg-gray-50 text-xs font-bold text-[#0B6BE6] rounded-xl transition-all cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs matching Screenshot 16 */}
      <div className="flex items-center gap-2 border-b border-[#E3EAF3] pb-2 text-xs font-bold">
        {[
          { key: 'all', label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'read', label: `Read (${readCount})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#0E9F6E] text-white shadow-xs'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-[#E3EAF3]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List matching Screenshot 16 */}
      {filtered.length > 0 ? (
        <div className="bg-white rounded-3xl border border-[#E3EAF3] divide-y divide-[#E3EAF3] shadow-xs overflow-hidden">
          {filtered.map((item) => {
            const { icon: Icon, color, bg } = getNotificationIcon(item.type);

            return (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer group ${
                  !item.isRead ? 'bg-[#F5F8FC] hover:bg-[#ebf1fa]' : 'hover:bg-gray-50/50'
                }`}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Tinted rounded square icon from screenshot */}
                  <div
                    style={{ backgroundColor: bg, color }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm ${!item.isRead ? 'font-black text-[#0B2A55]' : 'font-bold text-gray-700'} truncate`}>
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#0E9F6E] shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-[11px] font-semibold text-gray-400">
                    <span>{item.createdAt}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteNotification(e, item.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E3EAF3] p-12 text-center space-y-3">
          <Bell className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-600">No notifications found.</p>
        </div>
      )}
    </div>
  );
};
