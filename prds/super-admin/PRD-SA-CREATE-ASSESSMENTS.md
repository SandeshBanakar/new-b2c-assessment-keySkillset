# PRD KSS-SA-CA-001: Create Assessment Feature Set

**Status:** LOCKED — 2026-04-21  
**Author:** Sandesh Banakar I  
**Stakeholders:** Engineering, Product  
**Target Version:** V1

---

## 1. Executive Summary

### 1.1 Problem Statement
The Create Assessments section in Super Admin has a minimal action menu (Edit + Archive only), no search, no state-aware transitions, and no Adaptive assessment creation capability. The Linear form has Duration mixed into Basic Info, no sectional navigation toggle, no section cap, and no edit flow. Adaptive is entirely unbuilt.

### 1.2 Business Value
- Enables content creators to publish, maintain, and duplicate assessments without engineering intervention.
- Unlocks SAT Adaptive assessment creation with proper module/branching/scale-score configuration.
- Consistent state machine prevents invalid transitions (e.g., deleting a LIVE assessment in a plan).

### 1.3 Strategic Alignment
Directly supports the SAT Adaptive engine rollout and Linear exam catalogue management.

---

## 2. User Personas

| Persona | Impact |
| :--- | :--- |
| **Super Admin / Content Creator** | Full lifecycle management: create → draft → publish → maintain → archive/delete |
| **Learner** | Sees maintenance page during MAINTENANCE window; unaffected by DRAFT/INACTIVE assessments |

---

## 3. State Machine — Assessment Status

### 3.1 Status Values (DB)
| DB Value | UI Label | Meaning |
|---|---|---|
| `DRAFT` | Draft | Just created, not visible to learners |
| `INACTIVE` | Inactive | Visible to admin only, editable |
| `LIVE` | Active | Visible and accessible to learners |
| `MAINTENANCE` | Maintenance | Temporarily offline; shows maintenance page to learners |
| `ARCHIVED` | Archived | Removed from active use, can be restored |

> **NOTE:** `LIVE` stays as the DB value. UI displays it as "Active". No DB migration needed for status.

### 3.2 Allowed Transitions & Actions Per Status

| Status | Actions Available |
|---|---|
| **DRAFT** | Preview · Edit · Publish (→ LIVE) · Duplicate (→ INACTIVE) · Delete |
| **INACTIVE** | Preview · Continue Editing · Ready to Publish (→ LIVE) · Duplicate (→ INACTIVE) · Delete |
| **LIVE** | Preview · Take Offline for Editing (→ MAINTENANCE) · Archive (→ ARCHIVED) · Duplicate (→ INACTIVE) · Delete *(blocked)* |
| **MAINTENANCE** | Preview · End Maintenance (→ INACTIVE manually) · Delete *(blocked)* |
| **ARCHIVED** | Preview · Make Live (→ LIVE) · Duplicate (→ INACTIVE) · Delete |

**Delete block rule:** Assessment in status LIVE or MAINTENANCE cannot be deleted. Modal shows which plans contain it and instructs SA to make it INACTIVE first.

**Duplicate:** Always creates copy with status = INACTIVE, title prefixed "Copy of …", full assessment_config + display_config copied.

### 3.3 Take Offline for Editing — Modal
- Collects: start date/time (informational, set = now on confirm) + end date/time of maintenance window
- On confirm: status → `MAINTENANCE` immediately
- Stores: `assessment_config.maintenance_window = { start_time: ISO, end_time: ISO }`
- Learner sees: maintenance illustration + message page
- **Auto-revert:** On SA Create Assessments page load, any MAINTENANCE assessment whose `end_time < now` is auto-updated to `INACTIVE` + a yellow banner shown: "Maintenance window ended for [N] assessment(s) — now Inactive"
- SA can also manually click "End Maintenance" → INACTIVE

