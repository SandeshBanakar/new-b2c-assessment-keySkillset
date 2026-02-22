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
