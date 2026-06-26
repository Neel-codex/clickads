import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {APP_NAME} stores only the data needed to operate your account: your
        email, profile, license activation details, and a non-PII device
        fingerprint used to enforce license device limits.
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        <li>Authentication and data are handled by Supabase with row-level security.</li>
        <li>Market data is fetched from public providers; we do not sell your data.</li>
        <li>You may request deletion of your account and associated data at any time.</li>
      </ul>
    </main>
  );
}
