# PRD KSS-CC-SA-QB-001: Question Bank — Super Admin & Content Creator

**Status:** LOCKED  
**Author:** Sandesh Banakar I  
**Stakeholders:** Engineering, Product, QA  
**Target Version:** V1 (Current — Apr 20 2026)

---

## 1. Executive Summary & "The Why"

### 1.1 Problem Statement
Questions were previously seeded via raw SQL with no structured admin UI. Super Admins and Content Creators had no way to create, edit, preview, or manage the question bank from the platform. This blocked scalable content creation for JEE, NEET, CLAT, and SAT.

### 1.2 Business Value & ROI
A structured question bank is the foundation for all exam simulations on the platform. Without it, every new assessment requires an engineering SQL sprint. This feature removes that bottleneck and hands content ownership to the SA/CC team.

### 1.3 Strategic Alignment
Direct prerequisite for KSS-SA-030 (Assessment Builder) and all future NEET/JEE/CLAT question seeding work. Unblocks QB-003 (runtime question picker), QS-001b/c/d (seeding campaigns), and TIPTAP-001/002 (exam player rich text rendering).

---

## 2. User Personas & Impact

| Persona | Impact / Workflow Change |
| :--- | :--- |
| **Super Admin** | Can create, edit, preview, and soft-delete questions of all types (MCQ, NUMERIC, PASSAGE) directly from the platform. No longer needs an engineering SQL sprint for new content. |
| **Content Creator** | Same create/edit/preview capability within their assigned exam categories. Actions are scoped to their role. |
| **Learner** | Indirect — better quality questions with structured validation, rich text, and diagrams appear in their assessments. |

---

## 3. User Flow & System Logic

### 3.1 Functional Flowchart

**Entry Point:** `/super-admin/question-bank`

**Create flow:**
1. SA lands on Question Bank list page — sees all questions with serial #, type, difficulty, created by, last edited by.
2. Clicks "New Question" → `QuestionForm` opens in create mode.
3. Selects exam category filter → source → chapter.
4. Selects question type (MCQ_SINGLE / MCQ_MULTI / PASSAGE_SINGLE / PASSAGE_MULTI / NUMERIC).
5. Authors content using Tiptap rich-text editor (supports KaTeX for formulas).
6. Sets difficulty, marks, negative_marks, concept_tag, optional video URL.
7. Save → `questions` row inserted; for PASSAGE types `passage_sub_questions` rows inserted.

**Edit flow:**
1. From list page, eye icon → `QuestionPreviewModal` shows read-only preview.
2. Edit button in modal → `QuestionForm` opens in edit mode with existing data loaded.
3. SA edits → Save → `questions` updated, sub-questions updated/created/deleted.

**Delete flow:**
1. From preview modal, Delete button → confirmation warning shown.
2. Confirmed → `questions` row hard-deleted (CASCADE deletes `passage_sub_questions` + `assessment_question_map` rows).

### 3.2 State Transition Logic

Questions have a single `status` field: `DRAFT | ACTIVE | FLAGGED`.
- On create: always `ACTIVE` — no draft cycle.
- `FLAGGED`: set externally when a learner reports an issue (future scope).
- No archive state — wrong questions should be corrected, not hidden.

---

## 4. Functional Requirements

### Scenario 1: Create MCQ_SINGLE / MCQ_MULTI question
- **Given** I am a Super Admin on `/super-admin/question-bank/new`
- **When** I select type MCQ_SINGLE or MCQ_MULTI, author question text, set 4–6 options, select correct answer(s), and click Save
- **Then** a `questions` row is inserted with `question_type`, Tiptap `question_text`, `options` JSONB array, `correct_answer` JSONB array, `marks`, `negative_marks`, `concept_tag_id`, `source_id`, `chapter_id`, `created_by`

### Scenario 2: Create NUMERIC question
- **Given** I select type NUMERIC
- **When** I set `numeric_answer_type = EXACT` and enter a value, or `RANGE` and enter min/max, and click Save
- **Then** `questions` row is inserted with `numeric_answer_type`, `numeric_min`, `numeric_max` (RANGE only), `acceptable_answers` JSONB (EXACT only, wraps value in array)

### Scenario 3: Create PASSAGE_MULTI question
- **Given** I select type PASSAGE_MULTI
- **When** I author the passage text, add N sub-questions (each with options, correct answer, marks, negative_marks), and click Save
- **Then** one `questions` row is inserted (parent, no options/correct_answer, `marks` = auto-sum of sub-question marks), and N `passage_sub_questions` rows inserted

### Scenario 4: Create PASSAGE_SINGLE question
- **Given** I select type PASSAGE_SINGLE
- **When** I author the passage text (optional stem label in `question_text`), add exactly 1 sub-question, and click Save
- **Then** one `questions` row inserted with optional `question_text` (stem) and one `passage_sub_questions` row; stem is shown in exam player only, not in admin preview

