'use client';

import { useRouter } from 'next/navigation';
import { Lock, Star, Zap, Trophy, Shield, Building2, Briefcase, PenTool, FlaskConical, Atom, Scale, Mail, GraduationCap, LogIn, UserPlus, AlertTriangle } from 'lucide-react';
import { DEMO_USERS } from '@/data/demoUsers';
import { useAppContext } from '@/context/AppContext';
import type { DemoUser } from '@/data/demoUsers';
import PageWrapper from '@/components/layout/PageWrapper';
import ContinueLearningWidget from '@/components/dashboard/ContinueLearningWidget';
import TodayQuestCard from '@/components/shared/TodayQuestCard';
import QuestWorldMap from '@/components/gamification/QuestWorldMap';
import StreakCounter from '@/components/shared/StreakCounter';
import { AuthGuard } from '@/components/shared/AuthGuard';

// -------------------------------------------------------
// Persona Selector — pre-auth chooser
// -------------------------------------------------------

const TIER_AVATAR_BG: Record<DemoUser['subscription_tier'], string> = {
  free:         'bg-zinc-600',
  basic:        'bg-blue-700',
  professional: 'bg-blue-700',
  premium:      'bg-amber-600',
};

const TIER_BADGE_CLASSES: Record<DemoUser['subscription_tier'], string> = {
  free:         'bg-zinc-700 text-zinc-300',
  basic:        'bg-blue-900 text-blue-300',
  professional: 'bg-blue-900 text-blue-300',
  premium:      'bg-amber-900 text-amber-300',
};

const TIER_ICONS: Record<DemoUser['subscription_tier'], React.ElementType> = {
  free:         Lock,
  basic:        Star,
  professional: Zap,
  premium:      Trophy,
};

