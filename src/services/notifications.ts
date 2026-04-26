import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ANDROID_CHANNEL_ID = 'daily';

export async function ensureNotificationSetup(): Promise<boolean> {
  // Android: создаём канал
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  // permissions
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;

  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<string> {
  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  };

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Crypto check-in',
      body: 'Check your portfolio & today’s movers.',
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger,
  });

  return id;
}

export async function cancelReminder(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test notification',
      body: 'It works 🚀',
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
      repeats: false,
    },
  });
}

export async function showTestNow(): Promise<string> {
  // Самый стабильный вариант вместо trigger: null
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test NOW',
      body: 'If you see this — notifications work ✅',
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      repeats: false,
    },
  });

  return id;
}
