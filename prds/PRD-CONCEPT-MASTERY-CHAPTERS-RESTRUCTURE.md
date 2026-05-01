# PRD: Concept Mastery Restructure — Concepts → Chapters (All Exams)

**Status:** APPROVED FOR IMPLEMENTATION  
**Author:** Claude (Sandesh Banakar I approval)  
**Target Version:** V1+ (Phased)  
**Priority:** Phase 1: NEET | Phase 2: JEE, CLAT | Phase 3: BANK, SSC, SAT  
**Date:** May 1, 2026  
**Depends on:** Exam Engine update (planned integration, not blocker)

---

## 1. Executive Summary

### 1.1 Problem Statement
- **Current Model:** Concepts are free-text tags. Only SAT has sources/chapters structure. Other exams (NEET, JEE, CLAT) are concept-tag-flat.
- **Analytics** shows "Concept Mastery" (per-concept tracking). Not learner-friendly for discovery.
- **Platform Config** manages concept tags (loose CRUD). No organizational hierarchy.
- **Data Fragmentation:** Questions link via `concept_tag` text field + `question_concept_mappings` table. Exam engine reads this. UI must denormalize.

### 1.2 Solution: Unified Sources → Chapters Architecture
1. **Concepts become Chapters** (1:1 rename) — Each concept tag becomes a chapter in a source
2. **Auto-migrate existing tags** → Auto-create sources/chapters for NEET, JEE, CLAT, BANK, SSC
3. **Keep sections flexible** — Selected in Create Assessment form (not baked into chapters)
4. **Update analytics** to show "Chapter Mastery" instead of "Concept Mastery"
5. **Refactor questions** to use `chapter_id` FK instead of `concept_tag` text field
6. **Platform Config:** Stays as analytics config only (not sources/chapters CRUD — that stays in `/sources-chapters`)

### 1.3 Scope & Non-Scope

**IN SCOPE (This Ticket):**
- DB migrations for all exams (sources, chapters tables, auto-migration)
- Questions table refactor (concept_tag → chapter_id)
- Auto-create chapters from existing concept tags
- Update Create Assessment form to pick from chapters
- Update analytics UI to show chapter mastery
- Exam engine integration **PLAN** (ready to wire, not implemented yet)

**NOT IN SCOPE (Future Tickets):**
- Exam engine implementation (separate ticket dependency)
- New assessment types that leverage chapter hierarchies
- Advanced section management features

---

## 2. Architecture & Data Model

### 2.1 New Unified Hierarchy
```
exam_categories (NEET, JEE, CLAT, BANK, SSC, SAT)
  ├── sources (one per category)
  │   ├── Name: "{Category Name} - Reference" (e.g., "NEET - Reference", "SAT - Complete Suite")
  │   ├── Status: ACTIVE
  │   └── Chapters
  │       ├── name: "{Chapter Name}" (e.g., "Quadratic Equations")
  │       ├── source_id FK
  │       ├── order_index (0, 1, 2, ...)
  │       ├── difficulty (easy|medium|hard|mixed)
  │       └── [section_name] (optional field for analytics, picked at assessment creation)
  │
  └── Questions
      ├── chapter_id FK (replaces concept_tag)
      ├── source_id FK (inherited via chapter)
      ├── [concept_tag] (deprecated, kept during transition for exam engine compatibility)
      └── [section_name] (set at assessment creation, not chapter-bound)
```

### 2.2 Section Flexibility Model
- **Sections are NOT baked into chapters**
- **Sections are picked during assessment creation** (Create Linear/Adaptive Assessment form)
- Already supported via `Create Assessment → sections → SourceChapterPicker`
- This keeps content (chapters) separate from test structure (sections)
- **Example:**
  - Chapter: "Organic Chemistry Basics"
  - Same chapter could appear in Section 1 (Organic) OR Section 2 (Advanced) of different assessments
  - No conflict; chapters are reusable

