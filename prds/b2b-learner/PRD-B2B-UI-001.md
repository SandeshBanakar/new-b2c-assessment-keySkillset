# PRD KSS-B2B-UI-001: B2B Learner Portal — UI Overhaul

**Status:** COMPLETE  
**Author:** Sandesh Banakar  
**Date:** Apr 27 2026  
**Target Version:** V1 (Current)

---

## 1. Executive Summary

The B2B Learner Portal currently has a functional but visually inconsistent UI compared to the production keySkillset platform and the B2C learner experience. This PRD covers four targeted UI overhauls to bring the portal in line with design references and production parity:

1. **Course Cards** — Redesign to match production card layout (two pills, progress bar for all states, state-based CTA button inside card)
2. **Course Detail Page** — Full 3-tab redesign (Overview / Curriculum / Achievements) with achievement milestones, medal grid, and certificate section
3. **Assessment List Cards** — Redesign to visually match B2C `AssessmentCard` style (gradient header, exam badge, metadata row, attempt progress, state-based CTA)
4. **Assessment Detail Page** — Redesign with 3-tab layout (Overview / Attempts / Analytics) matching B2C design, plus Certificate Status section at the top of the Analytics tab

---

## 2. User Personas & Impact

| Persona | Impact |
|---------|--------|
| **B2B Learner** | Consistent, professional UI matching production platform standards. Clear progress indicators, state-aware CTAs, structured course and assessment detail pages |
| **Client Admin** | Learners see a polished portal that reflects the quality of the keySkillset brand |

---

## 3. Locked Design Decisions

All decisions below are locked after clarification session Apr 27 2026.

### 3.1 Course Cards

| Decision | Value |
|----------|-------|
| Thumbnail image | Colored placeholder based on `course_type` (no `thumbnail_url` on courses table) |
| "Expires on" date | **Omitted entirely** — B2B has no expiry concept. Future ticket when CA deadline feature ships |
| Pills | Two pills: `◇ Category Name` (Tag icon, zinc-100/zinc-600) + `⬜ Course Type` (Monitor icon, typed color per type) |
| Progress bar | Shown on ALL states (0% / partial / 100%) — not just IN_PROGRESS |
| Progress label | `"N% completed"` text above bar for all states |
| Completed date | `"Completed on: DD-MMM-YYYY"` shown below pills for COMPLETED state (from `learner_course_progress.completed_at`) |
| CTA button | Inside card — `"Continue Learning"` (NOT_STARTED + IN_PROGRESS) / `"View Certificate"` (COMPLETED) |
| Click target | Full card still navigates to detail page |

### 3.2 Course Detail Page — 3-Tab Layout

**Tab 1: Overview**
- Hero banner: colored gradient block (based on `course_type`) showing course title + description
- Rating row: static `4.9 ⭐ 500+` (no rating DB column — display-only placeholder)
- 4 stat cards: Flexible Time (always) / N Modules / `formatCourseType(course_type)` / English (hardcoded — no language column)
- "About This Course" section (course.description)
- "What you'll learn" section (4 hardcoded B2B-appropriate bullets)
- Right sidebar "Assigned" panel: progress ring + status + CTA (`Start Course` / `Continue Course` / `View Certificate`) + `Delivery: Included` / `Started: [date]` / `Certificate: Included` meta

**Tab 2: Curriculum**
- "Achievement Progress" milestone stepper at top — 5 hardcoded milestones:
  1. Welcome Champion (0%)
  2. Quarter Quest (25%)
  3. Halfway Hero (50%)
  4. Summit Conqueror (75%)
  5. Course Champion (100%)
  - Milestone unlock derived from `progress_pct` threshold. Trophy (lucide) icon per milestone.
- Course Curriculum accordion below (existing `CurriculumSection` logic preserved)

**Tab 3: Achievements**
- "Certifications" section: certificate card with number + issued date + Download button (using existing `CertificateCard` + preview route). Empty state if no cert.
- "Achievements" section: 5 medal tiles derived from same progress_pct thresholds as milestones. Lucide `Trophy` icon (amber when unlocked, zinc-200 when locked). "Locked" badge on unearned tiles.
- Note at bottom of tab (exact copy): *"Course achievement medals shown here are for reference only. The production medal images will replace these icons."*
- TODO comment in code: `// TODO: Replace lucide Trophy with final production medal images when available`

