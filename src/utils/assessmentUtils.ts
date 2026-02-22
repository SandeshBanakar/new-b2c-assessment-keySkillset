import type {
  Assessment,
  AssessmentType,
  CardStatus,
  MockUser,
  Tier,
  UserAssessmentProgress,
} from '@/types';

// -------------------------------------------------------
// Tier access check
// Source: domain-rules.md § 1 + § 6
// -------------------------------------------------------

function canAccess(type: AssessmentType, userTier: Tier): boolean {
  switch (type) {
    case 'daily-quiz':
      return true;
    case 'full-test':
      return userTier === 'basic' || userTier === 'professional' || userTier === 'premium';
    case 'subject-test':
      return userTier === 'professional' || userTier === 'premium';
    case 'chapter-test':
      return userTier === 'premium';
  }
}

// -------------------------------------------------------
// getCardStatus() — exact logic from domain-rules.md § 6
// Decision order:
//   1. No tier access              → 'locked'
//   2. attemptsUsed === 0          → 'start'
//   3. 0 < attemptsUsed < 5        → 'continue'
//   4. attemptsUsed === 5          → 'upgrade'
// -------------------------------------------------------

export function getCardStatus(
  assessment: Assessment,
  progress: UserAssessmentProgress | null,
  userTier: Tier,
): CardStatus {
  if (!canAccess(assessment.type, userTier)) return 'locked';

  const attemptsUsed = progress?.attemptsUsed ?? 0;

  if (attemptsUsed === 0) return 'start';
  if (attemptsUsed < 5) return 'continue';
  return 'upgrade';
}

// -------------------------------------------------------
// Mock assessments — 8 total, 2 per exam (Full Test + Subject Test)
// Durations and question counts from domain-rules.md § 3
// -------------------------------------------------------

export const mockAssessments: Assessment[] = [
  // SAT ─────────────────────────────────────────────────
  {
    id: 'sat-full-1',
    title: 'SAT Full Test 1',
    exam: 'SAT',
    type: 'full-test',
    subject: null,
    difficulty: 'hard',
    questionCount: 98,
    duration: 134,
    tier: 'basic',
    isPuzzleMode: false,
  },
  {
    id: 'sat-subject-math-1',
    title: 'SAT Math — Subject Test',
    exam: 'SAT',
    type: 'subject-test',
    subject: 'Math',
    difficulty: 'medium',
    questionCount: 50,
    duration: 75,
    tier: 'professional',
    isPuzzleMode: false,
  },

  // JEE ─────────────────────────────────────────────────
  {
    id: 'jee-full-1',
    title: 'JEE Full Test 1',
    exam: 'JEE',
    type: 'full-test',
    subject: null,
    difficulty: 'hard',
    questionCount: 90,
    duration: 180,
    tier: 'basic',
    isPuzzleMode: false,
  },
  {
    id: 'jee-subject-physics-1',
    title: 'JEE Physics — Subject Test',
    exam: 'JEE',
    type: 'subject-test',
    subject: 'Physics',
    difficulty: 'hard',
    questionCount: 45,
    duration: 60,
    tier: 'professional',
    isPuzzleMode: false,
  },

  // NEET ────────────────────────────────────────────────
  {
    id: 'neet-full-1',
    title: 'NEET Full Test 1',
    exam: 'NEET',
    type: 'full-test',
    subject: null,
    difficulty: 'medium',
    questionCount: 180,
    duration: 200,
    tier: 'basic',
    isPuzzleMode: false,
  },
  {
    id: 'neet-subject-biology-1',
    title: 'NEET Biology — Subject Test',
    exam: 'NEET',
    type: 'subject-test',
    subject: 'Biology',
    difficulty: 'easy',
    questionCount: 60,
    duration: 90,
    tier: 'professional',
    isPuzzleMode: false,
  },

  // PMP ─────────────────────────────────────────────────
  {
    id: 'pmp-full-1',
    title: 'PMP Full Test 1',
    exam: 'PMP',
    type: 'full-test',
    subject: null,
    difficulty: 'medium',
    questionCount: 180,
    duration: 230,
    tier: 'basic',
    isPuzzleMode: false,
  },
  {
    id: 'pmp-subject-planning-1',
    title: 'PMP Planning — Subject Test',
    exam: 'PMP',
    type: 'subject-test',
    subject: 'Planning',
    difficulty: 'easy',
    questionCount: 40,
    duration: 60,
    tier: 'professional',
    isPuzzleMode: false,
  },
];

// -------------------------------------------------------
// Mock user — Professional tier
// -------------------------------------------------------

export const mockUser: MockUser = {
  id: 'user-1',
  name: 'Priya Sharma',
  email: 'priya@example.com',
  tier: 'professional',
  xp: 1250,
  streak: 7,
  selectedExam: 'SAT',
  onboardingComplete: true,
};

// -------------------------------------------------------
// Mock progress — varied states to demonstrate all statuses
//   sat-full-1          → 2 attempts used  → 'continue'
//   jee-full-1          → 5 attempts used  → 'upgrade'
//   neet-subject-bio-1  → 1 attempt used   → 'continue'
//   all others          → no progress      → 'start'
// -------------------------------------------------------

export const mockProgressMap: Record<string, UserAssessmentProgress> = {
  'sat-full-1': {
    userId: 'user-1',
    assessmentId: 'sat-full-1',
    attemptsUsed: 2,
    attemptsMax: 5,
    isPaid: true,
    lastScore: 72,
    masteryPercent: 68,
  },
  'jee-full-1': {
    userId: 'user-1',
    assessmentId: 'jee-full-1',
    attemptsUsed: 5,
    attemptsMax: 5,
    isPaid: true,
    lastScore: 65,
    masteryPercent: 60,
  },
  'neet-subject-biology-1': {
    userId: 'user-1',
    assessmentId: 'neet-subject-biology-1',
    attemptsUsed: 1,
    attemptsMax: 5,
    isPaid: false,
    lastScore: 88,
    masteryPercent: 85,
  },
};
