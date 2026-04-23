# PRD KSS-SA-PC-001: Platform Config — Exam Category CRUD & Consumer Wiring

**Status:** DRAFT
**Author:** Sandesh Banakar I
**Stakeholders:** Engineering (Radhika, Yashwanthkrishna), Product, QA, Design
**Target Version:** V1 (Current)
**Ticket:** KSS-SA-PC-001

---

## 1. Executive Summary & "The Why"

### 1.1 Problem Statement

Four gaps exist in the Platform Config page and the exam category data model:

1. **No CRUD for exam categories.** SA cannot create, edit, or delete exam categories from the UI. The Platform Config page only allows selecting existing categories via tabs to manage concept tags and analytics display — the categories themselves are unmanageable without direct DB access.

2. **`exam_categories` table is incomplete.** Missing `description` and `display_order` columns. Display names are wrong (JEE should be "JEE Mains", CLAT → "CLAT UG", NEET → "NEET UG", SSC → "SSC CGL"). No structural link between `exam_categories` and the `assessments` table — categories are duplicated as a free-text `exam_type` field.

3. **`is_active` flag has no consumers.** Toggling `is_active = false` on an exam category currently has no effect anywhere — SA dropdowns, the end-user `/assessments` page, and the `makeLive()` flow all ignore it.

4. **`makeLive()` sync is incomplete.** When SA publishes an assessment to LIVE status, it does not create a row in `assessments` or populate `assessment_items.assessments_id`. SA-created content never appears on the end-user `/assessments` listing page.

### 1.2 Business Value & ROI

- SA can fully manage exam categories without DB access
- `is_active` toggle gives SA immediate control over which categories appear to end users
- SA-published assessments will appear on the end-user `/assessments` page for the first time
- `display_order` from DB replaces hardcoded sort — SA controls category ordering in the end-user UI
- Shared `useExamCategories()` hook eliminates 5+ scattered `exam_categories` fetch call-sites

### 1.3 Strategic Alignment

Prerequisite for: adaptive assessment form creation (exam category dropdown), future exam category expansion (BANK, SSC CGL), and KSS-CC-SA-QB-001 concept tag FK migration.

---

## 2. User Personas & Impact

| Persona | Impact |
|---|---|
| **Super Admin** | Full CRUD for exam categories. Slide-over create/edit. Delete guarded by content counts. `is_active` toggle immediately controls visibility. Drag-to-reorder controls end-user category sequence. |
| **B2C Learner** | Inactive categories disappear from `/assessments` page. SA-published assessments appear for the first time. Category display order matches SA-configured `display_order`. |
| **Content Creator** | Exam category dropdown in all SA forms (sources, question bank, create-assessments) filtered to active categories only — no stale or deactivated entries. |

---

## 3. User Flow & System Logic

### 3.1 Platform Config Page — Card Grid Entry

**Entry point:** `/super-admin/platform-config`

1. SA lands on Platform Config — sees 3-col card grid of exam categories (mobile: 1-col, tablet: 2-col, desktop: 3-col)
2. Each card shows: category display name, exam badge (colour-coded), concept tag count, Edit button
3. "Create Exam Category" button (top-right, mirroring "Create B2B Plan" pattern)
4. Drag-to-reorder cards → updates `display_order` on drop (dnd-kit, already installed)

### 3.2 Drill-Down (Option A)

1. SA clicks a card → URL updates to `?cat=[categoryId]`
2. Card grid replaced by category detail view with breadcrumb: `Platform Config > {display name}`
3. Two sub-tabs: **Concept Tags** | **Analytics Display** (existing panels, unchanged)
4. Browser back / breadcrumb click → returns to card grid, selected card visually highlighted

### 3.3 Create Slide-Over

