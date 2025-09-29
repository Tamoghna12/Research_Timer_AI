export interface NotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.permission = Notification.permission;
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission();
      return this.permission;
    }
    return 'denied';
  }

  async notify(title: string, options: NotificationOptions = {}): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (this.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return false;
      }
    }

    try {
      const notification = new Notification(title, {
        body: options.body || '',
        icon: options.icon || '/vite.svg',
        tag: options.tag || 'research-timer',
        requireInteraction: options.requireInteraction || false,
      });

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => notification.close(), 5000);
      }

      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return false;
    }
  }

  get hasPermission(): boolean {
    return this.permission === 'granted';
  }

  get canRequestPermission(): boolean {
    return 'Notification' in window && this.permission !== 'denied';
  }
}

// Convenience function for session completion notifications
export async function notifySessionComplete(mode: string, plannedDuration: number): Promise<boolean> {
  const manager = NotificationManager.getInstance();

  return await manager.notify('Session Complete!', {
    body: `${mode} session finished (${Math.round(plannedDuration / 60000)} minutes)`,
    tag: 'session-complete',
    requireInteraction: false
  });
}

// Convenience function for break reminders
export async function notifyBreakTime(): Promise<boolean> {
  const manager = NotificationManager.getInstance();

  return await manager.notify('Take a Break!', {
    body: 'Time for a short break. Your focus session is complete.',
    tag: 'break-reminder',
    requireInteraction: false
  });
}