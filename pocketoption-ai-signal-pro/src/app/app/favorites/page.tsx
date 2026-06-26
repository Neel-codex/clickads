import type { Metadata } from 'next';
import { Star } from 'lucide-react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Favorites' };

interface FavRow {
  is_pinned: boolean;
  assets: { symbol: string; name: string } | null;
}

export default async function FavoritesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supabase
    .from('favorites')
    .select('is_pinned, assets(symbol, name)')
    .eq('user_id', user.id)
    .order('is_pinned', { ascending: false });

  const favorites = (data ?? []) as unknown as FavRow[];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Favorites</h1>
      {favorites.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <Star className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No favorites yet. Star assets to pin them here for quick access.
          </p>
        </Card>
      ) : (
        <Card className="p-2">
          <ul className="flex flex-col">
            {favorites.map((f, i) => (
              <li
                key={f.assets?.symbol ?? i}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5"
              >
                <Star
                  className={f.is_pinned ? 'size-4 fill-primary text-primary' : 'size-4 text-muted-foreground'}
                />
                <div>
                  <p className="font-semibold">{f.assets?.symbol}</p>
                  <p className="text-xs text-muted-foreground">{f.assets?.name}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
