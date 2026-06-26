'use client';

import { useActionState, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import {
  Plus,
  Upload,
  Download,
  Search,
  Copy,
  Check,
  Ban,
  RefreshCw,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react';
import {
  generateLicensesAction,
  importLicensesCsvAction,
  toggleSuspendLicenseAction,
  renewLicenseAction,
  resetDeviceAction,
  deleteLicenseAction,
  type AdminActionState,
} from '@/app/actions/admin';
import { LICENSE_TYPES, type LicenseType } from '@/lib/constants';
import type { License } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'destructive' | 'muted'> = {
  active: 'success',
  unused: 'muted',
  suspended: 'warning',
  expired: 'destructive',
  revoked: 'destructive',
};

function GenerateSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Plus className="size-4" />
      {pending ? 'Generating…' : 'Generate'}
    </Button>
  );
}

export function LicenseManager({
  licenses,
  initialSearch,
  initialStatus,
}: {
  licenses: License[];
  initialSearch: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [panel, setPanel] = useState<'none' | 'generate' | 'import'>('none');
  const [copied, setCopied] = useState(false);
  const [rowMsg, setRowMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [genState, genAction] = useActionState<AdminActionState, FormData>(
    generateLicensesAction,
    {},
  );
  const [impState, impAction] = useActionState<AdminActionState, FormData>(
    importLicensesCsvAction,
    {},
  );

  function applyFilters(next: { q?: string; status?: string }) {
    const params = new URLSearchParams();
    const q = next.q ?? search;
    const status = next.status ?? initialStatus;
    if (q) params.set('q', q);
    if (status && status !== 'all') params.set('status', status);
    router.push(`/admin/licenses?${params.toString()}`);
  }

  function runRowAction(fn: () => Promise<AdminActionState>) {
    startTransition(async () => {
      const res = await fn();
      setRowMsg(res.error ?? res.success ?? null);
      router.refresh();
      setTimeout(() => setRowMsg(null), 3000);
    });
  }

  function copyKeys() {
    if (!genState.keys?.length) return;
    navigator.clipboard.writeText(genState.keys.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters({ q: search });
          }}
          className="relative flex-1 min-w-[180px]"
        >
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by key…"
            className="pl-9"
          />
        </form>
        <select
          defaultValue={initialStatus}
          onChange={(e) => applyFilters({ status: e.target.value })}
          className="h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {['all', 'unused', 'active', 'suspended', 'expired', 'revoked'].map((s) => (
            <option key={s} value={s} className="bg-card">
              {s[0]!.toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <Button
          variant={panel === 'generate' ? 'default' : 'outline'}
          onClick={() => setPanel(panel === 'generate' ? 'none' : 'generate')}
        >
          <Plus className="size-4" /> Generate
        </Button>
        <Button
          variant={panel === 'import' ? 'default' : 'outline'}
          onClick={() => setPanel(panel === 'import' ? 'none' : 'import')}
        >
          <Upload className="size-4" /> Import
        </Button>
        <a href="/api/admin/licenses/export">
          <Button variant="outline">
            <Download className="size-4" /> Export
          </Button>
        </a>
      </div>

      {rowMsg && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
          {rowMsg}
        </div>
      )}

      {/* Generate panel */}
      {panel === 'generate' && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Generate licenses</h2>
            <button onClick={() => setPanel('none')} aria-label="Close">
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
          <form action={genAction} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-xs text-muted-foreground">
              Type
              <select
                name="type"
                defaultValue="30d"
                className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {LICENSE_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-card">
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-muted-foreground">
              Quantity
              <Input name="quantity" type="number" min={1} max={1000} defaultValue={1} className="mt-1" />
            </label>
            <label className="text-xs text-muted-foreground">
              Device limit
              <Input name="deviceLimit" type="number" min={1} max={10} defaultValue={1} className="mt-1" />
            </label>
            <label className="text-xs text-muted-foreground">
              Notes
              <Input name="notes" placeholder="optional" className="mt-1" />
            </label>
            <div className="col-span-2 sm:col-span-4">
              <GenerateSubmit />
            </div>
          </form>

          {genState.error && (
            <p className="mt-3 text-sm text-destructive">{genState.error}</p>
          )}
          {genState.keys?.length ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-success">{genState.success}</p>
                <Button size="sm" variant="outline" onClick={copyKeys}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? 'Copied' : 'Copy all'}
                </Button>
              </div>
              <pre className="max-h-48 overflow-auto rounded-xl bg-black/30 p-3 font-mono text-xs">
                {genState.keys.join('\n')}
              </pre>
            </div>
          ) : null}
        </Card>
      )}

      {/* Import panel */}
      {panel === 'import' && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Import from CSV</h2>
            <button onClick={() => setPanel('none')} aria-label="Close">
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>
          <form action={impAction} className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              One per line: <code>license_key,type,device_limit,notes</code> — a
              header row is optional. Type is one of 7d, 30d, 90d, lifetime.
            </p>
            <textarea
              name="csv"
              rows={6}
              placeholder={'PO-ABCD-1234-WXYZ,30d,1,vip\nPO-EFGH-5678-QRST,lifetime,2,'}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div>
              <Button type="submit">
                <Upload className="size-4" /> Import
              </Button>
            </div>
          </form>
          {impState.error && <p className="mt-2 text-sm text-destructive">{impState.error}</p>}
          {impState.success && <p className="mt-2 text-sm text-success">{impState.success}</p>}
        </Card>
      )}

      {/* Table */}
      <Card className="overflow-hidden p-0">
        {licenses.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No licenses match your filters.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Device</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {licenses.map((lic) => (
                  <tr key={lic.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{lic.license_key}</td>
                    <td className="px-4 py-3">{lic.is_lifetime ? 'Lifetime' : lic.type}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[lic.status] ?? 'muted'}>{lic.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {lic.device_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {lic.is_lifetime || !lic.expires_at
                        ? 'Never'
                        : new Date(lic.expires_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <RowButton
                          title={lic.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          onClick={() => runRowAction(() => toggleSuspendLicenseAction(lic.id))}
                          disabled={isPending}
                        >
                          <Ban className="size-4" />
                        </RowButton>
                        <RowButton
                          title="Renew (same type)"
                          onClick={() =>
                            runRowAction(() =>
                              renewLicenseAction(lic.id, (lic.type as LicenseType) ?? '30d'),
                            )
                          }
                          disabled={isPending}
                        >
                          <RefreshCw className="size-4" />
                        </RowButton>
                        <RowButton
                          title="Reset device"
                          onClick={() => runRowAction(() => resetDeviceAction(lic.id))}
                          disabled={isPending}
                        >
                          <Smartphone className="size-4" />
                        </RowButton>
                        <RowButton
                          title="Delete"
                          danger
                          onClick={() => {
                            if (confirm(`Delete ${lic.license_key}? This cannot be undone.`))
                              runRowAction(() => deleteLicenseAction(lic.id));
                          }}
                          disabled={isPending}
                        >
                          <Trash2 className="size-4" />
                        </RowButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function RowButton({
  children,
  title,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`grid size-8 place-items-center rounded-lg transition-colors disabled:opacity-40 ${
        danger
          ? 'text-destructive hover:bg-destructive/15'
          : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}
