# PRD KSS-ANA-002: Analytics V2 — Shared Components + SAT + Linear Fixes

**Status:** ACTIVE  
**Author:** Sandesh Banakar I  
**Date:** Apr 21 2026  
**Depends on:** KSS-SAT-A02 (SATAnalyticsTab), KSS-ANA-001 (LinearAnalyticsTab), KSS-SA-CA-001 (Adaptive form)

---

## 1. Problem Statement

Analytics across SAT and Linear assessments have diverged into duplicate implementations with different bugs:
- Duplicate components doing the same job (`SATMistakeTaxonomy` vs `MistakeIntelligence`, two inline Section Breakdowns, two inline Solutions panels with different rendering bugs)
- Demo/Preview components that should now be live (`SATPacingChart`, `SATMistakeTaxonomy`)
- UI bugs: SATHeroScore mobile overlap, wrong attempt sub-scores, target score as dropdown, duplicate attempt pills
- Sections that should be removed: Leverage panels in both tabs, Score/Accuracy/Attempts stats card in Linear
- Concept Mastery has no section granularity — shows all concepts flat with no way to filter by subject

---

## 2. What We're Building

1. **Shared `SectionBreakdown` component** — replaces two inline implementations
2. **Unified Mistake Taxonomy** — wire existing `MistakeIntelligence` (6-cat live classification) into SAT; delete `SATMistakeTaxonomy`
3. **Live `PacingAnalysis` component** — real `attempt_answers.time_spent_seconds` data, grouped by module/section; replaces `SATPacingChart` demo
4. **New `ConceptMasterySection` component** — per section, per attempt; dynamic section pills from DB; replaces both `ConceptMasteryPanel` (SAT) and Linear inline heatmap
5. **SAT HeroScore bug fixes** — mobile layout, selected attempt sub-scores, number input for target
6. **Attempt naming** — "Free Attempt" for attempt_number=1, "Attempt N" for others; deduplicate pills
7. **Solutions Panel** — fix blank SAT panel (module_name fallback); match Linear inline UI style to SAT accordion style
8. **Remove** Leverage panels, Stats card, PreviewSectionWrapper from both tabs
9. **Linear Score Trajectory target input** — number field, blocked on KSS-DB-048

---

## 3. What Is NOT In This Ticket

- Platform Config Analytics Config for scoring reference → moved to Create Adaptive Assessment form
- SAT Scoring Reference table → remains static
- `user_concept_mastery` table deprecated for UI (still written to by exam engine — untouched)
- Solutions Panel merge (SAT + Linear) → UI-match only, separate implementations kept
- Pacing real data formula for section-level averages per question → see §6.4

---

## 4. DB Work Required

### KSS-DB-048 — `users` target score columns (Linear ScoreTrajectory target input)
```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS target_neet_score INTEGER NULL;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS target_jee_score INTEGER NULL;
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS target_clat_score INTEGER NULL;
```
SQL file: `docs/requirements/SQL-ANA-002.txt` — STEP 1

### KSS-DB-053 — Backfill `attempt_answers.section_id` for NEET/JEE/CLAT
One-time UPDATE using `concept_tag → concept_tags.concept_name → subject → section_id`:
```sql
-- Derive section_id from concept_tag text via concept_tags.subject
-- NEET: Physics → 'physics', Chemistry → 'chemistry', Biology → 'biology'
-- JEE:  Physics → 'physics', Chemistry → 'chemistry', Mathematics → 'mathematics'
-- CLAT: English → 'english', Legal Reasoning → 'legal_reasoning', etc.
-- Full SQL: docs/requirements/SQL-ANA-002.txt — STEP 2
```
**Risk:** text-match only — any concept_tag not found in concept_tags.concept_name leaves section_id NULL. Those rows degrade gracefully (fall into "Uncategorised" pill or hidden).

---

## 5. Architecture — Shared Components

| Component | File | Replaces | Used By |
|---|---|---|---|
| `SectionBreakdown` | `src/components/assessment-detail/SectionBreakdown.tsx` | Inline SAT + Linear breakdown | `SATAnalyticsTab`, `AnalyticsTab` |
| `MistakeIntelligence` | `src/components/assessment-detail/MistakeIntelligence.tsx` (existing — update) | `SATMistakeTaxonomy` (delete), Linear inline (already used) | Both |
| `PacingAnalysis` | `src/components/assessment-detail/PacingAnalysis.tsx` | `SATPacingChart` (delete) | `SATAnalyticsTab`, `AnalyticsTab` |
| `ConceptMasterySection` | `src/components/assessment-detail/ConceptMasterySection.tsx` | `ConceptMasteryPanel` (retire), Linear inline heatmap | Both |