### 2.3 Questions Table Refactor

**Current:**
```sql
questions.concept_tag         TEXT (free text, matches concept_tags.concept_name)
questions.chapter_id          UUID FK (SAT only, mostly NULL)
questions.source_id           UUID FK (SAT only, mostly NULL)
question_concept_mappings     (junction table, question → concept_tag)
```

**New:**
```sql
questions.chapter_id          UUID FK → chapters.id (NOT NULL after migration)
questions.source_id           UUID FK → sources.id (denormalized from chapters.source_id)
questions.concept_tag         TEXT (DEPRECATED, kept for exam engine transition)
question_concept_mappings     (DEPRECATED, can be dropped after engine wired)
```

---

## 3. Implementation Plan (5 Phases)

### **PHASE 0: Exam Engine Readiness** [PLANNED, NOT IN THIS TICKET]
- Exam engine team updates to read `questions.chapter_id` instead of `concept_tag`
- Exam engine writes to `user_chapter_mastery` (or adapted `user_concept_mastery`)
- Timeline: TBD (we proceed in parallel)

### **PHASE 1: DB Schema + NEET Migration** [WEEKS 1-2]

#### 1.1 Create DB Migrations
**KSS-DB-061:** Add `section_name` column to chapters table
```sql
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS section_name TEXT DEFAULT NULL;
ALTER TABLE chapters ADD COLUMN IF NOT EXISTS section_display_order INT DEFAULT NULL;
```

**KSS-DB-062:** Create `chapter_section_map` (for future use, if sections need to be per-chapter)
```sql
-- May not be needed if sections stay flexible in assessment form
-- Create as "reserved for future" to avoid surprises
CREATE TABLE IF NOT EXISTS chapter_section_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID FK → chapters.id ON DELETE CASCADE,
  exam_category_id UUID FK → exam_categories.id ON DELETE CASCADE,
  section_name TEXT,
  section_display_order INT,
  UNIQUE(chapter_id, section_name)
);
```

**KSS-DB-063:** Refactor questions table
```sql
-- Add NOT NULL enforcement (but allow NULL during transition)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS chapter_id_new UUID;
ALTER TABLE questions ADD CONSTRAINT fk_questions_chapter_id_new 
  FOREIGN KEY (chapter_id_new) REFERENCES chapters(id) ON DELETE CASCADE;

-- Backfill: for questions with concept_tag, find matching chapter
-- (requires chapter creation first — see 1.2 below)
UPDATE questions q SET chapter_id_new = c.id
  FROM chapters c
  WHERE q.concept_tag IS NOT NULL
  AND c.id IN (
    SELECT id FROM chapters 
    WHERE name = q.concept_tag
    AND source_id IN (
      SELECT id FROM sources 
      WHERE exam_category_id = q.source_id  -- ⚠ Temp: derive from assessment
    )
  );

-- Rename columns (in 1.3 after validation)
-- ALTER TABLE questions RENAME COLUMN chapter_id TO chapter_id_old;
-- ALTER TABLE questions RENAME COLUMN chapter_id_new TO chapter_id;
```

#### 1.2 Auto-Create Sources + Chapters from concept_tags (NEET)
- **Script:** `docs/scripts/migrate-concepts-to-chapters-NEET.sql`
- **Process:**
  1. Get all unique `concept_tags` for NEET from `questions` table
  2. Create one **Source** per exam category (e.g., "NEET - Reference Content")
  3. Create one **Chapter** per unique concept_tag (preserve tag name as chapter name)
  4. Backfill `questions.chapter_id` for all NEET questions