### Scenario 5: Options — minimum/maximum enforcement
- **Given** a question has MCQ options
- **When** option count is at minimum (4), the remove button on all options is disabled
- **And** when option count is at maximum (6), the "Add option" button is disabled
- **And** when an option is the currently selected correct answer, its remove button is disabled — SA must change correct answer first

### Scenario 6: Drag-to-reorder options
- **Given** a question has MCQ options
- **When** SA drags an option to a new position using the grip handle
- **Then** option keys are reflowed alphabetically (A → B → C …) and `correct_answer` is updated to the new key assignment for the previously correct option(s)

### Scenario 7: Concept tag assignment
- **Given** concept tags are loaded from `concept_tags` grouped by exam_category → subject
- **When** SA selects a tag from the dropdown
- **Then** `form.concept_tag_id` is set to the selected `concept_tags.id` UUID; saved as `questions.concept_tag_id`
- **And** if no tag is relevant, SA may leave it as `— None —` (nullable)

### Scenario 8: Marks validation
- **Given** SA enters marks and negative_marks for any question type
- **When** the form is submitted
- **Then** validation blocks save if: marks ≤ 0, marks > 10, negative_marks < 0, or negative_marks > marks
- **And** for PASSAGE_MULTI, the parent marks field is read-only and equals the sum of all sub-question marks

### Scenario 9: Question preview
- **Given** I am on the Question Bank list page
- **When** I click the eye icon on any question row
- **Then** `QuestionPreviewModal` opens showing the question in a split-pane format: Edit tab (admin) and Preview tab (learner view)
- **And** MCQ shows options with correct answer highlighted, NUMERIC shows expected answer, PASSAGE shows passage + sub-questions

### Scenario 10: Edit existing question
- **Given** I open a question in edit mode from the preview modal
- **When** the form loads
- **Then** all existing options are loaded as-is from the DB (not normalised to 4 slots — a saved 5-option question must show 5 options)
- **And** concept_tag_id is pre-selected in the dropdown if set

---

## 5. Technical Specifications

### 5.1 Data Entities

**Primary:** `questions` — see CLAUDE-DB.md for full schema.

Key columns relevant to QB-001 feature:
- `question_type`: `MCQ_SINGLE | MCQ_MULTI | PASSAGE_SINGLE | PASSAGE_MULTI | NUMERIC`
- `question_text`: JSONB (Tiptap doc) — for PASSAGE types stores optional stem
- `passage_text`: JSONB (Tiptap doc) — passage body
- `options`: JSONB array `[{key: 'A', text: TiptapDoc}, ...]` — 4–6 items for MCQ
- `correct_answer`: JSONB array `["A"]` single, `["A","C"]` multi, `null` for NUMERIC
- `acceptable_answers`: JSONB array — NUMERIC EXACT only
- `numeric_answer_type`: `EXACT | RANGE`
- `numeric_min`, `numeric_max`: numeric nullable — RANGE only
- `marks`: numeric (validated: 0 < marks ≤ 10; PASSAGE_MULTI = auto-sum)
- `negative_marks`: numeric (validated: 0 ≤ neg ≤ marks)
- `concept_tag_id`: UUID FK→concept_tags ON DELETE RESTRICT, nullable
- `source_id`, `chapter_id`: UUID FKs (bank model — question owned by chapter)
- `created_by`, `last_modified_by`: UUID FK→admin_users

**Secondary:** `passage_sub_questions`
- `marks`, `negative_marks`: numeric (same validation rules; KSS-DB-033)
- `question_text`, `options`, `correct_answer`, `explanation`: same Tiptap JSONB shape as parent

### 5.2 Key Components

| File | Role |
|------|------|
| `src/app/super-admin/question-bank/page.tsx` | List view — serial #, type, difficulty, created/edited by, eye action |
| `src/app/super-admin/question-bank/new/page.tsx` | Create route → `QuestionForm` |
| `src/app/super-admin/question-bank/[questionId]/edit/page.tsx` | Edit route → `QuestionForm` |
| `src/app/super-admin/question-bank/_components/QuestionForm.tsx` | Full create/edit form — all types, dnd options, validation |
| `src/app/super-admin/question-bank/_components/QuestionPreviewModal.tsx` | Read-only preview with Edit routing + Delete confirm |
| `src/components/ui/RichTextEditor.tsx` | Tiptap editor with KaTeX extension — used in form |
| `src/components/ui/RichTextRenderer.tsx` | Read-only Tiptap+KaTeX renderer — used in preview |

### 5.3 Rich Text (Tiptap JSONB)
All `question_text`, `explanation`, `passage_text`, and `options[].text` are stored as Tiptap `{ type: 'doc', content: [...] }` JSONB.
- Always call `ensureDoc()` when reading from DB — wraps legacy plain-string rows.
- Always call `isDocEmpty()` before saving optional fields — saves null for empty docs.
- KaTeX math: inline `$...$` and block `$$...$$` supported via Tiptap KaTeX extension.

