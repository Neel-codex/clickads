/**
 * Binance public market-data service for crypto pairs.
 *
 * Uses Binance's public DATA host `data-api.binance.vision` by default rather
 * than `api.binance.com`. The data host serves market data (klines, ticker)
 * without an API key and is NOT geo-restricted, so it works from US-hosted
 * environments like Vercel's iad1 region where `api.binance.com` returns 451.
 *
 * No API key is required for these public endpoints.
 */
import type { Candle } from '@/lib/analysis/types';
import type { TimeframeValue } from '@/lib/constants';

const BASE_URL =
  process.env.BINANCE_BASE_URL ?? 'https://data-api.binance.vision';

/**
 * Map app timeframes to Binance kline intervals.
 * Binance supports 1s/1m/3m/5m/15m/30m/1h/2h/4h/1d (no 2m or 10m), so those
 * are approximated with the nearest finer native interval.
 */
const TF_MAP: Record<TimeframeValue, { interval: string; native: boolean }> = {
  '15s': { interval: '1s', native: false },
  '30s': { interval: '1s', native: false },
  '1m': { interval: '1m', native: true },
  '2m': { interval: '1m', native: false },
  '3m': { interval: '3m', native: true },
  '5m': { interval: '5m', native: true },
  '10m': { interval: '5m', native: false },
  '15m': { interval: '15m', native: true },
  '30m': { interval: '30m', native: true },
  '1h': { interval: '1h', native: true },
  '4h': { interval: '4h', native: true },
  '1d': { interval: '1d', native: true },
};

export interface BinanceResult {
  candles: Candle[];
  native: boolean;
}

// Binance kline tuple: [openTime, open, high, low, close, volume, closeTime, ...]
type Kline = [number, string, string, string, string, string, ...unknown[]];

/**
 * Fetch klines for a Binance symbol (e.g. "BTCUSDT") at a given timeframe.
 */
export async function fetchBinanceCandles(
  symbol: string,
  timeframe: TimeframeValue,
): Promise<BinanceResult> {
  const tf = TF_MAP[timeframe];
  const url = `${BASE_URL}/api/v3/klines?symbol=${encodeURIComponent(
    symbol,
  )}&interval=${tf.interval}&limit=500`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 5 },
  });

  if (!res.ok) {
    if (res.status === 451) {
      throw new Error(
        'Crypto data host is geo-restricted from this server. Set BINANCE_BASE_URL to a public data host.',
      );
    }
    throw new Error(`Binance request failed: ${res.status}`);
  }

  const data = (await res.json()) as Kline[];
  if (!Array.isArray(data)) {
    throw new Error('Unexpected Binance response');
  }

  const candles: Candle[] = data.map((k) => ({
    time: Math.floor(Number(k[0]) / 1000),
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
    volume: Number(k[5]),
  }));

  return { candles, native: tf.native };
}

/** Lightweight last-price quote for a Binance symbol. */
export async function fetchBinanceQuote(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/v3/ticker/price?symbol=${encodeURIComponent(symbol)}`,
      { next: { revalidate: 5 } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { price?: string };
    return json.price ? Number(json.price) : null;
  } catch {
    return null;
  }
}
