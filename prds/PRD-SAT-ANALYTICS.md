# PRD — SAT Analytics Overhaul: Attempt Pill, DB-Driven Solutions, Chapter Analytics

**Status:** IN-PROGRESS  
**Author:** Sandesh Banakar I  
**Ticket:** KSS-SAT-A01  
**Created:** Apr 17 2026  
**Stakeholders:** Engineering, Product, QA

---

## 1. Executive Summary & "The Why"

### 1.1 Problem Statement

The existing `SATAnalyticsTab` has three UX and architecture defects that need correcting before the full SAT analytics demo is reliable:

1. **Attempt selector is buried** inside the Section Breakdown card — it should be a top-level pill strip that acts as parent to all analytics sections below Score Progression.
2. **Solutions Panel is hardcoded** — 4–5 mock SAT questions are shown alongside (or instead of) the 120 real DB-seeded questions, undermining trust in the demo.
3. **No analytics template for chapter tests** — SAT chapter tests (and all exam chapter tests) currently fall through to the generic `AnalyticsTab`, which is not optimised for the single-concept, single-section structure of a chapter test.

Additionally, there is no shared `AttemptPillFilter` component — both `SATAnalyticsTab` and `AnalyticsTab` implement their own pill/select patterns. This is duplicated code that diverges over time.

### 1.2 Business Value

- Improved demo quality for sales / investor demos (no fake questions visible)
- Consistent UX across all analytics tabs (attempt selection always works the same way)
- Extensible chapter analytics template that works for NEET, JEE, CLAT, SAT chapter tests without new files per exam

### 1.3 Strategic Alignment

Directly supports KSS-SA-031 (analytics engine). Prerequisite for full production wiring of solutions panel to real DB data.

---

## 2. User Personas & Impact

| Persona | Impact |
| :--- | :--- |
| **B2C Learner (all tiers)** | Attempt pill strip is prominent and intuitive. Solutions panel shows real questions, not mock ones. |
| **B2C Learner (chapter test)** | Gets a purpose-built analytics view showing concept-level performance, not a misfit full-test template. |
| **Super Admin (demo)** | Solutions panel matches the questions visible in the Question Bank — no divergence. |

---

## 3. Component Architecture

### 3.1 New Shared Component

**`src/components/ui/AttemptPillFilter.tsx`**

```
Props:
  attempts: { id: string; attempt_number: number; isLatest: boolean }[]
  selectedId: string
  onChange: (id: string) => void

Renders: row of rounded-full pill buttons.
  Active:   bg-blue-700 text-white
  Inactive: bg-white border border-zinc-200 text-zinc-700 hover:border-blue-300 hover:text-blue-700
  Label: "Attempt N" + "(Latest)" on most recent.
  NO score shown in pill. This is locked per CLAUDE-PLATFORM.md (Apr 17 2026).
```

Used by: `SATAnalyticsTab`, `AnalyticsTab`, `ChapterAnalyticsTab`

### 3.2 New Shared `ConceptMasteryPanel` component

**`src/components/assessment-detail/ConceptMasteryPanel.tsx`** (extracted + redesigned from `SATAnalyticsTab`)

Used by: `SATAnalyticsTab`, `ChapterAnalyticsTab` (Phase 1 — KSS-SAT-A01).
`AnalyticsTab` upgrade deferred to a separate ticket (CMP-1 = Option 1).

```typescript
interface ConceptMasteryPanelProps {
  conceptMastery: ConceptMastery[];       // ALL attempts, ALL tags
  tagSectionMap: Record<string, string>;  // tag → section label e.g. 'Linear equations' → 'Math'
  sections: string[];                     // ordered pill labels e.g. ['Reading & Writing', 'Math']
  attemptNumbers: number[];               // all completed attempt numbers for this assessment
}
```

**Section pill design (locked Apr 17 2026):**
- Pill shape: `rounded-full` (same as AttemptPillFilter)
- Active: `bg-blue-700 text-white`
- Inactive: `bg-white border border-zinc-200 text-zinc-700 hover:border-blue-300 hover:text-blue-700`
- Default selected: first pill in `sections` array (configured order)
- Always shown even when only 1 section — for consistency and API-loading resilience
- Label responsive text: `R&W` on mobile, `Reading & Writing` on `sm:` and above.
  Use `<span className="sm:hidden">R&W</span><span className="hidden sm:inline">Reading & Writing</span>`