### 3.3 Assessment List Cards

Visually match B2C `AssessmentCard` layout but with B2B-specific state logic.

**Visual structure:**
- Full-width gradient placeholder header (exam category gradient — same `EXAM_GRADIENT` map as B2C)
- Exam category badge (pill, same `EXAM_BADGE` colors as B2C)
- Test type pill (zinc)
- Assessment title (font-medium)
- Metadata row: `N questions · N min · [difficulty]` — sourced by JOIN `assessment_items → assessments` via `assessments_id`
- Attempt progress bar (shown when attempts > 0): `X/5 attempts used`
- State-based CTA button

**B2B Card States (5 fixed attempts, no tier gating):**
| Attempts used | State | CTA |
|---|---|---|
| 0 | Not started | `"Start Assessment"` (blue-700 filled) |
| 1–4 | In progress | `"Start New Attempt"` (blue-700 filled) + attempt count chip |
| 5 | All attempts used | `"View Analysis"` (zinc ghost border) |

### 3.4 Assessment Detail Page — 3-Tab Layout

**Data source:** `assessment_items` (not legacy `assessments`) + JOIN to `assessments` via `assessments_id` for duration, questions, difficulty. Access gate preserved.

**Tab 1: Overview**
- Dark hero band (zinc-900 bg) with assessment title + exam · test_type metadata
- 4 stat cards: Duration (from `assessments.duration_minutes`) / Questions (from `assessments.total_questions`) / Total Marks / Difficulty
- "About this assessment" section (from `assessment_items.description`)
- `"What you'll learn"` section (from `assessment_items.display_config.what_youll_get` if populated, else 4 hardcoded bullets)
- CTA button: state-based (Start Assessment / Start New Attempt / View Analysis) — styled correctly, **not wired to exam engine** (deferred, see §6.2)

**Tab 2: Attempts**
- Real data from `learner_attempts WHERE learner_id = X AND content_id = assessmentId AND content_type = 'ASSESSMENT'`
- Per-attempt row: Attempt number / Date / Score % / Pass badge or Fail badge / Time taken
- Attempt 1 labelled `"Free Attempt"` if `attempt_number = 1` (consistent with B2C naming convention)
- Empty state: standard zinc-50 block with icon + "No attempts yet. Start the assessment to see your history here."

**Tab 3: Analytics**

*Section at top — Certificate Status:*
- Query `certificates WHERE learner_id = X AND content_id = assessmentId AND content_type = 'ASSESSMENT' AND tenant_id = currentTenantId`
- If certificate found: amber-50/amber-200 border card showing `Award` icon + cert number + issued date + Download button (uses existing `handleDownload` pattern → `/b2b-learner/[tenant]/certificates/[id]/preview`)
- If score ≥ 80% on any attempt but no certificate: zinc-50 card showing "Certificate Pending — you may be eligible"
- If no qualifying attempt: small zinc caption "Complete an assessment with ≥80% score to earn a certificate"

*Score section (fully functional — from `learner_attempts`):*
- Score Trajectory: mini bar chart or line showing `score_pct` across attempts (attempt number on x-axis)
- Pass/Fail summary: `N Passed / N Failed / Avg Score X%` stat grid

*Detailed analytics sections (Option A — data not yet available):*
- Section Breakdown, Concept Mastery, Pacing Analysis, Mistake Taxonomy: rendered as tasteful "Detailed analytics coming soon" placeholder cards (NOT generic spinners — proper section headers with zinc-50 body + info text: `"Detailed per-question analytics will be available here once the B2B analytics engine is live."`)

---

## 4. DB Queries — No Migrations Required

