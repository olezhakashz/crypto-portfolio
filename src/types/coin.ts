// coin.ts
// This file defines the TypeScript "type" (blueprint) for a coin
// as returned by the CoinGecko /coins/markets API endpoint.
// Every coin in the Market screen list matches this exact shape.

export type CoinMarketItem = {
  id: string;       // CoinGecko's unique identifier — e.g. "bitcoin", "ethereum"
  symbol: string;   // The short ticker symbol — e.g. "btc", "eth"
  name: string;     // The full human-readable name — e.g. "Bitcoin", "Ethereum"
  image: string;    // URL to the coin's logo image
  current_price: number;        // The current price in the selected currency (USD or EUR)
  market_cap: number;           // Total market capitalization in the selected currency
  market_cap_rank: number;      // The coin's global rank by market cap (1 = biggest)
  price_change_percentage_24h: number | null; // % price change in the last 24 hours (can be null if unavailable)
};