**SQL Skeleton:**
```sql
-- Step 1: Create source for NEET
INSERT INTO sources (
  name, description, exam_category_id, difficulty, status, created_by, last_modified_by
) SELECT 'NEET - Reference Content', 'Auto-created from concept tags', 
  ec.id, 'mixed', 'ACTIVE', DEMO_SA_ID, DEMO_SA_ID
FROM exam_categories ec WHERE ec.name = 'NEET'
RETURNING id INTO @source_id;

-- Step 2: Create chapters from unique concept tags
INSERT INTO chapters (source_id, name, order_index, difficulty)
SELECT @source_id, DISTINCT concept_tag, ROW_NUMBER() OVER (ORDER BY concept_tag),
  CASE WHEN difficulty IN ('easy','medium','hard') THEN difficulty ELSE 'mixed' END
FROM questions q
WHERE q.source_id IN (SELECT id FROM sources WHERE exam_category_id = ...)
  AND q.concept_tag IS NOT NULL
ON CONFLICT DO NOTHING;

-- Step 3: Backfill questions.chapter_id
UPDATE questions q SET chapter_id = c.id
FROM chapters c
WHERE q.concept_tag = c.name AND c.source_id = @source_id;
```

#### 1.3 Validation & Cutover
- Verify 100% of NEET questions now have `chapter_id` NOT NULL
- Run `npm run build` — TypeScript checks
- Test in staging: Create Assessment → Chapter picker works
- Optionally run concurrent: NEET, JEE, CLAT (parallel migration scripts)

---

### **PHASE 2: Update Create Assessment Forms** [WEEKS 2-3]

#### 2.1 Linear Assessment Builder
- **File:** `src/app/super-admin/create-assessments/linear/page.tsx`
- **Current:** Uses `SourceChapterPicker` to select sources/chapters (already working)
- **Update:** No code change needed — already supports chapter selection ✓
- **Verify:** Sections are selected AFTER chapters (not baked into chapters)

#### 2.2 Adaptive Assessment Builder
- **File:** `src/app/super-admin/create-assessments/adaptive/page.tsx`
- **Current:** Uses Foundation Modules + Variant Modules
- **Update:** Module definition picks from chapters (not concepts)
- **Change:** Replace `conceptTags` picker with `chapters` picker in `FoundationModuleCard`

**Code Skeleton:**
```tsx
// Before:
<ConceptTagPicker 
  examCategoryId={examCategoryId}
  selectedTags={module.concept_tags}
  onChange={(tags) => updateModule(module.id, { concept_tags: tags })}
/>

// After:
<ChapterPicker 
  examCategoryId={examCategoryId}
  selectedChapterIds={module.chapter_ids}
  onChange={(ids) => updateModule(module.id, { chapter_ids: ids })}
/>
```

#### 2.3 Question Bank Filters
- **File:** `src/app/super-admin/question-bank/page.tsx`
- **Current:** Filters by `concept_tag`
- **Update:** Add filter by `chapter.name` (derived from `questions.chapter_id`)
- **Keep:** `concept_tag` filter for backward compat during transition

---

### **PHASE 3: Update Analytics** [WEEKS 3-4]

#### 3.1 Analytics Tab (SATAnalyticsTab.tsx + Generic AnalyticsTab)
- **Current:** Shows concept mastery (from `user_concept_mastery`)
- **Update:** Show chapter mastery (from `user_chapter_mastery` OR adapted `user_concept_mastery`)

**Data Pipeline:**
```
attempt_answers.chapter_id 
  → GROUP BY chapter_id, user_id, assessment_id
  → user_chapter_mastery (insert/update)
  → AnalyticsTab renders "Chapter Mastery" section
```

#### 3.2 Leverage Section (weak concepts)
- **Current:** Shows top weak concepts from `user_concept_mastery`
- **Update:** Shows top weak chapters (sorted by impact)
- **UI:** Replace concept pills with chapter names + source context

#### 3.3 Concept Mastery Panel
- **Rename to:** "Chapter Mastery Panel"
- **Data:** Same computation, keyed on `chapter_id` instead of `concept_tag`
- **Display:** Show chapter difficulty + source alongside strength/developing/needs_practice badges

---

