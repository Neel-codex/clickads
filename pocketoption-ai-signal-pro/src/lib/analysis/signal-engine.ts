/**
 * Signal engine: combines indicator readings, candlestick patterns and
 * Smart Money Concepts into a single weighted BUY / SELL / NEUTRAL idea with
 * a confidence score and human-readable reasons.
 *
 * IMPORTANT: Output is an analytical estimate only — never a guarantee.
 */
import type { Candle, SignalReason, SignalResult, Direction } from './types';
import {
  ema,
  rsi,
  macd,
  atr,
  adx,
  bollinger,
  cci,
  stochRsi,
  superTrend,
  ichimoku,
  vwap,
  avgVolume,
  last,
} from './indicators';
import { detectPatterns } from './candlestick';
import { detectSmc, supportResistance, classifyTrend } from './smc';

export interface SignalEngineConfig {
  /** Minimum confidence to emit a non-neutral signal (0..100). */
  minConfidence: number;
}

const DEFAULT_CONFIG: SignalEngineConfig = { minConfidence: 55 };

/** Weight applied to each evidence group when aggregating. */
const GROUP_WEIGHTS = {
  indicator: 1,
  candlestick: 0.9,
  smc: 1.1,
  trend: 1.2,
} as const;

function pushReason(
  reasons: SignalReason[],
  code: string,
  label: string,
  direction: Direction,
  weight: number,
  group: SignalReason['group'],
) {
  if (direction === 'neutral' || weight <= 0) return;
  reasons.push({ code, label, direction, weight, group });
}

/**
 * Evaluate the latest candle of `candles` and return a signal.
 * Requires a reasonable amount of history (>= 60 candles recommended).
 */
