import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchCandles } from '@/services/market-data';
import { fetchOtcCandles } from '@/services/otc-provider';
import { generateSignal } from '@/lib/analysis';
import { TIMEFRAMES, type TimeframeValue } from '@/lib/constants';
import type { Asset } from '@/types/database';

const VALID_TF = new Set(TIMEFRAMES.map((t) => t.value));

/**
 * GET /api/signal?symbol=EURUSD&timeframe=5m
 * Returns the latest analytical signal for an asset. Requires an authenticated
 * user with a valid license (enforced here and by RLS on persisted reads).
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const timeframe = (searchParams.get('timeframe') ?? '5m') as TimeframeValue;

  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });
  }
  if (!VALID_TF.has(timeframe)) {
    return NextResponse.json({ error: 'Invalid timeframe' }, { status: 400 });
  }

  const { data: asset } = await supabase
    .from('assets')
    .select('*')
    .eq('symbol', symbol)
    .eq('is_enabled', true)
    .single<Asset>();

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  try {
    let candles;
    if (asset.is_otc) {
      const otc = await fetchOtcCandles(asset, timeframe);
      if (!otc.available) {
        return NextResponse.json(
          { error: otc.message ?? 'OTC data unavailable', otcUnavailable: true },
          { status: 503 },
        );
      }
      candles = otc.candles;
    } else {
      const result = await fetchCandles(asset.provider_symbol ?? asset.symbol, timeframe);
      candles = result.candles;
    }

    if (!candles || candles.length < 60) {
      return NextResponse.json(
        { error: 'Insufficient market data to analyse this asset right now.' },
        { status: 503 },
      );
    }

    const signal = generateSignal(candles);

    return NextResponse.json(
      {
        symbol: asset.symbol,
        name: asset.name,
        timeframe,
        signal,
        candles: candles.slice(-200),
      },
      {
        headers: {
          // Edge/CDN cache for a few seconds to respect upstream rate limits.
          'Cache-Control': 's-maxage=5, stale-while-revalidate=10',
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to analyse asset' },
      { status: 502 },
    );
  }
}
