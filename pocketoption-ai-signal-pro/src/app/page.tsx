import Link from 'next/link';
import {
  Activity,
  ShieldCheck,
  TrendingUp,
  LineChart,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AiBrainLogo } from '@/components/brand/ai-brain-logo';
import { ComplianceDisclaimer } from '@/components/compliance-disclaimer';
import { APP_NAME } from '@/lib/constants';

const features = [
  {
    icon: LineChart,
    title: 'Multi-indicator engine',
    desc: 'RSI, MACD, ADX, Ichimoku, SuperTrend, Bollinger, VWAP and more, fused into one weighted read.',
  },
  {
    icon: Layers,
    title: 'Smart Money Concepts',
    desc: 'Order blocks, liquidity sweeps, fair value gaps, BOS and CHoCH structure detection.',
  },
  {
    icon: Activity,
    title: 'Candlestick patterns',
    desc: 'Engulfing, stars, soldiers, hammers and more recognised in real time.',
  },
  {
    icon: ShieldCheck,
    title: 'Licensed & secure',
    desc: 'Row-level security, device-bound licenses and audited admin controls.',
  },
];

export default function LandingPage() {
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-10 pt-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AiBrainLogo size={36} />
          <span className="text-sm font-semibold">AI Signal Pro</span>
        </div>
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </Link>
      </header>

      <section className="mt-14 flex flex-col items-start gap-5">
        <Badge variant="outline" className="gap-1.5">
          <TrendingUp className="size-3" /> Market analysis, reimagined
        </Badge>
        <h1 className="text-4xl font-bold leading-tight tracking-tight">
          {APP_NAME}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          Premium, mobile-first market analysis. Technical indicators and Smart
          Money Concepts distilled into clear, confidence-scored signal ideas —
          for education and research.
        </p>
        <div className="flex w-full flex-col gap-3 pt-2">
          <Link href="/register" className="w-full">
            <Button size="lg" className="w-full">
              Get started free
            </Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button size="lg" variant="outline" className="w-full">
              I already have an account
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-14 grid grid-cols-1 gap-3">
        {features.map((f) => (
          <div key={f.title} className="glass flex gap-3 rounded-2xl p-4">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15">
              <f.icon className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="mt-10">
        <ComplianceDisclaimer />
      </div>

      <footer className="mt-10 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground">
          Terms
        </Link>
        <span>·</span>
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
        <span>·</span>
        <Link href="/support" className="hover:text-foreground">
          Support
        </Link>
      </footer>
    </main>
  );
}
