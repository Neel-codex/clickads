/** App-wide constants shared by client and server. */

export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME ?? 'PocketOption AI Signal Pro';

export const SUPPORT_TELEGRAM =
  process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM ?? '@devtech77';

export const COMPLIANCE_DISCLAIMER =
  'Signals are analytical estimates based on public market data and technical analysis. They should not be interpreted as financial advice or guarantees of future market performance.';

/** Supported timeframes (value used by data layer, label for UI). */
export const TIMEFRAMES = [
  { value: '15s', label: '15s', seconds: 15 },
  { value: '30s', label: '30s', seconds: 30 },
  { value: '1m', label: '1m', seconds: 60 },
  { value: '2m', label: '2m', seconds: 120 },
  { value: '3m', label: '3m', seconds: 180 },
  { value: '5m', label: '5m', seconds: 300 },
  { value: '10m', label: '10m', seconds: 600 },
  { value: '15m', label: '15m', seconds: 900 },
  { value: '30m', label: '30m', seconds: 1800 },
  { value: '1h', label: '1H', seconds: 3600 },
  { value: '4h', label: '4H', seconds: 14400 },
  { value: '1d', label: '1D', seconds: 86400 },
] as const;

export type TimeframeValue = (typeof TIMEFRAMES)[number]['value'];

export const ASSET_CATEGORIES = [
  'major_forex',
  'minor_forex',
  'exotic_forex',
  'crypto',
  'indices',
  'commodities',
  'otc',
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const ASSET_CATEGORY_LABELS: Record<AssetCategory, string> = {
  major_forex: 'Major Forex',
  minor_forex: 'Minor Forex',
  exotic_forex: 'Exotic Forex',
  crypto: 'Crypto',
  indices: 'Indices',
  commodities: 'Commodities',
  otc: 'OTC',
};

export const LICENSE_TYPES = [
  { value: '7d', label: '7 Days', days: 7 },
  { value: '30d', label: '30 Days', days: 30 },
  { value: '90d', label: '90 Days', days: 90 },
  { value: 'lifetime', label: 'Lifetime', days: null },
] as const;

export type LicenseType = (typeof LICENSE_TYPES)[number]['value'];

export const USER_ROLES = ['super_admin', 'admin', 'user'] as const;
export type UserRole = (typeof USER_ROLES)[number];
