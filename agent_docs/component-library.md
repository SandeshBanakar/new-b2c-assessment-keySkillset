# agent_docs/component-library.md — keySkillset Component Library Reference

All custom components live in `src/components/`. Components are grouped by the route they primarily serve. Shared components used across multiple routes are listed separately at the end.

---

## / — Home Dashboard

### ExamBadge
**File:** `src/components/layout/Navbar.tsx` (also used standalone on the dashboard)
**Folder:** `src/components/shared/ExamBadge.tsx`

| Prop | Type | Description |
|---|---|---|
| `exam` | `Exam \| null` | The currently selected exam |
| `onClick` | `() => void` | Callback to open exam-change flow |
| `size` | `'sm' \| 'md'` | Controls pill size; default `'md'` |

Displays the selected exam as a coloured pill badge (e.g. "SAT", "JEE"). Clicking it opens the exam-change flow (navigates to `/onboarding` or opens a modal). Renders a placeholder state when `exam` is `null`.

**Used on:** `/` (dashboard), Navbar

---

### StreakCounter
**File:** `src/components/shared/StreakCounter.tsx`

| Prop | Type | Description |
|---|---|---|
| `streak` | `number` | Current day streak count |
| `xp` | `number` | Total cumulative XP |

Displays the learner's current streak (flame icon + count) and total XP (star icon + count) in a compact horizontal layout. Uses `amber-500` for both icons. Streak count resets display to 0 if `streak === 0`.

**Used on:** `/` (dashboard), Navbar

---

### TodayQuestCard
**File:** `src/components/shared/TodayQuestCard.tsx`

| Prop | Type | Description |
|---|---|---|
| `exam` | `Exam` | The learner's selected exam |
| `questTitle` | `string` | Title of today's suggested quest |
| `xpReward` | `number` | XP awarded for completing it |
| `href` | `string` | Route to navigate to on CTA click |

A card (`rounded-2xl`, `p-6`) surfacing today's recommended activity (typically the Daily Quiz or a recommended assessment). Shows exam badge, quest title, XP reward badge, and a "Go" CTA button. Uses `violet-600` as the primary accent.

**Used on:** `/`

---

### RecentActivityFeed
**File:** `src/components/shared/RecentActivityFeed.tsx`

| Prop | Type | Description |
|---|---|---|
| `attempts` | `RecentAttempt[]` | Last 3 assessment attempts |

`RecentAttempt` is a local type: `{ assessmentTitle: string; score: number; date: string; type: AssessmentType }`.

Renders an ordered list of the learner's 3 most recent assessment attempts, each showing the assessment title, type badge, score percentage, and relative date (e.g. "2 days ago"). Tapping a row navigates to `/assessments/[id]`.

**Used on:** `/`

---

## /onboarding — Exam Selection

### ExamSelector
**File:** `src/components/shared/ExamSelector.tsx`

| Prop | Type | Description |
|---|---|---|
| `selectedExam` | `Exam \| null` | Currently selected exam (controlled) |
| `onSelect` | `(exam: Exam) => void` | Called when learner taps an exam card |

Renders a 2×2 grid of exam cards (SAT, JEE, NEET, PMP). Each card shows the exam name, a short descriptor, and the subjects covered. Only one card can be selected at a time (single-select). The selected card is highlighted with a `violet-600` border and background tint. A "Continue" button is enabled only when an exam is selected; clicking it calls `onSelect` and triggers navigation away from `/onboarding`.

Stores the selection to `MockUser.selectedExam` and sets `MockUser.onboardingComplete = true`.

**Used on:** `/onboarding`

---

## /quiz/daily — Daily Quiz In-Session

### QuizQuestionCard
**File:** `src/components/quiz/QuizQuestionCard.tsx`

