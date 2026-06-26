'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ActionState } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;
type Field = { name: string; label: string; type?: string; placeholder?: string };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? 'Please wait…' : label}
    </Button>
  );
}

/** Reusable single-step form for forgot/reset password flows. */
export function SimpleActionForm({
  action,
  fields,
  submitLabel,
}: {
  action: Action;
  fields: Field[];
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <p className="text-sm text-muted-foreground">{state.success}</p>
        <a href="/login" className="text-sm font-medium text-primary hover:underline">
          Back to sign in
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
      {fields.map((f) => (
        <div key={f.name}>
          <Label htmlFor={f.name}>{f.label}</Label>
          <Input
            id={f.name}
            name={f.name}
            type={f.type ?? 'text'}
            placeholder={f.placeholder}
            required
          />
        </div>
      ))}
      <SubmitButton label={submitLabel} />
    </form>
  );
}
