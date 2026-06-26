'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
import type { SignalResult } from '@/lib/analysis/types';
import { TIMEFRAMES, type TimeframeValue } from '@/lib/constants';
import { SignalCard } from './signal-card';
import { ComplianceDisclaimer } from '@/components/compliance-disclaimer';
import { cn } from '@/lib/utils';

interface AssetOption {
  symbol: string;
  name: string;
  category: string;
  is_otc: boolean;
}

interface SignalResponse {
  symbol: string;
  name: string;
  timeframe: string;
  signal: SignalResult;
}

const REFRESH_MS =
  Number(process.env.NEXT_PUBLIC_MARKET_REFRESH_SECONDS ?? 5) * 1000;

async function fetchSignal(
  symbol: string,
  timeframe: string,
): Promise<SignalResponse> {
  const res = await fetch(`/api/signal?symbol=${symbol}&timeframe=${timeframe}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Unable to load signal');
  }
  return res.json();
}

export function Dashboard({ assets }: { assets: AssetOption[] }) {
  const [symbol, setSymbol] = useState(assets[0]?.symbol ?? 'EURUSD');
  const [timeframe, setTimeframe] = useState<TimeframeValue>('5m');

  const active = useMemo(
    () => assets.find((a) => a.symbol === symbol),
    [assets, symbol],
  );

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['signal', symbol, timeframe],
    queryFn: () => fetchSignal(symbol, timeframe),
    refetchInterval: REFRESH_MS,
    enabled: Boolean(symbol),
  });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Live analytical signals
            {isFetching && (
              <Loader2 className="ml-1 inline size-3 animate-spin align-[-2px]" />
            )}
          </p>
        </div>
        {/* Asset selector */}
        <div className="relative">
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="h-10 appearance-none rounded-xl border border-white/10 bg-white/5 pl-3 pr-9 text-sm font-medium backdrop-blur focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {assets.map((a) => (
              <option key={a.symbol} value={a.symbol} className="bg-card">
                {a.symbol}
                {a.is_otc ? ' (OTC)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </header>

      {/* Timeframe picker */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setTimeframe(tf.value)}
            className={cn(
              'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
              timeframe === tf.value
                ? 'bg-brand-gradient text-white shadow-lg shadow-primary/25'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10',
            )}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="glass-strong flex h-72 items-center justify-center rounded-3xl">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      )}

      {isError && (
        <div className="glass-strong flex flex-col items-center gap-2 rounded-3xl p-8 text-center">
          <AlertTriangle className="size-8 text-amber-400" />
          <p className="text-sm font-medium">
            {active?.is_otc ? 'Live OTC data unavailable' : 'Signal unavailable'}
          </p>
          <p className="text-xs text-muted-foreground">
            {(error as Error)?.message ??
              'We could not analyse this asset right now. Try another asset or timeframe.'}
          </p>
        </div>
      )}

      {data && !isError && (
        <SignalCard symbol={data.symbol} name={data.name} signal={data.signal} />
      )}

      <ComplianceDisclaimer />
    </div>
  );
}
