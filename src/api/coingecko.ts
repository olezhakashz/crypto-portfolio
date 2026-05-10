import type { CoinMarketItem } from '../types/coin';

const BASE_URL = 'https://api.coingecko.com/api/v3';
const TIMEOUT_MS = 10_000; // 10 second timeout

export type VsCurrency = 'usd' | 'eur';

export type CoinDetails = {
  id: string;
  symbol: string;
  name: string;
  image: {
    large: string;
  };
  market_data: {
    current_price: Record<'usd' | 'eur', number>;
    market_cap: Record<'usd' | 'eur', number>;
    price_change_percentage_24h: number | null;
  };
};

/** fetch with an AbortController timeout */
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Market list
export async function fetchMarketCoins(vsCurrency: VsCurrency = 'usd'): Promise<CoinMarketItem[]> {
  const url =
    `${BASE_URL}/coins/markets` +
    `?vs_currency=${vsCurrency}` +
    `&order=market_cap_desc` +
    `&per_page=50&page=1` +
    `&sparkline=false` +
    `&price_change_percentage=24h`;

  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Market fetch failed (${res.status})`);
  return (await res.json()) as CoinMarketItem[];
}

// Coin details
export async function fetchCoinDetails(id: string): Promise<CoinDetails> {
  const url =
    `${BASE_URL}/coins/${id}` +
    `?localization=false` +
    `&tickers=false` +
    `&market_data=true` +
    `&community_data=false` +
    `&developer_data=false` +
    `&sparkline=false`;

  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Coin fetch failed (${res.status})`);
  return (await res.json()) as CoinDetails;
}
