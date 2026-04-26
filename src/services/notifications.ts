import { Platform } from 'react-native';
import { IS_EXPO_GO } from '../utils/env';

const ANDROID_CHANNEL_ID = 'daily';

/**
 * Returns the expo-notifications module only in real builds.
 * In Expo Go (SDK 53+) remote-push infrastructure crashes on import,
 * so we lazy-require it only when IS_EXPO_GO is false.
 */
function getN() {
  if (IS_EXPO_GO) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as typeof import('expo-notifications');
}

export async function ensureNotificationSetup(): Promise<boolean> {
  const N = getN();
  if (!N) return false;

  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Daily reminders',
      importance: N.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const current = await N.getPermissionsAsync();
  if (current.status === 'granted') return true;

  const req = await N.requestPermissionsAsync();
  return req.status === 'granted';
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<string> {
  const N = getN();
  if (!N) return '';

  const trigger: import('expo-notifications').DailyTriggerInput = {
    type: N.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  };

  return N.scheduleNotificationAsync({
    content: {
      title: 'Crypto check-in',
      body: "Check your portfolio & today's movers.",
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger,
  });
}

export async function cancelReminder(id: string): Promise<void> {
  await getN()?.cancelScheduledNotificationAsync(id);
}

export async function cancelAllReminders(): Promise<void> {
  await getN()?.cancelAllScheduledNotificationsAsync();
}

export async function scheduleTestNotification(): Promise<void> {
  const N = getN();
  if (!N) return;

  await N.scheduleNotificationAsync({
    content: {
      title: 'Test notification',
      body: 'It works 🚀',
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 10,
      repeats: false,
    },
  });
}

export async function showTestNow(): Promise<string> {
  const N = getN();
  if (!N) return '';

  return N.scheduleNotificationAsync({
    content: {
      title: 'Test NOW',
      body: 'If you see this — notifications work ✅',
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 1,
      repeats: false,
    },
  });
}
