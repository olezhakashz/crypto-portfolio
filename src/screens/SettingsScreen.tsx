import { useMemo } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useSettingsStore, type Currency, type RefreshInterval } from '../store/settingsStore';
import { showTestNow } from '../services/notifications';
import { IS_EXPO_GO } from '../utils/env';
import { theme } from '../theme/theme';
import { Button, Card, Screen, SectionLabel, Divider } from '../components/ui';

const intervals: { label: string; value: RefreshInterval }[] = [
  { label: '15s', value: 15_000 },
  { label: '30s', value: 30_000 },
  { label: '60s', value: 60_000 },
];

const currencies: Currency[] = ['USD', 'EUR'];

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

      <View style={styles.segment}>
        {options.map((opt) => {
          const active = opt.value === value;
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
  const currency = useSettingsStore((s) => s.currency);
  const refreshIntervalMs = useSettingsStore((s) => s.refreshIntervalMs);

  const dailyReminderEnabled = useSettingsStore((s) => s.dailyReminderEnabled);
  const reminderHour = useSettingsStore((s) => s.reminderHour);
  const reminderMinute = useSettingsStore((s) => s.reminderMinute);

  const isLoading = useSettingsStore((s) => s.isLoading);
  const error = useSettingsStore((s) => s.error);

  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const setRefreshInterval = useSettingsStore((s) => s.setRefreshInterval);
  const setDailyReminderEnabled = useSettingsStore((s) => s.setDailyReminderEnabled);
  const clearError = useSettingsStore((s) => s.clearError);

  const intervalLabel = useMemo(() => {
    return intervals.find((x) => x.value === refreshIntervalMs)?.label ?? `${refreshIntervalMs}ms`;
  }, [refreshIntervalMs]);

  const timeLabel = `${String(reminderHour).padStart(2, '0')}:${String(reminderMinute).padStart(2, '0')}`;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSub}>Personalize your experience</Text>
        </View>

        {/* Error banner */}
        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>⚠️ Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <View style={{ marginTop: theme.space.md }}>
              <Button title="Dismiss" variant="ghost" onPress={clearError} />
            </View>
          </Card>
        ) : null}

        {/* Currency */}
        <SectionLabel>Currency</SectionLabel>
        <SegmentRow
          title="Display Currency"
          subtitle={`Currently showing prices in ${currency}`}
          options={currencies.map((c) => ({ label: c, value: c }))}
          value={currency}
          onChange={async (c) => {
            await setCurrency(c);
            await Haptics.selectionAsync();
          }}
        />

        <Divider />

        {/* Refresh */}
        <SectionLabel>Data Refresh</SectionLabel>
        <SegmentRow
          title="Auto-refresh Interval"
          subtitle={`Market & Portfolio refresh every ${intervalLabel}`}
          options={intervals.map((it) => ({ label: it.label, value: it.value }))}
          value={refreshIntervalMs}
          onChange={async (ms) => {
            await setRefreshInterval(ms);
            await Haptics.selectionAsync();
          }}
        />

        <Divider />

        {/* Notifications */}
        <SectionLabel>Notifications</SectionLabel>
        <Card style={styles.settingCard}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Daily Reminder</Text>
              <Text style={styles.settingHelp}>
                Get notified every day at {timeLabel} to check your portfolio.
              </Text>
            </View>
            <Switch
              value={dailyReminderEnabled}
              disabled={isLoading}
              trackColor={{ false: theme.color.surface2, true: theme.color.primary }}
              thumbColor={dailyReminderEnabled ? theme.color.white : theme.color.text3}
              onValueChange={async (v) => {
                await setDailyReminderEnabled(v);
                await Haptics.selectionAsync();
              }}
            />
          </View>
          {isLoading ? <Text style={styles.applyingText}>Applying…</Text> : null}
        </Card>

        {/* Dev tools */}
        {__DEV__ && !IS_EXPO_GO ? (
          <>
            <Divider />
            <SectionLabel>Developer</SectionLabel>
            <Card style={styles.settingCard}>
              <Text style={styles.settingTitle}>Debug Tools</Text>
              <Text style={styles.settingHelp}>Only visible in development builds</Text>
              <View style={{ marginTop: theme.space.md, gap: theme.space.sm }}>
                <Button
                  title="🔔 Send Test Notification (1s)"
                  onPress={async () => {
                    await showTestNow();
                  }}
                />
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

        {/* App info */}
        <Divider />
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Crypto Portfolio · v1.0.0</Text>
          <Text style={styles.appInfoText}>Data by CoinGecko · Prices delayed</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120, gap: 0 },

  header: {
    marginBottom: theme.space.xl,
  },
  headerTitle: {
    color: theme.color.text,
    fontSize: theme.font.xxl,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSub: {
    marginTop: 4,
    color: theme.color.text3,
    fontSize: theme.font.xs,
    fontWeight: '600',
  },

  errorCard: {
    borderColor: 'rgba(244,63,94,0.35)',
    backgroundColor: 'rgba(244,63,94,0.08)',
    marginBottom: theme.space.lg,
  },
  errorTitle: { color: theme.color.text, fontWeight: '900', fontSize: theme.font.md },
  errorText: { color: theme.color.text2, marginTop: 6 },

  settingCard: {
    marginBottom: theme.space.md,
  },

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
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.radius.sm,
  },
  segActiveCell: { backgroundColor: theme.color.primary },
  segText: { color: theme.color.text3, fontWeight: '700', fontSize: theme.font.sm },
  segTextActive: { color: theme.color.white, fontWeight: '800' },

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
