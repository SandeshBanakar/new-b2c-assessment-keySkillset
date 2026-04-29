# PRD KSS-PC-SST-001: Scale Score Templates — Platform Config + Adaptive Assessment Refactor

**Status:** COMPLETE  
**Author:** Sandesh Banakar I  
**Date:** 2026-04-29  
**Stakeholders:** Engineering, Product, Super Admin  
**Target Version:** V1 (Current)

---

## 1. Executive Summary & "The Why"

### 1.1 Problem Statement

Scale score configuration is currently done per-assessment inside the Create Adaptive Assessment form's "Scale Score" tab. This creates three problems:

1. **Repetition:** Every SAT Full Test assessment must have its conversion table manually entered per-assessment, even though the table is identical across 100+ assessments.
2. **No structural control:** The platform has no authoritative definition of how many foundation/variant modules an adaptive assessment may have. SA can create assessments with arbitrary module counts that conflict with scoring assumptions.
3. **Tight coupling of unrelated concerns:** `questions_per_attempt` lives in the assessment, but the scale score conversion table depends on it — these must be co-managed, not separated.

### 1.2 Business Value

- Eliminates duplicate data entry: one template covers all assessments of the same type.
- SA can set a structural standard (module count, questions per module) at the category level and enforce it across every assessment creation.
- Supports future exam categories adopting adaptive scoring without code changes (driven by `supported_assessment_types` on the category).

### 1.3 Strategic Alignment

Continues Platform Config V2 work. Extends the exam-category-driven configuration model established in KSS-SA-PC-001.

---

## 2. User Personas & Impact

| Persona | Impact |
| :--- | :--- |
| **Super Admin** | Creates scale score templates once in Platform Config. Selects a template when creating/editing any adaptive assessment. `questions_per_attempt` on all modules is locked to the template definition. |
| **B2C Learner** | Transparent — score calculation reads from the template rows instead of per-assessment rows. No UX change. |

---

## 3. User Flow & System Logic

### 3.1 Platform Config Flow — Create Template

1. SA navigates to Platform Config → SAT → Analytics Config sub-tab.
2. New "Scale Score Templates" section is visible (below College Targets).
3. SA clicks "Create Template" → two-step slideover opens.
4. **Step 1 — Module Structure:**
   - Template name (required, unique per exam category)
   - Optional description
   - Number of Foundation Modules (1–N, default 1)
   - Per Foundation Module: `questions_per_attempt` (int, required)
   - Per Foundation Module: Number of Variant Modules (default 3: Easy/Medium/Hard)
   - Per Variant Module: `questions_per_attempt` (int, required)
5. **Step 2 — Score Mapping:**
   - For each module defined in Step 1, SA enters raw→scaled mapping.
   - Two input methods: row-by-row OR CSV paste (`raw,scaled` format, one row per line).
   - Rows are auto-generated for raw 0..N where N = `questions_per_attempt` for that module.
   - Preview shows min/max scaled score derived from entered rows.
6. SA saves → template is created with `is_active = true`.

### 3.2 Create/Edit Adaptive Assessment Flow

1. SA opens Create or Edit Adaptive Assessment form (Edit tab).
2. New section "Scale Score Template" appears immediately **below Basic Info** (above Analytics Config reference widget and Foundation Modules).
3. Dropdown shows active templates for the selected exam category.
4. SA selects a template.
5. **Immediately:** `questions_per_attempt` fields on all Foundation Module and Variant Module cards are disabled and greyed out (`bg-zinc-50 text-zinc-400 cursor-not-allowed`), locked to the template's module definition values. A "Locked by scale score template" caption appears below each locked field.
6. **Add Foundation Module button** is hidden when the current FM count reaches the template's `max_foundation_modules` cap. An amber warning appears if existing FM count exceeds the cap.
7. On save: `scale_score_template_id` is written to `assessment_items`.

### 3.3 Assessment — No Template Selected (Backwards Compatibility)

- `scale_score_template_id = null` → system falls back to legacy `assessment_scale_scores` rows.
- Existing assessments with no template continue to work unchanged.
- Scale Score tab is permanently removed from the Create/Edit form UI.

### 3.4 Exam Category — Assessment Type Gate

- `exam_categories.supported_assessment_types text[]` replaces the hardcoded `category.name === 'SAT'` check in Platform Config.
- If `'adaptive'` is in the array: Analytics Config sub-tab is shown, Scale Score Templates section is shown.
- If `'linear'` only: Analytics Config tab may show Rank Prediction etc., but not Scale Score Templates.
- SA configures this in the Create/Edit Category slideover.

