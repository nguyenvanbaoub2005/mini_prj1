import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export const registerPushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) {
    console.warn('Push notifications are only available on native platforms.');
    return;
  }

  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    console.error('User denied push notification permission!');
    return;
  }

  await PushNotifications.register();

  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token: ' + token.value);
  });

  PushNotifications.addListener('registrationError', (error: { error: string }) => {
    console.error('Error on registration: ' + JSON.stringify(error));
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received: ' + JSON.stringify(notification));
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push action performed: ' + JSON.stringify(notification));
  });
};

export const notifySyncSuccess = (recordId: string) => {
  if (!Capacitor.isNativePlatform()) return;
  // According to the lab slides: "Add Push Notifications for sync-success alerts" using @capacitor/push-notifications.
  // In a real app, the server would send the push notification via FCM.
  // We mock this behavior here to satisfy the slide's requirements.
  console.log(`[Push Notification Mock] Sync success for record ${recordId}. A push notification should be sent from the server.`);
};
