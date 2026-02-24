# agent_docs/domain-rules.md — keySkillset Domain Rules Reference

## 1. Subscription Tier Access Map

These rules are absolute. Every access check in the codebase must derive from this table.

| Tier | Daily Quiz | Full Tests | Subject Tests | Chapter Tests | Puzzle Mode |
|---|---|---|---|---|---|
| **Free** | Yes | No | No | No | No |
| **Basic** | Yes | Yes (all 4 exams) | No | No | No |
| **Professional** | Yes | Yes | Yes | No | Subject Tests only |
| **Premium** | Yes | Yes | Yes | Yes | All types |

### Rules stated explicitly

- **Free** → Daily Quiz only. No Full Tests, no Subject Tests, no Chapter Tests, no Puzzle Mode.
- **Basic** → Daily Quiz + Full Tests across all 4 exams (SAT, JEE, NEET, PMP). No Subject or Chapter Tests.
- **Professional** → Daily Quiz + Full Tests + Subject Tests. Puzzle Mode is available on Subject Tests only.
- **Premium** → Daily Quiz + Full Tests + Subject Tests + Chapter Tests. Puzzle Mode is available on all assessment types.

### Important clarifications

- Puzzle Mode is **never** available on Daily Quiz regardless of tier.
- Chapter Tests are **exclusive to Premium**. Professional tier cannot access them.
- Tier access determines whether a learner can **start** an assessment. Attempt unlocking (attempts 2–5) is a separate payment on top of tier access.
- Tier names are lowercase in code: `'free' | 'basic' | 'professional' | 'premium'`.

---

## 2. Supported Exams and Their Subjects

### SAT
- Math
- Reading & Writing

### JEE (IIT-JEE)
- Physics
- Chemistry
- Mathematics

### NEET
- Physics
- Chemistry
- Biology

### PMP
- Initiating
- Planning
- Executing
- Monitoring & Controlling
- Closing

---

## 3. Assessment Type Definitions

### Full Test
Complete exam simulation matching the official exam structure.

| Exam | Questions | Duration |
|---|---|---|
| SAT | 98 | 2h 14m (134 min) |
| JEE | 90 | 3h (180 min) |
| NEET | 180 | 3h 20m (200 min) |
| PMP | 180 | 3h 50m (230 min) |

- Timed. Timer is mandatory and visible.
- Covers all subjects for the selected exam.
- Minimum tier: Basic.

### Subject Test
Single-subject focus within an exam.

- 40–60 questions (varies by subject and exam).
- 60–90 minutes (varies by subject and exam).
- Covers one subject only (e.g. SAT Math, JEE Chemistry).
- Minimum tier: Professional.
- Puzzle Mode available at Professional+.

### Chapter Test
Single concept or chapter focus.

- 25 questions.
- 30 minutes.
- Covers one concept/chapter only (e.g. Linear Equations, Organic Chemistry — Reactions).
- Minimum tier: Premium.
- Puzzle Mode available at Premium.

### Daily Quiz
Free, always-available, short quiz.

- 3 questions.
- No timer.
- Available to all tiers including Free.
- Questions are drawn from any subject of the learner's selected exam.
- Puzzle Mode is **never** available on Daily Quiz.
- Awards +10 XP on completion.

---

## 4. Puzzle Mode Rules

Puzzle Mode is a **question format variant** — it is not a separate assessment type. It is an alternate way to experience an existing assessment.

### How it works
- Standard MCQ: learner sees a question and must select the correct answer.
- Puzzle Mode MCQ (flipped): learner sees the **answer** and must **construct the question** that leads to it.
- This format deepens conceptual understanding by reversing the direction of reasoning.

### Availability matrix

| Assessment Type | Free | Basic | Professional | Premium |
|---|---|---|---|---|
| Daily Quiz | Never | Never | Never | Never |
| Full Test | Never | Never | Never | Yes |
| Subject Test | Never | Never | Yes | Yes |
| Chapter Test | Never | Never | Never | Yes |

### Implementation notes
- The `Assessment.isPuzzleMode` boolean flag indicates whether a given assessment record is the Puzzle Mode variant.
- Puzzle Mode assessments are separate records from their standard counterparts; they share the same subject/chapter scope but have `isPuzzleMode: true`.
- The UI should surface Puzzle Mode as a toggle or alternate card — not as a separate nav section.

---

## 5. Attempt Rules

### Structure
- Every assessment has a maximum of **5 attempts**.
- Attempts are tracked per user per assessment via `UserAssessmentProgress`.

### Access
- **Attempt 1** is free for all users whose tier grants access to the assessment type.
- **Attempts 2–5** require a **one-time unlock payment** per assessment. This is separate from the subscription tier.
- Once unlocked, attempts 2–5 are all available (the single payment unlocks all remaining attempts).

