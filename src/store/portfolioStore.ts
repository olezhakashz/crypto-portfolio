import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PortfolioItem = {
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
};

type PortfolioState = {
  items: PortfolioItem[];
  isLoading: boolean;
  error: string | null;

  load: () => Promise<void>;
  addOrUpdate: (item: PortfolioItem) => Promise<void>;
  remove: (coinId: string) => Promise<void>;
};

const KEY = 'portfolio_v1';

export const usePortfolioStore = create<PortfolioState>()((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  load: async () => {
    try {
      set({ isLoading: true, error: null });
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set({ items: JSON.parse(raw) as PortfolioItem[] });
    } catch (e) {
      set({ error: 'Failed to load portfolio' });
    } finally {
      set({ isLoading: false });
    }
  },

  addOrUpdate: async (item) => {
    try {
      set({ error: null });
      const items = get().items.slice();
      const idx = items.findIndex((x) => x.coinId === item.coinId);

      if (idx >= 0) items[idx] = item;
      else items.unshift(item);

      set({ items });
      await AsyncStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) {
      set({ error: 'Failed to save portfolio' });
    }
  },

  remove: async (coinId) => {
    try {
      set({ error: null });
      const items = get().items.filter((x) => x.coinId !== coinId);
      set({ items });
      await AsyncStorage.setItem(KEY, JSON.stringify(items));
    } catch (e) {
      set({ error: 'Failed to remove item' });
    }
  },
}));