Fields:
- **Display Name** *(required)* — e.g. "JEE Mains"
- **Code / Name** *(required)* — short immutable identifier e.g. "JEE" — see §5.1 decision note
- **Slug** *(auto-generated, editable)* — e.g. `jee-mains`
- **Description** *(optional)*
- **Display Order** *(integer, default = max existing + 1)*
- **Active** *(toggle, default ON)*

On save: INSERT into `exam_categories`, refresh card grid.

### 3.4 Edit Slide-Over

- Code/Name field: **READ-ONLY** (immutable identifier after creation)
- All other fields editable
- **Delete** button at bottom of slide-over (destructive, rose-600)
- Delete shows inline confirmation with exact counts before executing

### 3.5 Delete Guard

Before executing delete, query:
1. `COUNT(*) FROM concept_tags WHERE exam_category = [name]` (text match — legacy column)
2. `COUNT(*) FROM assessment_items WHERE exam_category_id = [id]`

If either count > 0: show blocking error:
> "Cannot delete — [X] concept tags and [Y] assessments are linked to this category."

If both = 0: show confirmation dialog, then hard DELETE.

### 3.6 is_active Toggle Effects

| Consumer | Behaviour when is_active = false |
|---|---|
| SA create-assessments exam dropdown | Category hidden |
| SA sources-chapters exam dropdown | Category hidden |
| SA plans-pricing new category plan | Category hidden |
| End-user `/assessments` page | All assessments for that category hidden |
| Platform Config card grid | Card shown with "Inactive" badge — SA can still manage it |

### 3.7 makeLive Sync (assessment_items → assessments)

When SA clicks "Make Live" in Content Bank:
1. Existing: flip `assessment_items.status = 'LIVE'`, set `audience_type`
2. **New:** INSERT into `assessments` (title, exam_category_id→exam_type bridge, slug, duration_minutes, total_questions, assessment_type, subject, difficulty, min_tier, is_active=true)
3. **New:** UPDATE `assessment_items.assessments_id = [new assessments.id]`
4. Idempotent: if `assessments_id` already set, UPDATE the existing `assessments` row instead

---

## 4. Functional Requirements (BDD Style)

### Scenario 1: Create exam category
- **Given** I am a Super Admin on Platform Config
- **When** I click "Create Exam Category", fill in display name, code, and save
- **Then** a new card appears in the grid at the specified display order

### Scenario 2: Edit exam category name
- **Given** I am editing an exam category
- **When** I view the slide-over
- **Then** the Code/Name field is read-only and all other fields are editable

### Scenario 3: Delete blocked by content
- **Given** an exam category has 47 concept tags and 3 assessments
- **When** I click Delete in the edit slide-over
- **Then** I see "Cannot delete — 47 concept tags and 3 assessments are linked to this category"
- **And** no delete is executed

### Scenario 4: Delete succeeds when empty
- **Given** an exam category has 0 concept tags and 0 assessments
- **When** I confirm deletion
- **Then** the category is hard-deleted and its card is removed from the grid

### Scenario 5: Deactivate category
- **Given** I toggle is_active = false on SAT
- **When** a B2C learner visits `/assessments`
- **Then** no SAT assessments appear in the library
- **And** SAT does not appear in any SA form dropdowns

### Scenario 6: Drag reorder
- **Given** I drag the SAT card from position 5 to position 1
- **When** I drop it
- **Then** `exam_categories.display_order` updates for all affected rows
- **And** the end-user `/assessments` page reflects the new order on next load

### Scenario 7: makeLive creates assessments row
- **Given** SA marks an assessment_item as LIVE
- **When** `makeLive()` executes
- **Then** a new row is inserted in `assessments` with `exam_category_id` set
- **And** `assessment_items.assessments_id` is set to the new row's id
- **And** the assessment appears on the end-user `/assessments` listing

### Scenario 8: URL param preserves drill-down state
- **Given** SA navigated to `?cat=[SAT-id]` and is on Concept Tags sub-tab
- **When** SA refreshes the page
- **Then** the page loads directly into SAT's Concept Tags sub-tab