---

## 4. Functional Requirements (BDD Style)

### Scenario 1: Create Scale Score Template — Happy Path
- **Given** I am SA viewing Platform Config → SAT → Analytics Config
- **When** I click "Create Template" and complete both steps
- **Then** the template appears in the template list with `is_active = true`
- **And** it is immediately available in the adaptive assessment template dropdown

### Scenario 2: Select Template in Create Assessment
- **Given** I am SA creating an Adaptive Assessment with exam category = SAT
- **When** I select a template from the Scale Score Template dropdown
- **Then** all `questions_per_attempt` fields on all modules are locked to the template values
- **And** the module count (foundation + variants) is constrained to the template structure

### Scenario 3: Template Delete Guard
- **Given** a template is referenced by 1+ assessment_items
- **When** SA attempts to delete the template
- **Then** the system blocks deletion and shows a count of assessments using it
- **And** SA must reassign those assessments to a different template before deletion is permitted

### Scenario 4: Template Deactivated Mid-Use
- **Given** a template is active and assigned to assessments
- **When** SA toggles it to inactive
- **Then** the template stays on currently-assigned assessments (reference intact)
- **And** it no longer appears in the template picker for new/edited assessments

### Scenario 5: CSV Paste in Step 2
- **Given** SA is on Step 2 of template creation for a module with 27 questions
- **When** SA pastes CSV with 28 rows (raw 0–27, scaled values)
- **Then** the system parses and populates all rows
- **And** shows inline validation error for any row where scaled value is out of range or non-numeric

### Scenario 6: Exam Category — Set Assessment Type
- **Given** SA opens edit slideover for an exam category
- **When** SA selects "Adaptive" from the Supported Assessment Type radio group (options: Not set / Adaptive / Linear — single selection only; no exam can be both)
- **Then** Analytics Config sub-tab appears for that category's drill-down
- **And** Scale Score Templates section is visible within Analytics Config

---

## 5. Technical Specifications

### 5.1 DB Schema — Migration KSS-DB-060

```sql
-- A. Add supported_assessment_types to exam_categories
ALTER TABLE exam_categories
  ADD COLUMN IF NOT EXISTS supported_assessment_types text[] NOT NULL DEFAULT '{}';

-- Seed SAT
UPDATE exam_categories
SET supported_assessment_types = ARRAY['adaptive','linear']
WHERE name = 'SAT';

-- B. Scale Score Templates
CREATE TABLE scale_score_templates (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_category_id        uuid NOT NULL REFERENCES exam_categories(id) ON DELETE CASCADE,
  name                    text NOT NULL,
  description             text,
  max_foundation_modules  int NOT NULL DEFAULT 1 CHECK (max_foundation_modules >= 1),
  is_active               boolean NOT NULL DEFAULT true,
  created_by              uuid,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_category_id, name)
);

-- C. Template Module Definitions (Step 1 output)
CREATE TABLE scale_score_template_modules (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id          uuid NOT NULL REFERENCES scale_score_templates(id) ON DELETE CASCADE,
  module_type          text NOT NULL CHECK (module_type IN ('foundation','variant')),
  foundation_index     int NOT NULL DEFAULT 1,  -- which foundation this belongs to (1-based)
  difficulty           text CHECK (difficulty IN ('EASY','MEDIUM','HARD')),  -- null for foundation
  questions_per_attempt int NOT NULL CHECK (questions_per_attempt > 0),
  display_order        int NOT NULL DEFAULT 1,
  UNIQUE (template_id, module_type, foundation_index, difficulty)
);

-- D. Template Score Rows (Step 2 output: raw → scaled per module)
CREATE TABLE scale_score_template_rows (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_module_id      uuid NOT NULL REFERENCES scale_score_template_modules(id) ON DELETE CASCADE,
  raw_score               int NOT NULL CHECK (raw_score >= 0),
  scaled_score            int NOT NULL,
  UNIQUE (template_module_id, raw_score)
);

-- E. Link assessments to templates
ALTER TABLE assessment_items
  ADD COLUMN IF NOT EXISTS scale_score_template_id uuid
  REFERENCES scale_score_templates(id) ON DELETE SET NULL;

-- Index for FK lookup performance
CREATE INDEX IF NOT EXISTS idx_assessment_items_template
  ON assessment_items (scale_score_template_id)
  WHERE scale_score_template_id IS NOT NULL;
```

### 5.2 Key Data Contracts

