// Mock attempt data layer — keyed by assessment title (string)
// since demo does not use real Supabase UUIDs.
// User IDs match demoUsers.ts: demo-free, demo-basic, demo-pro, demo-premium

export interface MockAttemptData {
  attemptsUsed: number;
  status: 'not_started' | 'inprogress' | 'completed';
  isFreeAttempt: boolean;
  lastAccessedAt: number | null;
  score?: number;
}

export type MockAttemptMap = Record<string, MockAttemptData>;

export const DEMO_ATTEMPTS: Record<string, MockAttemptMap> = {
  'demo-basic': {
    'SAT Full Test 1': {
      attemptsUsed: 2,
      status: 'inprogress',
      isFreeAttempt: false,
      lastAccessedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    },
  },
  'demo-pro': {
    'SAT Full Test 1': {
      attemptsUsed: 2,
      status: 'inprogress',
      isFreeAttempt: false,
      lastAccessedAt: Date.now() - 2 * 60 * 60 * 1000,
    },
    'NEET Subject Test — Physics': {
      attemptsUsed: 1,
      status: 'completed',
      isFreeAttempt: false,
      lastAccessedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      score: 280,
    },
  },
  'demo-premium': {
    'JEE Full Test 1': {
      attemptsUsed: 3,
      status: 'completed',
      isFreeAttempt: false,
      lastAccessedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      score: 210,
    },
    'SAT Math — Subject Test': {
      attemptsUsed: 1,
      status: 'inprogress',
      isFreeAttempt: false,
      lastAccessedAt: Date.now() - 5 * 60 * 60 * 1000,
    },
    'SAT Chapter Test — Algebra': {
      attemptsUsed: 0,
      status: 'not_started',
      isFreeAttempt: false,
      lastAccessedAt: null,
    },
  },
  'demo-free': {
    'SAT Full Test 1': {
      attemptsUsed: 1,
      status: 'inprogress',
      isFreeAttempt: true,
      lastAccessedAt: Date.now() - 30 * 60 * 1000,
    },
  },
};

export function getAttemptData(
  userId: string,
  assessmentTitle: string,
): MockAttemptData {
  return (
    DEMO_ATTEMPTS[userId]?.[assessmentTitle] ?? {
      attemptsUsed: 0,
      status: 'not_started',
      isFreeAttempt: false,
      lastAccessedAt: null,
    }
  );
}
