import type { ActivePlanInfo } from '@/types'

export type DemoUser = {
  id: string
  email: string
  display_name: string
  subscription_tier: 'free' | 'basic' | 'professional' | 'premium'
  subscription_status: string
  user_onboarded: boolean
  selected_exams: string[]
  goal: string
  xp: number
  streak: number
  role: string
  active_plan_info?: ActivePlanInfo | null
  target_sat_score?: number | null
  target_sat_subject_score?: number | null
  target_neet_score?: number | null
  target_jee_score?: number | null
  target_clat_score?: number | null
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: '9a3b56a5-31f6-4a58-81fa-66157c68d4f0',
    email: 'free@keyskillset.com',
    display_name: 'Free User',
    subscription_tier: 'free',
    subscription_status: 'free',
    user_onboarded: true,
    selected_exams: ['SAT'],
    goal: 'Crack SAT',
    xp: 0,
    streak: 0,
    role: 'student',
  },
  {
    id: 'a0c16137-7fd5-44f5-96e6-60e4617d9230',
    email: 'basic@keyskillset.com',
    display_name: 'Basic User',
    subscription_tier: 'basic',
    subscription_status: 'active',
    user_onboarded: true,
    selected_exams: ['SAT', 'JEE'],
    goal: 'Crack SAT',
    xp: 450,
    streak: 3,
    role: 'student',
    active_plan_info: { scope: 'PLATFORM_WIDE', tier: 'BASIC', category: null },
  },
  {
    id: 'e150d59c-13c1-4db3-b6d7-4f30c29178e9',
    email: 'pro@keyskillset.com',
    display_name: 'Priya Sharma',
    subscription_tier: 'professional',
    subscription_status: 'active',
    user_onboarded: true,
    selected_exams: ['SAT', 'NEET'],
    goal: 'Crack NEET',
    xp: 1250,
    streak: 7,
    role: 'student',
    active_plan_info: { scope: 'PLATFORM_WIDE', tier: 'PRO', category: null },
    target_sat_score: 1500,
  },
  {
    id: '191c894d-b532-4fa8-b1fe-746e5cdcdcc8',
    email: 'premium@keyskillset.com',
    display_name: 'Premium User',
    subscription_tier: 'premium',
    subscription_status: 'active',
    user_onboarded: true,
    selected_exams: ['SAT', 'JEE', 'NEET', 'CLAT'],
    goal: 'Crack IIT-JEE',
    xp: 3200,
    streak: 21,
    role: 'student',
    active_plan_info: { scope: 'PLATFORM_WIDE', tier: 'PREMIUM', category: null },
    target_neet_score: 650,
    target_jee_score: 220,
    target_clat_score: 95,
  },
  // ── Category Plan Demo Users ──────────────────────────────────────────────
  {
    id: 'c1a2e3b4-5f6a-7b8c-9d0e-f1a2b3c4d5e6',
    email: 'neet@keyskillset.com',
    display_name: 'Ananya Krishnan',
    subscription_tier: 'free',
    subscription_status: 'free',
    user_onboarded: true,
    selected_exams: ['NEET'],
    goal: 'Crack NEET',
    xp: 0,
    streak: 0,
    role: 'student',
    active_plan_info: { scope: 'CATEGORY_BUNDLE', tier: 'BASIC', category: 'NEET' },
  },
  {
    id: 'd2b3f4c5-6a7b-8c9d-0e1f-a2b3c4d5e6f7',
    email: 'jee@keyskillset.com',
    display_name: 'Rohan Mehta',
    subscription_tier: 'free',
    subscription_status: 'free',
    user_onboarded: true,
    selected_exams: ['JEE'],
    goal: 'Crack JEE',
    xp: 0,
    streak: 0,
    role: 'student',
    active_plan_info: { scope: 'CATEGORY_BUNDLE', tier: 'BASIC', category: 'JEE' },
  },
  {
    id: 'e3c4a5d6-7b8c-9d0e-1f2a-b3c4d5e6f7a8',
    email: 'clat@keyskillset.com',
    display_name: 'Preethi Nair',
    subscription_tier: 'free',
    subscription_status: 'free',
    user_onboarded: true,
    selected_exams: ['CLAT'],
    goal: 'Crack CLAT',
    xp: 0,
    streak: 0,
    role: 'student',
    active_plan_info: { scope: 'CATEGORY_BUNDLE', tier: 'BASIC', category: 'CLAT' },
  },
]

export const STORAGE_KEY = 'kss_active_persona'
