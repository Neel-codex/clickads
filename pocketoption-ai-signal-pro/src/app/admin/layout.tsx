import { Shield } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/require-admin';
import { AdminNav } from '@/components/admin/admin-nav';
import { Badge } from '@/components/ui/badge';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAdmin();

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 py-6">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-brand-gradient shadow-lg shadow-primary/30">
            <Shield className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-none">Admin Console</h1>
            <p className="text-xs text-muted-foreground">{ctx.profile.email}</p>
          </div>
        </div>
        <Badge variant="default">{ctx.profile.role.replace('_', ' ')}</Badge>
      </header>
      <AdminNav />
      {children}
    </div>
  );
}
