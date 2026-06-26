/**
 * Configurable OTC provider architecture.
 *
 * Pocket Option OTC prices are NOT available from Yahoo Finance. Rather than
 * fabricate unsupported data, OTC pairs declare a `data_provider` and the
 * platform resolves it through this registry. If no provider can serve a pair,
 * the UI must show "Live OTC data unavailable" instead of generating signals.
 */
import type { Candle } from '@/lib/analysis/types';
import type { TimeframeValue } from '@/lib/constants';
import type { Asset } from '@/types/database';

export interface OtcFetchResult {
  available: boolean;
  candles: Candle[];
  /** Reason shown to the user when `available` is false. */
  message?: string;
}

export interface OtcProvider {
  /** Unique key stored in assets.data_provider. */
  key: string;
  label: string;
  fetchCandles(asset: Asset, timeframe: TimeframeValue): Promise<OtcFetchResult>;
}

/**
 * Default provider: explicitly reports that live OTC data is unavailable.
 * This is the honest fallback when no external OTC feed is configured.
 */
const unavailableProvider: OtcProvider = {
  key: 'otc_custom',
  label: 'Unconfigured OTC Source',
  async fetchCandles(asset) {
    return {
      available: false,
      candles: [],
      message: `Live OTC data for ${asset.symbol} is unavailable. An administrator must assign a working data provider for this pair.`,
    };
  },
};

const registry = new Map<string, OtcProvider>([
  [unavailableProvider.key, unavailableProvider],
]);

/** Register a real OTC provider implementation (e.g. a broker websocket bridge). */
export function registerOtcProvider(provider: OtcProvider) {
  registry.set(provider.key, provider);
}

export function getOtcProvider(key: string): OtcProvider {
  return registry.get(key) ?? unavailableProvider;
}

/** Resolve OTC candles for an asset, respecting its configured provider. */
export async function fetchOtcCandles(
  asset: Asset,
  timeframe: TimeframeValue,
): Promise<OtcFetchResult> {
  if (!asset.is_enabled) {
    return {
      available: false,
      candles: [],
      message: `${asset.symbol} is currently disabled by an administrator.`,
    };
  }
  return getOtcProvider(asset.data_provider).fetchCandles(asset, timeframe);
}
