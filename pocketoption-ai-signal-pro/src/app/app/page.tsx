import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Dashboard } from '@/components/dashboard/dashboard';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: assets } = await supabase
    .from('assets')
    .select('symbol, name, category, is_otc')
    .eq('is_enabled', true)
    .order('sort_order', { ascending: true });

  return <Dashboard assets={assets ?? []} />;
}
