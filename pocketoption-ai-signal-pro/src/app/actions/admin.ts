'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import {
  generateLicenseKeys,
  isValidLicenseKeyFormat,
  computeExpiry,
} from '@/lib/license/license-key';
import type { LicenseType } from '@/lib/constants';

export interface AdminActionState {
  error?: string;
  success?: string;
  /** Optional payload, e.g. generated keys to display. */
  keys?: string[];
}

const LICENSE_DAYS: Record<LicenseType, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  lifetime: null,
};

/** Generate one or more licenses. */
export async function generateLicensesAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let ctx;
  try {
    ctx = await requireAdmin(true);
  } catch {
    return { error: 'You do not have permission to do that.' };
  }

  const type = String(formData.get('type') ?? '30d') as LicenseType;
  const quantity = Math.min(Math.max(Number(formData.get('quantity') ?? 1), 1), 1000);
  const deviceLimit = Math.min(Math.max(Number(formData.get('deviceLimit') ?? 1), 1), 10);
  const notes = String(formData.get('notes') ?? '').slice(0, 200) || null;

  if (!(type in LICENSE_DAYS)) return { error: 'Invalid license type.' };

  const isLifetime = type === 'lifetime';
  const keys = generateLicenseKeys(quantity);
  const supabase = await createClient();

  const rows = keys.map((license_key) => ({
    license_key,
    type,
    status: 'unused' as const,
    is_lifetime: isLifetime,
    device_limit: deviceLimit,
    expires_at: null, // expiry is computed on activation for time-limited licenses
    notes,
    created_by: ctx.userId,
  }));

  const { error } = await supabase.from('licenses').insert(rows);
  if (error) return { error: error.message };

  await supabase.from('activity_logs').insert({
    user_id: ctx.userId,
    action: 'licenses.generate',
    entity: 'license',
    detail: { count: quantity, type, deviceLimit },
  });

  revalidatePath('/admin/licenses');
  return {
    success: `Generated ${quantity} license${quantity > 1 ? 's' : ''}.`,
    keys,
  };
}

/** Suspend or un-suspend a license (toggles between suspended and active/unused). */
export async function toggleSuspendLicenseAction(
  licenseId: string,
): Promise<AdminActionState> {
  try {
    await requireAdmin(true);
  } catch {
    return { error: 'Forbidden.' };
  }
  const supabase = await createClient();
  const { data: lic } = await supabase
    .from('licenses')
    .select('status, assigned_user_id')
    .eq('id', licenseId)
    .single();
  if (!lic) return { error: 'License not found.' };

  const next =
    lic.status === 'suspended'
      ? lic.assigned_user_id
        ? 'active'
        : 'unused'
      : 'suspended';

  const { error } = await supabase
    .from('licenses')
    .update({ status: next })
    .eq('id', licenseId);
  if (error) return { error: error.message };

  await supabase.from('license_logs').insert({
    license_id: licenseId,
    action: next === 'suspended' ? 'suspended' : 'unsuspended',
  });
  revalidatePath('/admin/licenses');
  return { success: `License ${next === 'suspended' ? 'suspended' : 'reactivated'}.` };
}

/** Extend/renew a license's expiry from now by the given type's duration. */
export async function renewLicenseAction(
  licenseId: string,
  type: LicenseType,
): Promise<AdminActionState> {
  try {
    await requireAdmin(true);
  } catch {
    return { error: 'Forbidden.' };
  }
  const supabase = await createClient();
  const isLifetime = type === 'lifetime';
  const expires_at = isLifetime ? null : computeExpiry(type);

  const { error } = await supabase
    .from('licenses')
    .update({
      type,
      is_lifetime: isLifetime,
      expires_at,
      status: 'active',
    })
    .eq('id', licenseId);
  if (error) return { error: error.message };

  await supabase.from('license_logs').insert({
    license_id: licenseId,
    action: 'renewed',
    detail: { type },
  });
  revalidatePath('/admin/licenses');
  return { success: 'License renewed.' };
}