### 3.4 Navigation Policy — LOCKED DECISION
> Approved 2026-04-21. The standalone Navigation Policy dropdown is **removed** from the Linear form.
> The "Allow Sectional Navigation" toggle **alone** drives both `timer_mode` and `navigation_policy` in `assessment_config`:
> - Toggle **ON** → `navigation_policy = FREE`, `timer_mode = FULL` (one overall timer, free section navigation)
> - Toggle **OFF** → `navigation_policy = SECTION_LOCKED`, `timer_mode = SECTIONAL` (per-section timer, learner cannot go back to previous sections)
>
> A read-only derived label "Navigation: Free / Sectional" is shown in the Display Config overview — no separate editable field.

---

## 4. Functional Requirements

### Step 1 — Create Assessments Main Page

**Search:** Title-only, client-side filter on loaded data.

**Status filter:** DRAFT · Inactive · Active · Maintenance · Archived

**Modals required:**
| Action | Modal type |
|---|---|
| Publish (DRAFT→LIVE) | Confirm: "Publish '[title]'? It will be visible to learners." |
| Ready to Publish (INACTIVE→LIVE) | Confirm: "Publish '[title]'? It will be visible to learners." |
| Take Offline (LIVE→MAINTENANCE) | Date/time picker: start (default = now) + end + optional reason |
| End Maintenance (MAINTENANCE→INACTIVE) | Confirm: "End maintenance early?" |
| Archive (LIVE→ARCHIVED) | Confirm: "Archive '[title]'? Hidden from learners." |
| Make Live (ARCHIVED→LIVE) | Confirm: "Re-publish '[title]' to learners?" |
| Duplicate | Confirm: "Duplicate '[title]'? A copy (Inactive) will be created." |
| Delete | Shows plan names list. If no plans: "Permanently delete? This cannot be undone." If in plans: "Cannot delete — remove from plans first and set to Inactive." Block button if LIVE/MAINTENANCE. |

**Preview:** Direct `router.push` to preview URL — no modal.
**Edit / Continue Editing:** Direct `router.push` to `/linear/[id]` or `/adaptive/[id]` — no modal.

---

### Step 2 — Linear Assessment Form (Create + Edit)

**Basic Info section:** Assessment Length · Assessment Title · Description · Category

**Timings section (NEW):**
- Duration (minutes) — max 500
- Allow Sectional Navigation toggle (default: OFF)
  - OFF → one overall timer, SECTION_LOCKED nav policy saved to DB
  - ON → per-section duration inputs appear on each section, FREE nav policy saved to DB
- Allow Back Navigation toggle (default: ON)
- Allow Calculator toggle (default: OFF)

**Sections builder:**
- Max 10 sections — "+ Add Section" button disabled at cap, tooltip "Maximum 10 sections reached"
- Section row: Name · Questions · Duration (visible only when Sectional Navigation = OFF, i.e., SECTIONAL timer mode)
- Drag-to-reorder (dnd-kit, already built)

**Marks Configuration section:** unchanged

**Display Config section:** unchanged — Description · Language · What You'll Get · Topics Covered

**Edit flow (/linear/[id]):**
- Same form pre-populated from `assessment_items` DB row
- Button: "Save Changes" (replaces "Save as Draft")
- If assessment is MAINTENANCE: show read-only warning banner, disable save

---

### Step 3 — Adaptive Assessment Form (Create + Edit)

#### 3a. Assessment Length Rules
| Length | Foundation Modules | Variant Modules |
|---|---|---|
| Full Test | 1–5 Foundation Modules | 3 per FM (EASY, MEDIUM, HARD) = up to 15 VMs |
| Subject Test | Exactly 1 Foundation Module | Exactly 3 VMs (EASY, MEDIUM, HARD) |

