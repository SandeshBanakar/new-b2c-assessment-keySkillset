// Exam identifiers
export type Exam = 'SAT' | 'JEE' | 'NEET' | 'PMP';

// Assessment type identifiers
export type AssessmentType = 'full-test' | 'subject-test' | 'chapter-test' | 'daily-quiz';

// Difficulty levels
export type Difficulty = 'easy' | 'medium' | 'hard';

// Subscription tiers
export type Tier = 'free' | 'basic' | 'professional' | 'premium';

// Card status returned by getCardStatus()
export type CardStatus = 'start' | 'continue' | 'locked' | 'upgrade';

// -------------------------------------------------------

export interface Assessment {
  id: string;
  title: string;
  exam: Exam;
  type: AssessmentType;
  subject: string | null;       // null for Full Tests; subject name for Subject/Chapter Tests
  difficulty: Difficulty;
  questionCount: number;
  duration: number;             // in minutes
  tier: Tier;                   // minimum tier required to access
  isPuzzleMode: boolean;        // true when this variant flips MCQ format
}

// -------------------------------------------------------

export interface Question {
  id: string;
  assessmentId: string;
  text: string;
  options: string[];            // always 4 options
  correctIndex: number;         // 0-based index into options[]
  explanation: string;
  conceptTag: string;           // e.g. "Linear Equations", "Organic Chemistry"
  trapType: string | null;      // e.g. "unit conversion error", "negation trap"
  difficulty: Difficulty;
}

// -------------------------------------------------------

export interface UserAssessmentProgress {
  userId: string;
  assessmentId: string;
  attemptsUsed: number;         // 0–5
  attemptsMax: number;          // always 5
  isPaid: boolean;              // true if attempts 2–5 have been unlocked
  lastScore: number | null;     // percentage 0–100, null if never attempted
  masteryPercent: number;       // rolling concept mastery 0–100
}

// -------------------------------------------------------

export interface QuizAttemptState {
  questionIndex: number;        // current question (0-based)
  answers: (number | null)[];   // selected option index per question, null if unanswered
  startTime: number;            // Date.now() timestamp when session began
  timeRemaining: number;        // seconds remaining; -1 means no timer (Daily Quiz)
  isSubmitted: boolean;
}

// -------------------------------------------------------

export interface MockUser {
  id: string;
  name: string;
  email: string;
  tier: Tier;
  xp: number;                   // cumulative, never decreases
  streak: number;               // consecutive days active
  selectedExam: Exam | null;    // null until onboarding complete
  onboardingComplete: boolean;
}