---

## 5. Technical Specifications

### 5.1 PENDING DECISION — rename vs display_name

**Option A: Rename `exam_categories.name`**
- Cascade UPDATE `concept_tags.exam_category` (140 rows)
- Cascade UPDATE `plans.category` (9 CATEGORY_BUNDLE plans)
- `name` field in UI remains the single label

**Option B: Add `display_name` column (recommended)**
- `name` = immutable short code ('JEE', 'CLAT', etc.) — never shown to end users
- `display_name` = human-readable label ('JEE Mains', 'CLAT UG', etc.) — shown everywhere
- Zero cascade SQL needed; `concept_tags.exam_category` and `plans.category` stay as short codes
- Edit slide-over: `name` read-only, `display_name` editable
- All UI consumers read `display_name` for labels, join on `name`/`id` for queries

**Decision required from Sandesh before migration SQL is written.**

### 5.2 DB Migrations Required

#### KSS-DB-045 — exam_categories schema additions
```sql
ALTER TABLE exam_categories
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
-- If Option B chosen:
  ADD COLUMN IF NOT EXISTS display_name TEXT;
-- Seed display_order by current alphabetical position
-- Seed display_name values: JEE Mains, CLAT UG, NEET UG, SSC CGL, BANK, SAT
```

#### KSS-DB-046 — assessments.exam_category_id FK + drop exam_type
```sql
-- Step A: Add FK column + backfill
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS exam_category_id UUID REFERENCES exam_categories(id);
UPDATE assessments SET exam_category_id = ec.id
FROM exam_categories ec WHERE assessments.exam_type = ec.name;
-- Verify: SELECT COUNT(*) FROM assessments WHERE exam_category_id IS NULL AND exam_type IS NOT NULL;

-- Step B: Drop exam_type (run only after Step A verified)
ALTER TABLE assessments DROP COLUMN exam_type;
```

Backfill mapping (confirmed from DIAG-2 + DIAG-3):
| exam_type | exam_categories.id |
|---|---|
| 'JEE' | `93319838-3e05-4472-9dd0-decd6f731f7b` |
| 'CLAT' | `ad260442-74de-4e7c-993c-f006c4a29045` |
| 'NEET' | `23d482e7-81c3-4a10-bd60-52fd458595d6` |
| 'SAT' | `f16d8e32-77d1-4705-ac75-be7009c85636` |

### 5.3 Shared Hook — useExamCategories

**Location:** `src/hooks/useExamCategories.ts`

```typescript
// SA variant — all categories (active + inactive), ordered by display_order
useExamCategories({ activeOnly: false })

// Consumer variant — active only
useExamCategories({ activeOnly: true })
```

Replaces all 5 existing scattered call-sites:
- `src/lib/supabase/content-bank.ts` → `fetchExamCategories()`
- `src/app/super-admin/create-assessments/page.tsx`
- `src/app/super-admin/create-assessments/linear/page.tsx`
- `src/app/super-admin/platform-config/page.tsx`
- `src/app/client-admin/[tenant]/reports/page.tsx`

### 5.4 AssessmentLibrarySection — EXAM_SORT_ORDER replacement

- Remove hardcoded `EXAM_SORT_ORDER` array (line 26)
- Accept `examCategories: ExamCategory[]` prop (sorted by `display_order` ASC, filtered `is_active = true`)
- Filter `assessments` where `exam_category_id` is in active category ids
- `/assessments/page.tsx` calls `useExamCategories({ activeOnly: true })` and passes to component

### 5.5 makeLive() Implementation

Location: `src/lib/supabase/content-bank.ts`

When `contentType = 'ASSESSMENT'`:
1. Fetch `assessment_items` row to get `exam_category_id`, `title`, `test_type`, etc.
2. Check if `assessments_id` already set (idempotent guard)
3. INSERT `assessments` row with all required engine fields
4. UPDATE `assessment_items.assessments_id = new_id`
5. Flip `status = 'LIVE'`, `audience_type`