export function generateSignal(
  candles: Candle[],
  config: Partial<SignalEngineConfig> = {},
): SignalResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const n = candles.length;
  const price = n > 0 ? candles[n - 1]!.close : 0;
  const reasons: SignalReason[] = [];

  // --- Indicators ---
  const emaFast = ema(candles.map((c) => c.close), 9);
  const emaSlow = ema(candles.map((c) => c.close), 21);
  const rsiSeries = rsi(candles, 14);
  const macdSeries = macd(candles);
  const atrSeries = atr(candles, 14);
  const adxSeries = adx(candles, 14);
  const bbSeries = bollinger(candles, 20, 2);
  const cciSeries = cci(candles, 20);
  const stochRsiSeries = stochRsi(candles);
  const stSeries = superTrend(candles);
  const ichiSeries = ichimoku(candles);
  const vwapSeries = vwap(candles);
  const volSeries = avgVolume(candles, 20);

  const rsiVal = last(rsiSeries);
  const macdVal = macdSeries[n - 1];
  const adxVal = last(adxSeries.adx);
  const plusDI = last(adxSeries.plusDI);
  const minusDI = last(adxSeries.minusDI);
  const bb = bbSeries[n - 1];
  const cciVal = last(cciSeries);
  const stochRsiVal = last(stochRsiSeries);
  const st = stSeries[n - 1];
  const ichi = ichiSeries[n - 1];
  const vwapVal = last(vwapSeries);
  const atrVal = last(atrSeries);

  // RSI
  if (rsiVal != null) {
    if (rsiVal <= 30) pushReason(reasons, 'rsi_oversold', `RSI oversold (${rsiVal.toFixed(0)})`, 'buy', 0.7, 'indicator');
    else if (rsiVal >= 70) pushReason(reasons, 'rsi_overbought', `RSI overbought (${rsiVal.toFixed(0)})`, 'sell', 0.7, 'indicator');
    else if (rsiVal > 50) pushReason(reasons, 'rsi_bull', 'RSI above 50', 'buy', 0.25, 'indicator');
    else pushReason(reasons, 'rsi_bear', 'RSI below 50', 'sell', 0.25, 'indicator');
  }

  // MACD histogram + cross
  if (macdVal?.macd != null && macdVal.signal != null) {
    const dir: Direction = macdVal.macd > macdVal.signal ? 'buy' : 'sell';
    const strength = Math.min(0.6, Math.abs(macdVal.histogram ?? 0) / (price || 1) * 50 + 0.3);
    pushReason(reasons, 'macd', `MACD ${dir === 'buy' ? 'bullish' : 'bearish'} cross`, dir, strength, 'indicator');
  }

  // EMA alignment
  const ef = last(emaFast);
  const es = last(emaSlow);
  if (ef != null && es != null) {
    const dir: Direction = ef > es ? 'buy' : 'sell';
    pushReason(reasons, 'ema_align', `EMA9 ${dir === 'buy' ? 'above' : 'below'} EMA21`, dir, 0.5, 'indicator');
  }

  // ADX trend strength gates DI direction
  if (adxVal != null && plusDI != null && minusDI != null && adxVal >= 20) {
    const dir: Direction = plusDI > minusDI ? 'buy' : 'sell';
    const strength = Math.min(0.7, 0.3 + (adxVal - 20) / 100);
    pushReason(reasons, 'adx', `ADX ${adxVal.toFixed(0)} trend (${dir === 'buy' ? '+DI' : '-DI'} dominant)`, dir, strength, 'indicator');
  }

  // Bollinger touch
  if (bb?.upper != null && bb.lower != null) {
    if (price <= bb.lower) pushReason(reasons, 'bb_lower', 'Price at lower Bollinger band', 'buy', 0.45, 'indicator');
    else if (price >= bb.upper) pushReason(reasons, 'bb_upper', 'Price at upper Bollinger band', 'sell', 0.45, 'indicator');
  }

  // CCI
  if (cciVal != null) {
    if (cciVal <= -100) pushReason(reasons, 'cci_os', 'CCI oversold', 'buy', 0.4, 'indicator');
    else if (cciVal >= 100) pushReason(reasons, 'cci_ob', 'CCI overbought', 'sell', 0.4, 'indicator');
  }

  // Stochastic RSI
  if (stochRsiVal != null) {
    if (stochRsiVal <= 20) pushReason(reasons, 'stochrsi_os', 'Stoch RSI oversold', 'buy', 0.4, 'indicator');
    else if (stochRsiVal >= 80) pushReason(reasons, 'stochrsi_ob', 'Stoch RSI overbought', 'sell', 0.4, 'indicator');
  }

  // SuperTrend
  if (st?.direction) {
    pushReason(reasons, 'supertrend', `SuperTrend ${st.direction === 'up' ? 'bullish' : 'bearish'}`, st.direction === 'up' ? 'buy' : 'sell', 0.55, 'indicator');
  }

  // Ichimoku cloud position
  if (ichi?.spanA != null && ichi.spanB != null) {
    const cloudTop = Math.max(ichi.spanA, ichi.spanB);
    const cloudBottom = Math.min(ichi.spanA, ichi.spanB);
    if (price > cloudTop) pushReason(reasons, 'ichimoku_above', 'Price above Ichimoku cloud', 'buy', 0.5, 'indicator');
    else if (price < cloudBottom) pushReason(reasons, 'ichimoku_below', 'Price below Ichimoku cloud', 'sell', 0.5, 'indicator');
  }

  // VWAP
  if (vwapVal != null) {
    const dir: Direction = price > vwapVal ? 'buy' : 'sell';
    pushReason(reasons, 'vwap', `Price ${dir === 'buy' ? 'above' : 'below'} VWAP`, dir, 0.3, 'indicator');
  }

  // Volume confirmation
  const vol = candles[n - 1]?.volume;
  const avgVol = last(volSeries);
  if (vol != null && avgVol != null && avgVol > 0 && vol > avgVol * 1.5) {
    const dir: Direction = candles[n - 1]!.close >= candles[n - 1]!.open ? 'buy' : 'sell';
    pushReason(reasons, 'volume_spike', 'Above-average volume confirmation', dir, 0.35, 'indicator');
  }

  // --- Candlestick patterns ---
  for (const p of detectPatterns(candles)) {
    pushReason(reasons, p.code, p.label, p.direction, p.strength, 'candlestick');
  }

  // --- Smart Money Concepts ---
  for (const s of detectSmc(candles)) {
    pushReason(reasons, s.code, s.label, s.direction, s.strength, 'smc');
  }

  // --- Trend ---
  const trend = classifyTrend(candles, emaFast, emaSlow);
  if (trend === 'strong_up') pushReason(reasons, 'trend_strong_up', 'Strong uptrend', 'buy', 0.8, 'trend');
  else if (trend === 'up') pushReason(reasons, 'trend_up', 'Uptrend', 'buy', 0.45, 'trend');
  else if (trend === 'strong_down') pushReason(reasons, 'trend_strong_down', 'Strong downtrend', 'sell', 0.8, 'trend');
  else if (trend === 'down') pushReason(reasons, 'trend_down', 'Downtrend', 'sell', 0.45, 'trend');

  // --- Aggregate ---
  let buyScore = 0;
  let sellScore = 0;
  for (const r of reasons) {
    const w = r.weight * GROUP_WEIGHTS[r.group];
    if (r.direction === 'buy') buyScore += w;
    else if (r.direction === 'sell') sellScore += w;
  }
  const total = buyScore + sellScore;
  let direction: Direction = 'neutral';
  let confidence = 0;
  if (total > 0) {
    const dominant = Math.max(buyScore, sellScore);
    direction = buyScore >= sellScore ? 'buy' : 'sell';
    // Confidence = share of dominant side, scaled and capped (never 100%).
    confidence = Math.round((dominant / total) * 100);
    // Dampen confidence when overall evidence is thin.
    const evidenceFactor = Math.min(1, total / 4);
    confidence = Math.round(50 + (confidence - 50) * evidenceFactor);
    confidence = Math.min(confidence, 95); // never imply certainty
  }

  if (confidence < cfg.minConfidence) {
    direction = 'neutral';
  }

  // --- Risk level from ATR (volatility) and trend agreement ---
  const atrPct = atrVal != null && price > 0 ? (atrVal / price) * 100 : 0;
  let riskLevel: SignalResult['riskLevel'] = 'medium';
  if (atrPct < 0.4 && (trend === 'strong_up' || trend === 'strong_down')) riskLevel = 'low';
  else if (atrPct > 1.2 || trend === 'sideways') riskLevel = 'high';

  const { support, resistance } = supportResistance(candles);

  // Sort reasons by effective weight, strongest first.
  reasons.sort(
    (a, b) =>
      b.weight * GROUP_WEIGHTS[b.group] - a.weight * GROUP_WEIGHTS[a.group],
  );

  return {
    direction,
    confidence,
    trend,
    riskLevel,
    support,
    resistance,
    reasons: reasons.slice(0, 12),
    indicators: {
      rsi: rsiVal,
      macd: macdVal?.macd ?? null,
      macdHistogram: macdVal?.histogram ?? null,
      adx: adxVal,
      atr: atrVal,
      cci: cciVal,
      stochRsi: stochRsiVal,
      ema9: ef,
      ema21: es,
      vwap: vwapVal,
      bbUpper: bb?.upper ?? null,
      bbLower: bb?.lower ?? null,
    },
    price,
    generatedAt: new Date().toISOString(),
  };
}
