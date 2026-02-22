# agent_docs/architecture.md — keySkillset Architecture Reference

## 1. Full src/ Folder Structure

```
src/
├── app/                          # Next.js 15 App Router
│   ├── layout.tsx                # Root layout (html, body, global providers)
│   ├── page.tsx                  # / → Home / Dashboard
│   ├── globals.css               # Tailwind base imports only
│   ├── favicon.ico
│   ├── onboarding/
│   │   └── page.tsx              # /onboarding → Exam selection
│   ├── quiz/
│   │   ├── daily/
│   │   │   └── page.tsx          # /quiz/daily → Daily Quiz in-session
│   │   └── results/
│   │       └── page.tsx          # /quiz/results → Post-quiz results + XP
│   ├── assessments/
│   │   ├── page.tsx              # /assessments → Assessment Library
│   │   └── [id]/
│   │       └── page.tsx          # /assessments/[id] → Assessment Detail
│   ├── plans/
│   │   └── page.tsx              # /plans → Subscription Plans
│   └── quest/
│       └── page.tsx              # /quest → Quest Map + Game Hub
│
├── components/
│   ├── ui/                       # shadcn/ui base components — never edit directly
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   ├── separator.tsx
│   │   └── tabs.tsx
│   ├── assessment/               # Components scoped to /assessments routes
│   │   ├── AssessmentCard.tsx
│   │   ├── AssessmentFilterBar.tsx
│   │   ├── AssessmentDetailTabs.tsx
│   │   ├── AttemptHistoryList.tsx
│   │   ├── StartAssessmentButton.tsx
│   │   └── TierGateBanner.tsx
│   ├── quiz/                     # Components scoped to /quiz routes
│   │   ├── QuizQuestionCard.tsx
│   │   ├── QuizProgressBar.tsx
│   │   ├── QuizTimer.tsx
│   │   ├── ResultScoreCard.tsx
│   │   ├── ConceptBreakdown.tsx
│   │   └── RetryButton.tsx
│   ├── gamification/             # Components scoped to /quest and XP/streak UI
│   │   ├── QuestWorldMap.tsx
│   │   ├── QuestNode.tsx
│   │   ├── XPProgressBar.tsx
│   │   └── AvatarDisplay.tsx
│   ├── shared/                   # Components used across multiple routes
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   └── ErrorBoundary.tsx
│   └── layout/                   # Global layout components
│       ├── Navbar.tsx
│       └── PageWrapper.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser-side Supabase client
│   │   └── server.ts             # Server-side Supabase client (RSC / Server Actions)
│   └── utils.ts                  # Shared utility functions (cn(), getCardStatus(), etc.)
│
├── types/
│   └── index.ts                  # All shared TypeScript interfaces and types
│
├── hooks/                        # Custom React hooks (client-side only)
│   ├── useUser.ts                # Read MockUser from context or Supabase
│   ├── useAssessment.ts          # Fetch a single Assessment by id
│   └── useQuizState.ts           # Manage QuizAttemptState during a session
│
└── utils/                        # Pure utility/helper functions (no React)
    ├── xp.ts                     # XP calculation helpers
    ├── access.ts                 # Tier access check helpers (canAccess, getCardStatus)
    └── format.ts                 # Duration, score, date formatting helpers
```

---

## 2. All 8 Routes

| Route | File Path | Description |
|---|---|---|
| `/` | `src/app/page.tsx` | Home / Dashboard — exam badge, streak, today's quest card, recent activity |
| `/onboarding` | `src/app/onboarding/page.tsx` | Exam selection shown on first login; stores selectedExam to MockUser |
| `/quiz/daily` | `src/app/quiz/daily/page.tsx` | Daily Quiz in-session; dark mode; 3 questions, no timer |
| `/quiz/results` | `src/app/quiz/results/page.tsx` | Post-quiz results; shows score, XP earned, concept breakdown |
| `/assessments` | `src/app/assessments/page.tsx` | Assessment Library; filterable list of all assessments |
| `/assessments/[id]` | `src/app/assessments/[id]/page.tsx` | Assessment Detail; 3 tabs: Overview, Attempts, Leaderboard |
| `/plans` | `src/app/plans/page.tsx` | Subscription Plans; 4 plan cards + feature comparison table |
| `/quest` | `src/app/quest/page.tsx` | Quest Map + Game Hub; dark mode; node-based skill tree |

---

## 3. Core Data Models

All interfaces live in `src/types/index.ts`.

```ts
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
```

---

## 4. Supabase Client Usage Rules

### client.ts — Browser-side client

**File:** `src/lib/supabase/client.ts`

Use in:
- Client Components (`'use client'` files)
- Custom hooks (`src/hooks/`)
- Event handlers and form submissions in the browser

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### server.ts — Server-side client

**File:** `src/lib/supabase/server.ts`

Use in:
- React Server Components (RSC) — any `page.tsx` or `layout.tsx` without `'use client'`
- Server Actions (`'use server'` functions)
- Route Handlers (`src/app/api/**/route.ts`)

```ts
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### Hard Rules

- **Never import both `client.ts` and `server.ts` in the same file.** A file is either a Client Component (use `client.ts`) or a Server Component/action (use `server.ts`) — never both.
- **RLS (Row Level Security) must be enabled on every Supabase table.** No table should be readable or writable without an RLS policy.
- **Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code.** If a service role is needed, use a Server Action or Route Handler.
- **`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`** are the only Supabase env vars that may be referenced in client-side code.
