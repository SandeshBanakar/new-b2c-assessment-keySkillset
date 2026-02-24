'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { isDemoCredential, getDemoUserId, DEMO_SESSION_KEY } from '@/lib/demoAuth';

export default function AuthPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // — Attempt 1: Real Supabase auth —
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!signInError && data.session) {
      // Real auth succeeded — fetch profile and redirect
      const { data: userData } = await supabase
        .from('users')
        .select('user_onboarded')
        .eq('id', data.session.user.id)
        .single();

      router.push(userData?.user_onboarded === false ? '/onboarding' : '/');
      return;
    }

    // — Attempt 2: Demo bypass (used when email confirmation is pending) —
    if (isDemoCredential(email, password)) {
      const userId = getDemoUserId(email)!;
      localStorage.setItem(DEMO_SESSION_KEY, userId);

      const { data: userData } = await supabase
        .from('users')
        .select('user_onboarded')
        .eq('id', userId)
        .single();

      if (!userData) {
        // Profile row missing — clear and show error
        localStorage.removeItem(DEMO_SESSION_KEY);
        setError('Demo user profile not found in database. Check Supabase public.users.');
        setLoading(false);
        return;
      }

      router.push(userData.user_onboarded === false ? '/onboarding' : '/');
      return;
    }

    // — Both attempts failed —
    setError('Invalid email or password.');
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4">
      <div className="max-w-sm mx-auto mt-24 bg-white rounded-md shadow-sm p-8">

        {/* Wordmark */}
        <p className="text-blue-700 font-bold text-xl text-center mb-6">
          keySkillset
        </p>

        {/* Heading */}
        <h1 className="text-xl font-semibold text-zinc-900 text-center">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-500 text-center mt-1 mb-6">
          Sign in to continue
        </p>

        <form onSubmit={handleSignIn} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full border border-zinc-200 rounded-md px-3 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-zinc-200 rounded-md px-3 py-2.5 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-rose-600">{error}</p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-md disabled:opacity-40"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-xs text-zinc-400 text-center mt-4">
          Demo access only. Contact admin for credentials.
        </p>

      </div>
    </div>
  );
}
