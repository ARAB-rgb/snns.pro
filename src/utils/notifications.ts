// Browser Notification Utility

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'default';
  }
};

export const areNotificationsEnabled = (): boolean => {
  if (!isNotificationSupported()) return false;
  const saved = localStorage.getItem('notifications_enabled_state');
  if (saved === 'false') return false;
  // Default to true if permission is granted
  return Notification.permission === 'granted';
};

export const setNotificationsEnabled = (enabled: boolean) => {
  localStorage.setItem('notifications_enabled_state', enabled ? 'true' : 'false');
};

export interface ShowNotificationParams {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

export const showBrowserNotification = (params: ShowNotificationParams) => {
  if (!isNotificationSupported()) return;
  if (!areNotificationsEnabled()) return;
  if (Notification.permission !== 'granted') return;

  try {
    const options: NotificationOptions = {
      body: params.body,
      icon: params.icon || 'https://cdn-icons-png.flaticon.com/512/134/134937.png',
      tag: params.tag || 'new-message',
      badge: 'https://cdn-icons-png.flaticon.com/512/134/134937.png',
      dir: 'rtl',
    };

    const notification = new Notification(params.title, options);
    notification.onclick = () => {
      window.focus();
    };
  } catch (err) {
    console.error('Error showing browser notification:', err);
  }
};