### Components Being Deleted
- `src/components/assessment-detail/SATMistakeTaxonomy.tsx`
- `src/components/assessment-detail/SATPacingChart.tsx`
- `src/components/assessment-detail/SATLeveragePanel.tsx`
- `src/components/assessment-detail/LeverageActions.tsx`
- `src/components/assessment-detail/ConceptMasteryPanel.tsx`

---

## 6. Section-by-Section Specs

### 6.1 SectionBreakdown

**File:** `src/components/assessment-detail/SectionBreakdown.tsx`

**Props:**
```typescript
interface SectionResult {
  section_id: string;
  section_label: string;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  marks_scored: number;
  marks_possible: number;
  time_spent_seconds: number;
  accuracy_percent: number | null;
}

interface SectionBreakdownProps {
  sections: SectionResult[];
  title?: string; // defaults to "Section Breakdown"
}
```

**Rendering rules:**
- Flat list — no group headings (no "Reading & Writing" / "Math" banners)
- Per section: label + marks bar (emerald ≥70%, amber ≥50%, rose <50%) + correct / wrong / skipped / time / accuracy%
- Empty state: `<p className="text-sm text-zinc-400">No section data for this attempt.</p>`
- Always shows time if `time_spent_seconds > 0`

---

### 6.2 MistakeIntelligence (updated for SAT — per-section average)

**Current:** uses `globalAvg` = total time / total questions across all answers.

**Updated:** accept optional `sectionAverages?: Record<string, number>` map (section_id → avg seconds/q). When provided, each answer uses `sectionAverages[answer.section_id] ?? globalAvg` as its reference threshold.

**Why:** the spec requires "section average time per question" for each threshold comparison (Careless: < 40% of section avg; ConceptGap: > 120% of section avg; etc.). Without this, NEET Physics and SAT R&W Module 1 would use the same global average — inaccurate for mixed-pace exams.

**Updated interface:**
```typescript
interface MistakeIntelligenceProps {
  attemptAnswers: MIAttemptAnswer[] | null;
  exam: string;
  negMark: number;
  sectionAverages?: Record<string, number>; // section_id → avg s/q
}
```

**Classification thresholds (locked):**

| Category | Condition |
|---|---|
| CARELESS MISTAKE | Wrong + time < 40% of section avg |
| CONCEPT GAP | Wrong + time > 120% of section avg |
| PANIC SKIP | Skipped + time < 15s |
| KNOWLEDGE SKIP | Skipped + time > 60s |
| FRAGILE CORRECT | Correct + time > 180% of section avg |
| CONFIDENT CORRECT | Correct + time < 60% of section avg |

*Note: answers that don't match any threshold (e.g. correct at 70% section avg) are unclassified — not counted.*

**Section averages derivation (in parent tab):**
```typescript
const sectionAverages: Record<string, number> = {};
for (const sec of derivedSectionResults) {
  const answersInSection = selectedAnswers.filter(a => a.section_id === sec.section_id);
  if (answersInSection.length > 0) {
    sectionAverages[sec.section_id] = sec.time_spent_seconds / answersInSection.length;
  }
}
```

---

### 6.3 PacingAnalysis

**File:** `src/components/assessment-detail/PacingAnalysis.tsx`

**Data source:** `attempt_answers.time_spent_seconds` per question, grouped by `section_id`.

**Target time calculation:**
- **SAT (adaptive):** per module from `assessment_items.config` → `time_minutes ÷ questions_per_attempt` seconds/question
- **Linear (NEET/JEE/CLAT):** `(assessment.duration × 60) ÷ assessment.questionCount` seconds/question — one flat target across all sections

**"View Formula" info button:**
- Small `Info` (lucide) icon button next to section header "Pacing Analysis"
- Opens inline popover (no modal) containing just the algebraic formula:
  - SAT: `"Target = Module duration (min) × 60 ÷ Questions in module"`
  - Linear: `"Target = Total duration (min) × 60 ÷ Total questions"`

**Chip layout (not tooltip):**
Each question rendered as a rounded chip: `Q{N} · {t}s`  
Colors: emerald = on pace (≤ target), amber = slow (> target), rose = wrong answer  
Wrong answer takes priority over pace colour.

