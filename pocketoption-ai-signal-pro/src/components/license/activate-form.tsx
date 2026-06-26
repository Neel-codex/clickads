'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import {
  activateLicenseAction,
  type LicenseActionState,
} from '@/app/actions/license';
import { getDeviceFingerprint, suggestDeviceName } from '@/lib/license/fingerprint';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      <KeyRound className="size-4" />
      {pending ? 'Activating…' : 'Activate License'}
    </Button>
  );
}

export function ActivateForm() {
  const router = useRouter();
  const [fingerprint, setFingerprint] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [state, formAction] = useActionState<LicenseActionState, FormData>(
    activateLicenseAction,
    {},
  );

  useEffect(() => {
    getDeviceFingerprint().then(setFingerprint);
    setDeviceName(suggestDeviceName());
  }, []);

  useEffect(() => {
    if (state.success) {
      const t = setTimeout(() => router.push('/app'), 1200);
      return () => clearTimeout(t);
    }
  }, [state.success, router]);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <CheckCircle2 className="size-12 text-success" />
        <p className="text-sm text-muted-foreground">{state.success}</p>
        <p className="text-xs text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="deviceFingerprint" value={fingerprint} />

      {state.error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {state.error}
        </div>
      ) : null}

      <div>
        <Label htmlFor="licenseKey">License key</Label>
        <Input
          id="licenseKey"
          name="licenseKey"
          placeholder="PO-XXXX-XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="font-mono uppercase tracking-wider"
          required
        />
      </div>

      <div>
        <Label htmlFor="deviceName">Device name</Label>
        <Input
          id="deviceName"
          name="deviceName"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          placeholder="My phone"
          required
        />
      </div>

      <SubmitButton />
    </form>
  );
}
