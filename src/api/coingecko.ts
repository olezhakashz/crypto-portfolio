// This file is responsible for all network calls to the CoinGecko public API.
// CoinGecko gives us live cryptocurrency prices and market data — completely free.

import type { CoinMarketItem } from '../types/coin'; // Import the shape/blueprint of a coin object

const BASE_URL = 'https://api.coingecko.com/api/v3'; // The root address of the CoinGecko API — all URLs start here
const TIMEOUT_MS = 10_000; // How long (in ms) we wait before giving up on a slow request — 10 seconds

// Free demo API key from CoinGecko — gives a slightly higher rate limit than
// completely unauthenticated requests. You can get your own at:
// https://www.coingecko.com/en/api/pricing (the "Demo" tier is free)
const DEMO_API_KEY = 'CG-FbEjsVHMNGroA5UoXFRk3Jmm';

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

// ─── In-memory response cache ─────────────────────────────────────────────────
// Prevents repeated network calls when the user taps the same coin multiple
// times or navigates back-and-forth. Each entry expires after CACHE_TTL_MS.

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry<T> = { data: T; timestamp: number };

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// ─── Retry with exponential backoff ───────────────────────────────────────────
// When CoinGecko returns 429 (Too Many Requests), we wait progressively longer
// and retry. This avoids the user seeing an error on temporary rate-limits.

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1_500; // First retry waits 1.5s, then 3s, then 6s

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A wrapper around the built-in fetch() function that:
 * 1. Automatically cancels the request if it takes longer than TIMEOUT_MS
 * 2. Appends the demo API key as a query parameter
 * 3. Retries with exponential backoff on 429 responses
 */
async function fetchWithRetry(url: string): Promise<Response> {
  // Append demo API key
  const separator = url.includes('?') ? '&' : '?';
  const urlWithKey = `${url}${separator}x_cg_demo_api_key=${DEMO_API_KEY}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController(); // AbortController lets us cancel a fetch request
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS); // After timeout, cancel the request

    try {
      const res = await fetch(urlWithKey, { signal: controller.signal }); // Make the request

      if (res.status === 429 && attempt < MAX_RETRIES) {
        // Rate-limited — wait and retry
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[CoinGecko] 429 rate-limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        continue;
      }

      return res; // Return the response (even non-OK — caller decides how to handle)
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      // On network error, retry if we have attempts left
      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[CoinGecko] Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await sleep(delay);
        continue;
      }
    } finally {
      clearTimeout(timer); // Always clear the timer so it doesn't fire after a successful request
    }
  }

  throw lastError ?? new Error('Request failed after retries');
}

// ─── Fetch top 50 coins by market cap ────────────────────────────────────────
// Called by the Market screen to show the list of coins
export async function fetchMarketCoins(vsCurrency: VsCurrency = 'usd'): Promise<CoinMarketItem[]> {
  const cacheKey = `market_${vsCurrency}`;
  const cached = getCached<CoinMarketItem[]>(cacheKey);
  if (cached) return cached;

  // Build the full API URL with query parameters:
  const url =
    `${BASE_URL}/coins/markets` +   // Endpoint for the market list
    `?vs_currency=${vsCurrency}` +  // Which currency to price in (usd or eur)
    `&order=market_cap_desc` +       // Sort by market cap, biggest first
    `&per_page=50&page=1` +          // Get the top 50 coins, first page only
    `&sparkline=false` +             // Don't include sparkline chart data (saves bandwidth)
    `&price_change_percentage=24h`;  // Include 24-hour price change percentage

  const res = await fetchWithRetry(url); // Make the request with retry + timeout
  if (!res.ok) throw new Error(`Market fetch failed (${res.status})`); // If server returns an error, throw it

  const data = (await res.json()) as CoinMarketItem[]; // Parse JSON response
  setCache(cacheKey, data); // Cache the result
  return data;
}

// ─── Fetch detailed info for one specific coin ────────────────────────────────
// Called by the Coin Details screen when you tap on a coin
export async function fetchCoinDetails(id: string): Promise<CoinDetails> {
  const cacheKey = `coin_${id}`;
  const cached = getCached<CoinDetails>(cacheKey);
  if (cached) return cached;

  // Build the URL for a single coin using its unique id (e.g. "bitcoin")
  const url =
    `${BASE_URL}/coins/${id}` +        // Endpoint for a specific coin
    `?localization=false` +             // Don't include translations (we only need English)
    `&tickers=false` +                  // Skip exchange ticker data (not needed)
    `&market_data=true` +               // Include price and market cap data
    `&community_data=false` +           // Skip social media stats
    `&developer_data=false` +           // Skip GitHub/developer activity
    `&sparkline=false`;                 // Skip chart sparkline data

  const res = await fetchWithRetry(url); // Make the request with retry + timeout
  if (!res.ok) throw new Error(`Coin fetch failed (${res.status})`); // If server returns an error, throw it

  const data = (await res.json()) as CoinDetails; // Parse and return the coin detail object
  setCache(cacheKey, data); // Cache the result
  return data;
}
