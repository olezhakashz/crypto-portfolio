// SettingsScreen.tsx
// The "Settings" tab screen — allows the user to customize their app experience.
//
// Three settings sections:
//   1. Display Currency     — choose between USD and EUR for all prices
//   2. Auto-refresh Interval — how often market data refreshes (30s / 60s / 2m)
//   3. Notifications        — toggle a daily portfolio check-in reminder + test notifications
//
// Also includes a Developer section (only visible in __DEV__ builds, not in Expo Go)
// with debug tools for testing notifications and logging permissions.

import { useMemo } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Linking, Platform } from 'react-native';
// Haptics: provides physical vibration feedback when the user changes a setting
import * as Haptics from 'expo-haptics';

// Zustand settings store — holds currency, refresh interval, and notification preferences
import { useSettingsStore, type Currency, type RefreshInterval } from '../store/settingsStore';
// Notification helper functions (schedule, cancel, test)
import { showTestNow, ensureNotificationSetup } from '../services/notifications';
// IS_EXPO_GO: true when running inside the Expo Go app (notifications are unsupported there)
import { IS_EXPO_GO } from '../utils/env';
import { theme } from '../theme/theme'; // Design tokens (colors, spacing, fonts)
// Shared UI components for consistent design across the app
import { Button, Card, Screen, SectionLabel, Divider } from '../components/ui';

// Predefined refresh interval options with human-readable labels
const intervals: { label: string; value: RefreshInterval }[] = [
  { label: '30s', value: 30_000 },   // 30 seconds
  { label: '60s', value: 60_000 },   // 60 seconds (1 minute)
  { label: '2m', value: 120_000 },   // 120 seconds (2 minutes)
];

// The two supported display currencies
const currencies: Currency[] = ['USD', 'EUR'];

