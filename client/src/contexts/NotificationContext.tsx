import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/_core/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MessageNotification {
  messageId: number;
  senderId: number;
  content: string;
  subject?: string;
  timestamp: string;
}

interface NotificationContextType {
  unreadCount: number;
  notifications: MessageNotification[];
  markAsRead: (messageId: number) => void;
  clearAll: () => void;
  requestPermission: () => Promise<void>;
  hasPermission: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<MessageNotification[]>([]);
  const [hasPermission, setHasPermission] = useState(false);

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setHasPermission(permission === 'granted');
    }
  }, []);

  // Check existing permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to WebSocket server
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to notification server');
      // Register user for notifications
      newSocket.emit('register-user', { userId: user.id });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });

    // Listen for new message notifications
    newSocket.on(`user:${user.id}:new-message`, (data: MessageNotification) => {
      console.log('New message notification received:', data);
      
      // Add to notifications list
      setNotifications(prev => [data, ...prev]);

      // Show in-app toast notification
      toast({
        title: 'رسالة جديدة',
        description: data.content.substring(0, 100) + (data.content.length > 100 ? '...' : ''),
        duration: 5000,
      });

      // Show browser notification if permitted
      if (hasPermission && 'Notification' in window) {
        const notification = new Notification('رسالة جديدة - My Doctor طبيبي', {
          body: data.content.substring(0, 100),
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `message-${data.messageId}`,
        });

        notification.onclick = () => {
          window.focus();
          // Navigate to messages page
          window.location.href = '/clinician/messages';
          notification.close();
        };
      }

      // Play notification sound (optional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Could not play notification sound:', e));
      } catch (e) {
        console.log('Notification sound not available');
      }
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('unregister-user', { userId: user.id });
        newSocket.disconnect();
      }
    };
  }, [user, toast, hasPermission]);

  const markAsRead = useCallback((messageId: number) => {
    setNotifications(prev => prev.filter(n => n.messageId !== messageId));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.length;

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        markAsRead,
        clearAll,
        requestPermission,
        hasPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
