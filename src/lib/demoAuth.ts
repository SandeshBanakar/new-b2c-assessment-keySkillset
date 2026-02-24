/**
 * Demo authentication bypass.
 *
 * Root cause of DB approach failing: Supabase RLS blocks anonymous reads from
 * public.users, so fetching the profile after a credential-only bypass returns null.
 *
 * Solution: embed the demo profiles here. No DB query needed for demo login.
 * The profiles mirror what was inserted into public.users via SQL.
 *
 * Remove this file once real Supabase auth (email confirmation disabled) is confirmed.
 */

import type { User } from '@/types';

export const DEMO_PASSWORD = 'Demo@1234';
export const DEMO_SESSION_KEY = 'kss_demo_uid';

const DEMO_USERS: User[] = [
  {
    id: '9a3b56a5-31f6-4a58-81fa-66157c68d4f0',
    email: 'free@keyskillset.com',
    displayName: 'Free User',
    subscriptionTier: 'free',
    subscriptionStatus: 'free',
    subscriptionStartDate: null,
    subscriptionEndDate: null,
    razorpaySubscriptionId: null,
    razorpayPlanId: null,
    razorpayCustomerId: null,
    userOnboarded: true,
    selectedExams: ['SAT'],
    goal: 'Crack SAT',
    xp: 0,
    streak: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'a0c16137-7fd5-44f5-96e6-60e4617d9230',
    email: 'basic@keyskillset.com',
    displayName: 'Basic User',
    subscriptionTier: 'basic',
    subscriptionStatus: 'active',
    subscriptionStartDate: null,
    subscriptionEndDate: null,
    razorpaySubscriptionId: null,
    razorpayPlanId: null,
    razorpayCustomerId: null,
    userOnboarded: true,
    selectedExams: ['SAT', 'JEE'],
    goal: 'Crack SAT',
    xp: 450,
    streak: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'e150d59c-13c1-4db3-b6d7-4f30c29178e9',
    email: 'pro@keyskillset.com',
    displayName: 'Priya Sharma',
    subscriptionTier: 'professional',
    subscriptionStatus: 'active',
    subscriptionStartDate: null,
    subscriptionEndDate: null,
    razorpaySubscriptionId: null,
    razorpayPlanId: null,
    razorpayCustomerId: null,
    userOnboarded: true,
    selectedExams: ['SAT', 'NEET'],
    goal: 'Crack NEET',
    xp: 1250,
    streak: 7,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '191c894d-b532-4fa8-b1fe-746e5cdcdcc8',
    email: 'premium@keyskillset.com',
    displayName: 'Premium User',
    subscriptionTier: 'premium',
    subscriptionStatus: 'active',
    subscriptionStartDate: null,
    subscriptionEndDate: null,
    razorpaySubscriptionId: null,
    razorpayPlanId: null,
    razorpayCustomerId: null,
    userOnboarded: true,
    selectedExams: ['JEE', 'NEET'],
    goal: 'Crack IIT-JEE',
    xp: 3200,
    streak: 21,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const BY_EMAIL: Record<string, User> = Object.fromEntries(
  DEMO_USERS.map((u) => [u.email, u])
);

const BY_ID: Record<string, User> = Object.fromEntries(
  DEMO_USERS.map((u) => [u.id, u])
);

export function isDemoCredential(email: string, password: string): boolean {
  return password === DEMO_PASSWORD && email.toLowerCase() in BY_EMAIL;
}

/** Returns the full embedded User profile — no DB query needed. */
export function getDemoUserByEmail(email: string): User | null {
  return BY_EMAIL[email.toLowerCase()] ?? null;
}

/** Used by AppContext to rehydrate demo session from localStorage. */
export function getDemoUserById(id: string): User | null {
  return BY_ID[id] ?? null;
}