| Table | Usage | Notes |
|-------|-------|-------|
| `assessment_items` | Assessment list + detail data | JOIN to `assessments` via `assessments_id` for duration/questions/difficulty |
| `assessments` | duration_minutes, total_questions, total_marks, difficulty | Only queried via JOIN from `assessment_items.assessments_id` |
| `learner_attempts` | Attempts tab data + analytics score trend | Has: score_pct, passed, attempted_at, time_taken_seconds |
| `certificates` | Course Achievements tab + Assessment Analytics certificate section | `content_type` is polymorphic (COURSE / ASSESSMENT) — no migration needed |
| `learner_course_progress` | Course cards + course detail | progress_pct, status, started_at, completed_at |
| `learner_content_access` | Access gate (existing, unchanged) | — |

---

## 5. Component Architecture

### New B2B-specific components (all in `src/app/b2b-learner/[tenant]/`)
```
courses/page.tsx          — CourseCard redesign (Task 1)
courses/[id]/page.tsx     — 3-tab course detail (Task 2)
assessments/page.tsx      — AssessmentCard redesign (Task 3)
assessments/[id]/page.tsx — 3-tab assessment detail (Task 4)
```

### Reused existing shared atoms
```
src/components/certificates/CertificateCard.tsx   — used in course Achievements tab
src/components/certificates/CertificateTabsContent.tsx — NOT used here (different page)
```

### B2B assessment detail tabs (new, in assessments/[id]/page.tsx)
- `B2BOverviewTab` — local component, visually matches B2C `OverviewTab`
- `B2BAttemptsTab` — local component, queries `learner_attempts`, matches B2C `AttemptsTab` layout
- `B2BAnalyticsTab` — local component, certificate status + score trend + placeholder sections

---

## 6. Scope Boundaries

### 6.1 IN SCOPE (This ticket)
- Course card full redesign (Task 1)
- Course detail 3-tab layout with milestone stepper + achievement medals + certificate (Task 2)
- Assessment list card redesign to match B2C visual (Task 3)
- Assessment detail 3-tab layout with B2B-specific data queries (Task 4)
- Certificate status section in assessment analytics tab
- Score trajectory + pass/fail summary from `learner_attempts` in analytics tab
- Access gate logic preserved on all pages (unchanged)

### 6.2 OUT OF SCOPE / DEFERRED

| Item | Reason |
|------|--------|
| "Expires on" / content deadline dates | No DB column. Future: CA-configurable deadline on `learner_content_access` |
| Course thumbnail images | No `thumbnail_url` on `courses` table. Future: add column + Supabase Storage bucket |
| "Start Assessment" / "Start New Attempt" exam engine routing | B2B auth context (B2BLearnerContext) not wired to B2C exam engine (AppContext). Separate architecture ticket |
| Achievement milestone names per-course from DB | No `course_achievements` table. Future: SA-configurable milestones |
| Language field per course | No `language` column on `courses`. Future DB column |
| Per-question B2B analytics (pacing, concept mastery, section breakdown, mistake taxonomy) | No `learner_attempt_answers` table. Requires new DB tables + exam engine writes. Future ticket: KSS-B2B-ANA-001 |
| Rating and review count per course | No `rating` column on `courses` |
| Certificate PDF generation | No PDF storage/generation. Existing preview route is a placeholder |

---

## 7. Build Order

```
Phase 1 — Course Cards (courses/page.tsx)
Phase 2 — Course Detail 3-tab (courses/[id]/page.tsx)
Phase 3 — Assessment List Cards (assessments/page.tsx)
Phase 4 — Assessment Detail 3-tab (assessments/[id]/page.tsx)
Phase 5 — npm run build + TODO-BACKLOG + CLAUDE-HISTORY update
```

---

## 8. Success Criteria

- [ ] Course cards match all 3 reference images (not-started / in-progress / completed)
- [ ] Course detail has 3 working tabs; milestones unlock based on `progress_pct`; achievements tab shows certificate + medal grid + reference note
- [ ] Assessment list cards visually match B2C `AssessmentCard` (gradient, badge, metadata, CTA)
- [ ] Assessment detail has working Overview + Attempts tabs (real data from `learner_attempts`); Analytics tab has certificate status section + score trend
- [ ] Access gate on both detail pages still redirects to list if content not assigned
- [ ] `npm run build` passes with zero errors
