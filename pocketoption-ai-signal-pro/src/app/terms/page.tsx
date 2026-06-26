import type { Metadata } from 'next';
import { COMPLIANCE_DISCLAIMER, APP_NAME } from '@/lib/constants';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 prose-sm">
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {APP_NAME} is a market analysis and educational signal platform. By using
        the service you acknowledge and agree to the following.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        <li>The platform does not execute trades or connect to any brokerage account.</li>
        <li>The platform does not provide financial, investment, or trading advice.</li>
        <li>No signal, score, or analysis is a guarantee of future performance.</li>
        <li>You are solely responsible for any decisions you make.</li>
        <li>Access requires a valid license and is subject to fair-use limits.</li>
      </ul>
      <p className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200/90">
        {COMPLIANCE_DISCLAIMER}
      </p>
    </main>
  );
}