**Section grouping:**
- SAT Full Test: 4 groups (R&W M1 / R&W M2 / Math M1 / Math M2) — from `section_label`
- SAT Subject Test: 2 groups — from `section_label`
- Linear (NEET): 3 groups (Physics / Chemistry / Biology) — derived from `section_id`
- Linear (JEE): 3 groups (Physics / Chemistry / Mathematics)
- Linear (CLAT): 5 groups — from `section_id`

**Empty state:** "No timing data available for this attempt." if `time_spent_seconds` is 0 or null across all answers.

**Props:**
```typescript
interface PacingSection {
  section_id: string;
  section_label: string;
  target_seconds_per_question: number;
  questions: Array<{ question_id: string; order: number; time_seconds: number; is_correct: boolean; is_skipped: boolean }>;
}

interface PacingAnalysisProps {
  sections: PacingSection[];
  formulaText: string; // passed from parent; shown in "View Formula" popover
}
```

---

### 6.4 ConceptMasterySection

**File:** `src/components/assessment-detail/ConceptMasterySection.tsx`

**Data source:** `attempt_answers` with `concept_tag` + `section_id` — NOT `user_concept_mastery`.

**Section pills:** derived from unique `section_id` values in the answers, labelled via `sectionLabels: Record<string, string>` (section_id → display label, e.g. `{ physics: 'Physics', chemistry: 'Chemistry' }`). Dynamic — never hardcoded.

**Per-section mastery bars:**
- Group answers by `concept_tag` within the active section_id
- For each concept: `mastery_pct = correct_count / total_count × 100`
- Sorted: lowest mastery first (surfaces weaknesses at top)
- Colour: emerald ≥80%, amber ≥60%, rose <60%

**Attempt selector:** small "Attempt {N}" / "Free Attempt" pill filter above the bars — same attempt list passed from parent. Filters the answers array client-side.

**Props:**
```typescript
interface ConceptMasterySectionProps {
  answers: Array<{
    section_id: string | null;
    concept_tag: string | null;
    is_correct: boolean;
    is_skipped: boolean;
    attempt_id: string;
  }>;
  sectionLabels: Record<string, string>; // section_id → display name
  attempts: Array<{ id: string; attempt_number: number }>;
  selectedAttemptId: string;
  onAttemptChange: (id: string) => void;
}
```

**Degradation:** if `section_id` is NULL on most answers (backfill not run yet), group under a single `'all'` key labelled "All Sections" — one pill, no section filter. Full functionality once backfill is run.

---

### 6.5 AttemptPillFilter (updated)

**Change:** attempt_number=1 → label "Free Attempt". All others → "Attempt {N}".  
**Change:** defensively deduplicate input by `id` to prevent duplicate pills from bad DB data.

```typescript
// Naming rule — baked into component, not a prop
function attemptLabel(attempt_number: number): string {
  return attempt_number === 1 ? 'Free Attempt' : `Attempt ${attempt_number}`;
}
```

---

### 6.6 SATHeroScore Fixes

| Bug | Fix |
|---|---|
| Mobile overlap | `flex flex-col sm:flex-row sm:items-start sm:gap-6` |
| R&W/Math uses `lastAttempt` always | Change to `selectedAttempt.score_rw / score_math` |
| Target is `<select>` dropdown | Replace with `<input type="number" min={1} max={10000} className="..." />` — same save/remove logic |

---

### 6.7 SolutionsPanel (SAT) — Blank Fix

**Root cause:** `questions.module_name` values from `assessment_question_map` JOIN may not match the hardcoded `MODULE_ORDER` keys (`'rw_module_1'` etc.).

**Fix:**
1. When `groupedByModule` produces zero populated tabs, fall back to rendering all questions as a single flat list under label "All Questions"
2. Add proper empty state when `questions.length === 0`: "No questions found for this assessment. Ensure the assessment question map is populated."

---

### 6.8 Linear Solutions Panel — UI Match

Bring the Linear inline solutions in `AnalyticsTab.tsx` visually in line with `SolutionsPanel.tsx`:
- Collapsed row: `Q{N} | status badge | Your answer | Correct answer` (already close — verify)
- Expanded: options with colour-coding (emerald = correct, rose = user wrong) — no `(Correct)` inline label
- Marks Earned / Marks Lost two-column panel at bottom of expanded row
- Empty section state: "No questions seeded for this section yet."

---

### 6.9 Removals