### 5.4 dnd-kit Drag-to-Reorder
- Package: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (already installed).
- `reflowOptions(ordered, prevOpts, prevCorrect)` — reassigns keys A–F by position; uses object identity via Set to track correct option through the reorder.
- Both parent options (MCQ) and sub-question options (PASSAGE) use their own independent `DndContext` + `SortableContext`.

### 5.5 Concept Tag FK Integrity
- `questions.concept_tag_id` UUID FK ON DELETE RESTRICT (KSS-DB-034).
- Dropdown value = `concept_tags.id` UUID, not concept_name text.
- Platform Config delete handler must be fixed before allowing tag deletion when questions reference it (QB-010 — separate ticket).

---

## 6. Scope Boundaries

### 6.1 IN SCOPE (V1 — shipped Apr 20 2026)
- All 5 question types: MCQ_SINGLE, MCQ_MULTI, PASSAGE_SINGLE, PASSAGE_MULTI, NUMERIC
- Rich text authoring and preview (Tiptap + KaTeX)
- Options 4–6 with drag-to-reorder and key reflow
- Concept tag assignment via UUID FK dropdown
- Marks + negative_marks validation (all types)
- Question Bank list with serial #, type, difficulty, created/last edited by
- Preview modal (read-only split pane: admin + learner view)
- Create and edit flows; hard delete with confirmation

### 6.2 OUT OF SCOPE (V2 / Deferred)
- **QB-003**: Assessment question-picker UI — SA picks sources/chapters, system randomly assigns questions at runtime
- **QB-010**: Platform Config concept tag delete — FK violation error handler (show "Cannot delete — X questions reference this tag")
- **TIPTAP-001/002**: Exam player rendering of Tiptap JSONB (separate ticket)
- **Bulk import / CSV upload** of questions
- **Question versioning / history**
- **CC-scoped question visibility** (all questions currently visible to all SAs/CCs)
- JEE-specific note: NEET Physics/Chemistry concept tags are JEE-only for now. NEET CCs must add NEET-specific entries via Platform Config.

---

## 7. Edge Cases & Risk Mitigation

- **Edit mode option load**: `loadQuestion()` must NOT normalise to 4 slots — if DB has 5 options, load all 5. Fix shipped (Apr 20 2026).
- **filteredSources race condition**: `filteredSources` computed via `useMemo`; source/chapter reset effect gated on `allSources.length > 0` to prevent wiping on slow connections. Fix shipped (Apr 20 2026).
- **PASSAGE_SINGLE marks validation**: Marks validation loop uses `if (isPassage)` not `if (isPassageMulti)` to cover PASSAGE_SINGLE sub-question marks. Fix shipped (Apr 20 2026).
- **PASSAGE_MULTI parent marks**: Auto-sum from sub-questions — never user-enterable. If SA adds a sub-question, parent marks updates immediately.
- **concept_tag_id null**: Nullable — SA may leave untagged. Analytics MistakeTaxonomy will not display a concept for untagged questions.
- **FK RESTRICT on concept_tag_id**: Deleting a concept_tag while questions reference it will produce a Supabase FK error. Platform Config must catch and surface this error (QB-010).
- **Concept tags not yet renamed**: `exam_categories.name` still shows `JEE` not `JEE Mains` etc. (rename migration pending KSS-SA-PC-001). Concept tag dropdown will show current DB values until that migration runs.

---

## 8. Success Metrics (KPIs)

- SA/CC can create a question of any type end-to-end without engineering involvement.
- Zero question data loss on edit (options, correct_answer, concept_tag_id all round-trip correctly).
- Build passes (`npm run build`) with no type errors.
- `unmatched = 0` on KSS-DB-034 backfill verify (confirmed Apr 20 2026).

---

## 9. DB Migration Log (this feature)

| Migration | Date | Change |
|-----------|------|--------|
| KSS-DB-033 (sprint label: KSS-DB-020) | Apr 20 2026 | Added `numeric_answer_type (TEXT CHECK EXACT\|RANGE)`, `numeric_min (NUMERIC NULL)`, `numeric_max (NUMERIC NULL)` to `questions`. Added `marks (NUMERIC)`, `negative_marks (NUMERIC)` to `passage_sub_questions`. |
| KSS-DB-034 (sprint label: KSS-DB-021) | Apr 20 2026 | Added `concept_tag_id UUID FK→concept_tags ON DELETE RESTRICT` (nullable) to `questions`. Backfilled 233/233 rows (inserted 41 missing concept_tags first). Dropped `concept_tag` text column. Dropped `question_concept_mappings` table. |

> **Note:** Sprint labels KSS-DB-020/021 collide with plan migrations (compare_at_price, plan lifecycle) already in CLAUDE-DB.md. Canonical numbers are KSS-DB-033 and KSS-DB-034.
