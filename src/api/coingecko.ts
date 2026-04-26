import type { CoinMarketItem } from '../types/coin';

const BASE_URL = 'https://api.coingecko.com/api/v3';

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

// Market list
export async function fetchMarketCoins(vsCurrency: VsCurrency = 'usd'): Promise<CoinMarketItem[]> {
  const url =
    `${BASE_URL}/coins/markets` +
    `?vs_currency=${vsCurrency}` +
    `&order=market_cap_desc` +
    `&per_page=50&page=1` +
    `&sparkline=false` +
    `&price_change_percentage=24h`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch market');
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

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load coin details');
  return (await res.json()) as CoinDetails;
}
