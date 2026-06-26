import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { LicenseManager } from '@/components/admin/license-manager';
import type { License } from '@/types/database';

export const metadata: Metadata = { title: 'License Manager' };

export default async function LicensesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('licenses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (status && status !== 'all') query = query.eq('status', status);
  if (q && q.trim()) query = query.ilike('license_key', `%${q.trim()}%`);

  const { data } = await query;

  return (
    <LicenseManager
      licenses={(data ?? []) as License[]}
      initialSearch={q ?? ''}
      initialStatus={status ?? 'all'}
    />
  );
}