#### 3b. Foundation Module (FM) card fields
- Module Name
- Time (minutes)
- Question Type (MCQ / etc.)
- Sources checkboxes + Chapters checkboxes
- Questions Per Attempt
- Question Type Distribution (MCQ Single, MCQ Multi, Passage Single, Passage Multi, Numeric)
- **Branching Configuration** (per FM):
  - High Threshold % → Hard Variant (if accuracy ≥ High%)
  - Low Threshold % → Easy Variant (if accuracy < Low%)
  - Medium Range: auto-calculated = [Low%, High%) — read-only display
  - Reset to Default button (70% / 40%)
  - Hint label: "Engine routes learners after minimum 30% of questions attempted"

#### 3c. Variant Module (VM) card fields — 3 per FM (separate cards)
- Difficulty badge: EASY / MEDIUM / HARD (read-only, set at creation)
- Variant Module Name
- Time (minutes)
- Question Type
- Sources checkboxes + Chapters checkboxes
- Questions Per Attempt
- Question Type Distribution

#### 3d. Break Screens
- Can only be placed between a Foundation Module group and its Variant Module group
- UI: "+ Add Break Screen" button shown between FM card and its VM cards
- Break Screen fields: Title + Message
- Rule label shown in UI: "Break screens can only be placed between a Foundation Module and its Variant Modules"

#### 3e. Tabs
1. **Edit** — all form configuration
2. **Scale Score** — lookup tables per module (see §5.3)
3. **Preview** — assessment flow diagram (module cards, break screens)

#### 3f. Display Config section
Same fields as Linear: Description · Language · What You'll Get · Topics Covered
Visible on both Create and Edit forms.

---

## 5. Technical Specifications

### 5.1 DB Migrations Required

**KSS-DB-050:** Add score range columns to `exam_categories`
```sql
ALTER TABLE exam_categories
  ADD COLUMN IF NOT EXISTS score_min INT NULL,
  ADD COLUMN IF NOT EXISTS score_max INT NULL;

-- Seed SAT
UPDATE exam_categories
SET score_min = 200, score_max = 800
WHERE name = 'SAT';
```

**KSS-DB-051:** Create `assessment_scale_scores` table
```sql
CREATE TABLE IF NOT EXISTS assessment_scale_scores (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id           UUID NOT NULL REFERENCES assessment_items(id) ON DELETE CASCADE,
  module_id               TEXT NOT NULL,
  module_type             TEXT NOT NULL CHECK (module_type IN ('FOUNDATION','VARIANT_EASY','VARIANT_MEDIUM','VARIANT_HARD')),
  foundation_module_order INT NOT NULL,
  raw_score               INT NOT NULL,
  scaled_score            INT NULL,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE (assessment_id, module_id, module_type, raw_score)
);
```

### 5.2 assessment_config JSONB Schema — Linear
```jsonc
{
  "duration_minutes": 180,          // overall timer (used when timer_mode = FULL)
  "navigation_policy": "FREE",      // "FREE" | "SECTION_LOCKED" — driven by toggle, not editable standalone
  "timer_mode": "FULL",             // "FULL" | "SECTIONAL" — driven by toggle
  "allow_back_navigation": true,
  "allow_calculator": false,
  "override_marks": false,
  "total_questions": 180,
  "total_marks": 720,
  "marks_per_question": 4,
  "negative_marks": 1,
  "sections": [
    {
      "id": "uuid",
      "name": "Physics",
      "questions_per_attempt": 45,
      "duration_minutes": 60          // present only when timer_mode = SECTIONAL
    }
  ],
  "maintenance_window": {             // present only when status = MAINTENANCE
    "start_time": "2026-04-21T10:00:00Z",
    "end_time": "2026-04-21T18:00:00Z"
  }
}
```

