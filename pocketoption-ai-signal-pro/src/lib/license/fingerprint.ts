/**
 * Lightweight device fingerprinting for the license device-limit feature.
 * Runs in the browser. This is a deterrent, not a security boundary — the
 * authoritative device binding is enforced server-side in activate_license().
 */
'use client';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Build a stable-ish fingerprint from non-PII browser/device signals. */
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return 'server';
  const nav = window.navigator;
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const parts = [
    nav.userAgent,
    nav.language,
    (nav.languages ?? []).join(','),
    screenInfo,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? ''),
    String((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? ''),
  ];
  return sha256Hex(parts.join('|'));
}

/** A friendly default device name suggestion. */
export function suggestDeviceName(): string {
  if (typeof window === 'undefined') return 'Device';
  const ua = window.navigator.userAgent;
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Mac/.test(ua)
      ? 'Mac'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad/.test(ua)
          ? 'iOS'
          : 'Device';
  const browser = /Edg/.test(ua)
    ? 'Edge'
    : /Chrome/.test(ua)
      ? 'Chrome'
      : /Firefox/.test(ua)
        ? 'Firefox'
        : /Safari/.test(ua)
          ? 'Safari'
          : 'Browser';
  return `${os} · ${browser}`;
}