| Prop | Type | Description |
|---|---|---|
| `question` | `Question` | The question to display |
| `selectedIndex` | `number \| null` | Currently selected option index |
| `onSelect` | `(index: number) => void` | Called when learner selects an option |
| `isSubmitted` | `boolean` | If true, reveals correct/incorrect states |
| `darkMode` | `boolean` | Applies dark card styling (`zinc-900` bg) |

Renders the question text and 4 option buttons. Before submission, options are selectable and highlight on hover. After submission, correct option shows `emerald-500` and the selected-wrong option shows `rose-500`. In dark mode, uses `bg-zinc-900 border-zinc-800 text-zinc-50` for the card and options.

**Used on:** `/quiz/daily`

---

### QuizProgressBar
**File:** `src/components/quiz/QuizProgressBar.tsx`

| Prop | Type | Description |
|---|---|---|
| `current` | `number` | Current question number (1-based) |
| `total` | `number` | Total questions in quiz |

A thin progress bar at the top of the quiz screen showing how many questions have been answered. Uses the shadcn `Progress` component with `violet-600` fill. Also renders a text label: "Question {current} of {total}".

**Used on:** `/quiz/daily`, and any timed assessment session

---

### QuizTimer
**File:** `src/components/quiz/QuizTimer.tsx`

| Prop | Type | Description |
|---|---|---|
| `secondsRemaining` | `number` | Seconds left on the countdown |
| `onExpire` | `() => void` | Called when timer reaches 0 |
| `visible` | `boolean` | Set to `false` to hide timer (Daily Quiz) |

Countdown display in `MM:SS` format. When `secondsRemaining < 60`, the text color switches to `rose-500` as a warning. When `visible` is `false`, renders `null` — the component is included in quiz session pages for structural consistency but hidden for untimed quizzes (Daily Quiz).

**Used on:** `/quiz/daily` (hidden), Full Test and Subject Test sessions

---

## /quiz/results — Post-Quiz Results

### ResultScoreCard
**File:** `src/components/quiz/ResultScoreCard.tsx`

| Prop | Type | Description |
|---|---|---|
| `score` | `number` | Percentage score 0–100 |
| `xpEarned` | `number` | XP awarded for this attempt |
| `accuracy` | `number` | Accuracy percentage 0–100 |
| `assessmentTitle` | `string` | Name of the completed assessment |

Large card (`rounded-2xl`, `p-6`) showing the primary outcome of a completed assessment. Displays score as a large number with a circular or arc progress indicator, XP earned in `amber-500`, and accuracy. Uses `emerald-500` for scores ≥ 70%, `orange-400` for 40–69%, and `rose-500` for < 40%.

**Used on:** `/quiz/results`

---

### ConceptBreakdown
**File:** `src/components/quiz/ConceptBreakdown.tsx`

| Prop | Type | Description |
|---|---|---|
| `concepts` | `ConceptResult[]` | Per-concept accuracy data |

`ConceptResult` is a local type: `{ tag: string; correct: number; total: number; masteryPercent: number }`.

Renders a list of concept tags with a per-concept accuracy bar (shadcn `Progress`) and mastery percentage. Allows the learner to identify weak areas. Concepts with accuracy < 50% are highlighted with a `rose-500` label.

**Used on:** `/quiz/results`

---

### RetryButton
**File:** `src/components/quiz/RetryButton.tsx`

| Prop | Type | Description |
|---|---|---|
| `href` | `string` | Route to navigate to on click |
| `label` | `string` | Button label (e.g. "Try Again", "Back to Assessments") |
| `variant` | `'primary' \| 'outline'` | Visual style |

A simple navigational button that links the learner back to an assessment or to the Daily Quiz. Uses the shadcn `Button` component with `variant` controlling whether it uses the primary violet fill or an outline style.

**Used on:** `/quiz/results`

---

## /assessments — Assessment Library

### AssessmentCard
**File:** `src/components/assessment/AssessmentCard.tsx`

