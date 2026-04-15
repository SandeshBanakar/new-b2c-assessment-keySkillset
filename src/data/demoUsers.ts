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
  },
]

export const STORAGE_KEY = 'kss_active_persona'
