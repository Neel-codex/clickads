'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { registerAction, type ActionState } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Creating account…' : 'Create account'}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    registerAction,
    {},
  );

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <p className="text-sm text-muted-foreground">{state.success}</p>
        <a href="/login" className="text-sm font-medium text-primary hover:underline">
          Go to sign in
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      ) : null}

      <div>
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" autoComplete="name" placeholder="Jane Trader" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="••••••••" required />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••" required />
      </div>

      <SubmitButton />
    </form>
  );
}