| Prop | Type | Description |
|---|---|---|
| `assessment` | `Assessment` | Assessment data |
| `progress` | `UserAssessmentProgress \| null` | User's attempt progress for this assessment |
| `userTier` | `Tier` | The logged-in user's subscription tier |
| `status` | `CardStatus` | Return value of `getCardStatus()` |

Card (`rounded-2xl`, `p-6`) displaying assessment metadata and a context-aware CTA button. Shows: exam badge, assessment type badge, difficulty badge, question count, duration, and attempt counter (e.g. "2/5 attempts used"). The CTA button label and behavior depends on `status`:

- `"start"` → violet primary button labeled "Start"
- `"continue"` → violet primary button labeled "Continue"
- `"locked"` → outline button labeled "Unlock" that links to `/plans`
- `"upgrade"` → outline button labeled "Upgrade" that links to `/plans`

For `"locked"` status, the card is visually dimmed (reduced opacity) and an overlay lock icon is shown.

**Used on:** `/assessments`

---

### AssessmentFilterBar
**File:** `src/components/assessment/AssessmentFilterBar.tsx`

| Prop | Type | Description |
|---|---|---|
| `selectedExam` | `Exam \| 'all'` | Currently filtered exam |
| `selectedType` | `AssessmentType \| 'all'` | Currently filtered type |
| `selectedDifficulty` | `Difficulty \| 'all'` | Currently filtered difficulty |
| `onChange` | `(filters: FilterState) => void` | Called when any filter changes |

A horizontal row of filter controls (pill buttons or dropdowns) for narrowing the assessment list by exam, assessment type, and difficulty. The active filter is highlighted with `violet-600`. Changing a filter calls `onChange` with the new combined filter state.

**Used on:** `/assessments`

---

### TierGateBanner
**File:** `src/components/assessment/TierGateBanner.tsx`

| Prop | Type | Description |
|---|---|---|
| `requiredTier` | `Tier` | The tier needed to access the content |
| `currentTier` | `Tier` | The learner's current tier |

A full-width banner shown at the top of the assessment list (or inside a locked card) when the learner cannot access certain assessment types. Displays a message explaining which tier unlocks these assessments and a CTA button linking to `/plans`. Uses `violet-600` accent on a light `violet-50` background (light mode).

**Used on:** `/assessments`

---

## /assessments/[id] — Assessment Detail

### AssessmentDetailTabs
**File:** `src/components/assessment/AssessmentDetailTabs.tsx`

| Prop | Type | Description |
|---|---|---|
| `assessment` | `Assessment` | The assessment being viewed |
| `progress` | `UserAssessmentProgress \| null` | User's progress for this assessment |
| `userTier` | `Tier` | The logged-in user's subscription tier |

Wraps the shadcn `Tabs` component with three tabs:
1. **Overview** — assessment description, subject coverage, question count, duration, difficulty breakdown.
2. **Attempts** — renders `AttemptHistoryList` with past attempts.
3. **Leaderboard** — top scores for this assessment (future implementation placeholder).

**Used on:** `/assessments/[id]`

---

### AttemptHistoryList
**File:** `src/components/assessment/AttemptHistoryList.tsx`

| Prop | Type | Description |
|---|---|---|
| `attempts` | `AttemptRecord[]` | List of past attempt records |

`AttemptRecord` is a local type: `{ attemptNumber: number; score: number; date: string; duration: number }`.

Renders an ordered list of past attempts for the current assessment showing: attempt number, score percentage, date, and time taken. Empty state uses the shared `EmptyState` component with a message like "No attempts yet. Start your first attempt."

**Used on:** `/assessments/[id]` (Attempts tab)

---

### StartAssessmentButton
**File:** `src/components/assessment/StartAssessmentButton.tsx`

| Prop | Type | Description |
|---|---|---|
| `assessment` | `Assessment` | The assessment to start |
| `progress` | `UserAssessmentProgress \| null` | User's progress |
| `userTier` | `Tier` | The logged-in user's tier |
| `status` | `CardStatus` | Derived from `getCardStatus()` |

