import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <WifiOff className="size-12 text-muted-foreground" />
      <h1 className="text-xl font-semibold">You&apos;re offline</h1>
      <p className="text-sm text-muted-foreground">
        Market analysis needs a live connection. Reconnect to continue — the app
        shell stays available while you&apos;re away.
      </p>
    </main>
  );
}
