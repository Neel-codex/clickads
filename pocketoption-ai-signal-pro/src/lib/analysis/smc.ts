/**
 * Smart Money Concepts (SMC) and market-structure detection.
 * These are heuristic, swing-based implementations suitable for generating
 * analytical signal evidence — not exchange-grade structural labelling.
 */
import type { Candle, PatternMatch, Trend } from './types';

interface Swing {
  index: number;
  price: number;
  kind: 'high' | 'low';
}

/** Detect swing highs/lows using a symmetric fractal of `lookback` bars. */
export function findSwings(candles: Candle[], lookback = 2): Swing[] {
  const swings: Swing[] = [];
  for (let i = lookback; i < candles.length - lookback; i++) {
    const c = candles[i]!;
    let isHigh = true;
    let isLow = true;
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j === i) continue;
      if (candles[j]!.high >= c.high) isHigh = false;
      if (candles[j]!.low <= c.low) isLow = false;
    }
    if (isHigh) swings.push({ index: i, price: c.high, kind: 'high' });
    if (isLow) swings.push({ index: i, price: c.low, kind: 'low' });
  }
  return swings;
}

/** Nearest support/resistance from recent swings relative to price. */
export function supportResistance(
  candles: Candle[],
): { support: number | null; resistance: number | null } {
  const swings = findSwings(candles, 2);
  const price = candles[candles.length - 1]!.close;
  let support: number | null = null;
  let resistance: number | null = null;
  for (const s of swings) {
    if (s.kind === 'low' && s.price < price) {
      if (support == null || s.price > support) support = s.price;
    }
    if (s.kind === 'high' && s.price > price) {
      if (resistance == null || s.price < resistance) resistance = s.price;
    }
  }
  return { support, resistance };
}

/**
 * Trend classification from EMA slope + structure of swing highs/lows.
 */
export function classifyTrend(candles: Candle[], emaFast: (number | null)[], emaSlow: (number | null)[]): Trend {
  const n = candles.length;
  const f = emaFast[n - 1];
  const s = emaSlow[n - 1];
  const sPrev = emaSlow[Math.max(0, n - 6)] ?? s;
  if (f == null || s == null || sPrev == null) return 'sideways';
  const slope = (s - sPrev) / (Math.abs(sPrev) || 1);
  const spread = (f - s) / (Math.abs(s) || 1);
  if (f > s && slope > 0.002 && spread > 0.001) return 'strong_up';
  if (f > s) return 'up';
  if (f < s && slope < -0.002 && spread < -0.001) return 'strong_down';
  if (f < s) return 'down';
  return 'sideways';
}

/**
 * Detect SMC events at the end of the series:
 * BOS, CHoCH, liquidity sweep, order block, FVG, premium/discount,
 * mitigation block, breaker block.
 */
