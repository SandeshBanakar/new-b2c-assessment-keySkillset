'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Info, AlertTriangle, ArrowLeft } from 'lucide-react';

const KSS_LOGO =
  'https://uqweguyeaqkbxgtpkhez.supabase.co/storage/v1/object/public/Company%20Logos/New%20Upscaled%20keySkillset%20Logo.png';

const EDUCATION_QUOTE =
  '"Education is simply the soul of a society as it passes from one generation to another!"';

// ── Right-panel illustration ──────────────────────────────────────────────────

function IllustrationPanel() {
  return (
    <div className="relative w-full max-w-[560px] rounded-3xl overflow-hidden bg-zinc-800 aspect-[4/3] flex flex-col items-center justify-end p-10">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-900" />
      <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="absolute bottom-20 left-6 h-28 w-28 rounded-full bg-blue-400/10 blur-2xl" />
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none select-none">
        <img src={KSS_LOGO} alt="" aria-hidden className="w-72 h-auto" />
      </div>
      <div className="relative z-10 text-center">
        <p className="text-white text-[1.15rem] font-semibold leading-relaxed italic px-4">
          {EDUCATION_QUOTE}
        </p>
        <div className="mt-3 h-1 w-52 mx-auto rounded-full bg-yellow-400/60" />
      </div>
    </div>
  );
}

// ── Suspended panel ───────────────────────────────────────────────────────────

function SuspendedPanel({ reason }: { reason: string }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
          <AlertTriangle className="h-8 w-8 text-rose-600" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900">Account Suspended</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your access to keySkillset has been suspended by an administrator.
        </p>
      </div>

      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-rose-700">
          Reason for suspension
        </p>
        <p className="text-sm leading-relaxed text-zinc-700">{reason}</p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm text-zinc-600 leading-relaxed">
        <p>
          If you believe this was done in error or would like to discuss this matter, please contact
          our support team:
        </p>
        <a
          href="mailto:contact@keyskillset.com"
          className="mt-1.5 block font-medium text-blue-600 hover:underline"
        >
          contact@keyskillset.com
        </a>
      </div>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-zinc-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
    </div>
  );
}

// ── Normal login form ─────────────────────────────────────────────────────────

function LoginForm() {
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <>
      <h1 className="text-center text-2xl font-semibold text-zinc-900">Login to your account</h1>
      <p className="mt-1 text-center text-sm text-zinc-500">Your gateway to knowledge!</p>

      <div className="mt-8 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Registered Email ID"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700">
            Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              {showPwd ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-1.5 flex justify-end">
            <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-800">
              Forgot Password ?
            </button>
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-full bg-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
        >
          Log In
        </button>

        <Link
          href="/signup"
          className="block w-full rounded-full border border-zinc-900 py-3 text-center text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50"
        >
          Sign Up
        </Link>

        <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <p className="text-xs leading-relaxed text-blue-600">
            If you&apos;re an existing user, please set up your new password using Forgot Password
            button!
          </p>
        </div>
      </div>
    </>
  );
}

// ── Page (with search-param reading inside Suspense) ─────────────────────────

function LoginContent() {
  const searchParams = useSearchParams();
  const state = searchParams.get('state');
  const reason =
    searchParams.get('reason') ??
    'Your account has been suspended due to a violation of our terms of service. Please contact support if you believe this is an error.';

  const isSuspended = state === 'suspended';

  return (
    <div className="flex min-h-screen items-stretch bg-zinc-100">
      {/* Left panel */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-8 py-12 lg:w-[42%] lg:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <img src={KSS_LOGO} alt="keySkillset" className="h-10 w-auto" />
          </div>

          {isSuspended ? <SuspendedPanel reason={reason} /> : <LoginForm />}

          {/* Demo state switcher */}
          <div className="mt-10 border-t border-zinc-100 pt-6">
            <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-widest text-zinc-400">
              Demo States
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/login"
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  !isSuspended
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Normal Login
              </Link>
              <Link
                href="/login?state=suspended&reason=Your+account+was+flagged+for+suspicious+activity+and+has+been+suspended+pending+review."
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSuspended
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                Suspended User
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="hidden items-center justify-center bg-zinc-100 p-8 lg:flex lg:flex-1">
        <IllustrationPanel />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
