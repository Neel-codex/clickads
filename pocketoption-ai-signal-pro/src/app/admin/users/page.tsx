import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createClient } from '@/lib/supabase/server';
import { UserManager } from '@/components/admin/user-manager';
import type { Profile } from '@/types/database';

export const metadata: Metadata = { title: 'User Manager' };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await requireAdmin();
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (q && q.trim()) query = query.ilike('email', `%${q.trim()}%`);

  const { data } = await query;

  return (
    <UserManager
      users={(data ?? []) as Profile[]}
      currentUserId={ctx.userId}
      canChangeRoles={ctx.isSuperAdmin}
      initialSearch={q ?? ''}
    />
  );
}
