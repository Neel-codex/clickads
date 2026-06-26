/**
 * Candlestick pattern recognition.
 * Each detector inspects the most recent candle(s) and returns a PatternMatch
 * when the pattern is present. Detection is intentionally tolerant but uses
 * proportional thresholds so it adapts to different instruments/volatility.
 */
import type { Candle, PatternMatch } from './types';

const body = (c: Candle) => Math.abs(c.close - c.open);
const range = (c: Candle) => c.high - c.low || 1e-9;
const upperWick = (c: Candle) => c.high - Math.max(c.open, c.close);
const lowerWick = (c: Candle) => Math.min(c.open, c.close) - c.low;
const isBull = (c: Candle) => c.close > c.open;
const isBear = (c: Candle) => c.close < c.open;

/** Detect every supported pattern at the end of the series. */
export function detectPatterns(candles: Candle[]): PatternMatch[] {
  if (candles.length < 3) return [];
  const matches: PatternMatch[] = [];
  const n = candles.length;
  const c0 = candles[n - 1]!; // current
  const c1 = candles[n - 2]!; // previous
  const c2 = candles[n - 3]!; // two back

  // --- Doji ---
  if (body(c0) <= range(c0) * 0.1) {
    matches.push({
      code: 'doji',
      label: 'Doji (indecision)',
      direction: 'neutral',
      strength: 0.3,
    });
  }

  // --- Hammer / Hanging man (long lower wick, small body at top) ---
  if (
    lowerWick(c0) >= body(c0) * 2 &&
    upperWick(c0) <= body(c0) * 0.8 &&
    body(c0) > range(c0) * 0.05
  ) {
    matches.push({
      code: 'hammer',
      label: 'Hammer (bullish reversal)',
      direction: 'buy',
      strength: 0.55,
    });
  }

  // --- Inverted hammer / Shooting star (long upper wick) ---
  if (
    upperWick(c0) >= body(c0) * 2 &&
    lowerWick(c0) <= body(c0) * 0.8 &&
    body(c0) > range(c0) * 0.05
  ) {
    matches.push({
      code: 'shooting_star',
      label: 'Shooting Star (bearish reversal)',
      direction: 'sell',
      strength: 0.55,
    });
  }

  // --- Marubozu (full body, tiny wicks) ---
  if (body(c0) >= range(c0) * 0.9) {
    matches.push({
      code: 'marubozu',
      label: `Marubozu (${isBull(c0) ? 'bullish' : 'bearish'} momentum)`,
      direction: isBull(c0) ? 'buy' : 'sell',
      strength: 0.5,
    });
  }

  // --- Engulfing ---
  if (isBull(c0) && isBear(c1) && c0.close >= c1.open && c0.open <= c1.close) {
    matches.push({
      code: 'bullish_engulfing',
      label: 'Bullish Engulfing',
      direction: 'buy',
      strength: 0.7,
    });
  }
  if (isBear(c0) && isBull(c1) && c0.open >= c1.close && c0.close <= c1.open) {
    matches.push({
      code: 'bearish_engulfing',
      label: 'Bearish Engulfing',
      direction: 'sell',
      strength: 0.7,
    });
  }

  // --- Harami (small body inside previous large body) ---
  if (
    body(c1) > body(c0) * 1.5 &&
    Math.max(c0.open, c0.close) <= Math.max(c1.open, c1.close) &&
    Math.min(c0.open, c0.close) >= Math.min(c1.open, c1.close)
  ) {
    matches.push({
      code: 'harami',
      label: `Harami (${isBull(c0) ? 'bullish' : 'bearish'} reversal)`,
      direction: isBull(c0) ? 'buy' : 'sell',
      strength: 0.45,
    });
  }

  // --- Morning Star (bear, small, bull) ---
  if (
    isBear(c2) &&
    body(c1) <= range(c1) * 0.4 &&
    isBull(c0) &&
    c0.close > (c2.open + c2.close) / 2
  ) {
    matches.push({
      code: 'morning_star',
      label: 'Morning Star (bullish reversal)',
      direction: 'buy',
      strength: 0.75,
    });
  }

  // --- Evening Star (bull, small, bear) ---
  if (
    isBull(c2) &&
    body(c1) <= range(c1) * 0.4 &&
    isBear(c0) &&
    c0.close < (c2.open + c2.close) / 2
  ) {
    matches.push({
      code: 'evening_star',
      label: 'Evening Star (bearish reversal)',
      direction: 'sell',
      strength: 0.75,
    });
  }

  // --- Three White Soldiers ---
  if (
    isBull(c2) &&
    isBull(c1) &&
    isBull(c0) &&
    c1.close > c2.close &&
    c0.close > c1.close &&
    c1.open > c2.open &&
    c0.open > c1.open
  ) {
    matches.push({
      code: 'three_white_soldiers',
      label: 'Three White Soldiers',
      direction: 'buy',
      strength: 0.8,
    });
  }

  // --- Three Black Crows ---
  if (
    isBear(c2) &&
    isBear(c1) &&
    isBear(c0) &&
    c1.close < c2.close &&
    c0.close < c1.close &&
    c1.open < c2.open &&
    c0.open < c1.open
  ) {
    matches.push({
      code: 'three_black_crows',
      label: 'Three Black Crows',
      direction: 'sell',
      strength: 0.8,
    });
  }

  // --- Inside Bar ---
  if (c0.high <= c1.high && c0.low >= c1.low) {
    matches.push({
      code: 'inside_bar',
      label: 'Inside Bar (consolidation)',
      direction: 'neutral',
      strength: 0.35,
    });
  }

  // --- Outside Bar ---
  if (c0.high >= c1.high && c0.low <= c1.low) {
    matches.push({
      code: 'outside_bar',
      label: `Outside Bar (${isBull(c0) ? 'bullish' : 'bearish'})`,
      direction: isBull(c0) ? 'buy' : 'sell',
      strength: 0.45,
    });
  }

  return matches;
}
