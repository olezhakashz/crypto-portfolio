// types.ts
// Central type definitions for React Navigation's screen hierarchy.
// These types make navigation type-safe — TypeScript will catch mistakes
// like navigating to a screen that doesn't exist or forgetting required params.

// ──── Root Stack (top-level navigator) ────
// Maps each screen name to the params it expects.
// `undefined` means the screen takes no params; an object describes required ones.
export type RootStackParamList = {
  Tabs: undefined; // The bottom-tab container — no params needed
  CoinDetails: { id: string }; // Drill-in screen; `id` is the CoinGecko coin identifier
};

// ──── Bottom Tab Navigator (nested inside Root Stack) ────
// Each tab is a separate screen with its own sub-navigator or component.
export type TabsParamList = {
  Market: undefined; // Live market prices list
  Portfolio: undefined; // User's tracked coins / holdings
  Settings: undefined; // App preferences (currency, refresh rate, notifications)
};