### **PHASE 4: Exam Engine Integration** [TBD]

#### 4.1 Exam Engine Wiring
- Once exam engine is updated to support `chapter_id`:
  - Exam engine reads `questions.chapter_id`
  - Exam engine writes to `user_chapter_mastery` (or adapted table)
  - Remove `concept_tag` from questions (or keep as audit field)

#### 4.2 Backward Compat Cleanup
- After engine cutover: soft-delete `concept_tag_section_map` table
- Deprecate `question_concept_mappings` table
- Migrate historical data if needed

---

### **PHASE 5: Other Exams (JEE, CLAT, BANK, SSC)** [WEEKS 4+]

- Repeat PHASE 1-2 for each exam
- Can run in parallel after NEET validation
- Same script template, different exam_category_id

---

## 4. File Changes Summary

### **Database Files**
- `docs/scripts/migrate-concepts-to-chapters-NEET.sql` (NEW)
- `docs/scripts/migrate-concepts-to-chapters-JEE.sql` (NEW)
- `docs/scripts/migrate-concepts-to-chapters-CLAT.sql` (NEW)
- `docs/scripts/migrate-concepts-to-chapters-BANK.sql` (NEW)
- `docs/scripts/migrate-concepts-to-chapters-SSC.sql` (NEW)
- Update: `database.schema.json` with new chapter structure

### **Frontend Components**
- `src/app/super-admin/create-assessments/adaptive/_components.tsx` (ChapterPicker integration)
- `src/app/super-admin/create-assessments/adaptive/page.tsx` (Module definition)
- `src/app/super-admin/question-bank/page.tsx` (Filter by chapter)
- `src/components/assessment-detail/AnalyticsTab.tsx` (Chapter mastery rendering)
- `src/components/assessment-detail/SATAnalyticsTab.tsx` (Chapter mastery, if separate)

### **Type Updates**
- `src/types/index.ts` (FoundationModule, VariantModule add chapter_ids)
- Remove: `conceptTags` field (or keep for compat)

### **Backend APIs**
- `src/lib/supabase/questions.ts` (Queries by chapter_id)
- `src/lib/supabase/assessments.ts` (Chapter picker loader)
- `src/lib/supabase/analytics.ts` (Chapter mastery aggregation — prep for engine)

---

## 5. Platform Config Impact (CLAUDE-PLATFORM.md Updates)