**Table layout (always — no bar-chart fallback):**
- Always renders a comparison table (rows = tags, columns = attempt numbers)
- 1 attempt → 1 column. 3 attempts → 3 columns. No layout switch.
- Cell with data: mastery % badge (`masteryBadgeClass`)
- Cell with NO data (concept not tested in that attempt): `—` with `bg-zinc-100 text-zinc-400`
- `overflow-x-auto` wrapper for mobile horizontal scroll
- Rows sorted by **weakest mastery % first** (ascending, based on most recent attempt)
- Tags filtered to the selected section pill only
- Footer (always visible): `≥80% — strong · 60–79% — developing · <60% — needs work`

**Tag-to-section mapping for SAT (parent builds this):**
- Merge `SAT_RW_DOMAIN_MAP` keys → `'Reading & Writing'`
- Merge `SAT_MATH_DOMAIN_MAP` keys → `'Math'`
- `sections` array: `['Reading & Writing', 'Math']` for full test; `['Math']` or `['Reading & Writing']` for subject tests

### 3.3 Updated `SATAnalyticsTab`

Block order (locked Apr 17 2026):

| Block | Content | Attempt-Sensitive? | Scope |
|---|---|---|---|
| 1 | Score Progression | No — always shows all attempts | Static |
| 2 | **AttemptPillFilter** (NEW) | — parent to 3, 5, 6, 8 | Shared component |
| 3 | Section Breakdown | Yes | Inline |
| 4 | **ConceptMasteryPanel** (NEW shared) | No — all attempts in columns | Shared component |
| 5 | Where You Lost Points | Yes | Inline |
| 6 | Solutions Panel (DB-driven, module tabs) | Yes | Inline |
| 7 | SAT Scoring Reference | No | Inline |
| 8 | AI Insight | Yes | Inline |

**Removed:** Question-type filter card + `filter` state + `filteredSolutions` + `allowedConceptTags` + `filteredConceptMastery` — all concepts and all question types shown by default. Dual `ConceptMasteryPanel` sub-components (Math + R&W side-by-side) replaced by single `ConceptMasteryPanel` with section pill strip.

### 3.3 New `ChapterAnalyticsTab` (generic)

**`src/components/assessment-detail/ChapterAnalyticsTab.tsx`**

Works for ALL exam chapter tests (SAT, NEET, JEE, CLAT). No exam-specific branching in the component — exam-awareness comes via `assessment.exam` prop for negative marking logic only.

Block order:

| Block | Content | Notes |
|---|---|---|
| 1 | Attempt Summary | Score/accuracy, correct/wrong/skipped, time |
| 2 | AttemptPillFilter | Parent to blocks 3–5 |
| 3 | Marks Lost (NEET/JEE only) | Shown when `negMark > 0 && marksLost > 0` |
| 4 | Concept Performance | Bar chart: per-concept accuracy for selected attempt |
| 5 | Solutions Panel (DB-driven) | All questions for this chapter test |
| 6 | AI Insight | Pro/Premium gated |

**Routing change in `page.tsx`:**
```
assessment.type === 'chapter-test'                                     → ChapterAnalyticsTab
assessment.exam === 'SAT' && type ∈ ['full-test', 'subject-test']     → SATAnalyticsTab
everything else (NEET/JEE/CLAT full-test + subject-test)              → AnalyticsTab
```

---

## 4. Functional Requirements

### Scenario 1: Attempt pill strip (all analytics tabs)
- **Given** a user with 2+ completed attempts views the analytics tab
- **When** the page loads
- **Then** pill strip shows `Attempt 1`, `Attempt 2 (Latest)` — most recent pre-selected
- **And** switching pills updates Section Breakdown, Where You Lost Points, Solutions Panel, AI Insight
- **And** Score Progression and Concept Mastery Heatmap always show all attempts

### Scenario 2: DB-driven Solutions Panel (SAT full test)
- **Given** a user views the analytics tab for a SAT full test with real DB questions
- **When** Solutions panel renders
- **Then** it shows 4 module tabs: R&W Module 1 (27Q), R&W Module 2 (27Q), Math Module 1 (22Q), Math Module 2 (22Q)
- **And** zero hardcoded mock questions are visible
- **And** selecting a different attempt pill reloads user answers for that attempt

### Scenario 3: Chapter test analytics (generic)
- **Given** a user completes a chapter test (any exam type)
- **When** they open the analytics tab
- **Then** `ChapterAnalyticsTab` renders (not `AnalyticsTab` or `SATAnalyticsTab`)
- **And** Concept Performance bars show per-concept accuracy for the selected attempt
- **And** Marks Lost block appears for NEET/JEE, is hidden for SAT/CLAT

### Scenario 4: Question-type filter removed
- **Given** a user opens SAT full test or subject test analytics
- **When** they scroll the page
- **Then** there is no "Analytics filter" card or question-type dropdown anywhere on the page

---

## 5. Technical Specifications

### 5.1 Solutions Panel — DB Query Pattern

