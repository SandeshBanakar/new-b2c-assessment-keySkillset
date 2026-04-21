import type {
  ExplanationData,
  MockAttempt,
  MockQuestion,
  QuestionAttemptResult,
  SyllabusSection,
} from '@/types';
import { SupabaseAssessment } from '@/types/assessment'

// -------------------------------------------------------
// Supabase/Local Assessment Data
// -------------------------------------------------------

function mockCat(name: string, displayName: string, displayOrder: number) {
  return {
    exam_category_id: null as string | null,
    exam_categories: { name, display_name: displayName, display_order: displayOrder, is_active: true },
  }
}

export const ASSESSMENTS: SupabaseAssessment[] = [
  // ── SAT FULL TESTS ──
  {
    id: 'sat-full-1',
    title: 'SAT Full Test 1',
    description: 'Complete SAT simulation with adaptive modules',
    ...mockCat('SAT', 'SAT', 5),
    assessment_type: 'full_test',
    subject: 'All Subjects',
    difficulty: 'Medium',
    duration_minutes: 200,
    total_questions: 98,
    score_min: 400,
    score_max: 1600,
    min_tier: 'basic',
    is_active: true,
    thumbnail_url: null,
    tags: ['sat', 'full-test'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'sat-full-2',
    title: 'SAT Full Test 2',
    description: 'Full-length SAT practice with score prediction',
    ...mockCat('SAT', 'SAT', 5),
    assessment_type: 'full_test',
    subject: 'All Subjects',
    difficulty: 'Hard',
    duration_minutes: 200,
    total_questions: 98,
    score_min: 400,
    score_max: 1600,
    min_tier: 'basic',
    is_active: true,
    thumbnail_url: null,
    tags: ['sat', 'full-test'],
    created_at: new Date().toISOString(),
  },
  // ── JEE FULL TESTS ──
  {
    id: 'jee-full-1',
    title: 'JEE Full Test 1',
    description: 'Complete JEE Main simulation paper',
    ...mockCat('JEE', 'JEE Mains', 3),
    assessment_type: 'full_test',
    subject: 'All Subjects',
    difficulty: 'Hard',
    duration_minutes: 180,
    total_questions: 90,
    score_min: 0,
    score_max: 300,
    min_tier: 'basic',
    is_active: true,
    thumbnail_url: null,
    tags: ['jee', 'full-test'],
    created_at: new Date().toISOString(),
  },
  // ── CLAT FULL TESTS ──
  {
    id: 'clat-full-test-1',
    title: 'CLAT Full Mock Test 1',
    description: 'Complete CLAT mock test covering all 5 sections — English Language, Current Affairs & GK, Legal Reasoning, Logical Reasoning, and Quantitative Techniques.',
    ...mockCat('CLAT', 'CLAT UG', 2),
    assessment_type: 'full_test',
    subject: 'All Subjects',
    difficulty: 'Medium',
    duration_minutes: 120,
    total_questions: 140,
    score_min: -35,
    score_max: 140,
    min_tier: 'basic',
    is_active: true,
    thumbnail_url: null,
    tags: ['clat', 'full-test'],
    created_at: new Date().toISOString(),
  },
  // ── NEET FULL TESTS ──
  {
    id: 'neet-full-test-1',
    title: 'NEET Full Mock Test 1',
    description: 'Full NEET mock test with Physics (45Q), Chemistry (45Q), and Biology (90Q) following the latest NTA pattern.',
    ...mockCat('NEET', 'NEET UG', 4),
    assessment_type: 'full_test',
    subject: 'All Subjects',
    difficulty: 'Hard',
    duration_minutes: 200,
    total_questions: 180,
    score_min: -180,
    score_max: 720,
    min_tier: 'basic',
    is_active: true,
    thumbnail_url: null,
    tags: ['neet', 'full-test'],
    created_at: new Date().toISOString(),
  },
  // ── PMP FULL TESTS ──
  {
    id: 'pmp-full-1',
    title: 'PMP Full Test 1',
    description: 'Full PMP certification mock exam',
    ...mockCat('PMP', 'PMP', 7),
    assessment_type: 'full_test',
    subject: 'All Subjects',
    difficulty: 'Hard',
    duration_minutes: 230,
    total_questions: 180,
    score_min: 0,
    score_max: 100,
    min_tier: 'basic',
    is_active: true,
    thumbnail_url: null,
    tags: ['pmp', 'full-test'],
    created_at: new Date().toISOString(),
  },
  // ── SAT SUBJECT TESTS ──
  {
    id: 'sat-subject-rw',
    title: 'SAT Reading & Writing',
    description: 'Focused subject test for SAT verbal section',
    ...mockCat('SAT', 'SAT', 5),
    assessment_type: 'subject_test',
    subject: 'Reading & Writing',
    difficulty: 'Medium',
    duration_minutes: 64,
    total_questions: 54,
    score_min: 200,
    score_max: 800,
    min_tier: 'professional',
    is_active: true,
    thumbnail_url: null,
    tags: ['sat', 'subject-test', 'reading', 'writing'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'sat-subject-math',
    title: 'SAT Math',
    description: 'Focused subject test for SAT math section',
    ...mockCat('SAT', 'SAT', 5),
    assessment_type: 'subject_test',
    subject: 'Math',
    difficulty: 'Medium',
    duration_minutes: 70,
    total_questions: 44,
    score_min: 200,
    score_max: 800,
    min_tier: 'professional',
    is_active: true,
    thumbnail_url: null,
    tags: ['sat', 'subject-test', 'math'],
    created_at: new Date().toISOString(),
  },
  // ── NEET SUBJECT TESTS ──
  {
    id: 'neet-subject-biology',
    title: 'NEET Biology',
    description: 'Subject test covering full NEET biology syllabus',
    ...mockCat('NEET', 'NEET UG', 4),
    assessment_type: 'subject_test',
    subject: 'Biology',
    difficulty: 'Medium',
    duration_minutes: 60,
    total_questions: 90,
    score_min: 0,
    score_max: 360,
    min_tier: 'professional',
    is_active: true,
    thumbnail_url: null,
    tags: ['neet', 'subject-test', 'biology'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'neet-subject-physics',
    title: 'NEET Physics',
    description: 'Subject test covering NEET physics topics',
    ...mockCat('NEET', 'NEET UG', 4),
    assessment_type: 'subject_test',
    subject: 'Physics',
    difficulty: 'Hard',
    duration_minutes: 60,
    total_questions: 45,
    score_min: -45,
    score_max: 180,
    min_tier: 'professional',
    is_active: true,
    thumbnail_url: null,
    tags: ['neet', 'subject-test', 'physics'],
    created_at: new Date().toISOString(),
  },
  // ── SAT CHAPTER TESTS ──
  {
    id: 'sat-chapter-craft',
    title: 'Craft & Structure',
    description: 'SAT R&W chapter test — Craft & Structure module',
    ...mockCat('SAT', 'SAT', 5),
    assessment_type: 'chapter_test',
    subject: 'Reading & Writing',
    difficulty: 'Easy',
    duration_minutes: 30,
    total_questions: 25,
    score_min: 0,
    score_max: 100,
    min_tier: 'premium',
    is_active: true,
    thumbnail_url: null,
    tags: ['sat', 'chapter-test', 'reading'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'sat-chapter-info',
    title: 'Information & Ideas',
    description: 'SAT R&W chapter test — Information & Ideas module',
    ...mockCat('SAT', 'SAT', 5),
    assessment_type: 'chapter_test',
    subject: 'Reading & Writing',
    difficulty: 'Medium',
    duration_minutes: 30,
    total_questions: 25,
    score_min: 0,
    score_max: 100,
    min_tier: 'premium',
    is_active: true,
    thumbnail_url: null,
    tags: ['sat', 'chapter-test', 'reading'],
    created_at: new Date().toISOString(),
  },
  // ── JEE CHAPTER TESTS ──
  {
    id: 'jee-chapter-mechanics',
    title: 'JEE — Mechanics',
    description: 'Chapter test covering JEE Physics: Mechanics',
    ...mockCat('JEE', 'JEE Mains', 3),
    assessment_type: 'chapter_test',
    subject: 'Physics',
    difficulty: 'Hard',
    duration_minutes: 30,
    total_questions: 25,
    score_min: 0,
    score_max: 100,
    min_tier: 'premium',
    is_active: true,
    thumbnail_url: null,
    tags: ['jee', 'chapter-test', 'physics'],
    created_at: new Date().toISOString(),
  },
]

// -------------------------------------------------------
// Assessment Library — unified data model for list pages
// -------------------------------------------------------

export type LibraryAssessment = {
  id: string;
  title: string;
  exam: 'SAT' | 'JEE' | 'NEET' | 'PMP';
  type: 'full-test' | 'subject-test' | 'chapter-test';
  difficulty: 'easy' | 'medium' | 'hard';
  questions: number;
  durationLabel: string;
  thumbnailUrl: string;
};

export type DemoAttemptState = {
  attemptsUsed: number;
  freeAttemptUsed: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
  lastAccessedAt: number | null;
};

// Which assessments each demo user has subscribed to
export const SUBSCRIBED_ASSESSMENTS: Record<string, string[]> = {
  'demo-free':    [],
  'demo-basic':   ['sat-full-1'],
  'demo-pro':     ['sat-full-1', 'neet-subject-physics'],
  'demo-premium': ['sat-full-1', 'jee-subject-math', 'sat-chapter-algebra'],
};

// Per-user attempt state
export const DEMO_ATTEMPT_STATES: Record<string, Record<string, DemoAttemptState>> = {
  'demo-free': {
    'neet-full-1': { attemptsUsed: 1, freeAttemptUsed: true, status: 'in_progress', lastAccessedAt: null },
    'sat-full-1':  { attemptsUsed: 1, freeAttemptUsed: true, status: 'in_progress', lastAccessedAt: Date.now() - 30 * 60 * 1000 },
  },
  'demo-basic': {
    'sat-full-1':        { attemptsUsed: 2, freeAttemptUsed: true, status: 'in_progress', lastAccessedAt: Date.now() - 1 * 24 * 60 * 60 * 1000 },
    'sat-subject-math-1': { attemptsUsed: 1, freeAttemptUsed: true, status: 'completed',   lastAccessedAt: null },
  },
  'demo-pro': {
    'sat-full-1':          { attemptsUsed: 2, freeAttemptUsed: true,  status: 'in_progress', lastAccessedAt: Date.now() - 2 * 60 * 60 * 1000 },
    'neet-subject-physics': { attemptsUsed: 0, freeAttemptUsed: false, status: 'not_started', lastAccessedAt: null },
  },
  'demo-premium': {
    'sat-full-1':        { attemptsUsed: 2, freeAttemptUsed: true, status: 'in_progress', lastAccessedAt: null },
    'jee-subject-math':  { attemptsUsed: 5, freeAttemptUsed: true, status: 'completed',   lastAccessedAt: Date.now() - 3 * 24 * 60 * 60 * 1000 },
    'sat-chapter-algebra': { attemptsUsed: 1, freeAttemptUsed: true, status: 'completed', lastAccessedAt: null },
  },
};

// Full assessment catalogue — used by both list sections
export const ASSESSMENT_LIBRARY: LibraryAssessment[] = [
  // SAT
  { id: 'sat-full-1',          title: 'SAT Full Test 1',                           exam: 'SAT',  type: 'full-test',    difficulty: 'hard',   questions: 98,  durationLabel: '2h 14m', thumbnailUrl: '/images/full-test-cover.jpg'    },
  { id: 'sat-subject-math-1',  title: 'SAT Math — Subject Test',                   exam: 'SAT',  type: 'subject-test', difficulty: 'medium', questions: 50,  durationLabel: '1h 15m', thumbnailUrl: '/images/subject-test-cover.jpg' },
  { id: 'sat-chapter-algebra', title: 'SAT Chapter Test — Algebra',                exam: 'SAT',  type: 'chapter-test', difficulty: 'medium', questions: 25,  durationLabel: '30m',    thumbnailUrl: '/images/chapter-test-cover.jpg' },
  // JEE
  { id: 'jee-full-1',          title: 'JEE Full Test 1',                           exam: 'JEE',  type: 'full-test',    difficulty: 'hard',   questions: 90,  durationLabel: '3h',     thumbnailUrl: '/images/full-test-cover.jpg'    },
  { id: 'jee-subject-math',    title: 'JEE Subject Test — Mathematics',            exam: 'JEE',  type: 'subject-test', difficulty: 'hard',   questions: 60,  durationLabel: '1h 20m', thumbnailUrl: '/images/subject-test-cover.jpg' },
  { id: 'jee-chapter-calculus',title: 'JEE Chapter Test — Calculus',               exam: 'JEE',  type: 'chapter-test', difficulty: 'hard',   questions: 25,  durationLabel: '30m',    thumbnailUrl: '/images/chapter-test-cover.jpg' },
  // NEET
  { id: 'neet-full-1',         title: 'NEET Full Test 1',                          exam: 'NEET', type: 'full-test',    difficulty: 'medium', questions: 180, durationLabel: '3h 20m', thumbnailUrl: '/images/full-test-cover.jpg'    },
  { id: 'neet-subject-physics',title: 'NEET Subject Test — Physics',               exam: 'NEET', type: 'subject-test', difficulty: 'medium', questions: 45,  durationLabel: '1h',     thumbnailUrl: '/images/subject-test-cover.jpg' },
  { id: 'neet-chapter-bio',    title: 'NEET Chapter Test — Biology Cell Division', exam: 'NEET', type: 'chapter-test', difficulty: 'medium', questions: 25,  durationLabel: '30m',    thumbnailUrl: '/images/chapter-test-cover.jpg' },
  // PMP
  { id: 'pmp-full-1',          title: 'PMP Full Test 1',                           exam: 'PMP',  type: 'full-test',    difficulty: 'medium', questions: 180, durationLabel: '3h 50m', thumbnailUrl: '/images/full-test-cover.jpg'    },
  { id: 'pmp-subject-planning-1', title: 'PMP Planning — Subject Test',            exam: 'PMP',  type: 'subject-test', difficulty: 'easy',   questions: 40,  durationLabel: '1h',     thumbnailUrl: '/images/subject-test-cover.jpg' },
];

// -------------------------------------------------------
// Score ranges per exam (for OverviewTab stat card)
// -------------------------------------------------------

export const SCORE_RANGES: Record<string, string> = {
  SAT: '400 – 1600',
  JEE: '0 – 360',
  NEET: '-180 – 720',
  PMP: '0 – 100%',
};

// -------------------------------------------------------
// Mock attempts — SAT Full Test 1
// -------------------------------------------------------

export const mockAttempts: MockAttempt[] = [
  {
    id: 'attempt-sat-full-1-0',
    assessmentId: 'sat-full-1',
    attemptNumber: 0,
    status: 'completed',
    score: 920,
    scoreRw: 480,
    scoreMath: 440,
    durationMinutes: 120,
    correctCount: 68,
    incorrectCount: 30,
    startedAt: '2026-01-15T09:00:00Z',
    completedAt: '2026-01-15T11:00:00Z',
  },
  {
    id: 'attempt-sat-full-1-1',
    assessmentId: 'sat-full-1',
    attemptNumber: 1,
    status: 'completed',
    score: 820,
    scoreRw: 440,
    scoreMath: 380,
    durationMinutes: 130,
    correctCount: 58,
    incorrectCount: 40,
    startedAt: '2026-01-22T09:00:00Z',
    completedAt: '2026-01-22T11:10:00Z',
  },
  {
    id: 'attempt-sat-full-1-2',
    assessmentId: 'sat-full-1',
    attemptNumber: 2,
    status: 'in_progress',
    score: 0,
    durationMinutes: null,
    correctCount: 0,
    incorrectCount: 0,
    startedAt: '2026-02-10T10:00:00Z',
    completedAt: null,
  },
  {
    id: 'attempt-sat-full-1-3',
    assessmentId: 'sat-full-1',
    attemptNumber: 3,
    status: 'not_started',
    score: 0,
    durationMinutes: null,
    correctCount: 0,
    incorrectCount: 0,
    startedAt: null,
    completedAt: null,
  },
  {
    id: 'attempt-sat-full-1-4',
    assessmentId: 'sat-full-1',
    attemptNumber: 4,
    status: 'not_started',
    score: 0,
    durationMinutes: null,
    correctCount: 0,
    incorrectCount: 0,
    startedAt: null,
    completedAt: null,
  },
  {
    id: 'attempt-sat-full-1-5',
    assessmentId: 'sat-full-1',
    attemptNumber: 5,
    status: 'not_started',
    score: 0,
    durationMinutes: null,
    correctCount: 0,
    incorrectCount: 0,
    startedAt: null,
    completedAt: null,
  },

  // CLAT Full Mock Test 1 — 6 attempts
  {
    id: 'clat-attempt-free',
    assessmentId: 'clat-full-test-1',
    attemptNumber: 0,
    label: 'Free Attempt',
    status: 'not_started',
    score: null,
    correctCount: 0,
    incorrectCount: 0,
    durationMinutes: null,
    startedAt: null,
    completedAt: null,
    isLocked: false,
  },
  {
    id: 'clat-attempt-1',
    assessmentId: 'clat-full-test-1',
    attemptNumber: 1,
    label: 'Attempt 1',
    status: 'not_started',
    score: null,
    correctCount: 0,
    incorrectCount: 0,
    durationMinutes: null,
    startedAt: null,
    completedAt: null,
    isLocked: true,
  },
  {
    id: 'clat-attempt-2',
    assessmentId: 'clat-full-test-1',
    attemptNumber: 2,
    label: 'Attempt 2',
    status: 'not_started',
    score: null,
    correctCount: 0,
    incorrectCount: 0,
    durationMinutes: null,
    startedAt: null,
    completedAt: null,
    isLocked: true,
  },
  {
    id: 'clat-attempt-3',
    assessmentId: 'clat-full-test-1',
    attemptNumber: 3,
    label: 'Attempt 3',
    status: 'not_started',
    score: null,
    correctCount: 0,
    incorrectCount: 0,
    durationMinutes: null,
    startedAt: null,
    completedAt: null,
    isLocked: true,
  },
  {
    id: 'clat-attempt-4',
    assessmentId: 'clat-full-test-1',
    attemptNumber: 4,
    label: 'Attempt 4',
    status: 'not_started',
    score: null,
    correctCount: 0,
    incorrectCount: 0,
    durationMinutes: null,
    startedAt: null,
    completedAt: null,
    isLocked: true,
  },
  {
    id: 'clat-attempt-5',
    assessmentId: 'clat-full-test-1',
    attemptNumber: 5,
    label: 'Attempt 5',
    status: 'not_started',
    score: null,
    correctCount: 0,
    incorrectCount: 0,
    durationMinutes: null,
    startedAt: null,
    completedAt: null,
    isLocked: true,
  },

  // NEET Full Mock Test 1 — 6 attempts
  {
    id: 'neet-attempt-free',
    assessmentId: 'neet-full-test-1',
    attemptNumber: 0,
    label: 'Free Attempt',
    status: 'not_started',
    score: null,
    correctCount: 0,
    incorrectCount: 0,
    durationMinutes: null,
    startedAt: null,
    completedAt: null,
    isLocked: false,
  },
  {
    id: 'neet-attempt-1',
    assessmentId: 'neet-full-test-1',
    attemptNumber: 1,
    label: 'Attempt 1',
    status: 'not_started',
    score: null,
    correctCount: 0,
    incorrectCount: 0,
    durationMinutes: null,
    startedAt: null,
    completedAt: null,
    isLocked: true,
  },
  {
    id: 'neet-attempt-2',
    assessmentId: 'neet-full-test-1',
    attemptNumber: 2,
    label: 'Attempt 2',
    status: 'not_started',
    score: null,
    correctCount: 0,
    incorrectCount: 0,
    durationMinutes: null,
    startedAt: null,
    completedAt: null,
    isLocked: true,
  },
  {
    id: 'neet-attempt-3',
    assessmentId: 'neet-full-test-1',
    attemptNumber: 3,
    label: 'Attempt 3',
    status: 'not_started',
    score: null,
    correctCount: 0,
    incorrectCount: 0,
    durationMinutes: null,
    startedAt: null,
    completedAt: null,
    isLocked: true,
  },
  {
    id: 'neet-attempt-4',
    assessmentId: 'neet-full-test-1',
    attemptNumber: 4,
    label: 'Attempt 4',
    status: 'not_started',
    score: null,
    correctCount: 0,
    incorrectCount: 0,
    durationMinutes: null,
    startedAt: null,
    completedAt: null,
    isLocked: true,
  },
  {
    id: 'neet-attempt-5',
    assessmentId: 'neet-full-test-1',
    attemptNumber: 5,
    label: 'Attempt 5',
    status: 'not_started',
    score: null,
    correctCount: 0,
    incorrectCount: 0,
    durationMinutes: null,
    startedAt: null,
    completedAt: null,
    isLocked: true,
  },
];

// -------------------------------------------------------
// Mock question attempt results for attempt 0 (completed)
// -------------------------------------------------------

export const mockQuestionResults: QuestionAttemptResult[] = [
  {
    questionId: 'q-sat-1',
    questionNumber: 1,
    userAnswer: 'B',
    isCorrect: false,
    timeSpentSeconds: 72,
    module: 'RW-M1',
  },
  {
    questionId: 'q-sat-2',
    questionNumber: 2,
    userAnswer: 'A',
    isCorrect: true,
    timeSpentSeconds: 95,
    module: 'Math-M1',
  },
  {
    questionId: 'q-sat-3',
    questionNumber: 3,
    userAnswer: '5',
    isCorrect: true,
    timeSpentSeconds: 45,
    module: 'Math-M1',
  },
  {
    questionId: 'q-sat-4',
    questionNumber: 4,
    userAnswer: null,
    isCorrect: false,
    timeSpentSeconds: 30,
    module: 'RW-M1',
  },
];

// -------------------------------------------------------
// Mock questions — 4 types for demo
// -------------------------------------------------------

const passageQ1Explanation: ExplanationData = {
  correctAnswerLabel: 'The correct answer is C.',
  optionBreakdowns: [
    {
      option: 'A',
      text: 'Incorrect. The text does not primarily argue for government policy changes; it describes a scientific phenomenon and its ecological consequences.',
    },
    {
      option: 'B',
      text: 'Incorrect. While the text mentions economic impacts, the main purpose is broader — it addresses the ecological and climate consequences of deforestation.',
    },
    {
      option: 'C',
      text: 'Correct. The passage surveys the multiple environmental consequences of tropical deforestation, including biodiversity loss, carbon release, and disruption of water cycles.',
    },
    {
      option: 'D',
      text: 'Incorrect. The text does not propose solutions or conservation strategies; it describes the problem and its effects.',
    },
  ],
};

const mathQ2Explanation: ExplanationData = {
  correctAnswerLabel: 'The correct answer is A: x⁻¹²y¹⁶.',
  steps: [
    'Apply the Quotient Rule inside the parentheses: x⁴/x⁻² = x⁴⁻(⁻²) = x⁶, and y³/y⁻⁵ = y³⁻(⁻⁵) = y⁸. Expression becomes (x⁶y⁸)⁻².',
    'Apply the Power Rule: multiply each exponent by −2. x⁶ × (−2) = x⁻¹², and y⁸ × (−2) = y⁻¹⁶.',
    'Final answer: x⁻¹²y⁻¹⁶ — which matches option A.',
  ],
};

const numericQ3Explanation: ExplanationData = {
  correctAnswerLabel: 'The correct answer is 5.',
  steps: [
    'Start with the equation: 3x + 7 = 22.',
    'Subtract 7 from both sides: 3x = 22 − 7 = 15.',
    'Divide both sides by 3: x = 15 / 3 = 5.',
  ],
};

const multipleQ4Explanation: ExplanationData = {
  correctAnswerLabel: 'The correct answers are A and C.',
  optionBreakdowns: [
    {
      option: 'A',
      text: "Correct. This choice directly cites the study's quantitative findings, providing specific evidence that supports the central claim about deforestation rates.",
    },
    {
      option: 'B',
      text: 'Incorrect. This option introduces a counterargument without connecting it to the central claim, weakening rather than supporting the argument.',
    },
    {
      option: 'C',
      text: 'Correct. This choice references expert consensus and peer-reviewed data, effectively strengthening the central claim with credible evidence.',
    },
    {
      option: 'D',
      text: 'Incorrect. This choice offers a personal anecdote, which lacks the evidentiary weight needed to support a scientific central claim.',
    },
  ],
};

export const mockQuestions: MockQuestion[] = [
  // Q1 — PassageSingle (Reading comprehension)
  {
    id: 'q-sat-1',
    assessmentId: 'sat-full-1',
    questionNumber: 1,
    type: 'passage-single',
    passageText:
      'The rapid deforestation of tropical rainforests represents one of the most consequential environmental transformations of the modern era. Between 1990 and 2020, the world lost approximately 420 million hectares of forest — an area larger than the European Union. Tropical forests, which cover only 7% of the Earth\'s land surface, harbour more than half of the world\'s plant and animal species. When these ecosystems are cleared for agriculture or timber, the immediate consequences include catastrophic biodiversity loss and the release of vast quantities of stored carbon dioxide into the atmosphere. Less visible but equally significant is the disruption of regional water cycles: tropical forests generate rainfall through transpiration, and their removal can trigger severe droughts in areas hundreds of kilometres away. Scientists studying the Amazon Basin have found that continued deforestation could push the biome past a tipping point beyond which large-scale forest regeneration becomes impossible.',
    questionText: 'Which choice best states the main purpose of the text?',
    options: [
      'A. To argue that international governments must enact stricter environmental legislation to protect tropical forests',
      'B. To highlight the economic consequences of deforestation for communities that depend on forest resources',
      'C. To survey the wide-ranging environmental consequences of tropical deforestation, from biodiversity loss to climate disruption',
      'D. To propose conservation strategies that could reverse the damage caused by decades of deforestation',
    ],
    correctAnswer: 'C',
    explanation: passageQ1Explanation,
    conceptTag: 'Information and Ideas',
    module: 'RW-M1',
  },

  // Q2 — MCQSingle (Math with superscript)
  {
    id: 'q-sat-2',
    assessmentId: 'sat-full-1',
    questionNumber: 2,
    type: 'mcq-single',
    questionText:
      'Simplify: (x<sup>4</sup>y<sup>3</sup> / x<sup>-2</sup>y<sup>-5</sup>)<sup>-2</sup>',
    options: [
      'A. x<sup>-12</sup>y<sup>-16</sup>',
      'B. x<sup>12</sup>y<sup>-16</sup>',
      'C. x<sup>-8</sup>y<sup>16</sup>',
      'D. x<sup>8</sup>y<sup>-16</sup>',
    ],
    correctAnswer: 'A',
    explanation: mathQ2Explanation,
    conceptTag: 'Advanced Math',
    module: 'Math-M1',
  },

  // Q3 — Numeric (Algebra)
  {
    id: 'q-sat-3',
    assessmentId: 'sat-full-1',
    questionNumber: 3,
    type: 'numeric',
    questionText: 'If 3x + 7 = 22, what is the value of x?',
    correctAnswer: '5',
    explanation: numericQ3Explanation,
    conceptTag: 'Algebra',
    module: 'Math-M1',
  },

  // Q4 — MCQMultiple (English)
  {
    id: 'q-sat-4',
    assessmentId: 'sat-full-1',
    questionNumber: 4,
    type: 'mcq-multiple',
    questionText:
      'Which TWO choices most effectively use evidence to support the central claim that tropical deforestation poses an existential threat to global biodiversity?',
    options: [
      'A. "Tropical forests harbour more than half of the world\'s plant and animal species, and their destruction eliminates irreplaceable genetic diversity."',
      'B. "Some economists argue that the short-term agricultural gains from deforestation outweigh the ecological costs for developing nations."',
      'C. "Studies show that species extinction rates in cleared forest zones are up to 1,000 times higher than natural background rates."',
      'D. "A local farmer in the Amazon described how clearing land transformed his family\'s economic prospects within a single generation."',
    ],
    correctAnswer: 'A',
    correctAnswers: ['A', 'C'],
    explanation: multipleQ4Explanation,
    conceptTag: 'Expression of Ideas',
    module: 'RW-M1',
  },
];

// -------------------------------------------------------
// Syllabus — SAT Full Test 1
// -------------------------------------------------------

export const mockSyllabus: SyllabusSection[] = [
  {
    number: 1,
    title: 'Reading & Writing',
    topics: [
      'Information and Ideas — Central Ideas, Details, Command of Evidence',
      'Craft and Structure — Words in Context, Text Structure and Purpose, Cross-text Connections',
      'Expression of Ideas — Rhetorical Synthesis, Transitions',
      'Standard English Conventions — Boundaries, Form, Structure, and Sense',
    ],
  },
  {
    number: 2,
    title: 'Math',
    topics: [
      'Algebra — Linear equations, linear inequalities, systems of equations',
      'Advanced Math — Equivalent expressions, nonlinear equations, nonlinear functions',
      'Problem-Solving & Data Analysis — Ratios, rates, proportions, percentages, statistics',
      'Geometry & Trigonometry — Area, volume, lines, angles, triangles, trigonometry',
    ],
  },
];

export default ASSESSMENTS