| What | Where |
|---|---|
| `SATLeveragePanel` block | `SATAnalyticsTab.tsx` Block 6 |
| `LeverageActions` block | `AnalyticsTab.tsx` |
| "Reading & Writing" / "Math" group headings | `SATAnalyticsTab.tsx` Section Breakdown |
| `PreviewSectionWrapper` wrapping Pacing + MistakeTaxonomy | `SATAnalyticsTab.tsx` |
| Block 1 Score Summary card (Score / Accuracy / Total Attempts grid) | `AnalyticsTab.tsx` |

---

## 7. Section Order — Post-Build

### SATAnalyticsTab (updated)

| # | Section | Component |
|---|---|---|
| 1 | Score Progression | `SATHeroScore` (fixed) |
| 2 | Attempt Filter | `AttemptPillFilter` (renamed) |
| 3 | College Ladder (Full Test only) | `SATCollegeLadder` (unchanged) |
| 4 | Section Breakdown | `SectionBreakdown` (new shared) |
| 5 | Difficulty Breakdown | `DifficultyBreakdownCard` (unchanged) |
| 6 | Concept Mastery | `ConceptMasterySection` (new shared) |
| 7 | Pacing Analysis | `PacingAnalysis` (new live) |
| 8 | Mistake Taxonomy | `MistakeIntelligence` (existing, wired) |
| 9 | SAT Scoring Reference | `SATScoringTable` (unchanged) |
| 10 | Solutions Panel | `SolutionsPanel` (fixed) |
| 11 | AI Insight | inline (unchanged) |

### AnalyticsTab (updated)

| # | Section | Component |
|---|---|---|
| 1 | Attempt Filter | `AttemptPillFilter` (renamed) |
| 2 | Score Trajectory | `ScoreTrajectoryChart` (target input added) |
| 3 | Rank Prediction (NEET/JEE/CLAT) | `RankPredictionCard` (unchanged) |
| 4 | Marks Lost banner (negative marking only) | inline (unchanged) |
| 5 | Section Breakdown | `SectionBreakdown` (new shared) |
| 6 | Concept Mastery | `ConceptMasterySection` (new shared) |
| 7 | Pacing Analysis | `PacingAnalysis` (new shared) |
| 8 | Mistake Taxonomy | `MistakeIntelligence` (unchanged) |
| 9 | Solutions Panel | inline (UI-matched to SolutionsPanel accordion style) |
| 10 | AI Insight | inline (unchanged) |

---

## 8. Diagnostics Required (before building)

Run these in Supabase before starting implementation. Results → `docs/requirements/SQL-ANA-002.txt`.

**DIAG-1:** Confirm SAT FT `assessment_question_map` rows + `questions` join returns data
**DIAG-2:** Confirm `assessment_question_map.section_name` populated for NEET/JEE/CLAT FT assessments
**DIAG-3:** Check for duplicate `attempt_number` in `attempts` for NEET FT1
**DIAG-4:** Check `attempt_answers.section_id` NULL count for NEET/JEE/CLAT seeded attempts

---

## 9. Edge Cases

| Case | Behaviour |
|---|---|
| `attempt_answers.section_id` NULL (backfill not run) | `ConceptMasterySection` shows single "All Sections" pill |
| concept_tag in answers doesn't match `concept_tags.concept_name` | Row left with NULL section_id after backfill — falls into "All Sections" |
| PacingAnalysis: all `time_spent_seconds = 0` | Show empty state: "No timing data available" |
| SolutionsPanel: no questions in map | Show: "No questions found for this assessment." |
| Duplicate attempt rows in DB | `AttemptPillFilter` deduplicates by `id` defensively |
| attempt_number=1 but not free (edge case) | Label is purely number-based — attempt_number=1 always "Free Attempt" |
| Section has concept_tag = NULL in answers | Excluded from ConceptMasterySection aggregation |

---

## 10. Success Criteria

- SAT SolutionsPanel shows questions (not blank) after module_name fallback fix
- Linear solutions sections show questions (not empty) — requires DIAG-2 to confirm data
- Attempt pills show "Free Attempt" for first attempt in both SAT and Linear
- SATHeroScore R&W/Math sub-scores update when switching between attempts
- Target score input accepts any number 1–10000 (not limited to dropdown options)
- SATHeroScore renders correctly at 375px mobile viewport (no overlap)
- Pacing section shows live Q{N}·{t}s chips grouped by section (no demo data)
- "View Formula" popover shows algebraic formula
- Mistake Taxonomy shows 6 categories with live data in both SAT and Linear
- Concept Mastery section pills are dynamic (from actual section_ids in attempt_answers)
- Leverage panels are gone from both tabs
- Stats card (Score/Accuracy/Attempts) is gone from Linear
- `npm run build` passes clean
