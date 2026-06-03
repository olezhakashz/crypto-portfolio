// settingsStore.ts
// Zustand store that manages all user-facing settings: display currency,
// data-refresh interval, and daily push-notification reminders.
// Every change is persisted to AsyncStorage so settings survive app restarts.

// AsyncStorage — key-value storage that works like localStorage but for React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
// Zustand's `create` builds a global store that any component can subscribe to
import { create } from 'zustand';
// Notification helpers that wrap expo-notifications under the hood
import {
  ensureNotificationSetup,
  scheduleDailyReminder,
  cancelReminder,
} from '../services/notifications';

// ──── Literal union types restrict values to an explicit set ────
export type Currency = 'USD' | 'EUR';
// Values are in milliseconds (numeric separators like 30_000 = 30 000 ms = 30 s)
export type RefreshInterval = 30_000 | 60_000 | 120_000;

// ──── Shape of the entire settings store (data + actions) ────
type SettingsState = {
  // Which fiat currency to display prices in
  currency: Currency;
  // How often (ms) the app re-fetches market data
  refreshIntervalMs: RefreshInterval;

  // Whether the daily "check your portfolio" notification is on
  dailyReminderEnabled: boolean;
  reminderHour: number; // 0-23
  reminderMinute: number; // 0-59
  // The OS-level notification identifier so we can cancel it later
  reminderNotificationId: string | null;

  // True while any async operation (load / save / schedule) is in progress
  isLoading: boolean;
  // Human-readable error message shown in the UI
  error: string | null;
  /** When true, the error can be resolved by opening system notification settings */
  needsSettings: boolean;

  // ── Actions (functions that mutate state) ──
  load: () => Promise<void>;
  setCurrency: (c: Currency) => Promise<void>;
  setRefreshInterval: (ms: RefreshInterval) => Promise<void>;
  setDailyReminderEnabled: (v: boolean) => Promise<void>;
  clearError: () => void;
};

// Versioned key keeps us safe if the persisted shape changes in a future release
const KEY = 'settings_v1';

// `Persisted` picks only the fields we write to AsyncStorage —
// transient UI state like `isLoading` or `error` is intentionally excluded.
type Persisted = Pick<
  SettingsState,
  | 'currency'
  | 'refreshIntervalMs'
  | 'dailyReminderEnabled'
  | 'reminderHour'
  | 'reminderMinute'
  | 'reminderNotificationId'
>;

// Sensible defaults used on first launch (before anything is saved)
const DEFAULTS: Persisted = {
  currency: 'USD',
  refreshIntervalMs: 60_000,
  dailyReminderEnabled: false,
  reminderHour: 20, // 8:00 PM
  reminderMinute: 0,
  reminderNotificationId: null,
};

