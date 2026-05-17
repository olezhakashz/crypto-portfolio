// marketStore.ts
// This file manages the live market data — the list of top 50 coins with their prices.
// It fetches prices from CoinGecko and caches them so the app still works offline.

import AsyncStorage from '@react-native-async-storage/async-storage'; // Device storage for caching coin prices
import { create } from 'zustand'; // Zustand: a simple state manager shared across all screens
import { fetchMarketCoins } from '../api/coingecko'; // Our function that calls the CoinGecko API
import type { CoinMarketItem } from '../types/coin';  // The shape/blueprint of a single coin object

type VsCurrency = 'usd' | 'eur'; // The two supported display currencies

// MarketState = all the data and actions this store provides
type MarketState = {
  coins: CoinMarketItem[]; // The list of top 50 coins from CoinGecko
  isLoading: boolean;      // True while fetching from the internet
  error: string | null;    // Error message if the fetch fails

  query: string;           // The current search text typed by the user in the filter bar
  onlyGainers: boolean;    // If true, show only coins that went UP in the last 24h

  lastUpdated: number | null; // Timestamp (milliseconds) of the last successful data refresh

  setQuery: (v: string) => void;          // Action: update the search text
  setOnlyGainers: (v: boolean) => void;   // Action: toggle the "gainers only" filter

  refresh: (vsCurrency?: VsCurrency) => Promise<void>; // Action: fetch fresh prices from the API
};

// CACHE_KEY: creates a unique storage key per currency (e.g. "market_cache_usd")
// This means USD and EUR data are cached separately
const CACHE_KEY = (vs: VsCurrency) => `market_cache_${vs}`;

// Create the Zustand store
export const useMarketStore = create<MarketState>()((set, get) => ({
  coins: [],        // No coins loaded yet — filled after first refresh()
  isLoading: false,
  error: null,

  query: '',         // Empty search by default
  onlyGainers: false, // Show all coins by default

  lastUpdated: null, // No data fetched yet

  // setQuery: updates the search bar text so the Market screen can filter by it
  setQuery: (v) => set({ query: v }),

  // setOnlyGainers: toggles the gainers filter on/off
  setOnlyGainers: (v) => set({ onlyGainers: v }),

  // refresh: the main function — fetches live prices and updates the state
  refresh: async (vsCurrency: VsCurrency = 'usd') => {
    if (get().isLoading) return; // Don't start a second fetch if one is already running

    try {
      set({ isLoading: true, error: null }); // Show loading spinner

      // STEP 1: Show cached data instantly while the real request loads
      // This makes the app feel fast even on slow connections
      const cached = await AsyncStorage.getItem(CACHE_KEY(vsCurrency));
      if (cached) set({ coins: JSON.parse(cached) as CoinMarketItem[] }); // Populate with old data

      // STEP 2: Fetch fresh prices from the internet
      const data = await fetchMarketCoins(vsCurrency);
      set({ coins: data, lastUpdated: Date.now() }); // Update with fresh data and record the time

      // STEP 3: Save fresh data to cache so it's available next time (even offline)
      await AsyncStorage.setItem(CACHE_KEY(vsCurrency), JSON.stringify(data));
    } catch (e) {
      // Only show error if we have NO data at all (i.e., first-ever load failed)
      // If cached data is showing, we silently fail instead of showing an error
      if (get().coins.length === 0) set({ error: 'Cannot load market (offline?)' });
    } finally {
      set({ isLoading: false }); // Always hide loading spinner when done
    }
  },
}));
