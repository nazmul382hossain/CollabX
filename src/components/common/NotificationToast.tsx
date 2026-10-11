import React, { useState, useEffect } from 'react';
import { MessageSquare, Bell, ArrowRight, X } from 'lucide-react';
import { NotificationItem, User } from '../../types';

interface NotificationToastProps {
  currentUser: User | null;
  onNavigate: (path: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ currentUser, onNavigate }) => {
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  useEffect(() => {
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationItem>;
      const notif = customEvent.detail;
      if (!notif || !currentUser) return;

      // Only show to the intended recipient
      if (notif.userId === currentUser.id) {
        setActiveToast(notif);
      }
    };

    window.addEventListener('collabx_new_notification', handleNewNotification);
    return () => {
      window.removeEventListener('collabx_new_notification', handleNewNotification);
    };
  }, [currentUser]);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  if (!activeToast || !currentUser) return null;

  return (
    <div className="fixed top-18 sm:top-20 right-4 z-50 max-w-sm w-full bg-white rounded-2xl border-2 border-[#0B6BE6]/30 shadow-2xl p-4 animate-fade-in transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#DEEBFB] text-[#0B6BE6] flex items-center justify-center shrink-0">
          <MessageSquare className="w-5 h-5 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-[#0B2A55] truncate">{activeToast.title}</h4>
            <button
              onClick={() => setActiveToast(null)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">{activeToast.body}</p>

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => {
                const targetLink = activeToast.link;
                setActiveToast(null);
                onNavigate(targetLink);
              }}
              className="px-3 py-1 bg-[#0B6BE6] hover:bg-[#0956b8] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <span>Open Chat</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setActiveToast(null)}
              className="px-2.5 py-1 text-gray-500 hover:bg-gray-100 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
