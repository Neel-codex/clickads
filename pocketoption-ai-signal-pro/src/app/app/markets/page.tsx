import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ASSET_CATEGORY_LABELS,
  type AssetCategory,
} from '@/lib/constants';
import type { Asset } from '@/types/database';

export const metadata: Metadata = { title: 'Markets' };

export default async function MarketsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('assets')
    .select('*')
    .eq('is_enabled', true)
    .order('sort_order', { ascending: true });

  const assets = (data ?? []) as Asset[];
  const grouped = assets.reduce<Record<string, Asset[]>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Markets</h1>
      {Object.keys(grouped).length === 0 && (
        <Card>
          <p className="text-sm text-muted-foreground">No assets configured yet.</p>
        </Card>
      )}
      {(Object.keys(grouped) as AssetCategory[]).map((cat) => (
        <section key={cat}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {ASSET_CATEGORY_LABELS[cat] ?? cat}
          </h2>
          <Card className="p-2">
            <ul className="flex flex-col">
              {grouped[cat]!.map((a) => (
                <li
                  key={a.symbol}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-white/5"
                >
                  <div>
                    <p className="font-semibold">{a.symbol}</p>
                    <p className="text-xs text-muted-foreground">{a.name}</p>
                  </div>
                  {a.is_otc && <Badge variant="warning">OTC</Badge>}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ))}
    </div>
  );
}
