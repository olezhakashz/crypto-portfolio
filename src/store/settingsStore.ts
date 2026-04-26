import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import {
  ensureNotificationSetup,
  scheduleDailyReminder,
  cancelReminder,
} from '../services/notifications';

export type Currency = 'USD' | 'EUR';
export type RefreshInterval = 15_000 | 30_000 | 60_000;

type SettingsState = {
  currency: Currency;
  refreshIntervalMs: RefreshInterval;

  dailyReminderEnabled: boolean;
  reminderHour: number; // 0-23
  reminderMinute: number; // 0-59
  reminderNotificationId: string | null;

  isLoading: boolean;
  error: string | null;

  load: () => Promise<void>;
  setCurrency: (c: Currency) => Promise<void>;
  setRefreshInterval: (ms: RefreshInterval) => Promise<void>;
  setDailyReminderEnabled: (v: boolean) => Promise<void>;
  clearError: () => void;
};

const KEY = 'settings_v1';

type Persisted = Pick<
  SettingsState,
  | 'currency'
  | 'refreshIntervalMs'
  | 'dailyReminderEnabled'
  | 'reminderHour'
  | 'reminderMinute'
  | 'reminderNotificationId'
>;

const DEFAULTS: Persisted = {
  currency: 'USD',
  refreshIntervalMs: 30_000,
  dailyReminderEnabled: false,
  reminderHour: 20,
  reminderMinute: 0,
  reminderNotificationId: null,
};

async function persist(next: Persisted) {
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...DEFAULTS,

  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  load: async () => {
    try {
      set({ isLoading: true, error: null });
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Persisted>;
        set({ ...DEFAULTS, ...parsed });
      } else {
        set({ ...DEFAULTS });
      }
    } catch {
      set({ error: 'Failed to load settings' });
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrency: async (currency) => {
    set({ currency, error: null });

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

  setDailyReminderEnabled: async (enabled) => {
    const prevEnabled = get().dailyReminderEnabled;
    const prevId = get().reminderNotificationId;

    set({ dailyReminderEnabled: enabled, error: null, isLoading: true });

    try {
      if (!enabled) {
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
        return;
      }

      const ok = await ensureNotificationSetup();
      if (!ok) {
        set({ dailyReminderEnabled: false, reminderNotificationId: null });
        set({ error: 'Notification permission denied' });

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

      if (prevId) await cancelReminder(prevId);

      const id = await scheduleDailyReminder(get().reminderHour, get().reminderMinute);

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
      set({ dailyReminderEnabled: prevEnabled, reminderNotificationId: prevId });
      set({ error: `Failed to update reminder: ${String(e)}` });
    } finally {
      set({ isLoading: false });
    }
  },
}));
