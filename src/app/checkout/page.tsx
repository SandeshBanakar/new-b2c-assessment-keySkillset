'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Lock } from 'lucide-react';
import { AuthGuard } from '@/components/shared/AuthGuard';
import { useAppContext } from '@/context/AppContext';

// -------------------------------------------------------
// Plan data
// -------------------------------------------------------

const PLANS = {
  basic:        { name: 'Basic',        price: 299 },
  professional: { name: 'Professional', price: 599 },
  premium:      { name: 'Premium',      price: 999 },
} as const;

type PlanKey = keyof typeof PLANS;

// -------------------------------------------------------
// Shared input style
// -------------------------------------------------------

const INPUT_CLS =
  'bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-700 w-full cursor-not-allowed';

// -------------------------------------------------------
// Checkout content (uses useSearchParams — needs Suspense)
// -------------------------------------------------------

function CheckoutContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, simulateTierChange } = useAppContext();

  const rawKey      = searchParams.get('plan');
  const isValidPlan = rawKey !== null && rawKey in PLANS;
  const planKey     = isValidPlan ? (rawKey as PlanKey) : null;
  const plan        = planKey ? PLANS[planKey] : null;

  useEffect(() => {
    if (!isValidPlan) {
      router.replace('/plans');
    }
  }, [isValidPlan, router]);

  if (!plan || !planKey) return null;

  function handleSubscribe() {
    if (!planKey) return;
    simulateTierChange(planKey);
    sessionStorage.setItem('justSubscribed', PLANS[planKey].name);
    router.push('/assessments');
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-3xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── LEFT PANEL — Order Summary ── */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">

          {/* Back link */}
          <button
            onClick={() => router.push('/plans')}
            className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 cursor-pointer mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Plans
          </button>

          {/* Plan name + price */}
          <p className="text-xl font-bold text-zinc-900">
            Subscribe to {plan.name} Plan
          </p>
          <p className="text-3xl font-bold text-zinc-900 mt-1">
            ₹{plan.price}
            <span className="text-base font-normal text-zinc-500">/month</span>
          </p>
          <p className="text-xs text-zinc-400 mt-0.5">Billed monthly</p>

          <div className="border-t border-zinc-100 my-5" />

          {/* Line item */}
          <div className="flex justify-between text-sm py-1">
            <span className="text-zinc-700">{plan.name} Monthly Plan</span>
            <span className="text-zinc-900 font-medium">₹{plan.price}</span>
          </div>

          {/* Promo code */}
          <div className="mt-3">
            <input
              type="text"
              placeholder="Add promotion code"
              readOnly
              disabled
              className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-400 w-full cursor-not-allowed"
            />
          </div>

          <div className="border-t border-zinc-100 my-5" />

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-zinc-900">Total due today</span>
            <span className="text-xl font-bold text-zinc-900">₹{plan.price}</span>
          </div>
        </div>

        {/* ── RIGHT PANEL — Payment Form ── */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <p className="text-lg font-semibold text-zinc-900 mb-5">Payment Details</p>

          {/* Email */}
          <div>
            <p className="text-xs text-zinc-500 mb-1 font-medium">Email</p>
            <input
              type="email"
              value={user?.email ?? 'demo@keyskillset.com'}
              readOnly
              className={INPUT_CLS}
            />
          </div>

          {/* Card number */}
          <div className="mt-4">
            <p className="text-xs text-zinc-500 mb-1 font-medium">Card number</p>
            <input
              type="text"
              value="4242 4242 4242 4242"
              readOnly
              className={INPUT_CLS}
            />
          </div>

          {/* Expiry + CVC */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-zinc-500 mb-1 font-medium">MM / YY</p>
              <input
                type="text"
                value="12 / 28"
                readOnly
                className={INPUT_CLS}
              />
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1 font-medium">CVC</p>
              <input
                type="text"
                value="424"
                readOnly
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Subscribe button */}
          <button
            onClick={handleSubscribe}
            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-4 text-base transition-colors cursor-pointer"
          >
            Subscribe
          </button>

          {/* Legal text */}
          <p className="mt-4 text-xs text-zinc-400 text-center leading-5">
            By subscribing, you authorize keySkillset to charge ₹{plan.price}/month
            until you cancel. Cancel anytime from your profile.
          </p>

          {/* Stripe branding */}
          <div className="mt-3 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-zinc-400" />
            <span className="text-xs text-zinc-400">Secured by </span>
            <span className="text-xs font-bold text-zinc-600">stripe</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// -------------------------------------------------------
// Page export — Suspense required for useSearchParams
// -------------------------------------------------------

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="min-h-screen bg-zinc-50" />}>
        <CheckoutContent />
      </Suspense>
    </AuthGuard>
  );
}
