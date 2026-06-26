'use client';

import { useEffect, useState } from 'react';
import { Infinity as InfinityIcon, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LicenseCountdownProps {
  /** ISO expiry timestamp, or null for lifetime / no expiry. */
  expiresAt: string | null;
  isLifetime: boolean;
  /** 'full' shows D/H/M/S blocks; 'compact' shows a single inline line. */
  variant?: 'full' | 'compact';
}

interface Remaining {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function diff(target: number): Remaining {
  const total = Math.max(0, target - Date.now());
  return {
    total,
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total / 3_600_000) % 24),
    minutes: Math.floor((total / 60_000) % 60),
    seconds: Math.floor((total / 1000) % 60),
  };
}

/** Live, ticking countdown to a license's expiry. */
export function LicenseCountdown({
  expiresAt,
  isLifetime,
  variant = 'full',
}: LicenseCountdownProps) {
  const target = expiresAt ? new Date(expiresAt).getTime() : null;
  const [mounted, setMounted] = useState(false);
  const [rem, setRem] = useState<Remaining>(() => diff(target ?? Date.now()));

  useEffect(() => {
    setMounted(true);
    if (target == null) return;
    setRem(diff(target));
    const id = setInterval(() => setRem(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  // Lifetime / no expiry.
  if (isLifetime || target == null) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-sm text-success">
        <InfinityIcon className="size-4" />
        <span className="font-medium">Lifetime — never expires</span>
      </div>
    );
  }

  // Avoid hydration mismatch: render a stable placeholder until mounted.
  if (!mounted) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground">
        Loading expiry…
      </div>
    );
  }

  const expired = rem.total <= 0;
  const lessThanDay = rem.total > 0 && rem.total < 86_400_000;
  const lessThan3Days = rem.total > 0 && rem.total < 3 * 86_400_000;

  const tone = expired
    ? 'border-destructive/30 bg-destructive/10 text-destructive'
    : lessThanDay
      ? 'border-destructive/30 bg-destructive/10 text-destructive'
      : lessThan3Days
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        : 'border-white/10 bg-white/5 text-foreground';

  if (expired) {
    return (
      <div className={cn('flex items-center gap-2 rounded-xl border px-3 py-2 text-sm', tone)}>
        <AlertTriangle className="size-4" />
        <span className="font-semibold">License expired</span>
      </div>
    );
  }

  if (variant === 'compact') {
    const parts = [
      rem.days > 0 ? `${rem.days}d` : null,
      `${rem.hours}h`,
      `${rem.minutes}m`,
      rem.days === 0 ? `${rem.seconds}s` : null,
    ].filter(Boolean);
    return (
      <div className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium tabular-nums', tone)}>
        <Clock className="size-3.5" />
        {parts.join(' ')} left
      </div>
    );
  }

  const blocks: [number, string][] = [
    [rem.days, 'Days'],
    [rem.hours, 'Hrs'],
    [rem.minutes, 'Min'],
    [rem.seconds, 'Sec'],
  ];

  return (
    <div className={cn('rounded-xl border p-3', tone)}>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide opacity-80">
        <Clock className="size-3.5" /> Time remaining
      </div>
      <div className="grid grid-cols-4 gap-2">
        {blocks.map(([value, label]) => (
          <div
            key={label}
            className="flex flex-col items-center rounded-lg bg-black/20 py-2"
          >
            <span className="text-xl font-bold tabular-nums">
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase opacity-70">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
