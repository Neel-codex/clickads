import Link from 'next/link';
import { AiBrainLogo } from '@/components/brand/ai-brain-logo';

/** Shared centered shell for auth screens. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <AiBrainLogo size={40} />
        <span className="text-base font-semibold">AI Signal Pro</span>
      </Link>
      <div className="glass-strong rounded-3xl p-6">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
      {footer ? (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </main>
  );
}