// Helper: serialise the persistable slice to AsyncStorage
async function persist(next: Persisted) {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

// ──── Create the Zustand store ────
// `create<SettingsState>()((set, get) => ...)` — the double parentheses are
// Zustand's pattern: the outer call sets up the TypeScript generic, the inner
// call receives `set` (to update state) and `get` (to read current state).
export const useSettingsStore = create<SettingsState>()((set, get) => ({
  // Spread defaults so the store is usable immediately, even before `load()`
  ...DEFAULTS,

  isLoading: false,
  error: null,
  needsSettings: false,

  // Reset error state — called when the user dismisses an error banner
  clearError: () => set({ error: null, needsSettings: false }),

  // ── load(): Hydrate the store from disk on app start ──
  load: async () => {
    try {
      set({ isLoading: true, error: null });
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        // Merge saved values over DEFAULTS so new fields get a fallback
        const parsed = JSON.parse(raw) as Partial<Persisted>;
        set({ ...DEFAULTS, ...parsed });
      } else {
        // First launch — no saved data, just use defaults
        set({ ...DEFAULTS });
      }
    } catch {
      set({ error: 'Failed to load settings' });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── setCurrency(): Optimistically update state, then persist ──
  setCurrency: async (currency) => {
    // Update in-memory state immediately so the UI feels instant
    set({ currency, error: null });

    // Build the full persistable snapshot (we must save everything, not just the changed field)
    const next: Persisted = {
      currency,
      refreshIntervalMs: get().refreshIntervalMs,
      dailyReminderEnabled: get().dailyReminderEnabled,
      reminderHour: get().reminderHour,
      reminderMinute: get().reminderMinute,
      reminderNotificationId: get().reminderNotificationId,
    };

    try {
      await persist(next);
    } catch {
      set({ error: 'Failed to save currency' });
    }
  },

  // ── setRefreshInterval(): Same optimistic-update pattern as setCurrency ──
  setRefreshInterval: async (refreshIntervalMs) => {
    set({ refreshIntervalMs, error: null });

    const next: Persisted = {
      currency: get().currency,
      refreshIntervalMs,
      dailyReminderEnabled: get().dailyReminderEnabled,
      reminderHour: get().reminderHour,
      reminderMinute: get().reminderMinute,
      reminderNotificationId: get().reminderNotificationId,
    };

    try {
      await persist(next);
    } catch {
      set({ error: 'Failed to save refresh interval' });
    }
  },

  // ── setDailyReminderEnabled(): The most complex action ──
  // Flow: toggle → check/request permissions → cancel old → schedule new → persist.
  // Uses an optimistic update with rollback on failure.
  setDailyReminderEnabled: async (enabled) => {
    // Snapshot previous values so we can roll back if something goes wrong
    const prevEnabled = get().dailyReminderEnabled;
    const prevId = get().reminderNotificationId;

    // Optimistically show the toggle as flipped right away
    set({ dailyReminderEnabled: enabled, error: null, isLoading: true });

    try {
      // ── Path A: User is DISABLING the reminder ──
      if (!enabled) {
        // Cancel the existing OS notification if one was scheduled
        if (prevId) await cancelReminder(prevId);

        const next: Persisted = {
          currency: get().currency,
          refreshIntervalMs: get().refreshIntervalMs,
          dailyReminderEnabled: false,
          reminderHour: get().reminderHour,
          reminderMinute: get().reminderMinute,
          reminderNotificationId: null,
        };

        set({ reminderNotificationId: null });
        await persist(next);
        return; // Done — nothing else to do when disabling
      }

      // ── Path B: User is ENABLING the reminder ──
      // Step 1 — Make sure we have notification permissions
      const result = await ensureNotificationSetup();
      if (result !== 'granted') {
        // Permission was refused — distinguish between a soft deny (user
        // tapped "Don't Allow" once) and a hard deny (blocked at OS level).
        const isPermanent = result === 'denied-permanently';
        set({
          dailyReminderEnabled: false,
          reminderNotificationId: null,
          // `needsSettings` tells the UI to show a "Go to Settings" button
          needsSettings: isPermanent,
          error: isPermanent
            ? 'Notifications are blocked. Please enable them in your device settings.'
            : 'Notification permission denied',
        });

        // Persist the disabled state so the toggle stays off after restart
        const next: Persisted = {
          currency: get().currency,
          refreshIntervalMs: get().refreshIntervalMs,
          dailyReminderEnabled: false,
          reminderHour: get().reminderHour,
          reminderMinute: get().reminderMinute,
          reminderNotificationId: null,
        };
        await persist(next);
        return;
      }

      // Step 2 — Cancel any old notification before scheduling a new one
      if (prevId) await cancelReminder(prevId);

      // Step 3 — Schedule the new daily notification at the chosen time
      const id = await scheduleDailyReminder(get().reminderHour, get().reminderMinute);

      // Step 4 — Persist everything including the new notification ID
      const next: Persisted = {
        currency: get().currency,
        refreshIntervalMs: get().refreshIntervalMs,
        dailyReminderEnabled: true,
        reminderHour: get().reminderHour,
        reminderMinute: get().reminderMinute,
        reminderNotificationId: id,
      };

      set({ reminderNotificationId: id });
      await persist(next);
    } catch (e) {
      // Something unexpected happened — rollback to the previous state
      set({ dailyReminderEnabled: prevEnabled, reminderNotificationId: prevId });
      set({ error: `Failed to update reminder: ${String(e)}` });
    } finally {
      set({ isLoading: false });
    }
  },
}));