export function detectSmc(candles: Candle[]): PatternMatch[] {
  const out: PatternMatch[] = [];
  if (candles.length < 10) return out;
  const n = candles.length;
  const swings = findSwings(candles, 2);
  const highs = swings.filter((s) => s.kind === 'high');
  const lows = swings.filter((s) => s.kind === 'low');
  const price = candles[n - 1]!.close;

  const lastHigh = highs[highs.length - 1];
  const prevHigh = highs[highs.length - 2];
  const lastLow = lows[lows.length - 1];
  const prevLow = lows[lows.length - 2];

  // --- Break of Structure (continuation) ---
  if (lastHigh && price > lastHigh.price && lastHigh.index < n - 1) {
    out.push({
      code: 'bos_up',
      label: 'Break of Structure (bullish)',
      direction: 'buy',
      strength: 0.65,
    });
  }
  if (lastLow && price < lastLow.price && lastLow.index < n - 1) {
    out.push({
      code: 'bos_down',
      label: 'Break of Structure (bearish)',
      direction: 'sell',
      strength: 0.65,
    });
  }

  // --- Change of Character (reversal of structure) ---
  if (prevHigh && lastHigh && prevLow && lastLow) {
    const wasDown = lastHigh.price < prevHigh.price && lastLow.price < prevLow.price;
    const wasUp = lastHigh.price > prevHigh.price && lastLow.price > prevLow.price;
    if (wasDown && price > prevHigh.price) {
      out.push({
        code: 'choch_up',
        label: 'Change of Character (bullish)',
        direction: 'buy',
        strength: 0.6,
      });
    }
    if (wasUp && price < prevLow.price) {
      out.push({
        code: 'choch_down',
        label: 'Change of Character (bearish)',
        direction: 'sell',
        strength: 0.6,
      });
    }
  }

  // --- Liquidity sweep (wick takes prior swing then closes back) ---
  const c0 = candles[n - 1]!;
  if (lastHigh && c0.high > lastHigh.price && c0.close < lastHigh.price) {
    out.push({
      code: 'liquidity_sweep_high',
      label: 'Liquidity Sweep (sell-side trap above highs)',
      direction: 'sell',
      strength: 0.55,
    });
  }
  if (lastLow && c0.low < lastLow.price && c0.close > lastLow.price) {
    out.push({
      code: 'liquidity_sweep_low',
      label: 'Liquidity Sweep (buy-side trap below lows)',
      direction: 'buy',
      strength: 0.55,
    });
  }

  // --- Fair Value Gap (3-candle imbalance) ---
  const a = candles[n - 3]!;
  const b = candles[n - 1]!;
  if (a.high < b.low) {
    out.push({
      code: 'fvg_bull',
      label: 'Fair Value Gap (bullish imbalance)',
      direction: 'buy',
      strength: 0.4,
    });
  }
  if (a.low > b.high) {
    out.push({
      code: 'fvg_bear',
      label: 'Fair Value Gap (bearish imbalance)',
      direction: 'sell',
      strength: 0.4,
    });
  }

  // --- Order block (last opposite candle before an impulsive move) ---
  const move = (candles[n - 1]!.close - candles[n - 4]!.close) / (candles[n - 4]!.close || 1);
  if (move > 0.004) {
    out.push({
      code: 'order_block_bull',
      label: 'Bullish Order Block formed',
      direction: 'buy',
      strength: 0.45,
    });
  } else if (move < -0.004) {
    out.push({
      code: 'order_block_bear',
      label: 'Bearish Order Block formed',
      direction: 'sell',
      strength: 0.45,
    });
  }

  // --- Premium / Discount relative to recent range ---
  const lookback = candles.slice(Math.max(0, n - 30));
  const rngHigh = Math.max(...lookback.map((c) => c.high));
  const rngLow = Math.min(...lookback.map((c) => c.low));
  if (rngHigh > rngLow) {
    const posInRange = (price - rngLow) / (rngHigh - rngLow);
    if (posInRange >= 0.7) {
      out.push({
        code: 'premium_zone',
        label: 'Price in Premium zone (favours sells)',
        direction: 'sell',
        strength: 0.35,
      });
    } else if (posInRange <= 0.3) {
      out.push({
        code: 'discount_zone',
        label: 'Price in Discount zone (favours buys)',
        direction: 'buy',
        strength: 0.35,
      });
    }
  }

  // --- Mitigation / Breaker block (revisit of broken structure) ---
  if (prevHigh && lastLow && price > prevHigh.price && c0.low <= prevHigh.price) {
    out.push({
      code: 'breaker_block_bull',
      label: 'Bullish Breaker Block retest',
      direction: 'buy',
      strength: 0.4,
    });
  }
  if (prevLow && lastHigh && price < prevLow.price && c0.high >= prevLow.price) {
    out.push({
      code: 'mitigation_block_bear',
      label: 'Bearish Mitigation Block retest',
      direction: 'sell',
      strength: 0.4,
    });
  }

  return out;
}