### **5.1 What Stays the Same**
- `/super-admin/platform-config` = analytics configuration (toggles, settings)
- `/super-admin/sources-chapters` = sources/chapters management (CRUD)
- Platform Config does NOT manage chapters (that's sources-chapters page)

### **5.2 What Changes**
- Platform Config "Concept Tags" tab → renamed to "Analytics Config"
- If analytics need per-chapter settings, they live here (but chapters themselves don't)
- Ensure no confusion: "Platform Config ≠ Content CRUD"

### **5.3 CLAUDE-PLATFORM.md Update**
```markdown
## Concept Mastery Restructure (May 1 2026)

Sources and Chapters architecture is now unified across all exams (not just SAT).
- Concepts → Chapters (1:1 rename)
- Chapters organized under Sources (per exam category)
- Questions linked via chapter_id FK (not concept_tag text field)
- Analytics show "Chapter Mastery" instead of "Concept Mastery"

**Platform Config Role:**
- NOT responsible for chapter/source CRUD
- Remains analytics configuration (toggles, display settings)
- Chapter management stays in `/super-admin/sources-chapters`

**Section Flexibility:**
- Sections are picked during Assessment creation, not baked into chapters
- Chapters are reusable across different test structures
- Assessment form: Sections → SourceChapterPicker (existing pattern)
```

---

## 6. Database Updates (CLAUDE-DB.md)

### **6.1 New Unified Structure**

**sources table** (updated description)
```
All exams now have sources. One source per exam category by default.
Example: "NEET - Reference Content", "JEE - Reference Content", etc.
Auto-created from concept_tags during migration.
Can be expanded later (e.g., "NEET - Advanced Topics" source).
```

**chapters table** (expanded scope)
```
NOW: All exams. Chapters are the renamed concept tags.
One chapter per unique concept tag per source.
order_index: Used for display order (not locked by assessments).
section_name: [OPTIONAL] For analytics — if assessment doesn't specify, uses chapter section.
```

**questions table** (refactored)
```
chapter_id: UUID FK → chapters.id (NOW REQUIRED, NOT NULL after PHASE 1)
source_id: UUID FK → sources.id (denormalized from chapters.source_id)
concept_tag: TEXT (DEPRECATED — kept during transition for exam engine compat)

After exam engine update:
  - concept_tag: soft-deleted / removed
  - question_concept_mappings table: deprecated
  - concept_tag_section_map: may be deprecated (sections live in assessments)
```

**user_concept_mastery table** (renamed conceptually)
```
Will become user_chapter_mastery once exam engine wired.
Currently kept as-is for compat; exam engine will adapt.
```

### **6.2 Concept Tags Table (concept_tags)**
```
Still exists (not deleted) for backward compat.
Deprecated: New questions won't reference this.
May be archived later after engine update.
```

---

## 7. Rollout & Risk Mitigation

### **7.1 Phased Rollout**
- **Phase 1:** NEET (test with 48 tags)
- **Phase 2:** JEE, CLAT (confirm pattern works)
- **Phase 3:** BANK, SSC (less complex, quicker)
- **Phase 4:** SAT (already has chapters, verify consistency)

### **7.2 Backward Compatibility**
- Keep `concept_tag` field on questions during transition
- Keep `question_concept_mappings` table (not deleted)
- Exam engine continues using `concept_tag` until explicitly wired to chapters
- UI can support both paths (concept picker + chapter picker) for a while

### **7.3 Validation Steps**
1. Run migration script on staging
2. Verify: 100% of questions have chapter_id
3. Verify: Create Assessment → chapter picker works
4. Verify: Analytics compute chapter mastery correctly
5. Verify: `npm run build` passes
6. Canary: One user cohort tests new analytics
7. Full rollout: All users

### **7.4 Rollback Plan**
- If issues: Restore concept_tag as source of truth
- Revert questions.chapter_id to NULL
- Revert analytics to concept mastery
- Chapters remain in DB (no harm, unused)

---

## 8. Success Metrics

- ✅ 100% of questions in all exams have chapter_id FK (not NULL)
- ✅ Create Assessment forms pick chapters (not concepts)
- ✅ Analytics show chapter mastery (not concept mastery)
- ✅ Zero broken queries (npm run build passes)
- ✅ Exam engine integration ready (plan documented)
- ✅ Platform Config remains clear (sources/chapters ≠ config)

---

## 9. Timeline & Dependencies

| Phase | Duration | Blocker? | Dependency |
|-------|----------|----------|-----------|
| 0 | TBD | ✅ YES | Exam Engine team must update |
| 1 | Weeks 1-2 | ❌ NO | DB access |
| 2 | Weeks 2-3 | ❌ NO | Phase 1 complete |
| 3 | Weeks 3-4 | ❌ NO | Phase 2 complete |
| 4 | TBD | ✅ YES | Phase 0 (Exam Engine) |
| 5 | Weeks 4+ | ❌ NO | Phase 1-3 validated |

**Critical Path:** Phase 1 → Phase 2 → Phase 3 → (Exam Engine) → Phase 4

---

## 10. Open Questions & Decisions

- [ ] Should `chapter_section_map` table be created (Phase 1.1) or deferred?
- [ ] Should we create per-exam Slack alerts during migration? (Recommended)
- [ ] Should we add `chapter_id` index to questions for performance?
- [ ] Should historical `attempt_answers` be backfilled with `chapter_id`?