The primary CTA on the assessment detail page. Enforces tier access and attempt limit logic before allowing the learner to begin. If `status === 'locked'` or `status === 'upgrade'`, the button navigates to `/plans` instead of starting the assessment. If `status === 'start'` or `status === 'continue'`, the button initiates the assessment session.

**Used on:** `/assessments/[id]`

---

## /plans — Subscription Plans

### PlanCard
**File:** `src/components/shared/PlanCard.tsx`

| Prop | Type | Description |
|---|---|---|
| `tier` | `Tier` | The subscription tier this card represents |
| `price` | `string` | Display price (e.g. "Free", "₹499/mo") |
| `features` | `string[]` | List of feature strings to display |
| `isCurrent` | `boolean` | Whether this is the learner's active tier |
| `onSelect` | `() => void` | Called when CTA button is clicked |

Card (`rounded-2xl`, `p-6`) representing one subscription plan. Displays tier name, price, and a bullet list of included features. The CTA button label adapts: "Current Plan" (disabled, `isCurrent === true`), "Upgrade" (for higher tiers), "Downgrade" (for lower tiers). The current plan card is highlighted with a `violet-600` border. There are 4 cards: Free, Basic, Professional, Premium.

**Used on:** `/plans`

---

### FeatureComparisonTable
**File:** `src/components/shared/FeatureComparisonTable.tsx`

| Prop | Type | Description |
|---|---|---|
| `currentTier` | `Tier` | The learner's current tier (highlights column) |

A full-width table comparing what each tier unlocks across feature rows (Daily Quiz, Full Tests, Subject Tests, Chapter Tests, Puzzle Mode). Uses check icons (`emerald-500`) for included features and dash/X icons (`zinc-300`) for excluded features. The column for `currentTier` is highlighted with a subtle `violet-50` background.

**Used on:** `/plans`

---

### CurrentPlanBadge
**File:** `src/components/shared/CurrentPlanBadge.tsx`

| Prop | Type | Description |
|---|---|---|
| `tier` | `Tier` | The learner's current subscription tier |

A small `rounded-full` badge displaying the active plan name (e.g. "Professional"). Uses `violet-600` background and white text. Typically rendered next to the page title or inside the Navbar.

**Used on:** `/plans`, Navbar

---

## /quest — Quest Map + Game Hub

### QuestWorldMap
**File:** `src/components/gamification/QuestWorldMap.tsx`

| Prop | Type | Description |
|---|---|---|
| `nodes` | `QuestNodeData[]` | All quest nodes for the learner's selected exam |
| `userXP` | `number` | Current learner XP (used to determine unlocked nodes) |

`QuestNodeData` is a local type: `{ id: string; label: string; xpRequired: number; state: 'locked' \| 'unlocked' \| 'mastered'; position: { x: number; y: number } }`.

The primary visual on `/quest`. Renders a node-based skill tree on a dark `zinc-950` background. Nodes are connected by lines showing progression paths. Learners can tap nodes to view associated assessments. The layout is a fixed SVG or canvas with absolute-positioned `QuestNode` components.

**Used on:** `/quest`

---

### QuestNode
**File:** `src/components/gamification/QuestNode.tsx`

| Prop | Type | Description |
|---|---|---|
| `node` | `QuestNodeData` | Node data including state and label |
| `onClick` | `(id: string) => void` | Called when node is tapped |

An individual circular node on the Quest Map. Three visual states:
- **Locked** — `zinc-700` fill, lock icon, greyed label.
- **Unlocked** — `violet-600` fill, glow ring, label in `zinc-50`.
- **Mastered** — `emerald-500` fill, star icon, label in `zinc-50`.

**Used on:** `/quest` (via QuestWorldMap)

---

### XPProgressBar
**File:** `src/components/gamification/XPProgressBar.tsx`

