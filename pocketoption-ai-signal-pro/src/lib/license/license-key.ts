/**
 * License key generation & formatting.
 * Format: PO-XXXX-XXXX-XXXX (Crockford base32-ish, ambiguous chars removed).
 */
import { randomInt } from 'crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I,O,0,1

function segment(len = 4): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return out;
}

/** Generate a single license key, e.g. "PO-8FKA-28LS-QW92". */
export function generateLicenseKey(prefix = 'PO'): string {
  return `${prefix}-${segment()}-${segment()}-${segment()}`;
}

/** Generate `count` unique license keys. */
export function generateLicenseKeys(count: number, prefix = 'PO'): string[] {
  const set = new Set<string>();
  while (set.size < count) set.add(generateLicenseKey(prefix));
  return [...set];
}

const KEY_REGEX = /^PO-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;

/** Validate the structural format of a license key. */
export function isValidLicenseKeyFormat(key: string): boolean {
  return KEY_REGEX.test(key.trim().toUpperCase());
}

/** Compute the expiry timestamp for a license type from an activation moment. */
export function computeExpiry(
  type: '7d' | '30d' | '90d' | 'lifetime',
  from: Date = new Date(),
): string | null {
  const days = { '7d': 7, '30d': 30, '90d': 90, lifetime: null }[type];
  if (days == null) return null;
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
