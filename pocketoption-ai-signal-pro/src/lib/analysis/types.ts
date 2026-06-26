/** Core data types for the market analysis engine. */

export interface Candle {
  /** Unix epoch seconds for the open of the candle. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type Direction = 'buy' | 'sell' | 'neutral';
export type Trend = 'strong_up' | 'up' | 'sideways' | 'down' | 'strong_down';
export type RiskLevel = 'low' | 'medium' | 'high';

/** A single weighted reason contributing to a signal. */
export interface SignalReason {
  /** Short machine id, e.g. "rsi_oversold", "bullish_engulfing", "bos_up". */
  code: string;
  /** Human-readable explanation. */
  label: string;
  /** Direction this evidence points toward. */
  direction: Direction;
  /** Strength of this evidence, 0..1. */
  weight: number;
  /** Category grouping for UI. */
  group: 'indicator' | 'candlestick' | 'smc' | 'trend';
}

export interface SignalResult {
  direction: Direction;
  /** 0..100 */
  confidence: number;
  trend: Trend;
  riskLevel: RiskLevel;
  support: number | null;
  resistance: number | null;
  reasons: SignalReason[];
  /** Snapshot of indicator values at evaluation time. */
  indicators: Record<string, number | null>;
  price: number;
  generatedAt: string;
}

export interface PatternMatch {
  code: string;
  label: string;
  direction: Direction;
  /** Confidence of the pattern itself, 0..1. */
  strength: number;
}
