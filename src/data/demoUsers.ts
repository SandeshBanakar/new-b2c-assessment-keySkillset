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
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-free',
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
    id: 'demo-basic',
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
  },
  {
    id: 'demo-pro',
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
  },
  {
    id: 'demo-premium',
    email: 'premium@keyskillset.com',
    display_name: 'Premium User',
    subscription_tier: 'premium',
    subscription_status: 'active',
    user_onboarded: true,
    selected_exams: ['JEE', 'NEET'],
    goal: 'Crack IIT-JEE',
    xp: 3200,
    streak: 21,
    role: 'student',
  },
]

export const STORAGE_KEY = 'kss_active_persona'
