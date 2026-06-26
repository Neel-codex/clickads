/**
 * Market data service — fetches OHLC candles and quotes from Yahoo Finance's
 * public chart endpoint. Runs server-side only (route handlers / server actions)
 * to avoid CORS and to keep polling centralised for caching + rate limiting.
 *
 * Yahoo does not expose Pocket Option OTC pairs; OTC data is handled by the
 * configurable OTC provider layer (see services/otc-provider.ts).
 */
import type { Candle } from '@/lib/analysis/types';
import type { TimeframeValue } from '@/lib/constants';

const BASE_URL =
  process.env.MARKET_DATA_BASE_URL ?? 'https://query1.finance.yahoo.com';

/** Map app timeframes to Yahoo (interval, range). Sub-minute -> 1m (Yahoo's finest). */
const TF_MAP: Record<TimeframeValue, { interval: string; range: string; native: boolean }> = {
  '15s': { interval: '1m', range: '1d', native: false },
  '30s': { interval: '1m', range: '1d', native: false },
  '1m': { interval: '1m', range: '1d', native: true },
  '2m': { interval: '2m', range: '5d', native: true },
  '3m': { interval: '2m', range: '5d', native: false },
  '5m': { interval: '5m', range: '5d', native: true },
  '10m': { interval: '5m', range: '5d', native: false },
  '15m': { interval: '15m', range: '1mo', native: true },
  '30m': { interval: '30m', range: '1mo', native: true },
  '1h': { interval: '60m', range: '3mo', native: true },
  '4h': { interval: '60m', range: '6mo', native: false },
  '1d': { interval: '1d', range: '1y', native: true },
};

export interface MarketDataResult {
  candles: Candle[];
  /** Whether the timeframe is served natively or resampled/approximated. */
  native: boolean;
  symbol: string;
  currency?: string;
  meta: { regularMarketPrice?: number; previousClose?: number };
}

interface YahooChartResponse {
  chart: {
    result?: Array<{
      meta: { currency?: string; regularMarketPrice?: number; chartPreviousClose?: number };
      timestamp?: number[];
      indicators: {
        quote: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
      };
    }>;
    error?: { code: string; description: string } | null;
  };
}

/**
 * Fetch candles for a provider symbol at a given timeframe.
 * @param providerSymbol Yahoo symbol, e.g. "EURUSD=X", "BTC-USD", "^GSPC".
 */
export async function fetchCandles(
  providerSymbol: string,
  timeframe: TimeframeValue,
): Promise<MarketDataResult> {
  const tf = TF_MAP[timeframe];
  const url = `${BASE_URL}/v8/finance/chart/${encodeURIComponent(
    providerSymbol,
  )}?interval=${tf.interval}&range=${tf.range}&includePrePost=false`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AISignalPro/1.0)' },
    // Short server cache; the route handler adds CDN caching headers.
    next: { revalidate: 5 },
  });

  if (!res.ok) {
    throw new Error(`Market data request failed: ${res.status}`);
  }

  const json = (await res.json()) as YahooChartResponse;
  const result = json.chart.result?.[0];
  if (json.chart.error || !result) {
    throw new Error(json.chart.error?.description ?? 'No market data available');
  }

  const ts = result.timestamp ?? [];
  const q = result.indicators.quote[0] ?? {};
  const candles: Candle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const open = q.open?.[i];
    const high = q.high?.[i];
    const low = q.low?.[i];
    const close = q.close?.[i];
    if (open == null || high == null || low == null || close == null) continue;
    candles.push({
      time: ts[i]!,
      open,
      high,
      low,
      close,
      volume: q.volume?.[i] ?? undefined,
    });
  }

  return {
    candles,
    native: tf.native,
    symbol: providerSymbol,
    currency: result.meta.currency,
    meta: {
      regularMarketPrice: result.meta.regularMarketPrice,
      previousClose: result.meta.chartPreviousClose,
    },
  };
}

/** Lightweight last-price quote. */
export async function fetchQuote(providerSymbol: string): Promise<number | null> {
  try {
    const { candles, meta } = await fetchCandles(providerSymbol, '1m');
    return meta.regularMarketPrice ?? candles[candles.length - 1]?.close ?? null;
  } catch {
    return null;
  }
}