### 5.3 assessment_config JSONB Schema — Adaptive
```jsonc
{
  "assessment_type": "ADAPTIVE",
  "duration_minutes": 120,
  "allow_calculator": false,
  "foundation_modules": [
    {
      "id": "uuid-fm1",
      "order": 1,
      "name": "Module 1",
      "time_minutes": 32,
      "question_type": "MCQ",
      "source_ids": [],
      "chapter_ids": [],
      "questions_per_attempt": 27,
      "question_type_distribution": { "mcq_single": 27 },
      "branching": { "high_threshold": 70, "low_threshold": 40 },
      "break_screen": {               // optional, placed between FM and its VMs
        "id": "uuid-bs1",
        "title": "Break Time",
        "message": "Take a 10-minute break before Module 2."
      },
      "variant_modules": [
        {
          "id": "uuid-vm-easy",
          "difficulty": "EASY",
          "name": "Module 2 (Easy)",
          "time_minutes": 35,
          "question_type": "MCQ",
          "source_ids": [],
          "chapter_ids": [],
          "questions_per_attempt": 27,
          "question_type_distribution": { "mcq_single": 27 }
        },
        { "difficulty": "MEDIUM", ... },
        { "difficulty": "HARD", ... }
      ]
    }
  ],
  "display_config": {
    "description": "",
    "language": "English",
    "what_youll_get": [],
    "topics_covered": []
  },
  "maintenance_window": null
}
```

### 5.4 Scale Score Tab
- Rows are generated dynamically: for each module, raw_score rows 0..N where N = questions_per_attempt
- SA fills in scaled_score per row (e.g., 200–800 for SAT)
- Score range (min/max) sourced from `exam_categories.score_min` / `exam_categories.score_max`
- If SA changes questions_per_attempt AFTER entering scale scores → warning modal: "Changing question count will reset the Scale Score table for this module. Continue?"
- On confirm: DELETE existing rows for that module_id + regenerate empty rows
- Data stored in `assessment_scale_scores` table (KSS-DB-051)

### 5.5 Plan-Assessment Query (Delete Modal)
Use existing `fetchPlansContainingContent(assessmentId)` from `src/lib/supabase/plans.ts`.
This queries `plan_content_map` and returns plan names + statuses.

---

## 6. Scope Boundaries

### 6.1 IN SCOPE (V1)
- Main page: state machine actions, search, all modals, maintenance auto-revert
- Linear Create + Edit forms with Timings section, nav toggle, section cap
- Adaptive Create + Edit forms with FM/VM builder, branching config, break screens, Scale Score tab, Display Config
- DB migrations KSS-DB-050 + KSS-DB-051
- PRD note update in PRD-LINEAR-ANALYTICS-V2.md

### 6.2 OUT OF SCOPE (Deferred)
- Exam engine wiring (routing, adaptive branching execution)
- Scale score auto-calculation (SA fills manually)
- Maintenance page learner UI (separate ticket)
- Backfilling existing linear assessments' assessment_config with new timer_mode/navigation_policy fields

---

## 7. Edge Cases & Risk Mitigation

| Risk | Mitigation |
|---|---|
| Delete LIVE assessment | Block delete button + modal warning; query plan list |
| Scale score table grows large | Separate `assessment_scale_scores` table (not JSONB); max ~5000 rows per assessment |
| Maintenance window never ends | "End Maintenance" manual action + auto-revert on page load |
| Subject Test adaptive: user tries to add 2nd FM | "+ Foundation Module" button hidden when Assessment Length = Subject Test and 1 FM exists |
| VM without parent FM | VM cards only render inside their parent FM card |

---

## 8. Files Created / Modified

| File | Action |
|---|---|
| `src/app/super-admin/create-assessments/page.tsx` | REWRITE |
| `src/app/super-admin/create-assessments/linear/page.tsx` | REFACTOR |
| `src/app/super-admin/create-assessments/linear/[id]/page.tsx` | NEW |
| `src/app/super-admin/create-assessments/adaptive/page.tsx` | NEW |
| `src/app/super-admin/create-assessments/adaptive/[id]/page.tsx` | NEW |
| `prds/super-admin/PRD-SA-CREATE-ASSESSMENTS.md` | NEW (this file) |
| `prds/analytics/PRD-LINEAR-ANALYTICS-V2.md` | UPDATE (nav policy note) |
| `docs/TODO-BACKLOG.md` | UPDATE |
| `docs/CLAUDE-DB.md` | UPDATE post-migration |