### Tracking
- `UserAssessmentProgress.attemptsUsed` — how many attempts have been consumed (0–5).
- `UserAssessmentProgress.attemptsMax` — always 5.
- `UserAssessmentProgress.isPaid` — `true` if the unlock payment has been made (attempts 2–5 available).

### Edge cases
- A user who has used all 5 attempts cannot retake the assessment regardless of payment.
- A user whose tier is later downgraded loses access to assessment types above their new tier but retains their historical `attemptsUsed` data.

---

## 6. getCardStatus() Logic

`getCardStatus()` is a pure function used on the `/assessments` page to determine the CTA state for each `AssessmentCard`. It lives in `src/utils/access.ts`.

### Signature
```ts
function getCardStatus(
  assessment: Assessment,
  progress: UserAssessmentProgress | null,
  userTier: Tier
): CardStatus
```

### Return values and their conditions

| Status | Condition | CTA label |
|---|---|---|
| `"start"` | User's tier grants access to this assessment type **AND** `attemptsUsed === 0` | "Start" |
| `"continue"` | User's tier grants access **AND** `attemptsUsed > 0` **AND** `attemptsUsed < 5` | "Continue" |
| `"locked"` | User's tier does **not** grant access to this assessment type | "Unlock" (links to /plans) |
| `"upgrade"` | User's tier grants access **BUT** `attemptsUsed === 5` (all attempts exhausted) | "Upgrade" (links to /plans) |

### Decision order
1. Check tier access first. If the user's tier cannot access the assessment type → `"locked"`.
2. Check attempts. If `attemptsUsed === 0` → `"start"`.
3. If `attemptsUsed > 0 && attemptsUsed < 5` → `"continue"`.
4. If `attemptsUsed === 5` → `"upgrade"`.

### Notes
- If `progress` is `null`, treat `attemptsUsed` as `0`.
- `"locked"` takes precedence over attempt counts. Never show attempt info for locked assessments.
- `"upgrade"` on the /plans page should highlight the current plan's limitations and suggest the next tier up — but `getCardStatus` itself only returns the status string; the UI component handles the rest.

---

## 7. XP and Gamification Rules

### XP Awards

| Event | XP Earned |
|---|---|
| Daily Quiz completed | +10 XP |
| Subject Test completed | +50 XP |
| Full Test completed | +100 XP |
| Chapter Test completed | +75 XP |
| Streak maintained (daily bonus) | +5 XP/day |

### XP Rules
- **XP never decreases** under any circumstance.
- XP is awarded on assessment **completion**, not on a passing score. Any submitted attempt earns XP.
- Duplicate-attempt XP: each completed attempt of an assessment awards XP (not just the first).

### Streak Rules
- A **streak** is the count of consecutive calendar days on which the user completes at least one assessment or Daily Quiz.
- If a day is missed, the streak **resets to 0**.
- There is **no penalty XP** for breaking a streak — only the streak counter resets.
- The daily bonus of +5 XP is awarded each day when the streak is maintained (i.e. the user was active yesterday and is active today).
- The +5 bonus is applied once per day regardless of how many assessments are completed that day.

### Level / Progression
- XP thresholds for levels are defined in `src/utils/xp.ts`.
- The `XPProgressBar` component on `/quest` visualises current XP toward the next level threshold.
- Level badge is displayed on the learner's avatar via `AvatarDisplay`.

### Mastery
- `UserAssessmentProgress.masteryPercent` tracks rolling concept mastery per assessment (0–100).
- Mastery increases as the learner answers concept-tagged questions correctly across attempts.
- Mastery is displayed in the `ConceptBreakdown` component on `/quiz/results`.
---
## Chapter Tests Content Hierarchy
Exam → Subject → Skill Group → Individual Chapter Test

SAT:
  Reading & Writing: [Single Passage Basics, Dual Passages, Craft & Structure, Information & Ideas, Standard English Conventions, Expression of Ideas]
  Math: [Algebra, Advanced Math, Problem-Solving & Data Analysis, Geometry & Trigonometry]
JEE:
  Physics: [Mechanics, Thermodynamics, Electromagnetism, Optics, Modern Physics]
  Chemistry: [Organic, Inorganic, Physical]
  Math: [Calculus, Algebra, Coordinate Geometry, Trigonometry]
NEET:
  Biology: [Cell Biology, Genetics, Ecology, Human Physiology, Plant Physiology]
  Physics: [Mechanics, Thermodynamics, Optics, Electromagnetism]
  Chemistry: [Organic, Inorganic, Physical]
PMP:
  Domains: [Predictive, Agile, Hybrid, Stakeholder Engagement, Risk Management]

Skill Group data is entered by Super Admin and stored in DB.
Individual chapter tests belong to one skill group.

