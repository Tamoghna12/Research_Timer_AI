import { useEffect, useRef, useCallback } from 'react';
// import { useAccurateTimer } from './useAccurateTimer'; // Available for future use

export interface BackgroundTimerOptions {
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
  enableNotifications?: boolean;
}

export function useBackgroundTimer(options: BackgroundTimerOptions = {}) {
  const { onTick, enableNotifications = true } = options;
  // const onComplete is available in options for future use
  const visibilityChangeRef = useRef<(() => void) | null>(null);
  const notificationPermissionRef = useRef<NotificationPermission>('default');

  // Request notification permission
  useEffect(() => {
    if (enableNotifications && 'Notification' in window) {
      Notification.requestPermission().then(permission => {
        notificationPermissionRef.current = permission;
      });
    }
  }, [enableNotifications]);

  // Handle page visibility changes to keep timer accurate
  const handleVisibilityChange = useCallback(() => {
    // Timer accuracy is handled by useAccurateTimer using Date.now()
    // This just ensures we update UI when page becomes visible again
    if (!document.hidden && onTick) {
      // Timer will update automatically through its interval
    }
  }, [onTick]);

  useEffect(() => {
    visibilityChangeRef.current = handleVisibilityChange;
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  const showNotification = useCallback((title: string, body: string, options?: NotificationOptions) => {
    if (!enableNotifications || !('Notification' in window)) return;

    if (notificationPermissionRef.current === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'research-timer',
        requireInteraction: true,
        ...options
      });

      // Auto-close notification after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      return notification;
    }
  }, [enableNotifications]);

  return {
    showNotification,
    notificationPermission: notificationPermissionRef.current,
    isDocumentHidden: () => document.hidden
  };
}