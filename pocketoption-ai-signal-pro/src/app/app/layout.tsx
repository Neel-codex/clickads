import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BottomNav } from '@/components/app/bottom-nav';

/**
 * Authenticated, licensed area layout.
 * Auth is enforced by middleware; here we additionally gate on a valid license.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);
  const { data: licensed } = await supabase.rpc('has_active_license');

  // Non-admins must hold a valid license to enter the app.
  if (!licensed && !isAdmin) redirect('/activate');

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-28 pt-6">
      {children}
      <BottomNav />
    </div>
  );
}