Reuse the query pattern from `AnalyticsTab.tsx`:
1. Fetch `assessment_question_map` for `assessment_id`, grouped by `section_name` → module tabs
2. On tab select: fetch `questions` via FK join, fetch `attempt_answers` for `selectedAttemptId` × `question_ids`
3. Bust cache when `selectedAttemptId` changes

SAT module `section_name` values (from seeded data): `rw_module_1`, `rw_module_2`, `math_module_1`, `math_module_2`
Display labels: `R&W Module 1`, `R&W Module 2`, `Math Module 1`, `Math Module 2`

### 5.2 SolutionsPanel.tsx — DELETED (KSS-SAT-A01)

**Decision (Apr 17 2026):** `src/components/assessment-detail/SolutionsPanel.tsx` is deleted entirely.

- No remaining callers after SAT refactor (AnalyticsTab uses inline `renderQuestionRow`)
- All types (`DemoSolution`, `SolutionQuestionType`, `QUESTION_TYPE_LABELS`, `SOLUTION_QUESTIONS`, `SAT_SOLUTION_QUESTIONS`) are removed with it
- Any future analytics tab should use the DB-driven accordion pattern from `AnalyticsTab.tsx`
- CLAUDE-PLATFORM.md KEY FILES updated to document deletion — never re-create this file

### 5.3 ConceptMasteryPanel — Layout rules (locked Apr 17 2026)

**Column headers (CMP-3a = Option B):**
- Primary label: `Attempt N` in `text-xs font-medium text-zinc-400`
- Secondary label: `DD MMM` date from `completed_at` in `text-xs text-zinc-400` below
- `completed_at` must be passed through the `attempts` prop (not just `attemptNumbers`)

**Props contract (updated for date support):**
```typescript
interface ConceptMasteryPanelProps {
  conceptMastery: ConceptMastery[];
  tagSectionMap: Record<string, string>;
  sections: string[];
  attempts: Array<{ attempt_number: number; completed_at: string | null }>;
}
```
`attemptNumbers` is derived internally: `attempts.map(a => a.attempt_number)`

**Mobile layout (CMP-3b = Option B2 — sticky first column):**
- Outer wrapper: `overflow-x-auto`
- Tag column (first `<td>/<th>`): `sticky left-0 bg-white z-10`
- Important: parent must NOT have `overflow-hidden` — will break sticky positioning

**Section pill → rows only (CMP-3c confirmed):**
- Switching section pill re-filters rows (tags) and re-sorts weakest-first
- All attempt columns remain visible at all times

### 5.4 AttemptPillFilter Props Contract

```typescript
interface AttemptPillFilterProps {
  attempts: Array<{
    id: string;
    attempt_number: number;
  }>;
  selectedId: string;
  onChange: (id: string) => void;
}
```

The "Latest" label is derived internally: `attempt.id === attempts[attempts.length - 1].id`

---

## 6. Scope Boundaries

### 6.1 IN SCOPE (KSS-SAT-A01)
- AttemptPillFilter shared component
- SATAnalyticsTab: pill strip, remove filter card, DB-driven solutions
- AnalyticsTab: remove score from pills
- ChapterAnalyticsTab: new generic component
- page.tsx routing update

### 6.2 OUT OF SCOPE (deferred)
- SAT score equating (ANA-008) — scaled scores remain seeded static values
- Adaptive module routing tracking (ANA-009)
- Production exam engine wiring (ANA-001 to ANA-005)
- Chapter test question seeding (SAT chapter tests have no questions seeded yet — ChapterAnalyticsTab will show "No questions" state gracefully)

---

## 7. Open Questions

| # | Question | Status |
|---|---|---|
| OQ-1 | ChapterAnalyticsTab: score display — should NEET/JEE show `marks/total` and SAT show `accuracy%`, or always `accuracy%` for simplicity? | **PENDING decision** |
| OQ-2 | SAT Solutions Panel: should module tab selection also filter the Concept Mastery heatmap (show only tags for that module)? | **PENDING decision** |
| OQ-3 | SolutionsPanel.tsx: after SAT hardcoded removal, does any other component still import it? If not, deprecate or delete. | **PENDING audit** |
| OQ-4 | page.tsx routing: SAT subject tests are routed to SATAnalyticsTab — confirm section order used is `RW_SECTION_ORDER` or `MATH_SECTION_ORDER` based on `assessment.subject`. | **Confirmed — existing isFullTest flag handles this** |

---

## 8. Success Metrics

- Zero hardcoded mock questions visible in SAT full test solutions panel
- Attempt pill strip visible immediately below Score Progression on all analytics tabs
- Chapter test analytics renders correctly for at least one seeded chapter test
- `npm run build` passes with no type errors

---

*PRD version 1.0 — Apr 17 2026*
