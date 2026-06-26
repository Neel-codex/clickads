/**
 * Technical indicators implemented from first principles (no external TA lib).
 * All functions are pure and operate on numeric arrays / Candle arrays.
 * Each returns an array aligned to the input length, with `null` for
 * positions where the indicator is not yet defined (warm-up period).
 */
import type { Candle } from './types';

const closes = (c: Candle[]) => c.map((x) => x.close);

/** Simple Moving Average. */
export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i]!;
    if (i >= period) sum -= values[i - period]!;
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/** Exponential Moving Average. */
export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  // Seed with SMA of first `period` values.
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i]! * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** Wilder's smoothing (used by RSI, ATR, ADX). */
function wilderSmooth(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period) return out;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i]!;
  let prev = sum / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = (prev * (period - 1) + values[i]!) / period;
    out[i] = prev;
  }
  return out;
}

/** Relative Strength Index. */
export function rsi(candles: Candle[], period = 14): (number | null)[] {
  const c = closes(candles);
  const gains: number[] = [0];
  const losses: number[] = [0];
  for (let i = 1; i < c.length; i++) {
    const diff = c[i]! - c[i - 1]!;
    gains.push(Math.max(diff, 0));
    losses.push(Math.max(-diff, 0));
  }
  const avgGain = wilderSmooth(gains, period);
  const avgLoss = wilderSmooth(losses, period);
  return c.map((_, i) => {
    const g = avgGain[i];
    const l = avgLoss[i];
    if (g == null || l == null) return null;
    if (l === 0) return 100;
    const rs = g / l;
    return 100 - 100 / (1 + rs);
  });
}

export interface MacdPoint {
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

/** MACD (12, 26, 9 by default). */
export function macd(
  candles: Candle[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): MacdPoint[] {
  const c = closes(candles);
  const emaFast = ema(c, fast);
  const emaSlow = ema(c, slow);
  const macdLine = c.map((_, i) =>
    emaFast[i] != null && emaSlow[i] != null ? emaFast[i]! - emaSlow[i]! : null,
  );
  // Build signal line over the defined portion of the MACD line.
  const defined = macdLine.map((v) => v ?? 0);
  const sig = ema(defined, signalPeriod);
  return c.map((_, i) => {
    const m = macdLine[i] ?? null;
    const s = m == null ? null : (sig[i] ?? null);
    return {
      macd: m,
      signal: s,
      histogram: m != null && s != null ? m - s : null,
    };
  });
}

/** True Range series. */
function trueRange(candles: Candle[]): number[] {
  return candles.map((cur, i) => {
    if (i === 0) return cur.high - cur.low;
    const prevClose = candles[i - 1]!.close;
    return Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prevClose),
      Math.abs(cur.low - prevClose),
    );
  });
}

/** Average True Range. */
export function atr(candles: Candle[], period = 14): (number | null)[] {
  return wilderSmooth(trueRange(candles), period);
}

/** Average Directional Index with +DI / -DI. */
export function adx(
  candles: Candle[],
  period = 14,
): { adx: (number | null)[]; plusDI: (number | null)[]; minusDI: (number | null)[] } {
  const len = candles.length;
  const plusDM: number[] = new Array(len).fill(0);
  const minusDM: number[] = new Array(len).fill(0);
  const tr: number[] = trueRange(candles);
  for (let i = 1; i < len; i++) {
    const up = candles[i]!.high - candles[i - 1]!.high;
    const down = candles[i - 1]!.low - candles[i]!.low;
    plusDM[i] = up > down && up > 0 ? up : 0;
    minusDM[i] = down > up && down > 0 ? down : 0;
  }
  const smTR = wilderSmooth(tr, period);
  const smPlus = wilderSmooth(plusDM, period);
  const smMinus = wilderSmooth(minusDM, period);
  const plusDI = smPlus.map((v, i) =>
    v == null || !smTR[i] ? null : (100 * v) / smTR[i]!,
  );
  const minusDI = smMinus.map((v, i) =>
    v == null || !smTR[i] ? null : (100 * v) / smTR[i]!,
  );
  const dx = plusDI.map((p, i) => {
    const m = minusDI[i];
    if (p == null || m == null || p + m === 0) return null;
    return (100 * Math.abs(p - m)) / (p + m);
  });
  const dxDefined = dx.map((v) => v ?? 0);
  const adxLine = wilderSmooth(dxDefined, period).map((v, i) =>
    dx[i] == null ? null : v,
  );
  return { adx: adxLine, plusDI, minusDI };
}

/** Volume Weighted Average Price (cumulative). */
export function vwap(candles: Candle[]): (number | null)[] {
  let cumPV = 0;
  let cumVol = 0;
  return candles.map((c) => {
    const typical = (c.high + c.low + c.close) / 3;
    const vol = c.volume ?? 0;
    cumPV += typical * vol;
    cumVol += vol;
    return cumVol === 0 ? null : cumPV / cumVol;
  });
}

export interface BollingerPoint {
  upper: number | null;
  middle: number | null;
  lower: number | null;
}

/** Bollinger Bands. */
export function bollinger(
  candles: Candle[],
  period = 20,
  mult = 2,
): BollingerPoint[] {
  const c = closes(candles);
  const mid = sma(c, period);
  return c.map((_, i) => {
    if (i < period - 1 || mid[i] == null)
      return { upper: null, middle: null, lower: null };
    const slice = c.slice(i - period + 1, i + 1);
    const mean = mid[i]!;
    const variance =
      slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    return { upper: mean + mult * sd, middle: mean, lower: mean - mult * sd };
  });
}

