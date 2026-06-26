-- =====================================================================
-- 0004 - Markets expansion
-- Adds the full set of forex pairs, indices & commodities (Yahoo) and a broad
-- set of crypto pairs served by the Binance public data API.
-- Run this once on an EXISTING database (fresh installs get it via seed.sql).
-- Idempotent: re-running only updates provider/name/category.
-- =====================================================================

-- FOREX (provider: yahoo)
insert into public.assets (symbol, provider_symbol, name, category, data_provider, price_precision, sort_order)
values
  ('EURUSD','EURUSD=X','Euro / US Dollar','major_forex','yahoo',5,1),
  ('GBPUSD','GBPUSD=X','British Pound / US Dollar','major_forex','yahoo',5,2),
  ('USDJPY','USDJPY=X','US Dollar / Japanese Yen','major_forex','yahoo',3,3),
  ('USDCHF','USDCHF=X','US Dollar / Swiss Franc','major_forex','yahoo',5,4),
  ('AUDUSD','AUDUSD=X','Australian Dollar / US Dollar','major_forex','yahoo',5,5),
  ('USDCAD','USDCAD=X','US Dollar / Canadian Dollar','major_forex','yahoo',5,6),
  ('NZDUSD','NZDUSD=X','New Zealand Dollar / US Dollar','major_forex','yahoo',5,7),
  ('EURGBP','EURGBP=X','Euro / British Pound','minor_forex','yahoo',5,10),
  ('EURJPY','EURJPY=X','Euro / Japanese Yen','minor_forex','yahoo',3,11),
  ('EURCHF','EURCHF=X','Euro / Swiss Franc','minor_forex','yahoo',5,12),
  ('EURAUD','EURAUD=X','Euro / Australian Dollar','minor_forex','yahoo',5,13),
  ('EURCAD','EURCAD=X','Euro / Canadian Dollar','minor_forex','yahoo',5,14),
  ('EURNZD','EURNZD=X','Euro / New Zealand Dollar','minor_forex','yahoo',5,15),
  ('GBPJPY','GBPJPY=X','British Pound / Japanese Yen','minor_forex','yahoo',3,16),
  ('GBPCHF','GBPCHF=X','British Pound / Swiss Franc','minor_forex','yahoo',5,17),
  ('GBPAUD','GBPAUD=X','British Pound / Australian Dollar','minor_forex','yahoo',5,18),
  ('GBPCAD','GBPCAD=X','British Pound / Canadian Dollar','minor_forex','yahoo',5,19),
  ('GBPNZD','GBPNZD=X','British Pound / New Zealand Dollar','minor_forex','yahoo',5,20),
  ('AUDJPY','AUDJPY=X','Australian Dollar / Japanese Yen','minor_forex','yahoo',3,21),
  ('AUDCHF','AUDCHF=X','Australian Dollar / Swiss Franc','minor_forex','yahoo',5,22),
  ('AUDCAD','AUDCAD=X','Australian Dollar / Canadian Dollar','minor_forex','yahoo',5,23),
  ('AUDNZD','AUDNZD=X','Australian Dollar / New Zealand Dollar','minor_forex','yahoo',5,24),
  ('NZDJPY','NZDJPY=X','New Zealand Dollar / Japanese Yen','minor_forex','yahoo',3,25),
  ('NZDCHF','NZDCHF=X','New Zealand Dollar / Swiss Franc','minor_forex','yahoo',5,26),
  ('NZDCAD','NZDCAD=X','New Zealand Dollar / Canadian Dollar','minor_forex','yahoo',5,27),
  ('CADJPY','CADJPY=X','Canadian Dollar / Japanese Yen','minor_forex','yahoo',3,28),
  ('CADCHF','CADCHF=X','Canadian Dollar / Swiss Franc','minor_forex','yahoo',5,29),
  ('CHFJPY','CHFJPY=X','Swiss Franc / Japanese Yen','minor_forex','yahoo',3,30),
  ('USDTRY','USDTRY=X','US Dollar / Turkish Lira','exotic_forex','yahoo',4,40),
  ('USDZAR','USDZAR=X','US Dollar / South African Rand','exotic_forex','yahoo',4,41),
  ('USDMXN','USDMXN=X','US Dollar / Mexican Peso','exotic_forex','yahoo',4,42),
  ('USDSGD','USDSGD=X','US Dollar / Singapore Dollar','exotic_forex','yahoo',5,43),
  ('USDHKD','USDHKD=X','US Dollar / Hong Kong Dollar','exotic_forex','yahoo',4,44),
  ('USDSEK','USDSEK=X','US Dollar / Swedish Krona','exotic_forex','yahoo',4,45),
  ('USDNOK','USDNOK=X','US Dollar / Norwegian Krone','exotic_forex','yahoo',4,46),
  ('USDDKK','USDDKK=X','US Dollar / Danish Krone','exotic_forex','yahoo',4,47),
  ('USDPLN','USDPLN=X','US Dollar / Polish Zloty','exotic_forex','yahoo',4,48),
  ('USDHUF','USDHUF=X','US Dollar / Hungarian Forint','exotic_forex','yahoo',3,49),
  ('USDCZK','USDCZK=X','US Dollar / Czech Koruna','exotic_forex','yahoo',4,50),
  ('USDINR','USDINR=X','US Dollar / Indian Rupee','exotic_forex','yahoo',3,51),
  ('USDTHB','USDTHB=X','US Dollar / Thai Baht','exotic_forex','yahoo',3,52),
  ('USDCNH','USDCNH=X','US Dollar / Chinese Yuan (offshore)','exotic_forex','yahoo',4,53),
  ('EURTRY','EURTRY=X','Euro / Turkish Lira','exotic_forex','yahoo',4,54),
  ('EURPLN','EURPLN=X','Euro / Polish Zloty','exotic_forex','yahoo',4,55),
  ('EURSEK','EURSEK=X','Euro / Swedish Krona','exotic_forex','yahoo',4,56),
  ('EURNOK','EURNOK=X','Euro / Norwegian Krone','exotic_forex','yahoo',4,57),
  ('GBPTRY','GBPTRY=X','British Pound / Turkish Lira','exotic_forex','yahoo',4,58)
