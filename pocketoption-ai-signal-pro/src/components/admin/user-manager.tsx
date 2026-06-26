'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Search, UserCheck, UserX } from 'lucide-react';
import {
  setUserRoleAction,
  setUserActiveAction,
  type AdminActionState,
} from '@/app/actions/admin';
import { USER_ROLES, type UserRole } from '@/lib/constants';
import type { Profile } from '@/types/database';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export function UserManager({
  users,
  currentUserId,
  canChangeRoles,
  initialSearch,
}: {
  users: Profile[];
  currentUserId: string;
  canChangeRoles: boolean;
  initialSearch: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(fn: () => Promise<AdminActionState>) {
    startTransition(async () => {
      const res = await fn();
      setMsg(res.error ?? res.success ?? null);
      router.refresh();
      setTimeout(() => setMsg(null), 3000);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/admin/users?${search ? `q=${encodeURIComponent(search)}` : ''}`);
        }}
        className="relative"
      >
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email…"
          className="pl-9"
        />
      </form>

      {msg && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">{msg}</div>
      )}

      <Card className="overflow-hidden p-0">
        {users.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr key={u.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium">{u.full_name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        {canChangeRoles && !isSelf ? (
                          <select
                            defaultValue={u.role}
                            disabled={isPending}
                            onChange={(e) =>
                              run(() => setUserRoleAction(u.id, e.target.value as UserRole))
                            }
                            className="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {USER_ROLES.map((r) => (
                              <option key={r} value={r} className="bg-card">
                                {r.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Badge variant={u.role === 'user' ? 'muted' : 'default'}>
                            {u.role.replace('_', ' ')}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.is_active ? 'success' : 'destructive'}>
                          {u.is_active ? 'active' : 'inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          {!isSelf && (
                            <button
                              title={u.is_active ? 'Deactivate' : 'Activate'}
                              disabled={isPending}
                              onClick={() => run(() => setUserActiveAction(u.id, !u.is_active))}
                              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-40"
                            >
                              {u.is_active ? (
                                <UserX className="size-4" />
                              ) : (
                                <UserCheck className="size-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!canChangeRoles && (
        <p className="text-xs text-muted-foreground">
          Only a super admin can change user roles.
        </p>
      )}
    </div>
  );
}
