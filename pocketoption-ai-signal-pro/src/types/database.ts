/**
 * Hand-authored database types mirroring supabase/migrations.
 * For larger projects, generate these with `supabase gen types typescript`.
 */
import type { UserRole, AssetCategory, LicenseType } from '@/lib/constants';

export type LicenseStatus =
  | 'unused'
  | 'active'
  | 'suspended'
  | 'expired'
  | 'revoked';

export type SignalDirection = 'buy' | 'sell' | 'neutral';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  theme: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface License {
  id: string;
  license_key: string;
  type: LicenseType;
  status: LicenseStatus;
  is_lifetime: boolean;
  device_limit: number;
  expires_at: string | null;
  assigned_user_id: string | null;
  device_fingerprint: string | null;
  device_name: string | null;
  activated_at: string | null;
  last_login_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  symbol: string;
  provider_symbol: string | null;
  name: string;
  category: AssetCategory;
  is_otc: boolean;
  is_enabled: boolean;
  data_provider: string;
  price_precision: number;
  sort_order: number;
  otc_sessions: unknown | null;
  otc_refresh_ms: number | null;
  symbol_mapping: unknown | null;
  created_at: string;
  updated_at: string;
}

export interface Signal {
  id: string;
  asset_id: string;
  timeframe: string;
  direction: SignalDirection;
  confidence: number;
  price: number | null;
  trend: string | null;
  risk_level: string | null;
  support: number | null;
  resistance: number | null;
  reasons: unknown;
  indicators: unknown;
  expires_at: string | null;
  created_at: string;
}

export interface SignalHistoryRow {
  id: string;
  asset_id: string | null;
  asset_symbol: string;
  timeframe: string;
  direction: SignalDirection;
  confidence: number;
  price: number | null;
  trend: string | null;
  risk_level: string | null;
  reasons: unknown;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  asset_id: string;
  is_pinned: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  kind: string;
  is_read: boolean;
  data: unknown;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_by: string | null;
  created_at: string;
}