on conflict (symbol) do update
  set provider_symbol = excluded.provider_symbol, name = excluded.name,
      category = excluded.category, data_provider = excluded.data_provider,
      price_precision = excluded.price_precision;

-- CRYPTO (provider: binance) - internal <COIN>USD maps to Binance <COIN>USDT.
-- This also migrates any pre-existing crypto rows from yahoo to binance.
insert into public.assets (symbol, provider_symbol, name, category, data_provider, price_precision, sort_order)
values
  ('BTCUSD','BTCUSDT','Bitcoin / USDT','crypto','binance',2,100),
  ('ETHUSD','ETHUSDT','Ethereum / USDT','crypto','binance',2,101),
  ('BNBUSD','BNBUSDT','BNB / USDT','crypto','binance',2,102),
  ('SOLUSD','SOLUSDT','Solana / USDT','crypto','binance',3,103),
  ('XRPUSD','XRPUSDT','XRP / USDT','crypto','binance',5,104),
  ('ADAUSD','ADAUSDT','Cardano / USDT','crypto','binance',5,105),
  ('DOGEUSD','DOGEUSDT','Dogecoin / USDT','crypto','binance',6,106),
  ('AVAXUSD','AVAXUSDT','Avalanche / USDT','crypto','binance',3,107),
  ('DOTUSD','DOTUSDT','Polkadot / USDT','crypto','binance',4,108),
  ('LINKUSD','LINKUSDT','Chainlink / USDT','crypto','binance',3,109),
  ('LTCUSD','LTCUSDT','Litecoin / USDT','crypto','binance',2,110),
  ('BCHUSD','BCHUSDT','Bitcoin Cash / USDT','crypto','binance',2,111),
  ('TRXUSD','TRXUSDT','TRON / USDT','crypto','binance',6,112),
  ('UNIUSD','UNIUSDT','Uniswap / USDT','crypto','binance',4,113),
  ('ATOMUSD','ATOMUSDT','Cosmos / USDT','crypto','binance',4,114),
  ('ETCUSD','ETCUSDT','Ethereum Classic / USDT','crypto','binance',3,115),
  ('XLMUSD','XLMUSDT','Stellar / USDT','crypto','binance',5,116),
  ('NEARUSD','NEARUSDT','NEAR Protocol / USDT','crypto','binance',4,117),
  ('APTUSD','APTUSDT','Aptos / USDT','crypto','binance',4,118),
  ('ARBUSD','ARBUSDT','Arbitrum / USDT','crypto','binance',4,119),
  ('OPUSD','OPUSDT','Optimism / USDT','crypto','binance',4,120),
  ('FILUSD','FILUSDT','Filecoin / USDT','crypto','binance',4,121),
  ('INJUSD','INJUSDT','Injective / USDT','crypto','binance',3,122),
  ('SUIUSD','SUIUSDT','Sui / USDT','crypto','binance',4,123),
  ('TONUSD','TONUSDT','Toncoin / USDT','crypto','binance',4,124),
  ('ICPUSD','ICPUSDT','Internet Computer / USDT','crypto','binance',3,125),
  ('AAVEUSD','AAVEUSDT','Aave / USDT','crypto','binance',2,126),
  ('SANDUSD','SANDUSDT','The Sandbox / USDT','crypto','binance',5,127),
  ('PEPEUSD','PEPEUSDT','Pepe / USDT','crypto','binance',8,128),
  ('SHIBUSD','SHIBUSDT','Shiba Inu / USDT','crypto','binance',8,129)
on conflict (symbol) do update
  set provider_symbol = excluded.provider_symbol, name = excluded.name,
      category = excluded.category, data_provider = excluded.data_provider,
      price_precision = excluded.price_precision;

-- INDICES & COMMODITIES (provider: yahoo)
insert into public.assets (symbol, provider_symbol, name, category, data_provider, price_precision, sort_order)
values
  ('SPX','^GSPC','S&P 500','indices','yahoo',2,200),
  ('NDX','^NDX','Nasdaq 100','indices','yahoo',2,201),
  ('DJI','^DJI','Dow Jones 30','indices','yahoo',2,202),
  ('FTSE','^FTSE','FTSE 100','indices','yahoo',2,203),
  ('DAX','^GDAXI','DAX 40','indices','yahoo',2,204),
  ('N225','^N225','Nikkei 225','indices','yahoo',2,205),
  ('XAUUSD','GC=F','Gold','commodities','yahoo',2,220),
  ('XAGUSD','SI=F','Silver','commodities','yahoo',3,221),
  ('WTI','CL=F','Crude Oil WTI','commodities','yahoo',2,222),
  ('BRENT','BZ=F','Brent Crude Oil','commodities','yahoo',2,223),
  ('NATGAS','NG=F','Natural Gas','commodities','yahoo',3,224)
on conflict (symbol) do update
  set provider_symbol = excluded.provider_symbol, name = excluded.name,
      category = excluded.category, data_provider = excluded.data_provider,
      price_precision = excluded.price_precision;
