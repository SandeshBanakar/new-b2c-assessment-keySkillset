/**
 * Demo authentication bypass.
 *
 * When Supabase auth is not fully configured (e.g. email confirmation pending),
 * this module lets demo users log in by matching against a hardcoded credential map.
 * The user's profile is still read from public.users in Supabase — only the
 * password check is bypassed.
 *
 * Remove this file (and references) once real auth is confirmed working.
 */

export const DEMO_PASSWORD = 'Demo@1234';
export const DEMO_SESSION_KEY = 'kss_demo_uid';

const DEMO_USER_IDS: Record<string, string> = {
  'free@keyskillset.com': '9a3b56a5-31f6-4a58-81fa-66157c68d4f0',
  'basic@keyskillset.com': 'a0c16137-7fd5-44f5-96e6-60e4617d9230',
  'pro@keyskillset.com': 'e150d59c-13c1-4db3-b6d7-4f30c29178e9',
  'premium@keyskillset.com': '191c894d-b532-4fa8-b1fe-746e5cdcdcc8',
};

export function isDemoCredential(email: string, password: string): boolean {
  return password === DEMO_PASSWORD && email.toLowerCase() in DEMO_USER_IDS;
}

export function getDemoUserId(email: string): string | null {
  return DEMO_USER_IDS[email.toLowerCase()] ?? null;
}
