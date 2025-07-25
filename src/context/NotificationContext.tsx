import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export type NotificationType = 'info' | 'success' | 'error' | 'sync' | 'offline';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  duration?: number; // ms
  actionLabel?: string;
  onAction?: () => void;
}

interface NotificationContextType {
  notify: (notification: Omit<Notification, 'id'>) => void;
  remove: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

let notificationId = 0;

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = ++notificationId;
    setNotifications((prev) => [...prev, { ...notification, id }]);
    if (notification.duration !== 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, notification.duration || 3500);
    }
  }, []);

  const remove = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ notify, remove }}>
      {children}
      {/* Floating notification overlay */}
      <div
        aria-live="polite"
        className="fixed z-[9999] bottom-6 right-6 flex flex-col gap-2 items-end pointer-events-none"
        style={{ minWidth: 280 }}
      >
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium flex items-center gap-3 animate-fade-in-up ${
              n.type === 'error'
                ? 'bg-red-600'
                : n.type === 'success'
                ? 'bg-green-600'
                : n.type === 'sync'
                ? 'bg-cyan-700'
                : n.type === 'offline'
                ? 'bg-gray-700'
                : 'bg-zinc-800'
            }`}
            style={{ minWidth: 240, maxWidth: 360 }}
            role="alert"
          >
            <span>{n.message}</span>
            {n.actionLabel && n.onAction && (
              <button
                className="ml-2 px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-white font-semibold text-xs transition"
                onClick={n.onAction}
                tabIndex={0}
                style={{ pointerEvents: 'auto' }}
              >
                {n.actionLabel}
              </button>
            )}
            <button
              className="ml-2 px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs transition"
              onClick={() => remove(n.id)}
              tabIndex={0}
              style={{ pointerEvents: 'auto' }}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within a NotificationProvider');
  return ctx;
}; 