'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { activateLicenseSchema } from '@/lib/validations';

export interface LicenseActionState {
  error?: string;
  success?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: 'You must be signed in to activate a license.',
  LICENSE_NOT_FOUND: 'That license key was not found.',
  LICENSE_BLOCKED: 'This license has been suspended or revoked.',
  LICENSE_EXPIRED: 'This license has expired.',
  LICENSE_IN_USE: 'This license is already bound to another account.',
  DEVICE_LIMIT_REACHED:
    'This license is already active on a different device. Contact support to reset it.',
};

/**
 * Activate a license for the current user + device by invoking the
 * SECURITY DEFINER `activate_license` RPC, which atomically binds the license.
 */
export async function activateLicenseAction(
  _prev: LicenseActionState,
  formData: FormData,
): Promise<LicenseActionState> {
  const parsed = activateLicenseSchema.safeParse({
    licenseKey: formData.get('licenseKey'),
    deviceName: formData.get('deviceName'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const fingerprint = String(formData.get('deviceFingerprint') ?? '').slice(0, 128);
  if (!fingerprint) {
    return { error: 'Could not read this device. Please retry.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('activate_license', {
    p_license_key: parsed.data.licenseKey,
    p_device_fingerprint: fingerprint,
    p_device_name: parsed.data.deviceName,
  });

  if (error) {
    const code = error.message.replace(/.*?([A-Z_]{4,})$/, '$1').trim();
    return { error: ERROR_MESSAGES[code] ?? 'Activation failed. Please try again.' };
  }

  revalidatePath('/', 'layout');
  return { success: 'License activated. Welcome aboard!' };
}
