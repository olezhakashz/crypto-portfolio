// notifications.ts
// This file handles all push notification logic:
// - Asking the user for notification permission
// - Scheduling a daily reminder at a chosen time
// - Cancelling reminders
// - Sending a test notification for debugging
//
// IMPORTANT: Notifications are DISABLED when running inside Expo Go (the test app)
// because Expo Go doesn't support the full notification system (removed in SDK 53).
// They only work in a real standalone build.

import { Platform } from 'react-native'; // Used to check if we're on Android or iOS
import { IS_EXPO_GO } from '../utils/env'; // Check if we're running in Expo Go

const ANDROID_CHANNEL_ID = 'daily'; // Android requires notifications to belong to a "channel" — this is its ID

/**
 * getN: Safely imports the expo-notifications library.
 * We use a "lazy require" instead of a normal import because importing it at the
 * top of the file would CRASH the app when running inside Expo Go.
 * Returns null when inside Expo Go (so all functions below can safely bail out).
 */
function getN() {
  if (IS_EXPO_GO) return null; // Skip entirely inside Expo Go — not supported
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('expo-notifications') as typeof import('expo-notifications'); // Load the library dynamically
}

/**
 * Result from ensureNotificationSetup:
 * - 'granted'            → all good, notifications will work
 * - 'denied'             → user just denied the prompt (can be asked again)
 * - 'denied-permanently' → user denied AND canAskAgain is false — must open system settings
 * - 'unavailable'        → running in Expo Go or notifications not supported
 */
export type NotificationSetupResult =
  | 'granted'
  | 'denied'
  | 'denied-permanently'
  | 'unavailable';

/**
 * ensureNotificationSetup: checks (and requests) notification permission.
 * Also creates the Android notification channel if needed.
 * Returns a detailed result so the caller can guide the user appropriately.
 */
export async function ensureNotificationSetup(): Promise<NotificationSetupResult> {
  const N = getN();
  if (!N) return 'unavailable'; // We're in Expo Go — not supported

  if (Platform.OS === 'android') {
    // Android needs a "channel" set up before we can show notifications
    await N.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Daily reminders',                        // Display name shown in Android settings
      importance: N.AndroidImportance.DEFAULT,         // Normal priority (not silent, not heads-up)
      vibrationPattern: [0, 250, 250, 250],            // Vibration pattern: pause, buzz, pause, buzz
    });
  }

  // Check current permission status
  const current = await N.getPermissionsAsync();

  if (current.status === 'granted') return 'granted'; // Already have permission

  // If the system says we can't ask again, the user denied permanently —
  // the only option is to send them to the app's notification settings.
  if (current.canAskAgain === false) {
    return 'denied-permanently';
  }

  // Try requesting permission (shows the system dialog)
  const req = await N.requestPermissionsAsync();

  if (req.status === 'granted') return 'granted';

  // User just denied — check if they can be asked again next time
  return req.canAskAgain === false ? 'denied-permanently' : 'denied';
}

/**
 * scheduleDailyReminder: schedules a recurring notification at a specific time every day.
 * Returns the notification ID — save this so you can cancel it later.
 */
export async function scheduleDailyReminder(hour: number, minute: number): Promise<string> {
  const N = getN();
  if (!N) return ''; // Not supported in Expo Go

  // Define a DAILY trigger — fires every day at the given hour:minute
  const trigger: import('expo-notifications').DailyTriggerInput = {
    type: N.SchedulableTriggerInputTypes.DAILY,
    hour,   // 0–23 format (e.g., 20 = 8 PM)
    minute, // 0–59 format
  };

  return N.scheduleNotificationAsync({
    content: {
      title: 'Crypto check-in',                        // Notification title shown in the status bar
      body: "Check your portfolio & today's movers.",   // Notification body text
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}), // Android needs the channel ID
    },
    trigger,
  }); // Returns the unique notification ID
}

/**
 * cancelReminder: cancels a previously scheduled notification by its ID.
 * Used when the user toggles the daily reminder OFF.
 */
export async function cancelReminder(id: string): Promise<void> {
  await getN()?.cancelScheduledNotificationAsync(id); // The ?. means "only call this if getN() is not null"
}

/**
 * cancelAllReminders: cancels ALL scheduled notifications.
 * Nuclear option — use with care.
 */
export async function cancelAllReminders(): Promise<void> {
  await getN()?.cancelAllScheduledNotificationsAsync();
}

/**
 * scheduleTestNotification: schedules a notification to fire 10 seconds from now.
 * Used for testing the notification system during development.
 */
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
      seconds: 10,   // Fire 10 seconds from now
      repeats: false, // Don't repeat — fire just once
    },
  });
}

/**
 * showTestNow: schedules a notification to fire in just 1 second.
 * Useful for instantly verifying that notifications are working.
 * Only visible in the Settings screen during development (not in Expo Go).
 */
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
      seconds: 1,    // Almost immediate — 1 second delay
      repeats: false, // Fire just once
    },
  });
}
