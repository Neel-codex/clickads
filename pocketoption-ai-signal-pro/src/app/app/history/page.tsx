import type { Metadata } from 'next';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, timeAgo } from '@/lib/utils';
import type { SignalHistoryRow } from '@/types/database';

export const metadata: Metadata = { title: 'Signal History' };

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('signal_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const rows = (data ?? []) as SignalHistoryRow[];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Signal History</h1>
      {rows.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">
            No signals recorded yet. Generated signals will appear here.
          </p>
        </Card>
      ) : (
        <Card className="p-2">
          <ul className="flex flex-col">
            {rows.map((r) => {
              const isBuy = r.direction === 'buy';
              const isSell = r.direction === 'sell';
              const Icon = isBuy ? ArrowUpRight : isSell ? ArrowDownRight : Minus;
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5"
                >
                  <Icon
                    className={cn(
                      'size-5 shrink-0',
                      isBuy ? 'text-success' : isSell ? 'text-destructive' : 'text-muted-foreground',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {r.asset_symbol}{' '}
                      <span className="text-xs font-normal text-muted-foreground">
                        {r.timeframe}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</p>
                  </div>
                  <Badge variant="muted">{Math.round(r.confidence)}%</Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