## Chapter Tests UI Pattern
- Subject = section header (sticky divider)
- Skill Group = accordion row (expandable/collapsible, shows test count)
- Individual tests = 2-column card grid inside accordion
- Card anatomy: title, difficulty badge, description, duration, question count, attempts left, Start/Locked CTA
- NO exam badge chip or subject chip on the card (subject is the section header)

## Mock Pricing (No Razorpay for MVP)
- /plans page shows 3 plan cards: Basic ₹299/mo, Professional ₹599/mo, Premium ₹999/mo
- On CTA click → confirmation modal fires (see copy below)
- On confirm → Supabase UPDATE users SET subscription_tier = '[tier]', subscription_status = 'active',
  subscription_start_date = NOW(), subscription_end_date = NOW() + INTERVAL '30 days'
- Redirect to /assessments with dismissable success banner

UPGRADE modal copy (static, no real math):
  "Upgrading from [CurrentPlan] → [NewPlan]. Your new plan activates immediately.
   (₹[diff]/month difference — billing simulated)"

DOWNGRADE modal copy:
  "Downgrading from [CurrentPlan] → [NewPlan]. Takes effect immediately.
   Access to [locked features] will be removed now.
   (Proration simulated — no actual charge adjustment)"

CANCEL modal copy:
  "Cancelling your subscription. You will be moved to the Free plan immediately.
   You will lose access to [feature list for current plan]."

DOWNGRADE RULES (immediate, Option A):
- Tier changes the moment user confirms
- In-progress assessments above new tier = blocked immediately (Option A)
- No cron jobs, no scheduled downgrade

## Supabase users table additions (Razorpay-ready, nullable for mock)
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS razorpay_plan_id TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_onboarded BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_exams TEXT[] DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS goal TEXT NULL;

## Test Account (single)
test@keyskillset.com — starts as Free, upgrade/downgrade via /plans

## Dev Tier Switcher
- Activated via ?dev=true query param on any page
- Renders a floating pill (bottom-right, z-50) with 4 tier buttons
- Clicking a tier = Supabase UPDATE subscription_tier for current user
- Visible ONLY when process.env.NODE_ENV === 'development'
- Never renders in production

## Onboarding Flow
- Step 1: display_name (text input) + goal (select: "Crack SAT", "Crack JEE", "Crack NEET", "PMP Certification", "General Skill Building")
- Step 2: exam multi-select (SAT, IIT-JEE, NEET, PMP) — stored as selected_exams TEXT[]
- On complete: subscription_tier = 'free', user_onboarded = false (tour not yet shown)
- Redirect to: /assessments (auto-filtered to first selected exam)
- First-visit banner on /assessments: "You're on the Free plan. Daily Quiz is free →  Upgrade to unlock all tests [Compare Plans]"

## Welcome Tooltip Tour (Dashboard only)
- 3–4 step anchored tooltip tour, shown ONCE after first Dashboard visit
- Anchors: 1. Streak counter, 2. Today's Daily Quiz widget, 3. Quest Map preview, 4. Locked assessment teaser
- On completion or dismiss: UPDATE users SET user_onboarded = true
- Re-triggerable from Profile dropdown → "Retake Platform Tour" → resets user_onboarded = false,
  redirects to /dashboard, tour re-fires

## Profile Dropdown Structure (top-right nav)
- Avatar + display_name
- Current Plan badge (e.g., "Professional")
- Menu items:
    Subscription → /profile/subscription (manage plan)
    Retake Platform Tour → resets + redirects
    Settings → /profile/settings (placeholder for now)
    Sign Out

## Profile → Subscription Page (/profile/subscription)
Current Plan: [tier name]  [Active badge]
Simulated renewal: [subscription_end_date formatted]
───────────────────────────
[Upgrade to Premium →]     (hidden if already Premium)
[Downgrade to Basic]       (hidden if already Basic or Free)
[Cancel Subscription]      (hidden if already Free)
───────────────────────────
[Retake Platform Tour]

## Chapter Tests Content Hierarchy
Exam → Subject → Skill Group → Individual Chapter Test (accordion UI)

SAT:
  Reading & Writing: [Single Passage Basics, Dual Passages, Craft & Structure,
                      Information & Ideas, Standard English Conventions, Expression of Ideas]
  Math: [Algebra, Advanced Math, Problem-Solving & Data Analysis, Geometry & Trigonometry]
JEE:
  Physics: [Mechanics, Thermodynamics, Electromagnetism, Optics, Modern Physics]
  Chemistry: [Organic Chemistry, Inorganic Chemistry, Physical Chemistry]
  Math: [Calculus, Algebra, Coordinate Geometry, Trigonometry]
