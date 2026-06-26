'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle } from 'lucide-react';
import { loginAction, type ActionState } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      ) : null}

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a href="/forgot-password" className="mb-1.5 text-xs text-primary hover:underline">
            Forgot?
          </a>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
      </div>

      <SubmitButton />
    </form>
  );
}
