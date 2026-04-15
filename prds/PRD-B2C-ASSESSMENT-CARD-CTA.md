# PRD — B2C Assessment Card CTA & Attempt State Model
# Status: IMPLEMENTED — Apr 15 2026
# Owner: keySkillset Product
# Ticket: KSS-SA-035
# Release: Release 32

---

## 1. Purpose

Define the complete CTA and state model for the B2C Assessment Card component. This PRD covers all card states (1–7), the No Retry decision, and the migration from mock data to real Supabase attempt data.

---

## 2. Problem Statement

**Before:**
- `AssessmentCard` CTAs were driven by `mockAttempts.ts`, keyed by user IDs like `'demo-free'` / `'demo-basic'` — not real Supabase UUIDs. All production users fell through to the 0-attempt default regardless of actual attempt history.
- State 6 showed a "View Analysis + Retry" split button, implying users could re-attempt completed tests.
- No clear product specification existed for all card states across user tiers.

**After:**
- Real attempt data fetched from Supabase via `useUserAttempts()` hook.
- States 6 + 7 collapsed to a single "View Analysis" button — no Retry.
- All card states fully specified per user tier and attempt count.

---

## 3. Card State Model

| State | Condition | CTA |
|-------|-----------|-----|
| 1 | Tier below `min_tier`, free attempt available | "Take Free Test" + "Upgrade to Access" |
| 2 | Tier below `min_tier`, free attempt exhausted | "Continue Your Test" + "Upgrade to Access" |
| 4 | Tier allows, 0 attempts | "Start Your Test" |
| 5 | Tier allows, attempt in progress | "Resume Test" |
| 6 | Tier allows, completed, attempts < 6 | "View Analysis" |
| 7 | All 6 attempts consumed | "View Analysis" |

States 6 and 7 are visually and functionally identical — single "View Analysis" button.

---

## 4. No Retry — Locked Decision

**Retry is permanently removed from the Assessment Card.**

- State 6 previously showed a split "View Analysis + Retry" button. This was removed.
- Users navigate to the detail page via "View Analysis". Retrying is handled within the detail/instructions page flow, not from the card.
- This is a product decision — not a bug. Do not re-introduce Retry on the card.

**Why:** The card is a discovery and navigation surface, not an action surface. Surfacing Retry on the card created confusion about whether it would start a new attempt immediately without showing instructions/time limits. Detail-page flow preserves the proper attempt confirmation step.

---

## 5. Data Layer — useUserAttempts Hook

### 5.1 Problem with mockAttempts.ts

`mockAttempts.ts` was keyed by string IDs (`'demo-free'`, `'demo-basic'`) that never matched real Supabase UUIDs. All real users fell to the 0-attempt default. The file is now dead code for the library section.

### 5.2 New Hook

**File:** `src/hooks/useUserAttempts.ts`

- Fetches all `attempts` rows for the current `userId` from Supabase in a single query
- Groups rows by `assessment_id`
- Derives per-assessment `MockAttemptData`:
  - `attemptsUsed`: row count
  - `status`: derived from latest attempt (highest `attempt_number`) — maps `COMPLETED` → `'completed'`, `IN_PROGRESS` → `'inprogress'`, else `'not_started'`
  - `isFreeAttempt`: true if any row has `is_free_attempt = true`
  - `lastAccessedAt`: `updated_at` of the latest attempt as epoch ms
  - `score`: score of the latest attempt
- Returns `Map<assessmentId, MockAttemptData>` keyed by UUID
- Exports `DEFAULT_ATTEMPT` constant for the zero-state

### 5.3 AssessmentLibrarySection Changes

- Replaced `getAttemptData(userId, assessment.title)` calls with `attemptsMap.get(assessment.id) ?? DEFAULT_ATTEMPT`
- `ExamCategorySection` now receives `attemptsMap` prop instead of `userId`
- Progress filter also uses `attemptsMap.get(a.id)` for consistency
- Loading spinner covers both `useAssessments` and `useUserAttempts` loading states

---

## 6. Demo Data — Per Persona State Expectations

| Persona | Tier | Assessment | Expected Card State |
|---------|------|------------|-------------------|
| Free User | free | SAT Full Test 1 | State 2 (free attempt completed, tier locked) |
| Free User | free | All others | State 1 (free attempt available) |
| Basic User | basic | SAT Full Test 1 | State 6 (3 attempts completed) |
| Basic User | basic | SAT Full Test 2 | State 6 (3 attempts completed) |
| Basic User | basic | JEE Full Test 1 | State 6 (2 attempts completed) |
| Basic User | basic | Subject tests | State 1 (tier locked, free attempt available) |
| Basic User | basic | Chapter tests | State 1 (tier locked, premium required) |
| Priya (Pro) | professional | SAT/NEET Full + Subject tests | State 7 (6 attempts each) |
| Priya (Pro) | professional | Chapter tests | State 1 (premium required) |
| Premium User | premium | SAT/JEE/NEET full + subject tests | State 6 or 7 depending on attempt count |
| Premium User | premium | Chapter tests (9 tests) | State 6 (2 attempts each) |

---

## 7. Files Modified

- `src/components/assessment/AssessmentCard.tsx` — States 6+7 collapsed, Retry removed
- `src/components/assessment/AssessmentLibrarySection.tsx` — replaced mock data with hook
- `src/hooks/useUserAttempts.ts` — new hook (created)
- `src/data/demoUsers.ts` — Premium User `selected_exams` updated to `['SAT', 'JEE', 'NEET', 'CLAT']`
- `src/components/quiz/RetryButton.tsx` — deleted (was a TODO stub returning null)

---

## 8. Deleted / Dead Code

- `src/components/quiz/RetryButton.tsx` — deleted. Was a TODO stub (`return null`), never imported anywhere.
- `src/data/mockAttempts.ts` — retained as type source (`MockAttemptData` interface used by hook and card). The `DEMO_ATTEMPTS` map and `getAttemptData` function are now dead code in the library section but not deleted to avoid breaking other potential consumers.

---

## 9. Build Validation

- `npm run build` — passed with no TypeScript errors post-implementation.
