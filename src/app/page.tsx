'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageWrapper from '@/components/layout/PageWrapper';
import WelcomeTour from '@/components/shared/WelcomeTour';
import { useAppContext } from '@/context/AppContext';
import { getLevelName } from '@/utils/xp';
import type { Exam } from '@/types';

// -------------------------------------------------------
// Mock recent activity — last 3 attempts
// -------------------------------------------------------

type RecentAttempt = {
  id: string;
  assessmentTitle: string;
  score: number;
  date: string;
  exam: Exam;
};

const RECENT_ACTIVITY: RecentAttempt[] = [
  {
    id: 'sat-full-1',
    assessmentTitle: 'SAT Full Test 1',
    score: 72,
    date: '2 days ago',
    exam: 'SAT',
  },
  {
    id: 'jee-subject-physics-1',
    assessmentTitle: 'JEE Physics — Subject Test',
    score: 65,
    date: '5 days ago',
    exam: 'JEE',
  },
  {
    id: 'neet-subject-biology-1',
    assessmentTitle: 'NEET Biology — Subject Test',
    score: 88,
    date: '1 week ago',
    exam: 'NEET',
  },
];

const EXAM_BADGE_COLORS: Record<Exam, string> = {
  SAT:  'bg-violet-100 text-violet-700',
  JEE:  'bg-amber-100 text-amber-700',
  NEET: 'bg-emerald-100 text-emerald-700',
  PMP:  'bg-blue-100 text-blue-700',
};

// Mock: user hasn't played today — swap to true to test "played" state
const HAS_PLAYED_TODAY = false;

// -------------------------------------------------------

export default function DashboardPage() {
  const { user } = useAppContext();

  const primaryExam = user.selectedExams[0] ?? 'SAT';
  const isFree = user.subscriptionTier === 'free';
  const levelName = getLevelName(user.xp);
  const firstName = user.displayName?.split(' ')[0] ?? null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <PageWrapper>

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">
            Welcome back{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Here&apos;s your dashboard for today.</p>
        </div>

        {/* 2-col grid on desktop, 1-col on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* ── Widget 1 — Today's Daily Quiz ── */}
          <Card
            data-tour="daily-quiz"
            className="bg-white border border-zinc-200 rounded-2xl"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900">Today&apos;s Daily Quiz</h2>
                <span className="text-xs font-medium text-amber-500 bg-amber-50 px-2 py-1 rounded-full">
                  Day {user.streak} 🔥
                </span>
              </div>
              <p className="text-sm text-zinc-500">{primaryExam}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-600">6 questions · ~5 min</p>
              {HAS_PLAYED_TODAY ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-emerald-500">Played today ✓</p>
                  <p className="text-xs text-zinc-400">Come back tomorrow</p>
                </div>
              ) : (
                <Button
                  asChild
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
                >
                  <Link href="/quiz/daily">Play Now →</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* ── Widget 2 — Quest Map Preview ── */}
          <Card
            data-tour="quest-preview"
            className="bg-white border border-zinc-200 rounded-2xl"
          >
            <CardHeader className="pb-2">
              <h2 className="text-lg font-semibold text-zinc-900">Your Learning Path</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 3 locked node previews */}
              <div className="flex items-center gap-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 border-2 border-zinc-300 flex items-center justify-center text-zinc-400 text-sm">
                      🔒
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-400 text-center">Unlock your full quest map</p>
              {isFree ? (
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-xl border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                >
                  <Link href="/plans">Compare Plans →</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
                >
                  <Link href="/quest">Continue Quest →</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* ── Widget 3 — Stats Bar ── */}
          <Card
            data-tour="stats-bar"
            className="bg-white border border-zinc-200 rounded-2xl"
          >
            <CardHeader className="pb-2">
              <h2 className="text-lg font-semibold text-zinc-900">Your Stats</h2>
            </CardHeader>
            <CardContent>
              {isFree ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">XP</span>
                    <span className="text-sm text-zinc-300">— pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Level</span>
                    <span className="text-sm text-zinc-300">—</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600">Streak</span>
                    <span className="text-sm font-medium text-amber-500">{user.streak} days</span>
                  </div>
                  <p className="text-xs text-zinc-400 pt-1">
                    <Link href="/plans" className="text-violet-600 hover:underline">
                      Unlock with any plan
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600">XP</span>
                    <span className="text-sm font-semibold text-amber-500">{user.xp} pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600">Level</span>
                    <span className="text-sm font-semibold text-violet-600">{levelName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600">Streak</span>
                    <span className="text-sm font-medium text-amber-500">{user.streak} days</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Widget 4 — Recent Activity ── */}
          <Card className="bg-white border border-zinc-200 rounded-2xl">
            <CardHeader className="pb-2">
              <h2 className="text-lg font-semibold text-zinc-900">Recent Activity</h2>
            </CardHeader>
            <CardContent>
              {RECENT_ACTIVITY.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-zinc-500">
                    No activity yet.{' '}
                    <Link href="/quiz/daily" className="text-violet-600 hover:underline">
                      Start your first Daily Quiz →
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {RECENT_ACTIVITY.map((item) => (
                    <Link
                      key={item.id}
                      href={`/assessments/${item.id}`}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 -mx-2 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${EXAM_BADGE_COLORS[item.exam]}`}
                        >
                          {item.exam}
                        </span>
                        <span className="text-sm text-zinc-700 truncate">
                          {item.assessmentTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span
                          className={`text-sm font-semibold ${
                            item.score >= 70
                              ? 'text-emerald-500'
                              : item.score >= 40
                              ? 'text-orange-400'
                              : 'text-rose-500'
                          }`}
                        >
                          {item.score}%
                        </span>
                        <span className="text-xs text-zinc-400">{item.date}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </PageWrapper>

      {/* Welcome tour — shows only when userOnboarded === false */}
      {!user.userOnboarded && <WelcomeTour />}
    </div>
  );
}