/** Reset a license's device binding so it can be activated on a new device. */
export async function resetDeviceAction(
  licenseId: string,
): Promise<AdminActionState> {
  try {
    await requireAdmin(true);
  } catch {
    return { error: 'Forbidden.' };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from('licenses')
    .update({ device_fingerprint: null, device_name: null })
    .eq('id', licenseId);
  if (error) return { error: error.message };

  await supabase.from('license_logs').insert({
    license_id: licenseId,
    action: 'reset_device',
  });
  revalidatePath('/admin/licenses');
  return { success: 'Device binding reset.' };
}

/** Permanently delete a license. */
export async function deleteLicenseAction(
  licenseId: string,
): Promise<AdminActionState> {
  try {
    await requireAdmin(true);
  } catch {
    return { error: 'Forbidden.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.from('licenses').delete().eq('id', licenseId);
  if (error) return { error: error.message };
  revalidatePath('/admin/licenses');
  return { success: 'License deleted.' };
}

/** Import licenses from CSV text. Expected header: license_key,type,device_limit,notes */
export async function importLicensesCsvAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  let ctx;
  try {
    ctx = await requireAdmin(true);
  } catch {
    return { error: 'Forbidden.' };
  }
  const csv = String(formData.get('csv') ?? '').trim();
  if (!csv) return { error: 'Paste CSV content first.' };

  const lines = csv.split(/\r?\n/).filter(Boolean);
  // Drop header row if present.
  if (lines[0]?.toLowerCase().includes('license_key')) lines.shift();

  const rows: {
    license_key: string;
    type: LicenseType;
    is_lifetime: boolean;
    device_limit: number;
    status: 'unused';
    notes: string | null;
    created_by: string;
  }[] = [];
  const invalid: string[] = [];

  for (const line of lines) {
    const [key, typeRaw, limitRaw, notes] = line.split(',').map((s) => s.trim());
    const type = (typeRaw || '30d') as LicenseType;
    if (!key || !isValidLicenseKeyFormat(key) || !(type in LICENSE_DAYS)) {
      invalid.push(key || line);
      continue;
    }
    rows.push({
      license_key: key.toUpperCase(),
      type,
      is_lifetime: type === 'lifetime',
      device_limit: Math.min(Math.max(Number(limitRaw) || 1, 1), 10),
      status: 'unused',
      notes: notes || null,
      created_by: ctx.userId,
    });
  }

  if (rows.length === 0) {
    return { error: 'No valid rows found. Format: license_key,type,device_limit,notes' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('licenses')
    .upsert(rows, { onConflict: 'license_key', ignoreDuplicates: true });
  if (error) return { error: error.message };

  revalidatePath('/admin/licenses');
  return {
    success: `Imported ${rows.length} license${rows.length > 1 ? 's' : ''}.${
      invalid.length ? ` Skipped ${invalid.length} invalid row(s).` : ''
    }`,
  };
}

/** Change a user's role. Super admin only. */
export async function setUserRoleAction(
  userId: string,
  role: 'user' | 'admin' | 'super_admin',
): Promise<AdminActionState> {
  let ctx;
  try {
    ctx = await requireAdmin(true);
  } catch {
    return { error: 'Forbidden.' };
  }
  if (!ctx.isSuperAdmin) return { error: 'Only a super admin can change roles.' };
  if (userId === ctx.userId) return { error: 'You cannot change your own role.' };

  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) return { error: error.message };

  await supabase.from('activity_logs').insert({
    user_id: ctx.userId,
    action: 'user.role_change',
    entity: 'profile',
    entity_id: userId,
    detail: { role },
  });
  revalidatePath('/admin/users');
  return { success: 'Role updated.' };
}

/** Activate/deactivate a user account. */
export async function setUserActiveAction(
  userId: string,
  isActive: boolean,
): Promise<AdminActionState> {
  let ctx;
  try {
    ctx = await requireAdmin(true);
  } catch {
    return { error: 'Forbidden.' };
  }
  if (userId === ctx.userId) return { error: 'You cannot deactivate yourself.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId);
  if (error) return { error: error.message };
  revalidatePath('/admin/users');
  return { success: isActive ? 'User activated.' : 'User deactivated.' };
}
