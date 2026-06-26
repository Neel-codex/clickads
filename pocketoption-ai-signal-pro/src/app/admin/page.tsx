import type { Metadata } from 'next';
import {
  Users,
  UserCheck,
  KeyRound,
  CheckCircle2,
  XCircle,
  Package,
  Activity,
  Database,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Admin Overview' };

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const head = { count: 'exact' as const, head: true };

  const [
    totalUsers,
    activeUsers,
    totalLicenses,
    activeLicenses,
    expiredLicenses,
    unusedLicenses,
    totalAssets,
    signalsGenerated,
  ] = await Promise.all([
    supabase.from('profiles').select('*', head),
    supabase.from('profiles').select('*', head).eq('is_active', true),
    supabase.from('licenses').select('*', head),
    supabase.from('licenses').select('*', head).eq('status', 'active'),
    supabase.from('licenses').select('*', head).eq('status', 'expired'),
    supabase.from('licenses').select('*', head).eq('status', 'unused'),
    supabase.from('assets').select('*', head),
    supabase.from('signal_history').select('*', head),
  ]);
  void nowIso;

  const stats = [
    { label: 'Total Users', value: totalUsers.count ?? 0, icon: Users, tone: 'text-primary' },
    { label: 'Active Users', value: activeUsers.count ?? 0, icon: UserCheck, tone: 'text-success' },
    { label: 'Licenses', value: totalLicenses.count ?? 0, icon: KeyRound, tone: 'text-primary' },
    { label: 'Active Licenses', value: activeLicenses.count ?? 0, icon: CheckCircle2, tone: 'text-success' },
    { label: 'Expired', value: expiredLicenses.count ?? 0, icon: XCircle, tone: 'text-destructive' },
    { label: 'Unused', value: unusedLicenses.count ?? 0, icon: KeyRound, tone: 'text-muted-foreground' },
    { label: 'Assets', value: totalAssets.count ?? 0, icon: Package, tone: 'text-accent' },
    { label: 'Signals Generated', value: signalsGenerated.count ?? 0, icon: Activity, tone: 'text-primary' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <s.icon className={`size-5 ${s.tone}`} />
            <p className="mt-3 text-2xl font-bold tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Database className="size-4 text-success" /> System Health
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            <HealthRow label="Database" detail="Connected (Supabase)" />
            <HealthRow label="Market data" detail="Yahoo Finance public API" />
            <HealthRow label="Auth" detail="Supabase Auth + RLS" />
          </ul>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Quick actions</h2>
          <div className="flex flex-col gap-2 text-sm">
            <a href="/admin/licenses" className="rounded-xl bg-white/5 px-3 py-2.5 hover:bg-white/10">
              Generate &amp; manage licenses →
            </a>
            <a href="/admin/users" className="rounded-xl bg-white/5 px-3 py-2.5 hover:bg-white/10">
              Manage users &amp; roles →
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}

function HealthRow({ label, detail }: { label: string; detail: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <span className="size-2 rounded-full bg-success" />
        {label}
      </span>
      <span className="text-xs text-muted-foreground">{detail}</span>
    </li>
  );
}
