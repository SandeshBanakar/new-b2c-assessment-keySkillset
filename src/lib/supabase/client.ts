import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// NEXT_PUBLIC keys are intentionally public — safe to commit as fallbacks for Vercel deployments
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://uqweguyeaqkbxgtpkhez.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_AX2KDXMKhQp53MeCLkVWsQ_6mTbGCTj';

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string, unknown>)[prop as string];
  },
});