function PersonaSelector() {
  const router = useRouter();
  const { switchPersona } = useAppContext();

  function handleSelect(userId: string) {
    switchPersona(userId);
    router.push('/assessments');
  }

  function handleAdminSelect(path: string) {
    router.push(path);
  }

  return (
    <div className="bg-zinc-950 min-h-screen flex flex-col items-center justify-center gap-10">
      <h1 className="text-3xl font-semibold text-white text-center">
        Who&apos;s learning today?
      </h1>

      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide text-center">
        Admin Access
      </p>

      <div className="flex items-center justify-center gap-6">
        <div
          onClick={() => handleAdminSelect('/super-admin')}
          className="cursor-pointer group flex flex-col items-center gap-3"
        >
          <div className="w-24 h-24 rounded-md flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 bg-blue-700">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">
            Super Admin
          </span>
          <span className="text-xs rounded-md px-2.5 py-0.5 font-medium bg-blue-900 text-blue-300">
            SUPER_ADMIN
          </span>
        </div>

        <div
          onClick={() => handleAdminSelect('/client-admin/akash')}
          className="cursor-pointer group flex flex-col items-center gap-3"
        >
          <div className="w-24 h-24 rounded-md flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 bg-violet-700">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">
            Akash Institute
          </span>
          <span className="text-xs rounded-md px-2.5 py-0.5 font-medium bg-violet-900 text-violet-300">
            CLIENT_ADMIN
          </span>
        </div>

        <div
          onClick={() => handleAdminSelect('/client-admin/techcorp')}
          className="cursor-pointer group flex flex-col items-center gap-3"
        >
          <div className="w-24 h-24 rounded-md flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 bg-teal-700">
            <Briefcase className="w-10 h-10 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">
            TechCorp India
          </span>
          <span className="text-xs rounded-md px-2.5 py-0.5 font-medium bg-teal-900 text-teal-300">
            CLIENT_ADMIN
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full max-w-lg mx-auto">
        <div className="flex-1 h-px bg-zinc-800" />
        <p className="text-xs text-zinc-600 whitespace-nowrap">B2B Learner Portals</p>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <div className="flex items-center justify-center gap-6">
        <div
          onClick={() => handleAdminSelect('/b2b-learner/akash/login')}
          className="cursor-pointer group flex flex-col items-center gap-3"
        >
          <div className="w-24 h-24 rounded-md flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 bg-violet-700">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">
            Akash Learner
          </span>
          <span className="text-xs rounded-md px-2.5 py-0.5 font-medium bg-violet-900 text-violet-300">
            B2B_LEARNER
          </span>
        </div>

        <div
          onClick={() => handleAdminSelect('/b2b-learner/techcorp/login')}
          className="cursor-pointer group flex flex-col items-center gap-3"
        >
          <div className="w-24 h-24 rounded-md flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 bg-teal-700">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">
            TechCorp Learner
          </span>
          <span className="text-xs rounded-md px-2.5 py-0.5 font-medium bg-teal-900 text-teal-300">
            B2B_LEARNER
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full max-w-lg mx-auto">
        <div className="flex-1 h-px bg-zinc-800" />
        <p className="text-xs text-zinc-600 whitespace-nowrap">Email Templates</p>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <div className="grid grid-cols-2 gap-6 sm:gap-8">
        <div
          onClick={() => handleAdminSelect('/email-templates')}
          className="cursor-pointer group flex flex-col items-center gap-3"
        >
          <div className="w-24 h-24 rounded-md flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 bg-rose-700">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">
            Client Admin Emails
          </span>
          <span className="text-xs rounded-md px-2.5 py-0.5 font-medium bg-rose-900 text-rose-300">
            QA PERSONA
          </span>
        </div>
        <div
          onClick={() => handleAdminSelect('/email-templates/keyskillset')}
          className="cursor-pointer group flex flex-col items-center gap-3"
        >
          <div className="w-24 h-24 rounded-md flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 bg-blue-700">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">
            B2C End User Emails
          </span>
          <span className="text-xs rounded-md px-2.5 py-0.5 font-medium bg-blue-900 text-blue-300">
            QA PERSONA
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full max-w-lg mx-auto">
        <div className="flex-1 h-px bg-zinc-800" />
        <p className="text-xs text-zinc-600 whitespace-nowrap">Auth Screens</p>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
        <div
          onClick={() => handleAdminSelect('/signup')}
          className="cursor-pointer group flex flex-col items-center gap-3"
        >
          <div className="w-24 h-24 rounded-md flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 bg-green-700">
            <UserPlus className="w-10 h-10 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">B2C Sign Up</span>
          <span className="text-xs rounded-md px-2.5 py-0.5 font-medium bg-green-900 text-green-300">AUTH_SCREEN</span>
        </div>
        <div
          onClick={() => handleAdminSelect('/login')}
          className="cursor-pointer group flex flex-col items-center gap-3"
        >
          <div className="w-24 h-24 rounded-md flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 bg-blue-700">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">B2C Login</span>
          <span className="text-xs rounded-md px-2.5 py-0.5 font-medium bg-blue-900 text-blue-300">AUTH_SCREEN</span>
        </div>
        <div
          onClick={() => handleAdminSelect('/login?state=suspended&reason=Your+account+was+flagged+for+suspicious+activity.')}
          className="cursor-pointer group flex flex-col items-center gap-3"
        >
          <div className="w-24 h-24 rounded-md flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 bg-rose-700">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">Login — Suspended</span>
          <span className="text-xs rounded-md px-2.5 py-0.5 font-medium bg-rose-900 text-rose-300">SUSPENDED</span>
        </div>
        <div
          onClick={() => handleAdminSelect('/client-admin/login')}
          className="cursor-pointer group flex flex-col items-center gap-3"
        >
          <div className="w-24 h-24 rounded-md flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 bg-violet-700">
            <LogIn className="w-10 h-10 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">CA Login</span>
          <span className="text-xs rounded-md px-2.5 py-0.5 font-medium bg-violet-900 text-violet-300">AUTH_SCREEN</span>
        </div>
        <div
          onClick={() => handleAdminSelect('/client-admin/login?state=deactivated')}
          className="cursor-pointer group flex flex-col items-center gap-3"
        >
          <div className="w-24 h-24 rounded-md flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 bg-amber-700">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">CA Login — Deactivated</span>
          <span className="text-xs rounded-md px-2.5 py-0.5 font-medium bg-amber-900 text-amber-300">DEACTIVATED</span>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full max-w-lg mx-auto">
        <div className="flex-1 h-px bg-zinc-800" />
        <p className="text-xs text-zinc-600 whitespace-nowrap">Content Creator Personas</p>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-3 opacity-60 cursor-not-allowed select-none">
          <div className="w-24 h-24 rounded-md flex items-center justify-center ring-2 ring-transparent bg-amber-700">
            <PenTool className="w-10 h-10 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-300 text-center">
            Akash Content Creator
          </span>
          <span className="text-xs rounded-md px-2.5 py-0.5 font-medium bg-amber-900 text-amber-300">
            Coming Soon
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 w-full max-w-lg mx-auto">
        <div className="flex-1 h-px bg-zinc-800" />
        <p className="text-xs text-zinc-600 whitespace-nowrap">Learner Personas</p>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
        {DEMO_USERS.filter((u) => !u.active_plan_info || u.active_plan_info.scope === 'PLATFORM_WIDE').map((persona) => {
          const Icon = TIER_ICONS[persona.subscription_tier];
          return (
            <div
              key={persona.id}
              onClick={() => handleSelect(persona.id)}
              className="cursor-pointer group flex flex-col items-center gap-3"
            >
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 ${TIER_AVATAR_BG[persona.subscription_tier]}`}
              >
                <Icon className="w-10 h-10 text-white" />
              </div>

              <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">
                {persona.display_name}
              </span>

              <span
                className={`text-xs rounded-full px-2.5 py-0.5 font-medium capitalize ${TIER_BADGE_CLASSES[persona.subscription_tier]}`}
              >
                {persona.subscription_tier}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 w-full max-w-lg mx-auto">
        <div className="flex-1 h-px bg-zinc-800" />
        <p className="text-xs text-zinc-600 whitespace-nowrap">Category Plan Learners</p>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8">
        {DEMO_USERS.filter((u) => u.active_plan_info?.scope === 'CATEGORY_BUNDLE').map((persona) => {
          const category = persona.active_plan_info?.category ?? '';
          const tier = persona.active_plan_info?.tier ?? '';
          const Icon = category === 'NEET' ? FlaskConical : category === 'JEE' ? Atom : Scale;
          const avatarBg = category === 'NEET' ? 'bg-green-700' : category === 'JEE' ? 'bg-orange-700' : 'bg-purple-700';
          const badgeBg = category === 'NEET' ? 'bg-green-900 text-green-300' : category === 'JEE' ? 'bg-orange-900 text-orange-300' : 'bg-purple-900 text-purple-300';
          return (
            <div
              key={persona.id}
              onClick={() => handleSelect(persona.id)}
              className="cursor-pointer group flex flex-col items-center gap-3"
            >
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center ring-2 ring-transparent group-hover:ring-white group-hover:ring-offset-2 group-hover:ring-offset-zinc-950 group-hover:scale-105 transition duration-150 ${avatarBg}`}
              >
                <Icon className="w-10 h-10 text-white" />
              </div>

              <span className="text-sm font-medium text-zinc-300 group-hover:text-white text-center">
                {persona.display_name}
              </span>

              <span className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${badgeBg}`}>
                {category}·{tier}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-zinc-600 text-center mt-4">
        Demo mode — select a persona to explore
      </p>
    </div>
  );
}

// -------------------------------------------------------
// Dashboard — shown when a persona is active
// -------------------------------------------------------

function Dashboard() {
  return (
    <AuthGuard>
      <PageWrapper>
        <ContinueLearningWidget />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div data-tour="daily-quiz">
            <TodayQuestCard />
          </div>
          <div data-tour="quest-preview">
            <QuestWorldMap />
          </div>
          <div data-tour="stats-bar">
            <StreakCounter />
          </div>
        </div>
      </PageWrapper>
    </AuthGuard>
  );
}

// -------------------------------------------------------
// Root page — conditional on auth state
// -------------------------------------------------------

export default function RootPage() {
  const { user } = useAppContext();
  return user ? <Dashboard /> : <PersonaSelector />;
}