NEET:
  Biology: [Cell Biology, Genetics, Ecology, Human Physiology, Plant Physiology]
  Physics: [Mechanics, Thermodynamics, Optics, Electromagnetism]
  Chemistry: [Organic Chemistry, Inorganic Chemistry, Physical Chemistry]
PMP:
  Domains: [Predictive, Agile, Hybrid, Stakeholder Engagement, Risk Management]

Chapter Tests UI pattern:
  - Subject = sticky section header divider
  - Skill Group = accordion row (expandable, shows test count, 0% progress)
  - Tests = 2-col card grid inside expanded accordion
  - Card: title, difficulty badge, description, duration, question count, attempts left, Start/Locked CTA
  - NO exam badge chip or subject chip on individual cards
  - Skill group metadata is Super Admin-entered, stored in DB

## Future Org Structure (DO NOT BUILD YET — reference only)
users.organization_id  TEXT NULL  — null for B2C, org ID for B2B enrolled users
users.role             TEXT DEFAULT 'student'  — student | content_creator | org_admin | client_admin | super_admin
assessments.visibility TEXT DEFAULT 'global'   — global | org_specific
assessments.org_id     TEXT NULL               — null for global content

## Question Types (5 total)

### 1. MCQ Single
- Full-width question text
- 4 options (A/B/C/D) as bordered rows
- One correct answer
- Review state: correct option = emerald-50 bg + emerald-600 border + CheckCircle icon
  Wrong selected = rose-50 bg + rose-600 border + XCircle icon
  Unselected options = zinc-50 bg

### 2. MCQ Multiple
- Same layout as MCQ Single
- Multiple options can be correct
- Review state: each correct option highlighted individually
- User's selected wrong options highlighted in rose

### 3. Numeric
- Full-width question text (may include math notation)
- Input display: "Your answer: [value]" vs "Correct answer: [value]"
- No options — just two value rows
- Correct: emerald row. Wrong: rose row.

### 4. Passage Single
- Split-screen layout: passage LEFT (50%), question + options RIGHT (50%)
- Explanation appears BELOW the split as a full-width section
- On mobile: passage stacked above question

### 5. Passage Multi
- Split-screen: passage LEFT (50%), multiple questions RIGHT (50%, scrollable)
- Each question = independent MCQ Single within the right panel
- Explanation per question appears inline below each question in review mode
- CLAT will be primarily this type (V2)

## Math Notation
- Use superscript HTML (<sup>) for exponents in mock: x<sup>-12</sup>y<sup>16</sup>
- KaTeX or MathJax integration = V2 (engineering to implement with real content)
- All current mock math questions use plain text with <sup> tags

## Explanation Component (all question types)
Structure:
  1. Explanation header: "EXPLANATION:" (blue-700, font-medium)
  2. Answer statement: "Correct answer is [option/value]" (font-semibold)
  3. Option-by-option breakdown (for MCQ types): why each option is right/wrong
  4. Step-by-step for math (numeric + math MCQ): numbered steps
  5. VIDEO SLOT: placeholder div with <VideoIcon /> + "Video explanation coming soon"
     — hidden behind a feature flag: NEXT_PUBLIC_VIDEO_EXPLANATIONS_ENABLED=false
     — When enabled, embeds video player here

## Assessment Architecture: Linear vs Adaptive
Linear (NEET, JEE):
  - All questions in one sequence
  - No modules, no breaks
  - Single score at end
  - question_order is fixed, stored in assessment.questions[]

Adaptive/Modular (SAT):
  - 4 modules: RW Module 1, RW Module 2, Math Module 1, Math Module 2
  - Break screen between RW and Math sections
  - Branch config: performance on Module 1 determines difficulty of Module 2
  - Per-module scores + total score
  - Stored in assessment.modules[] with branch_config

## Attempt Locking Rule
- Attempts are sequential: cannot start Attempt N+1 until Attempt N is completed OR abandoned
- Abandoned = terminal status, counts as used attempt, unlocks next
- Locked attempt row copy: "Complete Attempt [N] to unlock"
- Abandon confirmation: "This will forfeit Attempt [N]. Score will be 0. Cannot be undone."

## Score Tracking
- best_score tracked per assessment per user
- NEET + JEE: raw score (marks-based, can be negative for wrong)
- SAT: scaled score 400–1600 (two section scores 200–800 each)
- PMP: percentage-based pass/fail
- Score trend tracked across all completed attempts for analytics tab

## Content Creator DB (same Supabase project)
- Role column: users.role — 'student' | 'content_creator' | 'org_admin' | 'client_admin' | 'super_admin'
- Questions table: accessible to content_creator role and above
- Assessments table: accessible to content_creator role and above
- End user reads only — no write access to questions/assessments tables
- Base44 platform = content creator UI (external tool, same DB via Supabase API keys)
