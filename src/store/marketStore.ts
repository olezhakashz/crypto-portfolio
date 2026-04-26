import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { fetchMarketCoins } from '../api/coingecko';
import type { CoinMarketItem } from '../types/coin';

type VsCurrency = 'usd' | 'eur';

type MarketState = {
  coins: CoinMarketItem[];
  isLoading: boolean;
  error: string | null;

  query: string;
  onlyGainers: boolean;

  lastUpdated: number | null;

  setQuery: (v: string) => void;
  setOnlyGainers: (v: boolean) => void;

  refresh: (vsCurrency?: VsCurrency) => Promise<void>;
};

const CACHE_KEY = (vs: VsCurrency) => `market_cache_${vs}`;

export const useMarketStore = create<MarketState>()((set, get) => ({
  coins: [],
  isLoading: false,
  error: null,

  query: '',
  onlyGainers: false,

  lastUpdated: null,

  setQuery: (v) => set({ query: v }),
  setOnlyGainers: (v) => set({ onlyGainers: v }),

  refresh: async (vsCurrency: VsCurrency = 'usd') => {
    if (get().isLoading) return;

    try {
      set({ isLoading: true, error: null });

      // cache first (per currency)
      const cached = await AsyncStorage.getItem(CACHE_KEY(vsCurrency));
      if (cached) set({ coins: JSON.parse(cached) as CoinMarketItem[] });

      const data = await fetchMarketCoins(vsCurrency);
      set({ coins: data, lastUpdated: Date.now() });

      await AsyncStorage.setItem(CACHE_KEY(vsCurrency), JSON.stringify(data));
    } catch (e) {
      if (get().coins.length === 0) set({ error: 'Cannot load market (offline?)' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
