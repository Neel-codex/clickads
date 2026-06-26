import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types/database';

export interface AdminContext {
  userId: string;
  profile: Profile;
  isSuperAdmin: boolean;
}

/**
 * Server-side guard for admin areas/actions. Redirects non-admins.
 * Use at the top of admin Server Components and (with `throwOnFail`) in actions.
 */
export async function requireAdmin(throwOnFail = false): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (throwOnFail) throw new Error('NOT_AUTHENTICATED');
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single<Profile>();

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    if (throwOnFail) throw new Error('FORBIDDEN');
    redirect('/app');
  }

  return {
    userId: user!.id,
    profile: profile!,
    isSuperAdmin: profile!.role === 'super_admin',
  };
}
