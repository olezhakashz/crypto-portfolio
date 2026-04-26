import { useMemo } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

import { useSettingsStore, type Currency, type RefreshInterval } from '../store/settingsStore';
import { showTestNow } from '../services/notifications';
import { theme } from '../theme/theme';
import { Button, Card, Screen, Subtle, Title } from '../components/ui';

const intervals: { label: string; value: RefreshInterval }[] = [
  { label: '15s', value: 15_000 },
  { label: '30s', value: 30_000 },
  { label: '60s', value: 60_000 },
];

const currencies: Currency[] = ['USD', 'EUR'];

function SegmentedRow<T extends string | number>({
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
    <Card style={{ padding: theme.space.md }}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle ? <Text style={styles.help}>{subtitle}</Text> : null}

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

  const timeLabel = `${String(reminderHour).padStart(2, '0')}:${String(reminderMinute).padStart(
    2,
    '0',
  )}`;

  return (
    <Screen style={{ paddingTop: theme.space.xl }}>
      <View style={{ marginBottom: theme.space.lg }}>
        <Title>Settings</Title>
        <Subtle>Personalize currency, refresh and reminders.</Subtle>
      </View>

      {error ? (
        <Card style={styles.errorBox}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <View style={{ marginTop: theme.space.md }}>
            <Button title="Dismiss" variant="ghost" onPress={clearError} />
          </View>
        </Card>
      ) : null}

      <SegmentedRow
        title="Currency"
        subtitle={`Current: ${currency}`}
        options={currencies.map((c) => ({ label: c, value: c }))}
        value={currency}
        onChange={async (c) => {
          await setCurrency(c);
          await Haptics.selectionAsync();
        }}
      />

      <View style={{ height: theme.space.md }} />

      <SegmentedRow
        title="Auto refresh"
        subtitle={`Current: ${intervalLabel} • Controls Market & Portfolio auto refresh`}
        options={intervals.map((it) => ({ label: it.label, value: it.value }))}
        value={refreshIntervalMs}
        onChange={async (ms) => {
          await setRefreshInterval(ms);
          await Haptics.selectionAsync();
        }}
      />

      <View style={{ height: theme.space.md }} />

      <Card>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Daily reminder</Text>
            <Text style={styles.help}>Local notification every day at {timeLabel}.</Text>
          </View>

          <Switch
            value={dailyReminderEnabled}
            disabled={isLoading}
            onValueChange={async (v) => {
              await setDailyReminderEnabled(v);
              await Haptics.selectionAsync();
            }}
          />
        </View>

        {isLoading ? <Text style={styles.help}>Applying…</Text> : null}
      </Card>

      {__DEV__ ? (
        <View style={{ marginTop: theme.space.md, gap: theme.space.sm }}>
          <Button
            title="Test notification (1s)"
            onPress={async () => {
              await showTestNow();
            }}
          />
          <Button
            title="Debug permissions + scheduled (logs)"
            variant="ghost"
            onPress={async () => {
              const p = await Notifications.getPermissionsAsync();
              const scheduled = await Notifications.getAllScheduledNotificationsAsync();
              console.log('PERMS:', p);
              console.log('SCHEDULED:', scheduled);
            }}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },

  cardTitle: {
    color: theme.color.text,
    fontSize: 16,
    fontWeight: '900',
  },
  help: { marginTop: 6, color: theme.color.text2, fontSize: 12, fontWeight: '700' },

  segment: {
    marginTop: theme.space.md,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.surface2,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  segCell: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segActiveCell: { backgroundColor: theme.color.text },
  segText: { color: theme.color.text, fontWeight: '900' },
  segTextActive: { color: theme.color.bg, fontWeight: '900' },

  errorBox: {
    borderColor: 'rgba(251,113,133,0.45)',
    backgroundColor: 'rgba(251,113,133,0.10)',
  },
  errorTitle: { color: theme.color.text, fontWeight: '900', fontSize: 16 },
  errorText: { color: theme.color.text2, marginTop: 6 },
});
