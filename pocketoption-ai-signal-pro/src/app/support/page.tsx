import type { Metadata } from 'next';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SUPPORT_TELEGRAM } from '@/lib/constants';

export const metadata: Metadata = { title: 'Support' };

export default function SupportPage() {
  const handle = SUPPORT_TELEGRAM.replace('@', '');
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-10">
      <Card className="flex flex-col items-center gap-4 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-brand-gradient shadow-lg shadow-primary/30">
          <Send className="size-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Contact Support</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Questions about licenses, activation, or the platform? Reach us on
            Telegram.
          </p>
        </div>
        <a
          href={`https://t.me/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Button size="lg" className="w-full">
            <Send className="size-4" /> Message {SUPPORT_TELEGRAM}
          </Button>
        </a>
      </Card>
    </main>
  );
}
