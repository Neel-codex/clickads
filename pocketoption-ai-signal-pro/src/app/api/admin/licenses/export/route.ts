import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { License } from '@/types/database';

/** GET /api/admin/licenses/export — CSV of all licenses (admin only). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data } = await supabase
    .from('licenses')
    .select('*')
    .order('created_at', { ascending: false });

  const licenses = (data ?? []) as License[];
  const header = [
    'license_key',
    'type',
    'status',
    'is_lifetime',
    'device_limit',
    'device_name',
    'expires_at',
    'activated_at',
    'notes',
    'created_at',
  ];

  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = licenses.map((l) =>
    [
      l.license_key,
      l.type,
      l.status,
      l.is_lifetime,
      l.device_limit,
      l.device_name,
      l.expires_at,
      l.activated_at,
      l.notes,
      l.created_at,
    ]
      .map(escape)
      .join(','),
  );

  const csv = [header.join(','), ...rows].join('\n');
  const filename = `licenses-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
