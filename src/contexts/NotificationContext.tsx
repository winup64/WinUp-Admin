import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Notification } from '../components/ui/NotificationToast';
import { generateId } from '../utils';

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  showSuccess: (title: string, message: string, duration?: number, action?: Notification['action']) => void;
  showError: (title: string, message: string, duration?: number, action?: Notification['action']) => void;
  showWarning: (title: string, message: string, duration?: number, action?: Notification['action']) => void;
  showInfo: (title: string, message: string, duration?: number, action?: Notification['action']) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  // Nuevas funciones mejoradas
  showPersistentNotification: (notification: Omit<Notification, 'id' | 'duration'>) => void;
  showNotificationWithAction: (notification: Omit<Notification, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
    };
    
    setNotifications(prev => [...prev, newNotification]);
  };

  const showSuccess = (title: string, message: string, duration = 5000, action?: Notification['action']) => {
    showNotification({
      type: 'success',
      title,
      message,
      duration,
      action,
    });
  };

  const showError = (title: string, message: string, duration = 7000, action?: Notification['action']) => {
    showNotification({
      type: 'error',
      title,
      message,
      duration,
      action,
    });
  };

  const showWarning = (title: string, message: string, duration = 6000, action?: Notification['action']) => {
    showNotification({
      type: 'warning',
      title,
      message,
      duration,
      action,
    });
  };

  const showInfo = (title: string, message: string, duration = 5000, action?: Notification['action']) => {
    showNotification({
      type: 'info',
      title,
      message,
      duration,
      action,
    });
  };

  // Notificaciones persistentes (no se auto-cierran)
  const showPersistentNotification = (notification: Omit<Notification, 'id' | 'duration'>) => {
    showNotification({
      ...notification,
      duration: 0, // 0 = persistente
    });
  };

  // Notificaciones con acciones
  const showNotificationWithAction = (notification: Omit<Notification, 'id'>) => {
    showNotification({
      ...notification,
      duration: notification.duration || 0, // Si no se especifica, es persistente
    });
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const value: NotificationContextType = {
    notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAllNotifications,
    showPersistentNotification,
    showNotificationWithAction,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
