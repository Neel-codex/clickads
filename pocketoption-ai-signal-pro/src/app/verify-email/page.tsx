import type { Metadata } from 'next';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Verify email' };

export default function VerifyEmailPage() {
  return (
    <AuthShell title="Check your inbox" subtitle="Confirm your email to finish setting up.">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <MailCheck className="size-12 text-primary" />
        <p className="text-sm text-muted-foreground">
          We sent you a verification link. Once confirmed, sign in to activate
          your license and start using the dashboard.
        </p>
        <Link href="/login" className="w-full">
          <Button size="lg" className="w-full">
            Continue to sign in
          </Button>
        </Link>
      </div>
    </AuthShell>
  );
}