/** Commodity Channel Index. */
export function cci(candles: Candle[], period = 20): (number | null)[] {
  const tp = candles.map((c) => (c.high + c.low + c.close) / 3);
  const smaTP = sma(tp, period);
  return tp.map((_, i) => {
    if (i < period - 1 || smaTP[i] == null) return null;
    const slice = tp.slice(i - period + 1, i + 1);
    const mean = smaTP[i]!;
    const meanDev =
      slice.reduce((acc, v) => acc + Math.abs(v - mean), 0) / period;
    if (meanDev === 0) return 0;
    return (tp[i]! - mean) / (0.015 * meanDev);
  });
}

export interface StochPoint {
  k: number | null;
  d: number | null;
}

/** Stochastic oscillator (%K, %D). */
export function stochastic(
  candles: Candle[],
  period = 14,
  smoothK = 3,
  smoothD = 3,
): StochPoint[] {
  const len = candles.length;
  const rawK: number[] = new Array(len).fill(0);
  for (let i = 0; i < len; i++) {
    if (i < period - 1) continue;
    const slice = candles.slice(i - period + 1, i + 1);
    const hh = Math.max(...slice.map((c) => c.high));
    const ll = Math.min(...slice.map((c) => c.low));
    rawK[i] = hh === ll ? 50 : ((candles[i]!.close - ll) / (hh - ll)) * 100;
  }
  const k = sma(rawK, smoothK);
  const dDefined = k.map((v) => v ?? 0);
  const d = sma(dDefined, smoothD);
  return candles.map((_, i) => ({
    k: i < period - 1 ? null : (k[i] ?? null),
    d: i < period - 1 ? null : (d[i] ?? null),
  }));
}

/** Stochastic RSI. */
export function stochRsi(
  candles: Candle[],
  rsiPeriod = 14,
  stochPeriod = 14,
): (number | null)[] {
  const r = rsi(candles, rsiPeriod);
  return r.map((_, i) => {
    if (i < rsiPeriod + stochPeriod - 1) return null;
    const slice = r.slice(i - stochPeriod + 1, i + 1).filter((v): v is number => v != null);
    if (slice.length < stochPeriod) return null;
    const hh = Math.max(...slice);
    const ll = Math.min(...slice);
    const cur = r[i]!;
    return hh === ll ? 0 : ((cur - ll) / (hh - ll)) * 100;
  });
}

export interface SuperTrendPoint {
  value: number | null;
  direction: 'up' | 'down' | null;
}

/** SuperTrend indicator. */
export function superTrend(
  candles: Candle[],
  period = 10,
  multiplier = 3,
): SuperTrendPoint[] {
  const atrSeries = atr(candles, period);
  const out: SuperTrendPoint[] = candles.map(() => ({
    value: null,
    direction: null,
  }));
  let prevUpper = 0;
  let prevLower = 0;
  let prevSuper = 0;
  let prevDir: 'up' | 'down' = 'up';
  for (let i = 0; i < candles.length; i++) {
    const a = atrSeries[i];
    if (a == null) continue;
    const c = candles[i]!;
    const hl2 = (c.high + c.low) / 2;
    let upper = hl2 + multiplier * a;
    let lower = hl2 - multiplier * a;
    if (i > 0 && prevSuper !== 0) {
      upper =
        upper < prevUpper || candles[i - 1]!.close > prevUpper
          ? upper
          : prevUpper;
      lower =
        lower > prevLower || candles[i - 1]!.close < prevLower
          ? lower
          : prevLower;
    }
    let dir: 'up' | 'down';
    if (prevSuper === 0) {
      dir = c.close >= hl2 ? 'up' : 'down';
    } else if (prevDir === 'up') {
      dir = c.close < prevLower ? 'down' : 'up';
    } else {
      dir = c.close > prevUpper ? 'up' : 'down';
    }
    const value = dir === 'up' ? lower : upper;
    out[i] = { value, direction: dir };
    prevUpper = upper;
    prevLower = lower;
    prevSuper = value;
    prevDir = dir;
  }
  return out;
}

export interface IchimokuPoint {
  conversion: number | null; // Tenkan
  base: number | null; // Kijun
  spanA: number | null; // Senkou A
  spanB: number | null; // Senkou B
}

/** Ichimoku Cloud (non-shifted spans for current-bar comparison). */
export function ichimoku(
  candles: Candle[],
  conversionPeriod = 9,
  basePeriod = 26,
  spanBPeriod = 52,
): IchimokuPoint[] {
  const hl = (start: number, end: number) => {
    const slice = candles.slice(start, end);
    if (slice.length === 0) return null;
    return (
      (Math.max(...slice.map((c) => c.high)) +
        Math.min(...slice.map((c) => c.low))) /
      2
    );
  };
  return candles.map((_, i) => {
    const conversion = i >= conversionPeriod - 1 ? hl(i - conversionPeriod + 1, i + 1) : null;
    const base = i >= basePeriod - 1 ? hl(i - basePeriod + 1, i + 1) : null;
    const spanA = conversion != null && base != null ? (conversion + base) / 2 : null;
    const spanB = i >= spanBPeriod - 1 ? hl(i - spanBPeriod + 1, i + 1) : null;
    return { conversion, base, spanA, spanB };
  });
}

/** Average volume over the last `period` candles (null if no volume data). */
export function avgVolume(candles: Candle[], period = 20): (number | null)[] {
  const vols = candles.map((c) => c.volume ?? 0);
  if (vols.every((v) => v === 0)) return candles.map(() => null);
  return sma(vols, period);
}

/** Convenience: take the last non-null value of a series. */
export function last<T>(series: (T | null)[]): T | null {
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i] != null) return series[i] as T;
  }
  return null;
}