### 5.6 Concept Tag Count Query Update

After QB-DB-021 Step B (drop `question_concept_mappings`), update platform-config count query:
```sql
-- Replace: SELECT concept_tag_id, COUNT(*) FROM question_concept_mappings WHERE ...
-- With:
SELECT COUNT(*) FROM questions WHERE concept_tag_id = $1
```

### 5.7 CQ-6 Concept Tag Insertions

New `concept_tags` rows to insert (SQL in SQL-RESPONSE-2.txt Step A.7 — partially done):
- Thermodynamics Laws → JEE, Physics (confirmed CQ-6b)
- Arithmetic, Ratio & Proportion → CLAT, Quantitative Techniques (confirmed CQ-6c)
- All Physics/Chemistry tags → JEE only (confirmed CQ-6a)

---

## 6. Scope Boundaries

### 6.1 IN SCOPE (V1 — KSS-SA-PC-001)
- Platform Config card grid + drill-down (URL param `?cat=[id]`)
- Exam Category CRUD (create, edit slide-over, delete guard)
- Drag-to-reorder (`display_order`)
- DB migrations: KSS-DB-045, KSS-DB-046
- `useExamCategories` shared hook
- `is_active` consumer wiring: SA dropdowns + `/assessments` page
- `EXAM_SORT_ORDER` replacement with `display_order` from DB
- `makeLive()` → assessments sync
- Concept tag count query update (post QB-DB-021 Step B)
- Fix silent delete error handler (platform-config/page.tsx line 259)

### 6.2 OUT OF SCOPE (Deferred)
- Adaptive assessment form creation (separate ticket — uses shared hook when built)
- `concept_tags.exam_category` TEXT → UUID FK migration (separate ticket post QB-DB-021)
- Analytics Display config for NEET/JEE/CLAT/BANK/SSC (currently "Coming Soon")
- Audit logging for exam category mutations
- B2B tenant-scoped exam category overrides

---

## 7. Edge Cases & Risk Mitigation

- **Concurrent edit:** Two SAs editing same category simultaneously — last write wins (acceptable for V1; no locking needed)
- **makeLive idempotency:** If `assessments_id` already set, UPDATE existing row instead of INSERT to prevent duplicates
- **display_order gaps after delete:** Resequence is NOT required; gaps are acceptable (drag reorder sets explicit integers)
- **Empty BANK/SSC cards:** Show standard empty state (no concept tags, no analytics config) — identical to NEET/JEE/CLAT currently
- **URL param with invalid categoryId:** Fall back to card grid view, no error shown
- **is_active toggle with active learners mid-session:** Toggle takes effect on next page load only; no forced session invalidation

---

## 8. Impacted Existing Components

| Component | Change |
|---|---|
| `platform-config/page.tsx` | Full refactor — tabs → card grid + drill-down + CRUD |
| `content-bank.ts` → `makeLive()` | Add assessments INSERT + assessments_id update |
| `content-bank.ts` → `fetchExamCategories()` | Replace with `useExamCategories` hook |
| `AssessmentLibrarySection.tsx` | Remove EXAM_SORT_ORDER; accept examCategories prop |
| `useAssessments.ts` | JOIN exam_categories after exam_type drop |
| `assessments/page.tsx` | Call useExamCategories, pass to AssessmentLibrarySection |
| `create-assessments/page.tsx` | Use shared hook with activeOnly=true |
| `create-assessments/linear/page.tsx` | Use shared hook with activeOnly=true |
| All sources-chapters dropdowns | Use shared hook with activeOnly=true |

---

## 9. Success Metrics

- SA can create/edit/delete exam categories without DB access
- All SA form dropdowns derive from `exam_categories` table (zero hardcoded exam lists)
- SA-published assessments appear on `/assessments` within 1 page reload after Make Live
- `npm run build` passes clean post-implementation