| Prop | Type | Description |
|---|---|---|
| `currentXP` | `number` | Learner's total XP |
| `currentLevel` | `number` | Derived current level |
| `xpForNextLevel` | `number` | XP threshold for next level |
| `xpAtCurrentLevel` | `number` | XP threshold at which current level started |

Horizontal progress bar showing XP progress toward the next level. Uses shadcn `Progress` with `amber-500` fill to reflect the gamification color. Displays the level number on the left and "next level" XP on the right as captions.

**Used on:** `/quest`

---

### AvatarDisplay
**File:** `src/components/gamification/AvatarDisplay.tsx`

| Prop | Type | Description |
|---|---|---|
| `user` | `MockUser` | The logged-in user |
| `size` | `'sm' \| 'md' \| 'lg'` | Controls avatar dimensions |

Renders the learner's avatar using shadcn `Avatar` with a level badge overlaid in the bottom-right corner. The level badge is a small `rounded-full` pill with `amber-500` background. Falls back to initials in `AvatarFallback` if no avatar image is set.

**Used on:** `/quest`, Navbar

---

## Shared Components (used across multiple routes)

### Navbar
**File:** `src/components/layout/Navbar.tsx`

| Prop | Type | Description |
|---|---|---|
| `user` | `MockUser` | The logged-in user |

Top navigation bar present on all authenticated pages. Contains (left to right): keySkillset logo/wordmark, `ExamBadge`, `StreakCounter`, `CurrentPlanBadge`, `AvatarDisplay`. On mobile, collapses to a hamburger menu or bottom tab bar. Uses `bg-white border-b border-zinc-200` in light mode; `bg-zinc-950 border-b border-zinc-800` in dark mode.

**Used on:** All authenticated routes

---

### PageWrapper
**File:** `src/components/layout/PageWrapper.tsx`

| Prop | Type | Description |
|---|---|---|
| `children` | `React.ReactNode` | Page content |
| `className` | `string?` | Additional classes for the wrapper div |

Applies consistent page-level padding (`px-4 py-6 md:px-8 md:py-8`) and a `max-w-5xl mx-auto` content constraint. Wrap every page's main content with this component to maintain consistent layout margins.

**Used on:** All routes

---

### LoadingSpinner
**File:** `src/components/shared/LoadingSpinner.tsx`

| Prop | Type | Description |
|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | Spinner size; default `'md'` |
| `label` | `string?` | Optional accessible label for screen readers |

A centered animated spinner used during async data fetching. Renders a `w-8 h-8` (or sized equivalent) circular spinner with `violet-600` color. Centered via `flex items-center justify-center` in its container.

**Used on:** All routes (during data loading states)

---

### EmptyState
**File:** `src/components/shared/EmptyState.tsx`

| Prop | Type | Description |
|---|---|---|
| `icon` | `React.ReactNode` | lucide-react icon to display |
| `title` | `string` | Primary message |
| `description` | `string?` | Secondary explanatory text |
| `action` | `React.ReactNode?` | Optional CTA button or link |

Displayed when a list or section has no items to show. Renders the icon in `zinc-300` color, the title in `text-base font-semibold`, and the description in `text-sm text-zinc-500`. Vertically centered in its container.

**Used on:** `/assessments` (no results), `/assessments/[id]` (no attempts), `/quest` (no nodes)

---

### ErrorBoundary
**File:** `src/components/shared/ErrorBoundary.tsx`

| Prop | Type | Description |
|---|---|---|
| `children` | `React.ReactNode` | Wrapped component tree |
| `fallback` | `React.ReactNode?` | Custom fallback UI (optional) |

A React class component that implements `componentDidCatch` to catch render errors in its subtree. If no `fallback` is provided, renders a default error card with a `rose-500` accent and a "Something went wrong" message. Prevents full-page crashes from propagating.

**Used on:** Wraps major sections on all routes
