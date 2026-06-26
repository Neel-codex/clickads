import { describe, it, expect } from 'vitest';
import { generateSignal } from '../signal-engine';
import { rsi, ema, macd, atr } from '../indicators';
import type { Candle } from '../types';

/** Build a deterministic uptrend with mild noise. */
function makeTrend(n: number, start: number, step: number): Candle[] {
  const candles: Candle[] = [];
  let price = start;
  for (let i = 0; i < n; i++) {
    const open = price;
    const drift = step;
    const noise = Math.sin(i / 3) * Math.abs(step) * 0.5;
    const close = open + drift + noise;
    const high = Math.max(open, close) + Math.abs(step) * 0.4;
    const low = Math.min(open, close) - Math.abs(step) * 0.4;
    candles.push({ time: 1700000000 + i * 60, open, high, low, close, volume: 1000 + i });
    price = close;
  }
  return candles;
}

describe('indicators', () => {
  const candles = makeTrend(120, 100, 0.5);

  it('RSI stays within 0..100', () => {
    const r = rsi(candles).filter((v): v is number => v != null);
    expect(r.length).toBeGreaterThan(0);
    for (const v of r) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it('EMA tracks an uptrend upward', () => {
    const e = ema(candles.map((c) => c.close), 21).filter((v): v is number => v != null);
    expect(e[e.length - 1]!).toBeGreaterThan(e[0]!);
  });

  it('MACD returns aligned series', () => {
    const m = macd(candles);
    expect(m.length).toBe(candles.length);
  });

  it('ATR is non-negative', () => {
    const a = atr(candles).filter((v): v is number => v != null);
    for (const v of a) expect(v).toBeGreaterThanOrEqual(0);
  });
});

describe('signal engine', () => {
  it('produces a BUY-leaning signal on a clean uptrend', () => {
    const candles = makeTrend(150, 100, 0.6);
    const sig = generateSignal(candles);
    expect(['buy', 'neutral']).toContain(sig.direction);
    expect(sig.confidence).toBeGreaterThanOrEqual(0);
    expect(sig.confidence).toBeLessThanOrEqual(95); // never implies certainty
    expect(['strong_up', 'up']).toContain(sig.trend);
    expect(sig.reasons.length).toBeGreaterThan(0);
  });

  it('produces a SELL-leaning signal on a clean downtrend', () => {
    const candles = makeTrend(150, 200, -0.6);
    const sig = generateSignal(candles);
    expect(['sell', 'neutral']).toContain(sig.direction);
    expect(['strong_down', 'down']).toContain(sig.trend);
  });

  it('confidence is capped below 100', () => {
    const candles = makeTrend(200, 50, 1.2);
    const sig = generateSignal(candles);
    expect(sig.confidence).toBeLessThanOrEqual(95);
  });
});
