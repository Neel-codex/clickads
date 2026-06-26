-- =====================================================================
-- Seed data: core assets + default settings.
-- Safe to run multiple times (idempotent upserts on unique symbol/key).
-- =====================================================================

insert into public.assets (symbol, provider_symbol, name, category, data_provider, price_precision, sort_order)
values
  -- Major forex
  ('EURUSD', 'EURUSD=X', 'Euro / US Dollar',        'major_forex', 'yahoo', 5, 1),
  ('GBPUSD', 'GBPUSD=X', 'British Pound / US Dollar','major_forex', 'yahoo', 5, 2),
  ('USDJPY', 'USDJPY=X', 'US Dollar / Yen',          'major_forex', 'yahoo', 3, 3),
  ('USDCHF', 'USDCHF=X', 'US Dollar / Swiss Franc',  'major_forex', 'yahoo', 5, 4),
  ('AUDUSD', 'AUDUSD=X', 'Australian / US Dollar',   'major_forex', 'yahoo', 5, 5),
  ('USDCAD', 'USDCAD=X', 'US Dollar / Canadian',     'major_forex', 'yahoo', 5, 6),
  -- Minor forex
  ('EURGBP', 'EURGBP=X', 'Euro / British Pound',     'minor_forex', 'yahoo', 5, 10),
  ('EURJPY', 'EURJPY=X', 'Euro / Yen',               'minor_forex', 'yahoo', 3, 11),
  ('GBPJPY', 'GBPJPY=X', 'Pound / Yen',              'minor_forex', 'yahoo', 3, 12),
  -- Exotic forex
  ('USDTRY', 'USDTRY=X', 'US Dollar / Turkish Lira', 'exotic_forex','yahoo', 4, 20),
  ('USDZAR', 'USDZAR=X', 'US Dollar / Rand',         'exotic_forex','yahoo', 4, 21),
  -- Crypto
  ('BTCUSD', 'BTC-USD',  'Bitcoin / US Dollar',      'crypto',      'yahoo', 2, 30),
  ('ETHUSD', 'ETH-USD',  'Ethereum / US Dollar',     'crypto',      'yahoo', 2, 31),
  ('SOLUSD', 'SOL-USD',  'Solana / US Dollar',       'crypto',      'yahoo', 3, 32),
  -- Indices
  ('SPX',    '^GSPC',    'S&P 500',                  'indices',     'yahoo', 2, 40),
  ('NDX',    '^NDX',     'Nasdaq 100',               'indices',     'yahoo', 2, 41),
  ('DJI',    '^DJI',     'Dow Jones 30',             'indices',     'yahoo', 2, 42),
  -- Commodities
  ('XAUUSD', 'GC=F',     'Gold',                     'commodities', 'yahoo', 2, 50),
  ('XAGUSD', 'SI=F',     'Silver',                   'commodities', 'yahoo', 3, 51),
  ('WTI',    'CL=F',     'Crude Oil WTI',            'commodities', 'yahoo', 2, 52)
on conflict (symbol) do update
  set name = excluded.name,
      provider_symbol = excluded.provider_symbol,
      category = excluded.category;

-- Example OTC pair (disabled until an admin assigns a data provider).
insert into public.assets
  (symbol, name, category, is_otc, is_enabled, data_provider, price_precision, sort_order, otc_refresh_ms, otc_sessions)
values
  ('EURUSD-OTC', 'EUR/USD OTC', 'otc', true, false, 'otc_custom', 5, 60,
   5000, '[{"day":"sat","open":"00:00","close":"23:59"},{"day":"sun","open":"00:00","close":"23:59"}]'::jsonb)
on conflict (symbol) do nothing;

insert into public.settings (key, value) values
  ('signal_engine', '{"min_confidence":55,"max_signals_per_minute":12}'::jsonb),
  ('market_data',   '{"refresh_seconds":5,"provider":"yahoo"}'::jsonb),
  ('branding',      '{"support_telegram":"@devtech77"}'::jsonb)
on conflict (key) do nothing;
