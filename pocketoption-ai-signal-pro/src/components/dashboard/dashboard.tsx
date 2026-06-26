'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronDown, Sparkles } from 'lucide-react';
import type { SignalResult } from '@/lib/analysis/types';
import { TIMEFRAMES, type TimeframeValue } from '@/lib/constants';
import { SignalCard } from './signal-card';
import { SignalAnalyzing } from './signal-analyzing';
import { AiBrainLogo } from '@/components/brand/ai-brain-logo';
import { ComplianceDisclaimer } from '@/components/compliance-disclaimer';
import { Button } from '@/components/ui/button';
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
  const [analyzing, setAnalyzing] = useState(false);

  const active = useMemo(
    () => assets.find((a) => a.symbol === symbol),
    [assets, symbol],
  );

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['signal', symbol, timeframe],
    queryFn: () => fetchSignal(symbol, timeframe),
    refetchInterval: REFRESH_MS,
    enabled: Boolean(symbol),
  });

  // Manual "Generate Signal": force a fresh fetch and keep the AI animation
  // on screen for a minimum duration so it reads as a deliberate analysis.
  const handleGenerate = useCallback(async () => {
    setAnalyzing(true);
    const started = Date.now();
    try {
      await refetch();
    } finally {
      const elapsed = Date.now() - started;
      if (elapsed < 1500) await sleep(1500 - elapsed);
      setAnalyzing(false);
    }
  }, [refetch]);

  const showAnalyzing = analyzing || (isLoading && !data);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AiBrainLogo size={40} thinking={showAnalyzing || isFetching} />
          <div>
            <h1 className="text-xl font-bold leading-none brand-text">AI Signal</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {showAnalyzing ? 'Analyzing…' : 'Live analytical signals'}
            </p>
          </div>
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

      {showAnalyzing ? (
        <SignalAnalyzing symbol={symbol} timeframe={timeframe} />
      ) : isError ? (
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
      ) : data ? (
        <SignalCard symbol={data.symbol} name={data.name} signal={data.signal} />
      ) : null}

      {/* Generate Signal button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleGenerate}
        disabled={showAnalyzing}
      >
        <Sparkles className="size-4" />
        {showAnalyzing ? 'Analyzing…' : 'Generate Signal'}
      </Button>

      <ComplianceDisclaimer />
    </div>
  );
}
