'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiBrainLogo } from '@/components/brand/ai-brain-logo';

const STEPS = [
  'Fetching live market data…',
  'Computing indicators (RSI, MACD, ADX)…',
  'Scanning candlestick patterns…',
  'Mapping Smart Money structure…',
  'Weighing the evidence…',
  'Finalising confidence score…',
];

/** Full-card "AI is analyzing" state shown while a signal is generated. */
export function SignalAnalyzing({ symbol, timeframe }: { symbol: string; timeframe: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 700);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="glass-strong flex h-72 flex-col items-center justify-center gap-5 rounded-3xl">
      <AiBrainLogo size={72} thinking />
      <div className="text-center">
        <p className="text-sm font-semibold">
          Analyzing {symbol} · {timeframe}
        </p>
        <div className="mt-1 h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="text-xs text-muted-foreground"
            >
              {STEPS[step]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      {/* Scanning bar */}
      <div className="relative h-1 w-40 overflow-hidden rounded-full bg-white/10">
        <motion.span
          className="absolute inset-y-0 w-1/3 rounded-full bg-brand-gradient"
          animate={{ x: ['-120%', '360%'] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}
