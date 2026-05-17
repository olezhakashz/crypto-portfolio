// This file is responsible for all network calls to the CoinGecko public API.
// CoinGecko gives us live cryptocurrency prices and market data — completely free.

import type { CoinMarketItem } from '../types/coin'; // Import the shape/blueprint of a coin object

const BASE_URL = 'https://api.coingecko.com/api/v3'; // The root address of the CoinGecko API — all URLs start here
const TIMEOUT_MS = 10_000; // How long (in ms) we wait before giving up on a slow request — 10 seconds

// VsCurrency = the currency we want prices shown in: either US Dollar or Euro
export type VsCurrency = 'usd' | 'eur';

// CoinDetails = the full shape of data we get back when loading a single coin page
export type CoinDetails = {
  id: string;       // Unique identifier e.g. "bitcoin"
  symbol: string;   // Short ticker e.g. "btc"
  name: string;     // Full name e.g. "Bitcoin"
  image: {
    large: string;  // URL to the coin's large logo image
  };
  market_data: {
    current_price: Record<'usd' | 'eur', number>;        // Price in both USD and EUR
    market_cap: Record<'usd' | 'eur', number>;           // Total market value in both currencies
    price_change_percentage_24h: number | null;           // How much the price changed in the last 24 hours (%)
  };
};

/**
 * A wrapper around the built-in fetch() function that automatically cancels
 * the request if it takes longer than TIMEOUT_MS milliseconds.
 * This prevents the app from hanging forever on a bad connection.
 */
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController(); // AbortController lets us cancel a fetch request
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS); // After timeout, cancel the request
  try {
    const res = await fetch(url, { signal: controller.signal }); // Make the request; signal links it to the controller
    return res; // Return the response if it arrives in time
  } finally {
    clearTimeout(timer); // Always clear the timer so it doesn't fire after a successful request
  }
}

// ─── Fetch top 50 coins by market cap ────────────────────────────────────────
// Called by the Market screen to show the list of coins
export async function fetchMarketCoins(vsCurrency: VsCurrency = 'usd'): Promise<CoinMarketItem[]> {
  // Build the full API URL with query parameters:
  const url =
    `${BASE_URL}/coins/markets` +   // Endpoint for the market list
    `?vs_currency=${vsCurrency}` +  // Which currency to price in (usd or eur)
    `&order=market_cap_desc` +       // Sort by market cap, biggest first
    `&per_page=50&page=1` +          // Get the top 50 coins, first page only
    `&sparkline=false` +             // Don't include sparkline chart data (saves bandwidth)
    `&price_change_percentage=24h`;  // Include 24-hour price change percentage

  const res = await fetchWithTimeout(url); // Make the request with our timeout wrapper
  if (!res.ok) throw new Error(`Market fetch failed (${res.status})`); // If server returns an error, throw it
  return (await res.json()) as CoinMarketItem[]; // Parse JSON response and return it as an array of coins
}

// ─── Fetch detailed info for one specific coin ────────────────────────────────
// Called by the Coin Details screen when you tap on a coin
export async function fetchCoinDetails(id: string): Promise<CoinDetails> {
  // Build the URL for a single coin using its unique id (e.g. "bitcoin")
  const url =
    `${BASE_URL}/coins/${id}` +        // Endpoint for a specific coin
    `?localization=false` +             // Don't include translations (we only need English)
    `&tickers=false` +                  // Skip exchange ticker data (not needed)
    `&market_data=true` +               // Include price and market cap data
    `&community_data=false` +           // Skip social media stats
    `&developer_data=false` +           // Skip GitHub/developer activity
    `&sparkline=false`;                 // Skip chart sparkline data

  const res = await fetchWithTimeout(url); // Make the request with our timeout wrapper
  if (!res.ok) throw new Error(`Coin fetch failed (${res.status})`); // If server returns an error, throw it
  return (await res.json()) as CoinDetails; // Parse and return the coin detail object
}
