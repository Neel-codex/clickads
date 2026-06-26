'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { LicenseCountdown } from './license-countdown';

const WARN_WINDOW_MS = 7 * 86_400_000; // show within 7 days of expiry

/**
 * Slim banner shown at the top of the app when the active license is within
 * 7 days of expiry (or expired). Hidden entirely for lifetime / healthy licenses.
 */
export function LicenseExpiryBanner({
  expiresAt,
  isLifetime,
}: {
  expiresAt: string | null;
  isLifetime: boolean;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLifetime || !expiresAt) return;
    const target = new Date(expiresAt).getTime();
    const check = () => setShow(target - Date.now() < WARN_WINDOW_MS);
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, [expiresAt, isLifetime]);

  if (!show) return null;

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
      <div className="flex items-center gap-2 text-sm text-amber-200">
        <AlertTriangle className="size-4 shrink-0" />
        <span>Your license is expiring</span>
      </div>
      <div className="flex items-center gap-2">
        <LicenseCountdown expiresAt={expiresAt} isLifetime={isLifetime} variant="compact" />
        <Link
          href="/support"
          className="rounded-lg bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white"
        >
          Renew
        </Link>
      </div>
    </div>
  );
}
