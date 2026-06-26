import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Shield, KeyRound, Calendar, Smartphone, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/app/logout-button';
import { SUPPORT_TELEGRAM } from '@/lib/constants';
import type { License, Profile } from '@/types/database';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  const { data: license } = await supabase
    .from('licenses')
    .select('*')
    .eq('assigned_user_id', user.id)
    .order('activated_at', { ascending: false })
    .limit(1)
    .maybeSingle<License>();

  const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Profile</h1>

      {isAdmin && (
        <Link href="/admin">
          <Button className="w-full">
            <Shield className="size-4" /> Open Admin Console
          </Button>
        </Link>
      )}

      <Card>
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-brand-gradient text-lg font-bold text-white">
            {(profile?.full_name ?? profile?.email ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{profile?.full_name ?? 'Trader'}</p>
            <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          {profile && profile.role !== 'user' && (
            <Badge variant="default" className="ml-auto gap-1">
              <Shield className="size-3" /> {profile.role.replace('_', ' ')}
            </Badge>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <KeyRound className="size-4 text-primary" /> License
        </h2>
        {license ? (
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Key" value={<span className="font-mono">{license.license_key}</span>} />
            <Row
              label="Status"
              value={
                <Badge variant={license.status === 'active' ? 'success' : 'warning'}>
                  {license.status}
                </Badge>
              }
            />
            <Row label="Type" value={license.is_lifetime ? 'Lifetime' : license.type} />
            <Row
              label="Expires"
              value={
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3" />
                  {license.is_lifetime || !license.expires_at
                    ? 'Never'
                    : new Date(license.expires_at).toLocaleDateString()}
                </span>
              }
            />
            <Row
              label="Device"
              value={
                <span className="inline-flex items-center gap-1">
                  <Smartphone className="size-3" />
                  {license.device_name ?? '—'}
                </span>
              }
            />
          </dl>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">No active license found.</p>
            <Link href="/activate">
              <Button size="sm">Activate a license</Button>
            </Link>
          </div>
        )}
      </Card>

      <Link href="/support">
        <Button variant="secondary" className="w-full">
          <Send className="size-4" /> Contact support · {SUPPORT_TELEGRAM}
        </Button>
      </Link>

      <LogoutButton />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
