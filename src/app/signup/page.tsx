'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';

const KSS_LOGO =
  'https://uqweguyeaqkbxgtpkhez.supabase.co/storage/v1/object/public/Company%20Logos/New%20Upscaled%20keySkillset%20Logo.png';

const EDUCATION_QUOTE =
  '"Education is simply the soul of a society as it passes from one generation to another!"';

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

export default function SignupPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="flex min-h-screen items-stretch bg-zinc-100">
      {/* Left panel */}
      <div className="flex w-full flex-col items-center justify-center bg-white px-8 py-12 lg:w-[42%] lg:px-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <img src={KSS_LOGO} alt="keySkillset" className="h-10 w-auto" />
          </div>

          <h1 className="text-center text-2xl font-semibold text-zinc-900">Create Your Account</h1>
          <p className="mt-1 text-center text-sm text-zinc-500">
            A great pathway to Learning begins here!
          </p>

          <div className="mt-8 space-y-5">
            {/* First + Last name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="First Name"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Last Name"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Email"
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">Phone Number</label>
              <div className="flex gap-2">
                <div className="relative flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-3">
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Phone Number"
                  className="flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Create Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Create a password"
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
            </div>

            {/* Terms */}
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-green-600"
              />
              <span className="text-sm text-zinc-600">
                I agree to the{' '}
                <button type="button" className="font-medium text-blue-600 hover:underline">
                  Terms &amp; Conditions
                </button>{' '}
                and{' '}
                <button type="button" className="font-medium text-blue-600 hover:underline">
                  Privacy Policy
                </button>
              </span>
            </label>

            {/* Create Account */}
            <button
              type="button"
              disabled={!agreed}
              className="w-full rounded-full bg-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create Account
            </button>

            <p className="text-center text-sm text-zinc-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:underline">
                Login
              </Link>
            </p>
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
