// portfolioStore.ts
// This file manages the user's personal portfolio — the list of coins they've saved.
// It uses Zustand (a simple state manager) to hold the data in memory,
// and AsyncStorage to save it to the phone so it persists between app restarts.

import { create } from 'zustand'; // Zustand: a lightweight tool to manage app-wide state
import AsyncStorage from '@react-native-async-storage/async-storage'; // Like localStorage for React Native — saves data permanently on the device

// PortfolioItem = the shape of one coin entry in the user's portfolio
export type PortfolioItem = {
  coinId: string;  // Unique coin ID from CoinGecko, e.g. "bitcoin"
  symbol: string;  // Short ticker symbol, e.g. "btc"
  name: string;    // Full name, e.g. "Bitcoin"
  amount: number;  // How many coins the user owns, e.g. 0.5
};

// PortfolioState = all the data and actions available in this store
type PortfolioState = {
  items: PortfolioItem[];   // The list of coins in the user's portfolio
  isLoading: boolean;       // True while reading/writing to storage
  error: string | null;     // Holds an error message if something went wrong

  load: () => Promise<void>;                          // Action: load saved portfolio from device storage
  addOrUpdate: (item: PortfolioItem) => Promise<void>; // Action: add a new coin or update an existing one
  remove: (coinId: string) => Promise<void>;           // Action: remove a coin from the portfolio
};

const KEY = 'portfolio_v1'; // The key name used to store portfolio data in AsyncStorage

// Create the Zustand store — this makes the state accessible from any screen in the app
export const usePortfolioStore = create<PortfolioState>()((set, get) => ({
  items: [],       // Start with an empty list — gets loaded from storage on app start
  isLoading: false,
  error: null,

  // load: reads the saved portfolio from the device's local storage
  load: async () => {
    try {
      set({ isLoading: true, error: null }); // Show a loading indicator while we read from disk
      const raw = await AsyncStorage.getItem(KEY); // Try to read the saved JSON string
      if (raw) set({ items: JSON.parse(raw) as PortfolioItem[] }); // If data exists, parse and store it
    } catch (e) {
      set({ error: 'Failed to load portfolio' }); // Something went wrong reading the file
    } finally {
      set({ isLoading: false }); // Always hide the loading indicator when done
    }
  },

  // addOrUpdate: saves a new coin, or updates the amount if that coin already exists
  addOrUpdate: async (item) => {
    try {
      set({ error: null });
      const items = get().items.slice(); // Make a copy of the current list (don't mutate the original)
      const idx = items.findIndex((x) => x.coinId === item.coinId); // Check if this coin already exists

      if (idx >= 0) items[idx] = item; // If coin exists, replace it (update the amount)
      else items.unshift(item);        // If new, add it to the beginning of the list

      set({ items }); // Update the in-memory state immediately (fast UI update)
      await AsyncStorage.setItem(KEY, JSON.stringify(items)); // Save the updated list to disk
    } catch (e) {
      set({ error: 'Failed to save portfolio' });
    }
  },

  // remove: deletes a coin from the portfolio by its ID
  remove: async (coinId) => {
    try {
      set({ error: null });
      const items = get().items.filter((x) => x.coinId !== coinId); // Keep all coins EXCEPT the removed one
      set({ items }); // Update in memory
      await AsyncStorage.setItem(KEY, JSON.stringify(items)); // Save the updated list to disk
    } catch (e) {
      set({ error: 'Failed to remove item' });
    }
  },
}));