// ─── SegmentRow ────────────────────────────────────────────────────────────────
// A reusable settings row component with a title, optional subtitle, and a
// segmented control (multi-option toggle). Used for both Currency and Refresh settings.
// Generic type <T> allows the options to be strings (Currency) or numbers (RefreshInterval).
function SegmentRow<T extends string | number>({
  title,
  subtitle,
  options,
  value,
  onChange,
}: {
  title: string;
  subtitle?: string;
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => Promise<void>;
}) {
  return (
    <Card style={styles.settingCard}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle ? <Text style={styles.settingHelp}>{subtitle}</Text> : null}

      {/* Segmented control — each option is a tappable cell, active one gets accent background */}
      <View style={styles.segment}>
        {options.map((opt) => {
          const active = opt.value === value; // Is this option currently selected?
          return (
            <View key={String(opt.value)} style={[styles.segCell, active && styles.segActiveCell]}>
              <Text
                onPress={async () => onChange(opt.value)}
                style={[styles.segText, active && styles.segTextActive]}
              >
                {opt.label}
              </Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

export default function SettingsScreen() {
  // --- Subscribe to individual slices of the settings store ---
  // Zustand only re-renders this component when the specific slice changes
  const currency = useSettingsStore((s) => s.currency);                       // Current display currency
  const refreshIntervalMs = useSettingsStore((s) => s.refreshIntervalMs);     // Current refresh interval (ms)

  const dailyReminderEnabled = useSettingsStore((s) => s.dailyReminderEnabled); // Whether daily notification is on
  const reminderHour = useSettingsStore((s) => s.reminderHour);                 // Hour of the daily reminder (0-23)
  const reminderMinute = useSettingsStore((s) => s.reminderMinute);             // Minute of the daily reminder (0-59)

  const isLoading = useSettingsStore((s) => s.isLoading);     // True while any async settings operation runs
  const error = useSettingsStore((s) => s.error);             // Error message string, or null
  const needsSettings = useSettingsStore((s) => s.needsSettings); // If true, user must open OS settings

  // --- Store actions (functions that update state) ---
  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const setRefreshInterval = useSettingsStore((s) => s.setRefreshInterval);
  const setDailyReminderEnabled = useSettingsStore((s) => s.setDailyReminderEnabled);
  const clearError = useSettingsStore((s) => s.clearError);

  // Look up the human-readable label for the current refresh interval (e.g., "60s")
  const intervalLabel = useMemo(() => {
    return intervals.find((x) => x.value === refreshIntervalMs)?.label ?? `${refreshIntervalMs}ms`;
  }, [refreshIntervalMs]);

  // Format the reminder time as "HH:MM" (e.g., "20:00" for 8 PM)
  const timeLabel = `${String(reminderHour).padStart(2, '0')}:${String(reminderMinute).padStart(2, '0')}`;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Screen header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSub}>Personalize your experience</Text>
        </View>

        {/* Error banner — shown when a settings operation fails (e.g., notification permission denied) */}
        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>⚠️ Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <View style={{ marginTop: theme.space.md, gap: theme.space.sm }}>
              {/* If notifications are permanently blocked, show a button to open OS settings */}
              {needsSettings ? (
                <Button
                  title="Open Settings"
                  onPress={() => {
                    if (Platform.OS === 'android') {
                      void Linking.openSettings(); // Opens the app's Android settings page
                    } else {
                      void Linking.openURL('app-settings:'); // Opens the app's iOS settings page
                    }
                  }}
                />
              ) : null}
              <Button title="Dismiss" variant="ghost" onPress={clearError} />
            </View>
          </Card>
        ) : null}

        {/* ── Section 1: Display Currency ────────────────────────────────────── */}
        <SectionLabel>Currency</SectionLabel>
        <SegmentRow
          title="Display Currency"
          subtitle={`Currently showing prices in ${currency}`}
          options={currencies.map((c) => ({ label: c, value: c }))}
          value={currency}
          onChange={async (c) => {
            await setCurrency(c);          // Update state + persist to AsyncStorage
            await Haptics.selectionAsync(); // Light haptic feedback on change
          }}
        />

        <Divider />

        {/* ── Section 2: Auto-refresh Interval ───────────────────────────────── */}
        <SectionLabel>Data Refresh</SectionLabel>
        <SegmentRow
          title="Auto-refresh Interval"
          subtitle={`Market & Portfolio refresh every ${intervalLabel}`}
          options={intervals.map((it) => ({ label: it.label, value: it.value }))}
          value={refreshIntervalMs}
          onChange={async (ms) => {
            await setRefreshInterval(ms);  // Update state + persist to AsyncStorage
            await Haptics.selectionAsync();
          }}
        />

        <Divider />

        {/* ── Section 3: Notifications ───────────────────────────────────────── */}
        <SectionLabel>Notifications</SectionLabel>
        <Card style={styles.settingCard}>
          {/* Daily reminder toggle row */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Daily Reminder</Text>
              <Text style={styles.settingHelp}>
                Get notified every day at {timeLabel} to check your portfolio.
              </Text>
            </View>
            {/* iOS/Android native toggle switch */}
            <Switch
              value={dailyReminderEnabled}
              disabled={isLoading} // Disable while a notification operation is in progress
              trackColor={{ false: theme.color.surface2, true: theme.color.primary }}
              thumbColor={dailyReminderEnabled ? theme.color.white : theme.color.text3}
              onValueChange={async (v) => {
                await setDailyReminderEnabled(v); // Handles permission check + schedule/cancel
                await Haptics.selectionAsync();
              }}
            />
          </View>
          {/* Show "Applying…" text while the async notification operation runs */}
          {isLoading ? <Text style={styles.applyingText}>Applying…</Text> : null}

          {/* Test notification button — sends a notification in ~1 second */}
          <View style={styles.testBtnWrap}>
            <Button
              title="🔔 Send Test Notification"
              variant="ghost"
              onPress={async () => {
                // First ensure we have notification permission
                const result = await ensureNotificationSetup();
                if (result !== 'granted') {
                  // Permission denied — show an error with appropriate guidance
                  useSettingsStore.getState().clearError();
                  useSettingsStore.setState({
                    error:
                      result === 'denied-permanently'
                        ? 'Notifications are blocked. Please enable them in your device settings.'
                        : 'Notification permission denied',
                    needsSettings: result === 'denied-permanently',
                  });
                  return;
                }
                // Permission granted — fire a test notification
                await showTestNow();
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
            />
            <Text style={styles.testHint}>Sends a notification in ~1 second</Text>
          </View>
        </Card>

        {/* ── Developer section — only visible in dev builds, hidden in Expo Go ── */}
        {/* __DEV__ is a React Native global that's true in development mode */}
        {__DEV__ && !IS_EXPO_GO ? (
          <>
            <Divider />
            <SectionLabel>Developer</SectionLabel>
            <Card style={styles.settingCard}>
              <Text style={styles.settingTitle}>Debug Tools</Text>
              <Text style={styles.settingHelp}>Only visible in development builds</Text>
              <View style={{ marginTop: theme.space.md, gap: theme.space.sm }}>
                {/* Quick test notification (skips permission check since dev already granted) */}
                <Button
                  title="🔔 Send Test Notification (1s)"
                  onPress={async () => {
                    await showTestNow();
                  }}
                />
                {/* Logs current permission status and all scheduled notifications to the console */}
                <Button
                  title="Log Permissions + Scheduled"
                  variant="ghost"
                  onPress={async () => {
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    const N = require('expo-notifications') as typeof import('expo-notifications');
                    const p = await N.getPermissionsAsync();
                    const scheduled = await N.getAllScheduledNotificationsAsync();
                    console.log('PERMS:', p);
                    console.log('SCHEDULED:', scheduled);
                  }}
                />
              </View>
            </Card>
          </>
        ) : null}

        {/* App info footer */}
        <Divider />
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Crypto Portfolio · v1.0.0</Text>
          <Text style={styles.appInfoText}>Data by CoinGecko · Prices delayed</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { paddingBottom: 120, gap: 0 }, // Extra bottom padding for floating tab bar

  // Screen header
  header: {
    marginBottom: theme.space.xl,
  },
  headerTitle: {
    color: theme.color.text,
    fontSize: theme.font.xxl,
    fontWeight: '900',
    letterSpacing: -0.5, // Tighter tracking at large sizes
  },
  headerSub: {
    marginTop: 4,
    color: theme.color.text3,
    fontSize: theme.font.xs,
    fontWeight: '600',
  },

  // Error banner
  errorCard: {
    borderColor: 'rgba(244,63,94,0.35)',       // Semi-transparent red border
    backgroundColor: 'rgba(244,63,94,0.08)',   // Very subtle red background
    marginBottom: theme.space.lg,
  },
  errorTitle: { color: theme.color.text, fontWeight: '900', fontSize: theme.font.md },
  errorText: { color: theme.color.text2, marginTop: 6 },

  // Individual setting card
  settingCard: {
    marginBottom: theme.space.md,
  },

  // Setting title and help text
  settingTitle: {
    color: theme.color.text,
    fontSize: theme.font.md,
    fontWeight: '800',
  },
  settingHelp: {
    marginTop: 5,
    color: theme.color.text3,
    fontSize: theme.font.xs,
    fontWeight: '600',
    lineHeight: 16,
  },

  // Segmented control (multi-option toggle)
  segment: {
    marginTop: theme.space.md,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface2,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    padding: 3,
    gap: 3,
  },
  segCell: {
    flex: 1,           // Each option takes equal width
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.radius.sm,
  },
  segActiveCell: { backgroundColor: theme.color.primary },  // Active option gets the accent color
  segText: { color: theme.color.text3, fontWeight: '700', fontSize: theme.font.sm },
  segTextActive: { color: theme.color.white, fontWeight: '800' },

  // Switch row layout (label on left, toggle on right)
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
  },
  applyingText: {
    marginTop: theme.space.sm,
    color: theme.color.text3,
    fontSize: theme.font.xs,
    fontWeight: '600',
  },

  // Test notification button area
  testBtnWrap: {
    marginTop: theme.space.md,
    paddingTop: theme.space.md,
    borderTopWidth: 1,
    borderTopColor: theme.color.border,
    alignItems: 'center',
    gap: 6,
  },
  testHint: {
    color: theme.color.text3,
    fontSize: 11,
    fontWeight: '600',
  },

  // App info footer at the very bottom
  appInfo: {
    marginTop: theme.space.xl,
    alignItems: 'center',
    gap: 4,
  },
  appInfoText: {
    color: theme.color.text3,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
