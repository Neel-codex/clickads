import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ActivateForm } from '@/components/license/activate-form';
import { SUPPORT_TELEGRAM } from '@/lib/constants';

export const metadata: Metadata = { title: 'Activate License' };

export default async function ActivatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Already licensed? Skip straight to the app.
  const { data: licensed } = await supabase.rpc('has_active_license');
  if (licensed) redirect('/app');

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-brand-gradient shadow-lg shadow-primary/30">
          <Lock className="size-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Activate your license</h1>
        <p className="text-sm text-muted-foreground">
          The platform is locked until a valid license is activated on this
          device.
        </p>
      </div>

      <div className="glass-strong rounded-3xl p-6">
        <ActivateForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Need a license?{' '}
        <Link href="/support" className="font-medium text-primary hover:underline">
          Contact {SUPPORT_TELEGRAM}
        </Link>
      </p>
    </main>
  );
}
