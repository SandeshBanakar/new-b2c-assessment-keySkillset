# PRD KSS-ANA-001: Linear Analytics V2 — Score Trajectory, Mistake Intelligence, Leverage Actions, Rank Prediction

**Status:** DRAFT  
**Author:** Sandesh Banakar I  
**Date:** Apr 20 2026  
**Target Version:** V1

> **Navigation Policy — LOCKED (Apr 21 2026):** The standalone Navigation Policy dropdown is removed from the Linear form. "Allow Sectional Navigation" toggle drives both `timer_mode` + `navigation_policy` in assessment_config. Toggle ON → FREE/FULL. Toggle OFF → SECTION_LOCKED/SECTIONAL. Analytics reads of `navigation_policy` remain valid. See PRD-SA-CREATE-ASSESSMENTS.md §3.4.

---

## 1. Executive Summary

### 1.1 Problem Statement
The existing `AnalyticsTab.tsx` for linear assessments (NEET/JEE/CLAT and all non-SAT assessments) shows score summary, section breakdown, concept mastery, AI insights, and solutions — but lacks:
- A **visual score progression** across attempts (students can't see improvement trajectory)
- **Mistake pattern classification** (can't distinguish careless errors from concept gaps)
- **Leverage-weighted concept prioritisation** (current Strengths/WeakSpots shows what's good/bad, not what's worth fixing *first*)
- **Predicted rank/percentile** anchored to real exam data (no north-star metric per attempt)

### 1.2 Business Value
- Score trajectory + rank prediction creates an **emotional hook** — students see their projected AIR improving, which increases engagement and retention.
- Mistake intelligence gives students **actionable next-steps** beyond just a percentage — "15 careless mistakes cost you 15 marks" is more motivating than "74% accuracy."
- Leverage actions drive **study plan engagement** — directs time to highest-ROI concepts.
- Rank prediction is a **conversion lever** — showing a student they're 200 AIR away from AIIMS Delhi creates urgency to attempt more (upgrade from Free/Basic).

### 1.3 Strategic Alignment
Builds on KSS-SAT-A02 (SAT Analytics V2) pattern. Shares component architecture. Extends analytics value proposition to NEET/JEE/CLAT — the majority of the user base.

---

## 2. User Personas & Impact

| Persona | Impact |
|---|---|
| **Free User** | Sees ScoreTrajectory (greyed slots 2–6), teaser of RankPrediction, MistakeIntelligence empty state. Clear upgrade signal. |
| **Basic User** | Full ScoreTrajectory + RankPrediction + MistakeIntelligence. No AI Insight. LeverageActions visible. |
| **Pro/Premium User** | Full access to all blocks including AI Insight. Full MistakeIntelligence with real data. |
| **Super Admin** | Can update rank prediction lookup tables per exam per year via Platform Config. Can toggle which year is active. |

---

## 3. Scope

### 3.1 IN SCOPE (V1)

- **ScoreTrajectoryChart** — shared standalone component. Linear assessments only.
- **RankPredictionCard** — separate card. NEET/JEE/CLAT only (guarded by exam type). Standalone component.
- **MistakeIntelligence** — standalone component. Requires `attempt_answers` seeding.
- **LeverageActions** — replaces existing Strengths/WeakSpots block in `AnalyticsTab.tsx`.
- **DB migrations:** KSS-DB-048 (target scores on users) + KSS-DB-049 (rank_prediction_tables).
- **Data seeding:** 2 NEET FT, 2 JEE FT, 2 CLAT FT attempt_answers rows for Premium demo user.
- **Platform Config:** "Rank Prediction" sub-tab on NEET/JEE/CLAT exam categories.
- **AnalyticsTab.tsx integration** — import and place new components in correct block order.
- **AppContext wiring** — target_neet_score, target_jee_score, target_clat_score read/write.

### 3.2 OUT OF SCOPE (V2 / Deferred)

- SAT ScoreTrajectory — SAT uses its own `SATAnalyticsTab.tsx`. Not modified.
- Exam-specific insights (NEET biology split, JEE integer opportunity, CLAT passage pacing) — LOCKED OUT.
- Peer percentile / cohort comparison — no cohort data.
- Recovery Journey (previous real exam score) — no DB column.
- Exam countdown — no exam date stored.
- Shareable Rank Card (social sharing) — deferred.
- Onboarding modal / target collection flow — deferred (inline prompt only in V1).
- Section Performance sparklines (cross-attempt section data) — deferred.
- Per-row SA editing of rank prediction lookup data — V2. V1: SA toggles active year only.

---

## 4. New Block Order in `AnalyticsTab.tsx`

Blocks 1, 2, 4, 5, 6, 7 from existing build are **unchanged**. Block 3 (Strengths/WeakSpots) is **replaced** by LeverageActions. New blocks inserted at positions 3 and 4.

| Position | Block | Status |
|---|---|---|
| 1 | Attempt Pill Filter | ✅ Existing — unchanged |
| 2 | Score Summary (score, accuracy, attempt count) | ✅ Existing — unchanged |
| **3** | **ScoreTrajectoryChart** | 🆕 New component |
| **4** | **RankPredictionCard** | 🆕 New component (NEET/JEE/CLAT only) |
| 5 | Marks Lost (negative marking — existing Block 2) | ✅ Existing — unchanged |
| 6 | Section Breakdown | ✅ Existing — unchanged |
| **7** | **MistakeIntelligence** | 🆕 New component |
| 8 | Concept Mastery heatmap/table | ✅ Existing — unchanged |
| **9** | **LeverageActions** | 🆕 Replaces Strengths/WeakSpots |
| 10 | AI Insight (Pro/Premium gated) | ✅ Existing — unchanged |
| 11 | Solutions Panel | ✅ Existing — unchanged |

---

## 5. Component Specifications

### 5.1 ScoreTrajectoryChart

**File:** `src/components/assessment-detail/ScoreTrajectoryChart.tsx`

**Purpose:** Show score progression across up to 6 attempts with target line.

**Props:**
```typescript
interface ScoreTrajectoryChartProps {
  attempts: { id: string; attempt_number: number; score: number | null; accuracy_percent: number | null; completed_at: string | null; is_free_attempt: boolean }[];
  exam: string;          // 'NEET' | 'JEE' | 'CLAT' | other
  targetScore: number | null;
  onSetTarget: (score: number) => void;
  scoreMax: number;      // 720 for NEET, 300 for JEE, 120 for CLAT, assessments.score_max for others
}
```

**Chart design:**
- X-axis: exactly 6 slots, labelled "Attempt 1"–"Attempt 6"
- Attempt 1 additionally labelled "Free" (badge or sub-label)
- Filled slots: bar or dot + connecting line in exam accent colour
- Empty slots (attempt not yet taken): greyed-out placeholder bar, ~20% opacity, dashed border
- Y-axis: 0 → scoreMax. Adapts per exam.
- Target line: horizontal dashed line in emerald-500 at targetScore value
- If score is null (exam has no score field): use accuracy_percent × (scoreMax / 100) as proxy value, label y-axis as "Accuracy (%)"
- Tooltip on hover: "Attempt N · Score: X / scoreMax · Date"
- Implementation: SVG-based (inline SVG, no external chart library). Mirror ScoreTrajectoryChart pattern from SAT if one already exists in src/components/ui/.

**Target score interaction:**
- If targetScore is null: render a soft inline prompt below the chart — "Set a target score" with a small input field + ✓ button
- On confirm: call `onSetTarget(value)` → parent saves to Supabase + AppContext
- If targetScore is set: show it as a label on the target line ("Target: 650")
- Validation: must be within exam valid range (NEET: 0–720, JEE: 0–300, CLAT: 0–120)

**DB columns for target scores (KSS-DB-048):**

| Exam | Column | Type | Range |
|---|---|---|---|
| NEET | `users.target_neet_score` | INTEGER NULL | 0–720 |
| JEE | `users.target_jee_score` | INTEGER NULL | 0–300 |
| CLAT | `users.target_clat_score` | INTEGER NULL | 0–120 |

AppContext must expose these alongside existing `target_sat_score`. Read on load, write on set.

---

### 5.2 RankPredictionCard

**File:** `src/components/assessment-detail/RankPredictionCard.tsx`

**Purpose:** Show predicted AIR (NEET/CLAT) or percentile band (JEE) for the user's current score.

**Visibility guard:** Only render for exams `NEET | JEE | CLAT`. Hidden for all other exams.

**Props:**
```typescript
interface RankPredictionCardProps {
  exam: 'NEET' | 'JEE' | 'CLAT';
  currentScore: number | null;   // selectedAttempt.score
  targetScore: number | null;
  lookupData: RankLookupRow[];   // loaded from rank_prediction_tables
  dataYear: number;              // year of active lookup (for disclaimer)
}

type RankLookupRow =
  | { marks: number; rank: number }                                    // NEET / CLAT
  | { marks: number; percentile_low: number; percentile_high: number } // JEE
```

**Display:**
- NEET / CLAT: "Predicted AIR: ~3,200" (single interpolated value, formatted with commas or "K" suffix)
- JEE: "Predicted Percentile: 96th–98th" (band, lower and upper from interpolated lookup)
- Disclaimer on all: "Based on [year] official data. Actual ranks vary by exam difficulty."
- If targetScore set: show "Gap to target" — e.g., "Need ~50 more marks to reach AIR 2,000"
- If currentScore null or lookupData empty: show empty state card with "Score data unavailable for prediction"

**Interpolation algorithm (client-side, same for all):**
```typescript
function interpolateRank(marks: number, table: RankLookupRow[]): number {
  // Sort descending by marks
  // Find bracket where marks falls between table[i].marks and table[i+1].marks
  // Linear interpolation between bracket values
  // Clamp to table min/max
}
```

**DB table: rank_prediction_tables (KSS-DB-049)**
```sql
CREATE TABLE IF NOT EXISTS rank_prediction_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_category_id UUID NOT NULL REFERENCES exam_categories(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  data JSONB NOT NULL DEFAULT '[]',
  updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (exam_category_id, year)
);
```

`data` JSONB shape:
- NEET/CLAT: `[{"marks": 720, "rank": 1}, {"marks": 710, "rank": 50}, ...]` sorted marks DESC
- JEE: `[{"marks": 300, "percentile_low": 99.9, "percentile_high": 100}, ...]` sorted marks DESC

**Seeded data (2025 official/coaching-institute data):**

NEET 2025 (marks → rank, approximate from NTA official):

| Marks | Predicted AIR |
|---|---|
| 720 | 1 |
| 710 | 50 |
| 700 | 100 |
| 678 | 250 |
| 660 | 800 |
| 640 | 2000 |
| 620 | 4000 |
| 600 | 8000 |
| 580 | 15000 |
| 560 | 25000 |
| 540 | 40000 |
| 520 | 60000 |
| 500 | 85000 |
| 480 | 120000 |
| 450 | 180000 |
| 420 | 250000 |
| 390 | 350000 |
| 360 | 480000 |
| 330 | 600000 |
| 300 | 750000 |
| 144 | 1300000 |

JEE Mains 2025 (marks → percentile band — normalised, shift-dependent):

| Marks | %ile Low | %ile High |
|---|---|---|
| 300 | 99.99 | 100 |
| 280 | 99.9 | 99.99 |
| 260 | 99.7 | 99.9 |
| 240 | 99.2 | 99.7 |
| 220 | 98.5 | 99.2 |
| 200 | 97.5 | 98.5 |
| 180 | 95.8 | 97.5 |
| 160 | 93.0 | 95.8 |
| 140 | 89.0 | 93.0 |
| 120 | 83.0 | 89.0 |
| 100 | 75.0 | 83.0 |
| 80 | 65.0 | 75.0 |
| 60 | 50.0 | 65.0 |
| 35 | 0 | 50.0 |

CLAT 2025 (marks out of 120 → rank, consortium data):

| Marks | Predicted Rank |
|---|---|
| 110 | 1 |
| 107 | 10 |
| 104 | 50 |
| 101 | 150 |
| 98 | 350 |
| 95 | 700 |
| 92 | 1200 |
| 88 | 2000 |
| 84 | 3500 |
| 80 | 5500 |
| 75 | 9000 |
| 70 | 14000 |
| 60 | 30000 |
| 50 | 55000 |
| 40 | 90000 |

**Fetch strategy:** AnalyticsTab fetches active `rank_prediction_tables` row for the current exam category **once** on mount. Interpolation is client-side. No per-attempt fetch.

---

### 5.3 MistakeIntelligence

**File:** `src/components/assessment-detail/MistakeIntelligence.tsx`

**Purpose:** Classify each answered question in the selected attempt into one of 6 behavioural categories. Surface counts + actionable advice.

**Props:**
```typescript
interface MistakeIntelligenceProps {
  attemptId: string;
  exam: string;
}
```

**Classification rules (from INFERENCE-ENGINE.txt, global avg time):**

Global average time-per-question for the attempt:
```
global_avg = total_time_spent_seconds (sum of all attempt_answers.time_spent_seconds) / total_question_count
```

| Category | Condition | Colour |
|---|---|---|
| Careless Mistake | `is_correct=false AND is_skipped=false AND time < 40% of global_avg` | amber |
| Concept Gap | `is_correct=false AND is_skipped=false AND time > 120% of global_avg` | rose |
| Panic Skip | `is_skipped=true AND time < 15s` | violet |
| Knowledge Skip | `is_skipped=true AND time > 60s` | blue |
| Fragile Correct | `is_correct=true AND time > 180% of global_avg` | orange |
| Confident Correct | `is_correct=true AND time < 60% of global_avg` | emerald |

Questions in the "normal zone" (do not meet any threshold) are not categorised. Normal zone = correct or incorrect within normal time bands.

**UI design — 6 category tiles (2×3 grid on desktop, 1-col on mobile):**

Each tile:
- Icon (emoji or Lucide) + Category label
- Count (large, bold, `—` if no data)
- 1-line description of what it means
- 1-line action tip (fixed copy per category)

**Summary bar below tiles:**
- Total answerable questions
- "X questions cost you Y marks" (Careless + Concept Gap counts × neg_marks per exam)
- "Z correct questions are fragile under real exam pressure"

**Empty state:** When `attempt_answers` do not exist for the selected attempt:
- All 6 tiles render with count = `—`
- Below tiles: subtle info message — "Detailed answer tracking is not available for this attempt."
- No loading spinner — render empty state immediately if no data

**Fetch:** Single query on `attempt_answers` filtered by `attempt_id`. If 0 rows → empty state. Compute classifications client-side.

**Data seeding requirements (SEED-LA-001 through SEED-LA-006):**

2 attempts per exam, premium user `191c894d-b532-4fa8-b1fe-746e5cdcdcc8`:

| Exam | Assessment | Attempt # | Questions |
|---|---|---|---|
| NEET | NEET Full Test 1 | 1 (free) | 180 questions with time + outcome |
| NEET | NEET Full Test 1 | 2 (paid) | 180 questions with time + outcome |
| JEE | JEE Full Test 1 | 1 (free) | 90 questions with time + outcome |
| JEE | JEE Full Test 1 | 2 (paid) | 90 questions with time + outcome |
| CLAT | CLAT Full Test 1 | 1 (free) | 150 questions with time + outcome |
| CLAT | CLAT Full Test 1 | 2 (paid) | 150 questions with time + outcome |

Seeding distribution per attempt (realistic mix):
- Correct + fast (Confident Correct): ~25%
- Correct + normal time: ~30%
- Correct + slow (Fragile Correct): ~10%
- Wrong + fast (Careless): ~10%
- Wrong + normal time: ~10%
- Wrong + slow (Concept Gap): ~8%
- Skipped + fast (Panic Skip): ~4%
- Skipped + slow (Knowledge Skip): ~3%

SQL goes in `SQL-RESPONSE-2.txt` (or next available SQL file). Section IDs must match `attempt_section_results.section_id` values already seeded.

---

### 5.4 LeverageActions (replaces Strengths/WeakSpots)

**File:** `src/components/assessment-detail/LeverageActions.tsx`

**Purpose:** Surface top 3 highest-ROI concepts — those with the most marks recoverable if improved. Replaces the existing Strengths/WeakSpots grid in `AnalyticsTab.tsx` (Block 3 in old order).

**Props:**
```typescript
interface LeverageActionsProps {
  conceptMastery: ConceptMastery[];   // all rows for all attempts (already loaded by AnalyticsTab)
  selectedAttemptNum: number;
  attemptId: string;
  exam: string;
  negMark: number;                    // from NEG_MARKS constant
}
```

**Calculation — "marks lost per concept" (rich path):**

1. Fetch `attempt_answers` for the selected attempt (already fetched if MistakeIntelligence also loaded — share the fetch, don't double-query)
2. JOIN with concept mastery by `concept_tag` (text match — `attempt_answers.concept_tag` matches `user_concept_mastery.concept_tag`)
3. Per concept: `marks_lost = SUM(attempt_answers WHERE concept_tag = X AND is_correct = false) × avg_marks_per_question` — use `marks_awarded` sum inversion: marks_lost = (total_possible - marks_awarded_sum) for that concept's questions
4. Sort descending by marks_lost
5. Show top 3

**Fallback (if no attempt_answers for this attempt):**
- Sort concept mastery by `mastery_percent` ascending (worst first)
- Top 3 weakest concepts
- Show mastery % only — no marks-lost figure
- Label: "Questions to recover" = `total_count × (1 - mastery_percent/100)` rounded

**Time insight per concept (from MistakeIntelligence data if available):**
- If majority of wrong answers on this concept were fast → "⚡ Likely careless — slow down and verify"
- If majority were slow → "🧩 Concept gap — needs targeted revision"
- If no time data → "📖 Review this concept"

**Card design — 3 columns desktop, stacked mobile:**
- Numbered badge (1, 2, 3)
- Concept name + exam section label (colour-coded)
- Marks lost (or mastery %)
- Accuracy badge
- Time insight line
- Total header: "Fix these 3 to recover ~X marks"

---

## 6. Platform Config — Rank Prediction Sub-tab

**Location:** Platform Config → [NEET / JEE / CLAT] category → "Rank Prediction" sub-tab (alongside existing "Concept Tags" and "Analytics Display" sub-tabs)

### 6.1 Sub-tab UI (V1 — year toggle only)

- List of available years from `rank_prediction_tables` for this exam_category_id
- Each row: year, is_active toggle, "Updated by" + "Updated at"
- Only ONE year can be active at a time (toggling one off when activating another — enforced server-side)
- "Add Year" button: opens slide-over with year input + textarea for JSON data paste
- JSON format hint shown: `[{"marks": 720, "rank": 1}, ...]` for NEET/CLAT; `[{"marks": 300, "percentile_low": 99.9, "percentile_high": 100}, ...]` for JEE
- No per-row editing of data in V1. Full table edit deferred to V2.
- V2 deferred: row-by-row add/edit/delete for lookup entries

### 6.2 NEET/JEE/CLAT — "Coming Soon" on Analytics Display
- The "Analytics Display" sub-tab (which currently exists for SAT) shows "Coming Soon" for NEET/JEE/CLAT
- This is unchanged from the current "Coming Soon" placeholder

---

## 7. DB Migrations

### KSS-DB-048 — users target score columns
```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS target_neet_score INTEGER NULL,
  ADD COLUMN IF NOT EXISTS target_jee_score INTEGER NULL,
  ADD COLUMN IF NOT EXISTS target_clat_score INTEGER NULL;
```
Validation constraints (enforce in UI, not DB):
- `target_neet_score`: 0–720
- `target_jee_score`: 0–300
- `target_clat_score`: 0–120

### KSS-DB-049 — rank_prediction_tables
```sql
CREATE TABLE IF NOT EXISTS rank_prediction_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_category_id UUID NOT NULL REFERENCES exam_categories(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  data JSONB NOT NULL DEFAULT '[]',
  updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (exam_category_id, year)
);
```

Seed: insert 3 rows (NEET 2025, JEE 2025, CLAT 2025) with `is_active = true` using the lookup tables defined in §5.2.

---

## 8. AppContext Changes

Add to `AppContext` user shape:
```typescript
target_neet_score: number | null;
target_jee_score: number | null;
target_clat_score: number | null;
```

Add `updateTargetScore(exam: 'NEET' | 'JEE' | 'CLAT', score: number): Promise<void>` method — writes to `users` table + updates local context state. Reuses same pattern as existing `updateUser()`.

---

## 9. AnalyticsTab Fetch Changes

Additional fetch needed on `AnalyticsTab` mount (after attempts loaded):

```typescript
// 1. Active rank prediction lookup for this exam (once on mount)
const { data: rankLookup } = await supabase
  .from('rank_prediction_tables')
  .select('data, year')
  .eq('exam_category_id', examCategoryId)  // derived from assessment.exam
  .eq('is_active', true)
  .maybeSingle();

// 2. attempt_answers for selected attempt (also used by MistakeIntelligence + LeverageActions)
// Already being considered — fetch shared across both components via prop/context
// NOT fetched twice. Pass attemptAnswers as prop to both MistakeIntelligence + LeverageActions.
```

Note: `examCategoryId` must be resolved from `assessment.exam` string (e.g., 'NEET' → `23d482e7-...`). Use the `EXAM_TO_CATEGORY_ID` constant map from `CLAUDE-DB.md` confirmed IDs.

---

## 10. Edge Cases

| Case | Behaviour |
|---|---|
| No completed attempts | Existing empty state in AnalyticsTab — ScoreTrajectory shows 6 greyed slots with no data |
| Only 1 attempt | ScoreTrajectory: slot 1 filled, slots 2–6 greyed. RankPrediction still functional. |
| score = null (accuracy-only assessment) | ScoreTrajectory uses accuracy_percent × scoreMax as Y value. RankPrediction hidden. |
| No rank_prediction_tables row for exam | RankPredictionCard shows empty state: "Rank prediction data not configured for this exam." |
| No attempt_answers for attempt | MistakeIntelligence shows all tiles with `—`. LeverageActions falls back to mastery_percent. |
| target score not set | ScoreTrajectory shows no target line + soft inline prompt. RankPredictionCard can still show current predicted rank. |
| JEE percentile band: marks exactly on boundary | Use the lower bracket row (round down). |

---

## 11. Impacted Existing Components

| Component | Change |
|---|---|
| `AnalyticsTab.tsx` | Add imports + insert 4 new blocks. Remove Strengths/WeakSpots section (replaced by LeverageActions). Add rank lookup fetch. |
| `AppContext` / context provider | Add 3 target score fields + updateTargetScore() |
| `platform-config/page.tsx` | Add "Rank Prediction" sub-tab for NEET/JEE/CLAT categories |
| `CLAUDE-DB.md` | Add KSS-DB-048, KSS-DB-049 schema entries |

---

## 12. Success Metrics

- ScoreTrajectoryChart renders for all existing NEET/JEE/CLAT demo attempts without error
- MistakeIntelligence correctly classifies seeded attempt_answers using INFERENCE-ENGINE rules
- LeverageActions shows top 3 concepts ranked by marks lost for seeded attempts
- RankPrediction interpolates within ±10% of published coaching institute estimates for 2025 data
- Platform Config Rank Prediction sub-tab: SA can add a year, paste JSON, and toggle active
- `npm run build` passes clean after all changes