**Template → assessment coupling:**
- `assessment_items.scale_score_template_id` FK (nullable — null = legacy mode)
- At exam scoring time: if template_id present → join `scale_score_template_modules` + `scale_score_template_rows` for score lookup. Else → use `assessment_scale_scores` (legacy).

**Module structure enforcement:**
- Template defines `max_foundation_modules` (e.g., 1 for standard SAT).
- Template defines variant modules per foundation via `scale_score_template_modules` rows where `module_type = 'variant'`.
- Create Assessment form reads the template structure and caps module add buttons + locks `questions_per_attempt`.

### 5.3 File Impact Map

| File | Change |
|------|--------|
| `src/app/super-admin/platform-config/page.tsx` | Add `supported_assessment_types` to ExamCategory type + CategorySlideOver form. Gate Analytics Config sub-tab by `'adaptive' in category.supported_assessment_types`. Add Scale Score Templates section inside AnalyticsDisplayPanel. |
| `src/app/super-admin/create-assessments/adaptive/page.tsx` | Remove `scale_score` tab. Add template chooser section in Edit tab. |
| `src/app/super-admin/create-assessments/adaptive/[id]/page.tsx` | Same as above for edit mode. |
| `src/app/super-admin/create-assessments/adaptive/_components.tsx` | `ScoreScoreTab` component kept (legacy) but no longer rendered in Create/Edit forms. Add `ScaleScoreTemplatePicker` component. |
| `docs/requirements/KSS-DB-060.sql` | New migration file (SA runs). |

---

## 6. Scope Boundaries

### 6.1 IN SCOPE (V1)

- `supported_assessment_types` column on `exam_categories` + Category slideover update
- Analytics Config sub-tab gated by `'adaptive'` in `supported_assessment_types` (replaces hardcoded SAT check)
- Scale Score Templates list, create (2-step), edit, activate/deactivate, delete guard — under SAT Analytics Config
- Step 2 CSV paste for bulk score row entry
- Template chooser section in Create + Edit Adaptive Assessment (Edit tab)
- `questions_per_attempt` locked per module when template selected
- `scale_score_template_id` saved on `assessment_items`
- Scale Score tab removed from Create + Edit Adaptive Assessment
- Legacy `assessment_scale_scores` rows untouched — backwards compatible
- DB Migration KSS-DB-060 SQL

### 6.2 OUT OF SCOPE (V2)

- Score lookup path at exam engine (uses template rows instead of per-assessment rows) — separate ticket
- NEET/JEE/CLAT scale score templates (category not yet adaptive)
- Bulk migration of existing `assessment_scale_scores` rows → template
- Template versioning / history
- CSV export of template rows

---

## 7. Edge Cases & Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Template deleted while assessments reference it | Delete guard: count `assessment_items WHERE scale_score_template_id = X`. Block if >0. |
| Template deactivated — existing assignments | Soft deactivate only: `is_active = false`. Assigned assessments keep the FK reference. New pickers filter to `is_active = true` only. |
| Step 1 module count changes on edit | Show warning if changing module count would invalidate previously-entered Step 2 score rows. Require explicit confirmation to clear affected rows. |
| CSV parse failure | Show first failing row inline with line number. Do not partial-save. |
| questions_per_attempt mismatch | If SA tries to set questions_per_attempt > template value: input is clamped + tooltip explains why. |
| Category name change | `exam_category_id` FK ensures templates stay linked to the category object, not the name string. |

---

## 8. Success Metrics

- SA creates a SAT scale score template once and assigns it to all SAT Full Tests without re-entering rows per assessment.
- Zero `assessment_scale_scores` rows written for new assessments that use a template.
- Create Assessment form enforces module count from template — no out-of-spec assessments possible.

---

## 9. UX Notes

- **Mobile:** Two-step slideover must be fully scrollable on mobile. Step indicator (Step 1 of 2) at top.
- **Step 2 CSV paste:** Textarea with mono font. Hint text: `raw,scaled (one per line, e.g. 0,200)`. Parse on blur or on "Preview" button before save.
- **Template picker placement:** Section sits immediately below Basic Info card, above the Analytics Config reference widget and Foundation Modules — so SA sees the structural constraint before configuring modules.
- **Locked QPA fields:** When a template is selected, all `questions_per_attempt` inputs on FM and VM cards receive `disabled` + `bg-zinc-50 text-zinc-400 cursor-not-allowed`. A `text-[10px] text-zinc-400` caption "Locked by scale score template" appears below each locked input.
- **Assessment Type selection:** Radio group in Category slideover — Not set / Adaptive / Linear. Single selection; stored as `text[]` with at most one value. No exam category can be both adaptive and linear.
