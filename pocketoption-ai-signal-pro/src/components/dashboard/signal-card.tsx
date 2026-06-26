'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus, Gauge } from 'lucide-react';
import type { SignalResult } from '@/lib/analysis/types';
import { Badge } from '@/components/ui/badge';
import { cn, formatPrice } from '@/lib/utils';

const TREND_LABEL: Record<string, string> = {
  strong_up: 'Strong Uptrend',
  up: 'Uptrend',
  sideways: 'Ranging',
  down: 'Downtrend',
  strong_down: 'Strong Downtrend',
};

const RISK_VARIANT = {
  low: 'success',
  medium: 'warning',
  high: 'destructive',
} as const;

export function SignalCard({
  symbol,
  name,
  signal,
}: {
  symbol: string;
  name: string;
  signal: SignalResult;
}) {
  const isBuy = signal.direction === 'buy';
  const isSell = signal.direction === 'sell';
  const Icon = isBuy ? ArrowUpRight : isSell ? ArrowDownRight : Minus;
  const directionColor = isBuy
    ? 'text-success'
    : isSell
      ? 'text-destructive'
      : 'text-muted-foreground';
  const ringColor = isBuy
    ? 'hsl(var(--success))'
    : isSell
      ? 'hsl(var(--destructive))'
      : 'hsl(var(--muted-foreground))';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-3xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{name}</p>
          <h2 className="text-2xl font-bold tracking-tight">{symbol}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Price</p>
          <p className="text-lg font-semibold tabular-nums">
            {formatPrice(signal.price)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-5">
        {/* Confidence ring */}
        <div className="relative grid size-24 shrink-0 place-items-center">
          <svg className="size-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(signal.confidence / 100) * 264} 264`}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold tabular-nums">{signal.confidence}</span>
            <span className="text-[10px] text-muted-foreground">confidence</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className={cn('flex items-center gap-2 text-2xl font-bold', directionColor)}>
            <Icon className="size-7" />
            {signal.direction.toUpperCase()}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="muted" className="gap-1">
              <Gauge className="size-3" />
              {TREND_LABEL[signal.trend] ?? signal.trend}
            </Badge>
            <Badge variant={RISK_VARIANT[signal.riskLevel]}>
              {signal.riskLevel} risk
            </Badge>
          </div>
        </div>
      </div>

      {/* Support / resistance */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-muted-foreground">Support</p>
          <p className="font-semibold tabular-nums text-success">
            {signal.support != null ? formatPrice(signal.support) : '--'}
          </p>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xs text-muted-foreground">Resistance</p>
          <p className="font-semibold tabular-nums text-destructive">
            {signal.resistance != null ? formatPrice(signal.resistance) : '--'}
          </p>
        </div>
      </div>

      {/* Reasons */}
      {signal.reasons.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Why this signal
          </p>
          <ul className="flex flex-col gap-1.5">
            {signal.reasons.slice(0, 6).map((r) => (
              <li key={r.code} className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    r.direction === 'buy'
                      ? 'bg-success'
                      : r.direction === 'sell'
                        ? 'bg-destructive'
                        : 'bg-muted-foreground',
                  )}
                />
                <span className="text-foreground/90">{r.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
