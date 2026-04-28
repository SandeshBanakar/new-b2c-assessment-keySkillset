# TODO Backlog — keySkillset Platform
# Last updated: Apr 28 2026 — KSS-CA-CHANGES-001 complete. CA dashboard refactor + Users & Roles fix + Billing page + PRD-CA-BILLING shipped. npm run build ✅ PASSED.

## [COMPLETE] KSS-B2B-PORTAL-POLISH — B2B Portal Polish + PRD (Apr 28 2026)

**Build:** ✅ PASSED
**PRD:** `prds/b2b-learner/PRD-B2B-PORTAL-001.md` (LOCKED)

| # | Task | File | Status |
|---|------|------|--------|
| POL-1 | Navbar — remove orphaned divider div (4th child in 3-col grid causing learner to wrap to row 2) | `B2BNavbar.tsx` | [x] DONE |
| POL-2 | Attempts tab — "View Analysis" button moved to rightmost position (after score + badge) | `assessments/[id]/page.tsx` | [x] DONE |
| POL-3 | Analytics tab — each section placeholder now has description + "Everything in B2C is finalised…" teal note | `assessments/[id]/page.tsx` | [x] DONE |
| POL-4 | Certificate cards — redesigned to vertical layout (accent bar → body → footer), grid capped at sm:grid-cols-2 | `CertificateCard.tsx`, `CertificateTabsContent.tsx` | [x] DONE |
| POL-5 | Assessment filters — category dropdown + status pills (All/Not Started/In Progress/Exhausted) mirroring courses page | `assessments/page.tsx` | [x] DONE |
| POL-6 | Cert page UI banner — fixed from 60% to 80% to match application logic and PRD rule | `certificates/page.tsx` | [x] DONE |
| POL-7 | PRD-B2B-PORTAL-001 — spec-as-built for all 4 portal pages, cert rules locked, assignment flow documented | `prds/b2b-learner/PRD-B2B-PORTAL-001.md` | [x] DONE |

---

## [COMPLETE] KSS-CA-CHANGES-001 — Client Admin Dashboard + Users & Roles + Billing (Apr 28 2026)

**Source:** `docs/requirements/client_admin_changes.txt`  
**Build:** ✅ PASSED Apr 28 2026

### Item 1 — TechCorp Dashboard (RUN_ONLY)
| # | Task | File | Status |
|---|------|------|--------|
| CA-CHG-1a | Remove tabs (Overview/Performance) — render 3 cards directly | `dashboard/page.tsx` | [x] DONE |
| CA-CHG-1b | Remove metric cards: Completion Rate, Certificate Rate, Average Score, Total Attempts | `dashboard/page.tsx` | [x] DONE |
| CA-CHG-1c | Add "Courses Completed" card — `learner_course_progress` WHERE status='COMPLETED', subtext "out of N assigned" | `dashboard/page.tsx` | [x] DONE |
| CA-CHG-1d | Add "Certificates Generated" card — raw count from `certificates` table | `dashboard/page.tsx` | [x] DONE |
| CA-CHG-1e | Remove dead code: `TabButton`, tab state, tab type aliases | `dashboard/page.tsx` | [x] DONE |

### Item 2 — Akash Dashboard (FULL_CREATOR)
| # | Task | File | Status |
|---|------|------|--------|
| CA-CHG-2a | Remove tabs (Content/Analytics) — render 6 cards directly | `dashboard/page.tsx` | [x] DONE |
| CA-CHG-2b | Retain Content 3 cards (Courses Created, Assessments Created, Questions Added) | `dashboard/page.tsx` | [x] DONE |
| CA-CHG-2c | Add 3 learner cards (Active Learners, Courses Completed, Certificates Generated) | `dashboard/page.tsx` | [x] DONE |
| CA-CHG-2d | Unified 6-card data fetch (single Promise.all in FullCreatorStats) | `dashboard/page.tsx` | [x] DONE |

### Item 3 — Users & Roles: Client Admin Data Fix
| # | Task | File | Status |
|---|------|------|--------|
| CA-CHG-3a | Root cause: no `is_active=true` filter on CLIENT_ADMIN query → returns Rahul Sharma (first, inactive) not Sandesh | — | [x] DONE |
| CA-CHG-3b | Add `.eq('is_active', true)` to CLIENT_ADMIN query in `users-roles/page.tsx` | `users-roles/page.tsx` | [x] DONE |
| CA-CHG-3c | Add `.eq('is_active', true)` to CLIENT_ADMIN query in `layout.tsx` (nav footer) | `layout.tsx` | [x] DONE |
| CA-CHG-3d | Update `CA_ADMIN_USER_MAP` in `tenants.ts` — Akash → c0f26275 (Sandesh Banakar) | `src/lib/client-admin/tenants.ts` | [x] DONE |

### Item 4 — Billing Page (new feature)
| # | Task | File | Status |
|---|------|------|--------|
| CA-CHG-4a | PRD — `prds/client_admin/PRD-CA-BILLING.md` written | — | [x] DONE |
| CA-CHG-4b | Add "Billing" nav item under Settings in layout (CreditCard icon) | `layout.tsx` | [x] DONE |
| CA-CHG-4c | Build `billing/page.tsx` — contract overview, seat usage bars, storage (FC), notes, CTA | `billing/page.tsx` | [x] DONE |
| CA-CHG-4d | Contract status badge: Active/Expiring Soon/Expired. Days remaining countdown. | `billing/page.tsx` | [x] DONE |
| CA-CHG-4e | UsageBar: violet/amber/rose progress bar, over-limit warnings | `billing/page.tsx` | [x] DONE |
| CA-CHG-4f | Storage section (FULL_CREATOR only): static 12.4GB / $18.60/mo / Mar 18 | `billing/page.tsx` | [x] DONE |
| CA-CHG-4g | Empty state + "Contact Support" `mailto:contact@keyskillset.com` CTA | `billing/page.tsx` | [x] DONE |
| CA-CHG-4h | 2-business-day SLA note added to CTA section (violet highlighted callout) | `billing/page.tsx` | [x] DONE |
| CA-CHG-4i | `npm run build` passes | — | [x] DONE ✅ |

**V1 Planned — Separate Ticket Required:**
- Platform hard-lock on expired contracts (middleware/layout gate — PRD §6.3). Currently Billing page shows "Expired" badge only; no cross-portal access gate exists.

---

## [COMPLETE] KSS-B2B-UI-FIXES — B2B UI Fixes, Report Card + Gradient Bug Sweep (Apr 27 2026)

**Build:** ✅ PASSED  
**PRD:** `prds/b2b-learner/PRD-B2B-REPORT-CARD-001.md` (Phase 1 COMPLETE)

| # | Fix | File | Status |
|---|-----|------|--------|
| FIX-1 | Navbar — 3-col grid single row (brand \| centered tabs \| learner), mobile overflow-x-auto confirmed | `B2BNavbar.tsx` | [x] DONE |
| FIX-2 | Course detail hero gradient — replaced dynamic Tailwind classes with `React.CSSProperties` inline styles | `courses/[id]/page.tsx` | [x] DONE |
| FIX-3 | Assessment list + detail — two-step fetch replacing broken `assessments!assessments_id` PostgREST join | `assessments/page.tsx`, `assessments/[id]/page.tsx` | [x] DONE |
| FIX-4 | Assessment card gradient header — same inline style fix (`EXAM_GRADIENT_STYLE` CSSProperties map) | `assessments/page.tsx` | [x] DONE |
| FIX-5 | AttemptsSummaryPanel gradient — inline style fix | `assessments/page.tsx` | [x] DONE |
| FIX-6 | Attempts tab — all 5 slots rendered (filled rows + dashed placeholders with Lock icon) | `assessments/[id]/page.tsx` | [x] DONE |
| FIX-7 | "View Analysis" button on each completed attempt — switches to Analytics tab (`onSwitchTab`) | `assessments/[id]/page.tsx` | [x] DONE |
| FIX-8 | Report Card section in Analytics tab (blue card, disabled if 0 attempts, modal on click) | `assessments/[id]/page.tsx` | [x] DONE |
| FIX-9 | ReportCardModal — 6 sections, eligibility, Salesforce 24hr delivery notice, Request CTA + session state | `assessments/[id]/page.tsx` | [x] DONE |
| FIX-10 | PRD KSS-B2B-RC-001 — Report Card + Salesforce spec written (Phase 1 shipped, Phase 2/3 deferred) | `prds/b2b-learner/PRD-B2B-REPORT-CARD-001.md` | [x] DONE |

**Confirmed decisions this session:**
- CQ-A: Navbar mobile = single row horizontal scroll (option a) ✓
- CQ-1: "View Analysis" → switches to Analytics tab (option a) ✓
- CQ-2: "View Analysis" shows on both Pass and Fail rows ✓

**Deferred (future tickets):**
- Report Card Phase 2: Salesforce webhook API integration + `report_card_requests` DB table
- Report Card Phase 3: PDF generation + CA audit view + white-label PDF
- Exam engine routing for B2B (Start/Continue Assessment not wired to exam engine)
- Per-attempt deep-dive analytics (no `learner_attempt_answers` table yet)

---

## [COMPLETE] KSS-ANA-002 — Linear Analytics V2 (Apr 27 2026)

**PRD:** `prds/analytics/PRD-LINEAR-ANALYTICS-V2.md` | **Build:** ✅ PASSED

### KSS-ANA-DB-001 — Database Migrations
| # | Task | Status |
|---|------|--------|
| DB-056-write | Write KSS-DB-056.sql — assessment_items config correction + attempts.score recalc | [x] DONE Apr 27 2026 |
| DB-057-write | Write KSS-DB-057.sql — concept_tag_section_map + user_concept_mastery.section_name | [x] DONE Apr 27 2026 |
| DB-056-run | SA runs KSS-DB-056 in Supabase | [x] DONE Apr 27 2026 |
| DB-057-run | SA runs KSS-DB-057 in Supabase | [x] DONE Apr 27 2026 |

### Code — AnalyticsTab.tsx Data Source Fix
| # | Task | Status |
|---|------|--------|
| A2-fix-1 | `ExamCatConfig` interface: remove `score_max` / `neg_mark` (not columns on exam_categories) | [x] DONE Apr 27 2026 |
| A2-fix-2 | Add `assessment_items` query to Promise.all — source `assessment_config.negative_marks` + `total_marks` | [x] DONE Apr 27 2026 |
| A2-fix-3 | `setNegMark` / `setScoreMax` now derived from `assessment_items.assessment_config` JSONB | [x] DONE Apr 27 2026 |
| A2-fix-4 | Build passes clean | [x] DONE Apr 27 2026 |

### Remaining Phases — Verified Status
| # | Task | Status |
|---|------|--------|
| A2-8a | PacingAnalysis | [CANCELLED] — not in PRD. CLAT passage pacing explicitly locked out. |
| A2-8b | SectionBreakdown | [x] DONE — already existed at Block 5, sourced from `attempt_section_results` |
| A2-8c | ConceptMasterySection — group by section | [x] DONE — code was already ready; now live via DB-057 `concept_tag_section_map` |
| A2-8d | SATHeroScore fixes | [CANCELLED] — SAT is out of PRD scope; `SATAnalyticsTab.tsx` is a separate component |
| A2-8e | Solutions Panel UI | [x] DONE — already existed at Block 7 (unchanged per PRD) |

### Known data quality notes (non-blocking)
- CLAT concept_tags has 3 subject names that don't match canonical section names ("Current Affairs and GK", "English", "General Knowledge") — seeded in concept_tag_section_map with display_order=99. Appear at bottom of CLAT section tabs.
- 46 UCM rows remain null for section_name (concept_tags in UCM don't match concept_tags.concept_name). Tags invisible in ConceptMasteryPanel section view — benign.

---

## [COMPLETE] KSS-B2B-UI-001 — B2B Learner Portal: UI Overhaul (Apr 27 2026)

**PRD:** `prds/b2b-learner/PRD-B2B-UI-001.md` (COMPLETE)  
**Build:** ✅ PASSED

### Phase 1 — Course Cards
| # | Task | File | Status |
|---|------|------|--------|
| B2B-UI-1a-1 | CourseCard — two pills (Tag+category, Monitor+course type), colored placeholder | `courses/page.tsx` | [x] DONE |
| B2B-UI-1a-2 | CourseCard — progress bar + N% label for ALL states | `courses/page.tsx` | [x] DONE |
| B2B-UI-1a-3 | CourseCard — "Completed on: DD-MMM-YYYY" for COMPLETED state | `courses/page.tsx` | [x] DONE |
| B2B-UI-1a-4 | CourseCard — CTA button ("Continue Learning" / "View Certificate") | `courses/page.tsx` | [x] DONE |
| B2B-UI-1a-5 | CourseCard — removed status badge overlay; revoked_at IS NULL gate added | `courses/page.tsx` | [x] DONE |

### Phase 2 — Course Detail 3-Tab
| # | Task | File | Status |
|---|------|------|--------|
| B2B-UI-1b-1 | Tab bar (Overview / Curriculum / Achievements) + useSearchParams ?tab= | `courses/[id]/page.tsx` | [x] DONE |
| B2B-UI-1b-2 | Overview tab — gradient hero, static rating, 4 stat cards, About, What You'll Learn, Assigned panel with ProgressRing | `courses/[id]/page.tsx` | [x] DONE |
| B2B-UI-1b-3 | Curriculum tab — 5-milestone stepper (Trophy icons, progress_pct thresholds) + curriculum accordion | `courses/[id]/page.tsx` | [x] DONE |
| B2B-UI-1b-4 | Achievements tab — Certifications + 5 medal tiles (Trophy icon) + reference note | `courses/[id]/page.tsx` | [x] DONE |

### Phase 3 — Assessment List Cards
| # | Task | File | Status |
|---|------|------|--------|
| B2B-UI-1c-1 | Query — JOIN assessments!assessments_id + countMap + latestMap + revoked_at IS NULL | `assessments/page.tsx` | [x] DONE |
| B2B-UI-1c-2 | AssessmentCard — gradient header (h-20), exam badge pill, title, metadata row | `assessments/page.tsx` | [x] DONE |
| B2B-UI-1c-3 | AssessmentCard — X/5 attempt progress bar (shown when >0 attempts) | `assessments/page.tsx` | [x] DONE |
| B2B-UI-1c-4 | AssessmentCard — B2B CTAs: Start / Start New Attempt (+N left chip) / View Analysis | `assessments/page.tsx` | [x] DONE |

### Phase 4 — Assessment Detail 3-Tab
| # | Task | File | Status |
|---|------|------|--------|
| B2B-UI-1d-1 | Replaced getAssessmentBySlug → assessment_items + JOIN assessments!assessments_id | `assessments/[id]/page.tsx` | [x] DONE |
| B2B-UI-1d-2 | Tab bar + useSearchParams ?tab= (overview/attempts/analytics); attempts count badge | `assessments/[id]/page.tsx` | [x] DONE |
| B2B-UI-1d-3 | B2BOverviewTab — zinc-900 hero, 4 stat cards, About, What You'll Learn, state CTA (non-functional placeholder) | `assessments/[id]/page.tsx` | [x] DONE |
| B2B-UI-1d-4 | B2BAttemptsTab — real learner_attempts sorted ASC, per-row score/pass/date/time, empty state | `assessments/[id]/page.tsx` | [x] DONE |
| B2B-UI-1d-5 | B2BAnalyticsTab — Certificate Status top section (amber card / pending card / caption) | `assessments/[id]/page.tsx` | [x] DONE |
| B2B-UI-1d-6 | B2BAnalyticsTab — Score trajectory bar chart + Passed/Failed/Avg stat grid | `assessments/[id]/page.tsx` | [x] DONE |
| B2B-UI-1d-7 | B2BAnalyticsTab — 4 "Detailed analytics coming soon" placeholder sections | `assessments/[id]/page.tsx` | [x] DONE |

### Phase 5 — Post-Build
| # | Task | Status |
|---|------|--------|
| B2B-UI-POST-1 | npm run build passes clean | [x] DONE |
| B2B-UI-POST-2 | Update TODO-BACKLOG.md + CLAUDE-HISTORY.md | [x] DONE |
| B2B-UI-POST-3 | PRD status → COMPLETE | [x] DONE |

---

## [COMPLETE] KSS-CA-LEARNER-FIXES — Client Admin Learner Portal: Bug Fixes (Apr 26–27 2026)

**Scope:** Sequential UX/bug fixes in the B2B learner portal and client-admin learners pages.

| # | Fix | File | Status |
|---|-----|------|--------|
| CLF-1 | Add "← Back To Personas" button to B2B login page header | `b2b-learner/[tenant]/login/page.tsx` | [x] DONE |
| CLF-2 | Dashboard — stat cards (4) inside WelcomeHeader banner | `b2b-learner/[tenant]/page.tsx` | [x] DONE |
| CLF-3 | Dashboard — all queries filtered through `learner_content_access` | `b2b-learner/[tenant]/page.tsx` | [x] DONE |
| CLF-4 | Dashboard — "Newly Assigned" section (2 sub-sections + info icon tooltip) | `b2b-learner/[tenant]/page.tsx` | [x] DONE |
| CLF-5 | Courses page — filter all content through `learner_content_access` | `b2b-learner/[tenant]/courses/page.tsx` | [x] DONE |
| CLF-6 | Assessments page — filter all content through `learner_content_access` | `b2b-learner/[tenant]/assessments/page.tsx` | [x] DONE |
| CLF-7 | Course detail page — access gate redirect | `b2b-learner/[tenant]/courses/[id]/page.tsx` | [x] DONE |
| CLF-8 | Assessment detail page — access gate redirect | `b2b-learner/[tenant]/assessments/[id]/page.tsx` | [x] DONE |
| CLF-11 | Persona selector → always routes to `/login` (not dashboard) for B2B portals | `src/app/page.tsx` | [x] DONE Apr 27 |
| CLF-12 | Login page — removed auto-redirect when learner in localStorage (always show picker) | `b2b-learner/[tenant]/login/page.tsx` | [x] DONE Apr 27 |
| CLF-13 | Login page — `PersonaGuide` fully dynamic from DB (`learner_course_progress` + `learner_attempts`) | `b2b-learner/[tenant]/login/page.tsx` | [x] DONE Apr 27 |
| CLF-14 | Dashboard — "Assessments Done" card gets `Info` icon tooltip explaining ≥5 threshold | `b2b-learner/[tenant]/page.tsx` | [x] DONE Apr 27 |
| CLF-15 | SQL data fix — 3 orphan `learner_course_progress` rows fixed (null learner_id → correct UUIDs); Aditya Shah access to NEET Prep added; Nisha/Rahul Employee Policy Handbook removed + PF Basics added | `docs/requirements/b2b_data_fix.txt` | [x] DONE Apr 27 |
| CLF-9 | Courses page — "Newly Assigned Courses" sub-section | `b2b-learner/[tenant]/page.tsx` (dashboard covers this) | [x] DONE — covered by dashboard NewlyAssignedSection |
| CLF-10 | Assessments page — "Newly Assigned Assessments" sub-section | `b2b-learner/[tenant]/page.tsx` (dashboard covers this) | [x] DONE — covered by dashboard NewlyAssignedSection |
| CLF-16 | Dashboard — `created_at` → `granted_at` column fix in `learner_content_access` query (was returning null → all stats showing 0). Added `revoked_at IS NULL` filter. | `b2b-learner/[tenant]/page.tsx` | [x] DONE Apr 27 |
| CLF-17 | Remove `.eq('status', 'LIVE')` from all 4 B2B content queries — `learner_content_access` is the sole gate | `page.tsx` (×2), `courses/page.tsx`, `assessments/page.tsx` | [x] DONE Apr 27 |

**Build:** ✅ PASSED (CLF-1 through CLF-17)

---

## [COMPLETE] KSS-LINT-001 — React Hooks: set-state-in-effect Sweep (Apr 26 2026)

**Rule:** `react-hooks/set-state-in-effect` — all violations resolved  
**Build:** ✅ PASSED · **Lint errors remaining:** 0 (set-state-in-effect)

| File | Fix Applied |
|------|-------------|
| `certificates/CertificateTabsContent.tsx` | Removed `setLoading(true)` from effect (prior session) |
| `context/B2BLearnerContext.tsx` | `useState` lazy initializer for localStorage (prior session) |
| `hooks/useUserAttempts.ts` | `useState(!!userId)` — removed sync guard setState (prior session) |
| `b2b-learner/[tenant]/login/page.tsx` | `useState(!!tenantId)` — removed sync guard setState (prior session) |
| `components/ui/Tooltip.tsx` | Removed `mounted` state + effect; portal rendered directly (prior session) |
| `super-admin/content-creators/page.tsx` | Removed `setLoading(true)` from `load()` (prior session) |
| `super-admin/plans-pricing/page.tsx` | Removed `setLoading(true)` from 4 effect bodies (prior session) |
| `super-admin/sources-chapters/page.tsx` | Converted `fetchSources` async→Promise.then(); removed `setChapters([])` guard; `key={viewSource?.id}` on `ViewSourceModal`; `useState(!!(open && source))` (this session) |
| `super-admin/sources-chapters/[sourceId]/page.tsx` | Converted `fetchData` async→Promise.then(); `effectivePage` clamping (prior session) |
| `super-admin/sources-chapters/[sourceId]/[chapterId]/page.tsx` | Converted `fetchData` async→Promise.then(); removed `setPage(1)` effect; `effectivePage` clamping (this session) |
| `super-admin/question-bank/page.tsx` | Converted `fetchQuestions` async→Promise.then(); removed `setPage(0)` effect; `setPage(0)` moved to onChange handlers; `key={previewId}` on modal (this session) |
| `super-admin/question-bank/_components/QuestionForm.tsx` | `key={form.question_type}` on `FormPreview`; removed `setSubIdx(0)` effect (this session) |
| `super-admin/question-bank/_components/QuestionPreviewModal.tsx` | Converted `fetchQuestion` async→Promise.then(); removed cleanup effect (state resets via key remount) (this session) |
| `super-admin/platform-config/page.tsx` | Converted `loadCategories` + `loadTags` async→Promise.then(); `key={selectedCat.name}` on `ConceptTagsPanel`; removed 3-setState effect; converted `loadRows` to useCallback+Promise.then() (this session) |
| `super-admin/create-assessments/page.tsx` | Converted `fetchData` to inner-async+.then() (this session) |
| `client-admin/[tenant]/content-bank/page.tsx` | Converted `loadItems` async→Promise.then() (this session) |
| `client-admin/[tenant]/dashboard/page.tsx` | `useState(!!tenantId)` — removed sync guard setState (prior session) |
| `client-admin/[tenant]/learners/page.tsx` | `useState(!!tenantId)`; converted `fetchData` async→Promise.then() (this session) |
| `client-admin/[tenant]/learners/[id]/page.tsx` | `useState(!!(tenantId && learnerId))` — removed sync guard setState (this session) |
| `client-admin/[tenant]/catalog/page.tsx` | `useState(!!tenantId)`; converted `fetchCatalog` to inner-async+.then(); `useState(item.content_type === 'COURSE')` for `modulesLoading` (this session) |

**Key patterns established:**
- `useCallback(async () => {...})` called from `useEffect` → convert to `useCallback(() => { Promise.all([...]).then(([...]) => { setState }) })`
- Sequential async logic → inner `async function doFetch() { return data }` + `doFetch().then(data => { setState })`
- Sync guard `if (!dep) { setState(false); return }` → `useState(!!dep)` + just `return`
- `useEffect(() => { setPage(0) }, [filters])` pagination reset → move `setPage(0)` to onChange handlers (server-side) or `effectivePage = Math.min(page, totalPages)` clamping (client-side)
- `useEffect(() => { setState(x) }, [prop])` in sub-component → `key={prop}` on the component at call site

---

## [COMPLETE] KSS-B2B-LEARNER-001 — B2B Learner Portal Fix + Login + Navigation + Demo Data

**SQL:** KSS-DB-053 ✓ · SEED-B2B-MODULES.sql ✓ · SEED-B2B-PROGRESS.sql ✓

### Summary (Phase 1 — Apr 24 2026)
- Email-only demo login (learner picker card grid per tenant)
- `B2BLearnerContext` + `useB2BLearner()` hook (localStorage keyed by tenant slug)
- `B2BAuthGuard` (replaces no-op `AuthGuard` on all B2B pages)
- `B2BNavbar` (sticky, tenant-branded, tab links with active state)
- `layout.tsx` at `[tenant]` level — provides context to all B2B pages
- Standalone `/b2b-learner/[tenant]/courses` page
- Fixed course query: `(tenant_id IS NULL OR tenant_id = currentTenantId) AND status = LIVE`
- Fixed all progress/attempt queries: added `learner_id` filter
- Fixed assessments column names: `exam_category_id` → joined `exam_categories(name)`
- Removed non-existent `assigned_at` reference — `started_at IS NULL` as "New" badge proxy
- Removed non-existent `thumbnail_url` — colored placeholders by `course_type`
- WelcomeHeader moved below navbar (layout fix)

### Summary (Phase 2 — Apr 24 2026)
- Fixed `getAssessmentBySlug`: `.eq('status','INACTIVE')` → `.in('status',['LIVE','INACTIVE'])`
- Course detail: 2-column layout (left: hero + curriculum accordion, right: sticky action panel with SVG progress ring + CTA)
- Assessment list: B2C-style cards (gradient strip, exam badge, attempt chip) + `AttemptsSummaryPanel`
- Login page: `PersonaGuide` table + state badge inline on each learner card
- DB seed: 4 modules + 16 topics (NEET Prep) · 4 modules + 11 topics (PF Basics)
- DB seed: progress — Aditya Shah 100%, Divya Nair 45%, Nisha Kapoor 100%, Rahul Bose 30%
- DB seed: certificates for Aditya Shah (KSS-AKASH-2026-0001) + Nisha Kapoor (KSS-TCORP-2026-0001)
- DB seed: learner_attempts — Aditya Shah 82% passed · Nisha Kapoor 76% passed

### Backlog item (deferred)
- **`learner_course_progress.assigned_at`**: Column does not exist. Using `started_at IS NULL` as "New" proxy. PRD + DB migration needed for proper assignment-date tracking.

### Build: ✅ PASSED

---

## [COMPLETE] KSS-CA-OVERHAUL-001 — Client Admin Dashboard & Profile Overhaul

**PRD:** `prds/client_admin/PRD-CA-DASHBOARD.md`
**SQL:** `docs/requirements/SQL-CA-MIGRATIONS.txt` — KSS-DB-052 (pending run in Supabase)

### Summary
- Unified Dashboard with role-based tabs:
  - **FULL_CREATOR:** Content (courses, assessments, questions) + Analytics tabs
  - **RUN_ONLY:** Overview (learner metrics) + Performance tabs
- Name field split in Users & Roles:
  - CA Profile: First Name + Last Name with inline edit
  - Content Creator: Add/Edit/View slide-overs use split name fields
  - Avatar initials use first_name + last_name

### Files Modified
| File | Change |
|------|--------|
| `docs/requirements/SQL-CA-MIGRATIONS.txt` | Added KSS-DB-052 migration |
| `src/app/client-admin/[tenant]/users-roles/page.tsx` | Split name fields |
| `src/app/client-admin/[tenant]/dashboard/page.tsx` | Unified dashboard |
| `src/app/client-admin/[tenant]/layout.tsx` | Nav note |
| `prds/client_admin/PRD-CA-DASHBOARD.md` | New PRD |

### Build: ✅ PASSED

---

## [COMPLETE] KSS-SA-FIXES-001 — Super Admin Bug Fixes (5 items, Apr 27 2026)

**Source:** `docs/linear_analytics/super_admin_changes.txt`

| # | Fix | Status |
|---|-----|--------|
| SA-FIX-1 | Plans & Pricing page — subscriber count = 0 on all cards | [x] DONE — Apr 27 2026. Data fix: `plan_subscribers.subscriber_count` recalculated from `b2c_assessment_subscriptions`. Platform Pro now shows 11 subscribers. KSS-DB-SA-FIXES-001.sql |
| SA-FIX-2 | B2C Users "Plan" column shows "Free" | [x] DONE — Apr 27 2026. Root cause: all subscription plan_ids were from superseded seed batch (no rows in plans table). Remapped all 11 stale subs → Platform Pro. KSS-DB-SA-FIXES-001.sql |
| SA-FIX-3 | Question Bank page — no questions showing | [x] DONE — Apr 26 2026. Fixed: `concept_tags!concept_tag_id(concept_name)`, FK hints `!created_by` |
| SA-FIX-4 | B2C Revenue tab — no data | [x] DONE — Apr 27 2026. Plans exist + LIVE ✓. Root cause same as SA-FIX-1: subscriber_count = 0 → MRR = 0. Fixed by same KSS-DB-SA-FIXES-001.sql migration. MRR now ₹5,489/mo (11 × ₹499). |
| SA-FIX-5 | Platform Config — Section Visibility toggles removed (dead code). Table redesign. Analytics Config widget on Adaptive form. | [x] DONE — Apr 27 2026 |

---

## [DONE] KSS-SA-PC-001 V2 — Platform Config Table Redesign + Analytics Config Cleanup (Apr 27 2026)

**PRD:** `prds/super-admin/PRD-SA-PLATFORM-CONFIG.md` (updated)

| Item | Status |
|---|---|
| Exam Category card grid → sortable table inside "Exam Category" card | [x] DONE |
| DnD: `rectSortingStrategy` → `verticalListSortingStrategy` | [x] DONE |
| DnD save: sequential for-loop → `Promise.all` | [x] DONE |
| Pagination: 10/page with Prev/Next controls | [x] DONE |
| Table columns: Drag \| Status \| Display Name \| Internal Name \| Concept Tags \| Actions | [x] DONE |
| Mobile: hide Drag/Internal Name/Concept Tags below `sm` breakpoint | [x] DONE |
| Create button moved inside card above table | [x] DONE |
| Section Visibility toggles removed from SAT Analytics Config | [x] DONE |
| `AnalyticsConfig` interface + related state/functions removed | [x] DONE |
| Analytics Config read-only widget on Create Adaptive form (SAT only) | [x] DONE |
| Analytics Config read-only widget on Edit Adaptive form (SAT only) | [x] DONE |
| Build | ✅ PASSED |

---

## [COMPLETE] KSS-CA-EMAIL-001 - Client Admin White-Label Email Template Center

**PRD:** Not written (bug-fix/feature build, PRD not requested)
**Build:** ✅ PASSED

### Phase 1 - Raw Template System
| # | Task | Status |
|---|------|--------|
| CAE-1a | Create dedicated raw HTML email template folder with 6 white-label templates | [x] DONE — `src/email-templates/html/` (b2c-access-restored, b2c-user-suspended, certificate-of-completion, client-admin-onboarding, content-creator-full, content-creator-run-only) |
| CAE-1b | Add shared token renderer + preview payload contract | [x] DONE — `src/lib/email-templates/render.ts` + `types.ts` |
| CAE-1c | Add sample tenant/template data with tenant-first branding fallback | [x] DONE — `src/lib/email-templates/data.ts` (TENANT_EMAIL_PREVIEW_PROFILES) |

### Phase 2 - Persona Flow
| # | Task | Status |
|---|------|--------|
| CAE-2a | Add shared Email Templates persona tile on root selector | [x] DONE — `src/app/page.tsx` (Client Admin Emails + B2C End User Emails tiles) |
| CAE-2b | Build tenant chooser page using existing tenant slug mapping | [x] DONE — `src/app/email-templates/page.tsx` + `TenantChooserCard` |
| CAE-2c | Build client-admin email template index page | [x] DONE — `src/app/email-templates/[tenant]/page.tsx` + `EmailTemplateCard` |
| CAE-2d | Build template detail page with trigger context, variables, payload, and iframe preview | [x] DONE — `src/app/email-templates/[tenant]/[template]/page.tsx` |

### Phase 3 - Verification + Documentation
| # | Task | Status |
|---|------|--------|
| CAE-3a | Verify no Sandesh Banakar references or hardcoded old-brand support contact remain in new templates | [x] DONE |
| CAE-3b | Run `npm run build` | [x] DONE — ✅ PASSED |
| CAE-3c | Move completed work to `CLAUDE-HISTORY.md` and mark backlog done | [x] DONE — Apr 27 2026 |

---

## [DONE] KSS-SA-CA-001 — Create Assessment Feature Set (Part 2)

**PRD:** `prds/super-admin/PRD-SA-CREATE-ASSESSMENTS.md`  
**SQL:** `docs/requirements/SQL-CA-MIGRATIONS.txt` (KSS-DB-050 + KSS-DB-051 ✓) · `docs/requirements/SQL-CA-MIGRATIONS-2.txt` (KSS-DB-054 + KSS-DB-055 pending SA run)  
**Scope:** Main page state machine · Linear form refactor · Linear edit flow · Adaptive create + edit forms · Scale Score tab  
**Phase 1–7 Completed:** Apr 21 2026

### Phase 7 — Fixes + Engine Assessment Seeding (Apr 21 2026 session)
| # | Task | Status |
|---|------|--------|
| CA-7a | Fix 400 error on Create Assessments page (remove broken admin_users!created_by PostgREST join) | [x] DONE |
| CA-7b | Add Sources & Chapters picker to linear create form — FULL_TEST (per section) + SUBJECT/CHAPTER test (single pool) | [x] DONE |
| CA-7c | Add Sources & Chapters picker to linear edit form (`linear/[id]/page.tsx`) — same pattern as create | [x] DONE |
| CA-7d | Move `SourceChapterPicker`, `Source`, `Chapter` to `linear/_components.tsx`; adaptive re-exports them | [x] DONE |
| CA-7e | `SortableSectionRow` → expandable card with collapsible Sources & Chapters panel | [x] DONE |
| CA-7f | Write SQL — KSS-DB-054 (`assessments_id` col + admin_users FK constraints) | [x] DONE — SQL-CA-MIGRATIONS-2.txt |
| CA-7g | Write SQL — KSS-DB-055 (seed 22 engine assessments into assessment_items) | [x] DONE — SQL-CA-MIGRATIONS-2.txt |
| CA-7h | Run KSS-DB-054 (STEP 1 + STEP 3 + STEP 4) in Supabase | [x] DONE — Apr 22 2026 |
| CA-7i | Run KSS-DB-055 (STEP 2) in Supabase | [x] DONE — Apr 22 2026 |
| CA-7j | After KSS-DB-054 complete: re-add admin_users join in `page.tsx` to populate "Created by" column | [x] DONE — Apr 22 2026 |
| CA-7k | `npm run build` passes clean | [x] DONE — verified Apr 22 2026 |

### Phase 0 — PRD + SQL + Planning
| # | Task | Status |
|---|------|--------|
| CA-0a | Write PRD → `prds/super-admin/PRD-SA-CREATE-ASSESSMENTS.md` | [x] DONE |
| CA-0b | Write SQL → `docs/requirements/SQL-CA-MIGRATIONS.txt` (KSS-DB-050 + KSS-DB-051) | [x] DONE |
| CA-0c | Update TODO-BACKLOG.md | [x] DONE |
| CA-0d | Add nav policy lock note to `prds/analytics/PRD-LINEAR-ANALYTICS-V2.md` | [x] DONE |

### Phase 1 — Main Page Rewrite
| # | Task | Status |
|---|------|--------|
| CA-1a | `statusActions()` helper — returns allowed actions per status | [x] DONE |
| CA-1b | Search bar (title-only, client-side) | [x] DONE |
| CA-1c | Full action menus by status (DRAFT/INACTIVE/LIVE/MAINTENANCE/ARCHIVED) | [x] DONE |
| CA-1d | Modals: Publish, Ready to Publish, Archive, Duplicate | [x] DONE |
| CA-1e | Take Offline modal (start/end date-time → stores to assessment_config JSONB, status → MAINTENANCE) | [x] DONE |
| CA-1f | End Maintenance modal (MAINTENANCE → INACTIVE) | [x] DONE |
| CA-1g | Make Live modal (ARCHIVED → LIVE) | [x] DONE |
| CA-1h | Delete modal (query plan_content_map, list plans, block if LIVE/MAINTENANCE) | [x] DONE |
| CA-1i | Auto-revert check on page load (MAINTENANCE + end_time < now → INACTIVE + banner) | [x] DONE |
| CA-1j | Enable "Create Adaptive" button | [x] DONE |

### Phase 2 — Linear Form Refactor
| # | Task | Status |
|---|------|--------|
| CA-2a | Move Duration to new "Timings" section card | [x] DONE |
| CA-2b | Allow Sectional Navigation toggle (drives timer_mode + navigation_policy; removes dropdown) | [x] DONE |
| CA-2c | Cap sections at 10 (disable button at cap, tooltip) | [x] DONE |
| CA-2d | Cap duration at 500 min (max=500 on input) | [x] DONE |
| CA-2e | Allow Back Navigation + Allow Calculator toggles in Timings section | [x] DONE |
| CA-2f | Shared components extracted to `linear/_components.tsx` | [x] DONE |

### Phase 3 — Linear Edit Form
| # | Task | Status |
|---|------|--------|
| CA-3a | `/linear/[id]/page.tsx` — load by ID, pre-populate all fields | [x] DONE |
| CA-3b | "Save Changes" button, UPDATE instead of INSERT | [x] DONE |
| CA-3c | MAINTENANCE read-only warning banner + fieldset disabled | [x] DONE |

### Phase 4 — Adaptive Create Form
| # | Task | Status |
|---|------|--------|
| CA-4a | Basic Info section (Full Test / Subject Test, Category, Allow Calculator) | [x] DONE |
| CA-4b | Foundation Module builder (1–5 FM for Full Test, exactly 1 for Subject Test) | [x] DONE |
| CA-4c | Per-FM branching config (High/Low % + auto medium range + reset) | [x] DONE |
| CA-4d | Variant Module cards (3 per FM: EASY/MEDIUM/HARD) | [x] DONE |
| CA-4e | Break screen builder (between FM and VMs only) | [x] DONE |
| CA-4f | Display Config section | [x] DONE |
| CA-4g | Preview tab (module flow diagram) | [x] DONE |
| CA-4h | Scale Score tab (disabled until save; shows "Save first" message) | [x] DONE |
| CA-4i | Sources + Chapters multi-select picker per module | [x] DONE |
| CA-4j | Question Type Distribution editor per module | [x] DONE |
| CA-4k | Save as Draft (INSERT to assessment_items) | [x] DONE |

### Phase 5 — Adaptive Edit Form
| # | Task | Status |
|---|------|--------|
| CA-5a | `/adaptive/[id]/page.tsx` — hydrate from DB, pre-populate all FM/VM fields | [x] DONE |
| CA-5b | "Save Changes" button, UPDATE + Scale Score UPSERT (per-module delete+insert) | [x] DONE |
| CA-5c | Scale Score tab fully active (assessment_id available) | [x] DONE |
| CA-5d | MAINTENANCE read-only banner + fieldset disabled | [x] DONE |

### Phase 6 — Post-Build
| # | Task | Status |
|---|------|--------|
| CA-6a | Update `docs/CLAUDE-DB.md` — KSS-DB-050 + KSS-DB-051 schemas | [x] DONE |
| CA-6b | `npm run build` passes clean (6 new routes) | [x] DONE |
| CA-6c | KSS-DB-050 + KSS-DB-051 run in Supabase — verified Apr 21 2026 | [x] DONE |

---

## [IN-PROGRESS] KSS-ANA-002 — Analytics V2: Shared Components + SAT + Linear Fixes

**PRD:** `prds/analytics/PRD-ANA-002.md` (to be written)
**Scope:** Shared SectionBreakdown · Unified ConceptMastery (per section/attempt, dynamic pills) · MistakeTaxonomy (live 6-cat) · Live PacingAnalysis · Solutions Panel fixes · SAT HeroScore bugs · Linear stats card removal · Attempt naming
**DB Required:** KSS-DB-048 (users target score columns) — for Linear target-set UI only
**Solutions Panel:** UI-match approach (both implementations kept, matched visually — no merge)

---

**LOCKED DECISIONS:**
- Attempt naming: attempt_number=1 → "Free Attempt", others → "Attempt {N}" — no DB change
- Leverage Panels: remove from both SAT and Linear entirely
- Stats card (Score/Accuracy/Attempts): remove from Linear AnalyticsTab
- Target score input: `<input type="number" min=1 max=10000>` (replaces dropdown) — SAT and Linear
- SATHeroScore layout: keep single card, fix responsive (flex-col → sm:flex-row), fix selectedAttempt sub-scores
- PreviewSectionWrapper: remove from Pacing + MistakeTaxonomy entirely
- Pacing data: live from `attempt_answers.time_spent_seconds` — no more demo data
- Pacing formula: `(assessment.duration × 60) / assessment.questionCount` s/q — displayed visibly in UI
- Pacing in Linear: YES add it (target = total_duration_seconds ÷ total_questions)
- MistakeTaxonomy: 6-category classification (same as `MistakeIntelligence`) — wire to SAT, replaces `SATMistakeTaxonomy`
- Concept Mastery: per section, per attempt. Pills = dynamic from `attempt_section_results.section_label`. Data derived from `attempt_answers` (concept_tag + section_id). New shared component replaces both `ConceptMasteryPanel` (SAT) and inline heatmap (Linear)
- Section Breakdown: shared component, flat list (no R&W/Math headings), used by both
- Solutions Panel: keep separate implementations (SAT: SolutionsPanel.tsx, Linear: inline) — match UI only
- Platform Config Analytics Config: DEFERRED to Create Adaptive Assessment form
- SAT Scoring Reference table: remains static for now

---

---

**FINAL LOCKED DECISIONS (Apr 21 2026):**
- Pacing in Linear: group by subject section (Physics/Chemistry/Biology for NEET etc.) — same grouping as Section Breakdown
- Pacing formula: algebraic only (`Target = Total duration (min) × 60 ÷ Total questions`) shown in "View Formula" info popover — not student-facing inline
- ConceptMasterySection: derives from `attempt_answers.concept_tag + section_id` (not `user_concept_mastery`)
- `attempt_answers.section_id` backfill: SQL UPDATE via `concept_tag = concept_tags.concept_name` join → derive subject → map to section_id

---

### Phase 0 — PRD + Diagnostics (run before building)
| # | Task | Status |
|---|------|--------|
| A2-PRD | Write `prds/analytics/PRD-ANA-002.md` | [x] DONE — Apr 21 2026 |
| A2-D1 | DIAG-1/1b: SAT FT questions found (98 rows, module_name matches MODULE_ORDER). Code bug confirmed. | [x] DONE |
| A2-D2 | DIAG-2: Linear questions found per section (5/5 each). Questions are placeholder IDs not in `questions` table — code bug in loadSection() JOIN. | [x] DONE |
| A2-D3 | DIAG-3: Duplicate attempts confirmed — attempt_number 1 AND 2 each have 2 rows (placeholder + real seed). Delete placeholders in STEP 9b/9c. | [x] DONE |
| A2-D4 | DIAG-4: section_id already 100% populated for NEET/JEE/CLAT (null_section_id=0). KSS-DB-053 backfill CANCELLED. | [x] DONE |
| A2-D5 | DIAG-5: concept_tag → concept_name 100% match. All tags resolve. | [x] DONE |
| A2-DB048 | KSS-DB-048: target_neet/jee/clat_score columns added and verified. | [x] DONE |
| A2-DB053 | KSS-DB-053: CANCELLED — section_id already populated. | [x] N/A |
| A2-DATA001 | KSS-DATA-001: Delete placeholder attempt rows (11111111-*, 22222222-*, 33333333-*) — SQL-ANA-002.txt STEP 9b/9c. Run STEP 10/11 after. | [ ] SA RUNS |

### Phase 1 — Quick Removals (no new components, fast wins)
| # | Task | Status |
|---|------|--------|
| A2-0a | Remove `SATLeveragePanel` block from `SATAnalyticsTab.tsx` Block 6 | [x] DONE — Already removed from imports/code (confirmed Apr 26). File deleted. |
| A2-0b | Remove `LeverageActions` block from `AnalyticsTab.tsx` | [x] DONE — Apr 24 2026 (file deleted) |
| A2-0c | Remove "Reading & Writing" + "Math" group headings from SAT Section Breakdown in `SATAnalyticsTab.tsx` | [ ] PENDING |
| A2-0d | Remove `PreviewSectionWrapper` wrapping from Pacing + MistakeTaxonomy in `SATAnalyticsTab.tsx` | [ ] PENDING |
| A2-0e | Remove Block 1 Score Summary card (Score / Accuracy / Total Attempts grid) from `AnalyticsTab.tsx` | [ ] PENDING |

### Phase 2 — Bug Fixes
| # | Task | Status |
|---|------|--------|
| A2-1a | `SATHeroScore.tsx`: fix mobile layout — `flex items-start gap-6` → `flex flex-col sm:flex-row sm:items-start sm:gap-6` | [ ] PENDING |
| A2-1b | `SATHeroScore.tsx`: R&W/Math sub-scores hardcoded to `lastAttempt` — fix to `selectedAttempt` | [ ] PENDING |
| A2-1c | `SATHeroScore.tsx`: convert target `<select>` dropdown → `<input type="number" min={1} max={10000}>` | [ ] PENDING |
| A2-1d | `AttemptPillFilter.tsx`: accept optional `attemptName?: string` per entry; attempt_number=1 → "Free Attempt" | [ ] PENDING |
| A2-1e | `AttemptPillFilter.tsx`: deduplicate attempts array by `id` defensively | [ ] PENDING |
| A2-1f | `SolutionsPanel.tsx` (SAT): add `module_name` fallback grouping (render all questions when no module match) + proper empty state | [ ] PENDING |
| A2-1g | `AnalyticsTab.tsx` solutions section (Linear): add empty state when section loads but questions array is empty | [ ] PENDING |

### Phase 3 — Shared: SectionBreakdown
| # | Task | Status |
|---|------|--------|
| A2-2a | Create `src/components/assessment-detail/SectionBreakdown.tsx` — props: `sections: SectionResult[]`; flat list (no group headings); marks bar + correct/wrong/skipped/time/accuracy | [ ] PENDING |
| A2-2b | Replace SAT inline section breakdown in `SATAnalyticsTab.tsx` with `<SectionBreakdown>` | [ ] PENDING |
| A2-2c | Replace Linear inline section breakdown (Block 5) in `AnalyticsTab.tsx` with `<SectionBreakdown>` | [ ] PENDING |

### Phase 4 — Shared: MistakeTaxonomy (unify)
| # | Task | Status |
|---|------|--------|
| A2-3a | Add `concept_tag` + `section_id` to SAT `attempt_answers` query in `SATAnalyticsTab.tsx` | [x] DONE — Apr 24 2026 |
| A2-3b | Wire `MistakeIntelligence` into `SATAnalyticsTab.tsx` — replaces `SATMistakeTaxonomy` block | [x] DONE — Apr 24 2026 |
| A2-3c | Delete `SATMistakeTaxonomy.tsx` | [x] DONE — Apr 26 2026 |

### Phase 5 — Shared: Live PacingAnalysis
| # | Task | Status |
|---|------|--------|
| A2-4a | Build `src/components/assessment-detail/PacingAnalysis.tsx` — live `attempt_answers.time_spent_seconds`; target time from assessment config (time_minutes ÷ questions_per_attempt per module for SAT / duration × 60 ÷ questionCount for Linear); chip layout showing "Q{N} · {t}s" on each dot; visible formula line in section header | [x] DONE — Already built (confirmed Apr 26). Dot grid, summary stats, legend, sectionLabel prop. |
| A2-4b | Wire `PacingAnalysis` into `SATAnalyticsTab.tsx` — replace `SATPacingChart` | [ ] PENDING |
| A2-4c | Wire `PacingAnalysis` into `AnalyticsTab.tsx` (Linear) — target = `assessment.duration × 60 ÷ assessment.questionCount` | [ ] PENDING |
| A2-4d | Delete `SATPacingChart.tsx` | [x] DONE — Apr 26 2026 |

### Phase 6 — Shared: ConceptMastery (per section, per attempt)
| # | Task | Status |
|---|------|--------|
| A2-5a | Build `src/components/assessment-detail/ConceptMasterySection.tsx` — props: `answers: {section_id, concept_tag, is_correct, is_skipped}[]`, `sectionLabels: Record<string, string>`, `selectedAttemptNumber: number`; pill tabs from `sectionLabels` keys (dynamic DB values); concept mastery bars per selected section | [ ] PENDING |
| A2-5b | Add `section_id` to Linear `attempt_answers` query in `AnalyticsTab.tsx` | [ ] PENDING |
| A2-5c | Replace `ConceptMasteryPanel` usage in `SATAnalyticsTab.tsx` with `<ConceptMasterySection>` | [ ] PENDING |
| A2-5d | Replace inline concept mastery heatmap in `AnalyticsTab.tsx` with `<ConceptMasterySection>` | [ ] PENDING |
| A2-5e | Retire `ConceptMasteryPanel.tsx` (replaced) | [ ] PENDING |

### Phase 7 — Solutions Panel: UI-match (Linear inline = SAT accordion style)
| # | Task | Status |
|---|------|--------|
| A2-6a | Audit visual diff between SAT `SolutionsPanel.tsx` and Linear inline solutions in `AnalyticsTab.tsx` | [ ] PENDING |
| A2-6b | Update Linear inline solutions to match SAT accordion style (collapsed row = Q# / status badge / time / answer; expanded = full question + marks earned/lost + explanation) | [ ] PENDING |

### Phase 8 — Linear Score Trajectory Target Input
| # | Task | Status |
|---|------|--------|
| A2-7a | KSS-DB-048 SQL: `users` ADD `target_neet_score`, `target_jee_score`, `target_clat_score` INT NULL | [x] DONE — KSS-DB-048 already ran and verified (see A2-DB048) |
| A2-7b | Add inline `<input type="number">` to `ScoreTrajectoryChart.tsx` when target is null (shows "Set a target →" prompt) | [ ] PENDING |
| A2-7c | Verify `AppContext.updateTargetScore()` writes to KSS-DB-048 columns (referenced in AnalyticsTab but columns may not exist yet) | [ ] PENDING |

### Phase 9 — Post-Build
| # | Task | Status |
|---|------|--------|
| A2-8a | `npm run build` passes clean | [ ] PENDING |
| A2-8b | Move completed tasks to `CLAUDE-HISTORY.md`, update `TODO-BACKLOG.md` | [ ] PENDING |
| A2-8c | Update memory file `project_kss_ana_002.md` | [ ] PENDING |

---

## [IN-PROGRESS] KSS-ANA-DB-001 — Analytics DB Config + Score Fix (PENDING SA SQL RUNS)

**SQL files ready — SA must run in order:**
| # | File | ID | Status |
|---|------|----|--------|
| 1 | `docs/linear_analytics/fix_attempt_scores.sql` | KSS-DB-056 | [ ] SA RUNS |
| 2 | `docs/linear_analytics/migration_exam_config.sql` | KSS-DB-057 | [ ] SA RUNS |

**KSS-DB-056**: Recomputes attempt scores for seeded NEET/JEE/CLAT from marks_awarded. Fixes CLAT score 870→~45.
**KSS-DB-057**: Adds `exam_categories.neg_mark`, creates `concept_tag_section_map` table (seeded for NEET/JEE/CLAT), adds `user_concept_mastery.section_name`. ⚠️ Contains `SET score_max = 1600 WHERE slug = 'sat'` — KSS-DB-050 previously set it to 800 (per-section). Confirm correct value before running.

---

## [IN-PROGRESS] KSS-ANA-001 — Linear Analytics V2 (NEET / JEE / CLAT)

**PRD:** `prds/analytics/PRD-LINEAR-ANALYTICS-V2.md`  
**Scope:** ScoreTrajectoryChart · MistakeIntelligence · LeverageActions · RankPredictionCard  
**Retains:** All 7 existing AnalyticsTab blocks unchanged. Strengths/WeakSpots → replaced by LeverageActions.  
**Out of scope (locked):** Exam-specific insights, peer percentile, exam countdown, recovery journey, SAT analytics.

### Phase 0 — PRD & Planning
| # | Task | Status |
|---|------|--------|
| LA-0a | Write PRD → `prds/analytics/PRD-LINEAR-ANALYTICS-V2.md` | [x] DONE — Apr 20 2026 |
| LA-0b | Update TODO-BACKLOG.md | [x] DONE — Apr 20 2026 |

### Phase 1 — DB Migrations
| # | Migration | Status |
|---|---|---|
| KSS-DB-048 | `users`: ADD `target_neet_score INT NULL`, `target_jee_score INT NULL`, `target_clat_score INT NULL` | [ ] PENDING |
| KSS-DB-049 | CREATE `rank_prediction_tables` + seed NEET/JEE/CLAT 2025 data (`is_active=true`) | [ ] PENDING |
| KSS-DB-052 | DROP `attempt_answers_question_id_fkey` — undocumented FK blocking analytics seeding with placeholder question_ids | [x] DONE — Apr 21 2026 |

### Phase 2 — Data Seeding (attempt_answers for NEET / JEE / CLAT)
| # | Task | Status |
|---|---|---|
| SEED-LA-001 | NEET FT1 Attempt 1 (free) — 180 attempt_answers with time + distribution | [x] DONE — Apr 21 2026 |
| SEED-LA-002 | NEET FT1 Attempt 2 (paid) — 180 attempt_answers | [x] DONE — Apr 21 2026 |
| SEED-LA-003 | JEE FT1 Attempt 1+2 — 180 attempt_answers combined | [x] DONE — Apr 21 2026 |
| SEED-LA-004 | JEE FT1 Attempt 2 (paid) — 90 attempt_answers | [x] DONE — Apr 21 2026 (combined with SEED-LA-003) |
| SEED-LA-005 | CLAT FT1 Attempt 1+2 — 240 attempt_answers combined | [x] DONE — Apr 21 2026 |
| SEED-LA-006 | CLAT FT1 Attempt 2 (paid) — 150 attempt_answers | [x] DONE — Apr 21 2026 (combined with SEED-LA-005) |
| SEED-LA-007 | Verify `attempt_section_results.time_spent_seconds` populated for all 6 attempts | [x] DONE — Apr 21 2026 (seeded in STEP 2) |
| SEED-LA-008 | Chapter test answer UPDATEs + mastery INSERTs for chapter tests | [x] DONE — Apr 21 2026 (STEP 9+10, pre-completed) |

### Phase 3 — New Standalone Components
| # | File | Status |
|---|---|---|
| LA-C001 | `src/components/assessment-detail/ScoreTrajectoryChart.tsx` — 6-slot, target line, inline prompt | [ ] PENDING |
| LA-C002 | `src/components/assessment-detail/RankPredictionCard.tsx` — NEET/CLAT AIR + JEE band, interpolation | [ ] PENDING |
| LA-C003 | `src/components/assessment-detail/MistakeIntelligence.tsx` — 6 categories, empty state, INFERENCE-ENGINE rules | [x] DONE — Apr 21 2026 |
| LA-C004 | `src/components/assessment-detail/LeverageActions.tsx` — top 3 by marks lost, mastery fallback, time insight | [x] CANCELLED — file deleted Apr 24 2026, not needed |

### Phase 4 — AnalyticsTab.tsx Integration
| # | Task | Status |
|---|---|---|
| LA-I001 | Add rank_prediction_tables fetch (once on mount, by exam_category_id) | [ ] PENDING |
| LA-I002 | Add attempt_answers fetch per selected attempt (shared by MistakeIntelligence + LeverageActions) | [ ] PENDING |
| LA-I003 | Insert ScoreTrajectoryChart at Block 3 | [ ] PENDING |
| LA-I004 | Insert RankPredictionCard at Block 4 (NEET/JEE/CLAT guard) | [ ] PENDING |
| LA-I005 | Insert MistakeIntelligence after Section Breakdown | [x] DONE — Apr 24 2026 |
| LA-I006 | Replace Strengths/WeakSpots with LeverageActions | [x] CANCELLED — LeverageActions deleted, block removed Apr 24 2026 |
| LA-I007 | Wire target score read/write via AppContext | [x] DONE — Apr 21 2026 (updateTargetScore in AppContext) |

### Phase 5 — AppContext
| # | Task | Status |
|---|---|---|
| LA-AC001 | Add `target_neet_score`, `target_jee_score`, `target_clat_score` to user shape | [ ] PENDING |
| LA-AC002 | Add `updateTargetScore(exam, score)` method — writes Supabase + updates context | [ ] PENDING |

### Phase 6 — Platform Config Rank Prediction Sub-tab
| # | Task | Status |
|---|---|---|
| LA-PC001 | Add "Rank Prediction" sub-tab to NEET/JEE/CLAT categories in Platform Config drill-down | [ ] PENDING |
| LA-PC002 | List years + is_active toggle + "Add Year" slide-over (year + JSON paste) | [ ] PENDING |

### Phase 7 — Post-Build (Phase 2 seeding docs)
| # | Task | Status |
|---|---|---|
| LA-POST001 | Update `CLAUDE-DB.md` — KSS-DB-052 + Phase 2 seeding notes + routing bug note | [x] DONE — Apr 21 2026 |
| LA-POST002 | Update `CLAUDE-HISTORY.md` — log KSS-ANA-001 Phase 2 seeding + KSS-DB-052 | [x] DONE — Apr 21 2026 |
| LA-POST003 | Update memory files — project_kss_ana_001.md | [x] DONE — Apr 21 2026 |
| LA-POST004 | `npm run build` must pass clean | [ ] PENDING |
| LA-POST005 | Update `CLAUDE-DB.md` — KSS-DB-048 + KSS-DB-049 schemas (after Phase 1 DB migrations run) | [ ] PENDING |

---

## [COMPLETE — BUILD PASSING] KSS-SA-PC-001 — Platform Config Exam Category CRUD

**PRD:** `prds/super-admin/PRD-SA-PLATFORM-CONFIG.md`
**Decision:** Option B — `display_name` column added; `name` = immutable short code

### Phase 0 — Pre-Implementation
| # | Task | Status |
|---|------|--------|
| PC-0a | DB diagnostic run — DIAG-1 through DIAG-6 pasted in SQL-RESPONSE-3.txt | [x] DONE — Apr 20 2026 |
| PC-0b | CQ-6a/b/c resolved — JEE-only, Thermodynamics=Physics, CLAT Quantitative | [x] DONE |
| PC-0c | CLAUDE-DB.md updated — confirmed IDs, schema gaps, backfill mapping | [x] DONE |
| PC-0d | PRD written — `prds/super-admin/PRD-SA-PLATFORM-CONFIG.md` | [x] DONE |
| PC-0e | Option B chosen — `display_name` column added (`name` = immutable code) | [x] DONE — Apr 20 2026 |

### Phase 1 — DB Migrations
| # | Migration | Status |
|---|---|---|
| KSS-DB-045 | `exam_categories`: ADD `description`, `display_order`, `display_name`. Seeded. | [x] DONE — Apr 20 2026 |
| KSS-DB-046a | `assessments` + `assessment_items`: ADD `exam_category_id UUID FK`. Backfilled. | [x] DONE — Apr 20 2026 |
| KSS-DB-046b | `assessments`: DROP `exam_type`. | [x] DONE — Apr 20 2026 |
| KSS-DB-047 | Insert missing concept tags (Thermodynamics/JEE, Arithmetic+Ratio/CLAT). Verify pending. | [x] DONE — Apr 20 2026 |

### Phase 2 — Shared Hook
| # | Task | Status |
|---|---|---|
| PC-2a | Create `src/hooks/useExamCategories.ts` — `activeOnly` flag, ordered by `display_order` | [x] DONE — Apr 20 2026 |
| PC-2b | `useAssessments.ts`, `assessmentUtils.ts`, `plans.ts`, `b2c-users.ts` — JOIN `exam_categories!exam_category_id` | [x] DONE — Apr 20 2026 |

### Phase 3 — EXAM_SORT_ORDER Replacement
| # | Task | Status |
|---|---|---|
| PC-3a | Remove hardcoded `EXAM_SORT_ORDER` from `AssessmentLibrarySection.tsx` | [x] DONE — Apr 20 2026 |
| PC-3b | `buildExamGroups()` sorts by `display_order`; filters `is_active = false` | [x] DONE — Apr 20 2026 |
| PC-3c | `YourAssessmentsSection` — dynamic exam filter options from active assessments | [x] DONE — Apr 20 2026 |

### Phase 4 — Platform Config Page Refactor
| # | Task | Status |
|---|---|---|
| PC-4a | Replace tab nav → 3-col card grid (mobile 1-col, tablet 2-col, desktop 3-col) | [x] DONE — Apr 20 2026 |
| PC-4b | SortableExamCard: display_name, badge, tag count, Edit button, drag handle | [x] DONE — Apr 20 2026 |
| PC-4c | dnd-kit drag-to-reorder → batch UPDATE `display_order` on drop | [x] DONE — Apr 20 2026 |
| PC-4d | URL param `?cat=[categoryId]` — drill-down with breadcrumb (Suspense wrapper) | [x] DONE — Apr 20 2026 |
| PC-4e | Sub-tabs (Concept Tags + Analytics Display) preserved inside drill-down | [x] DONE — Apr 20 2026 |

### Phase 5 — Exam Category CRUD
| # | Task | Status |
|---|---|---|
| PC-5a | "Create Exam Category" slide-over (all fields, slug auto-gen) | [x] DONE — Apr 20 2026 |
| PC-5b | Edit slide-over — name/slug READ-ONLY; delete button at bottom | [x] DONE — Apr 20 2026 |
| PC-5c | Delete guard — count concept_tags + assessment_items; block if > 0 | [x] DONE — Apr 20 2026 |
| PC-5d | Cancel button bug fixed — `onCancelDelete` prop resets confirming state | [x] DONE — Apr 20 2026 |

### Phase 6 — is_active Consumer Wiring
| # | Task | Status |
|---|---|---|
| PC-6a | SA `create-assessments/page.tsx` + `linear/page.tsx` — `.eq('is_active', true).order('display_order')` | [x] DONE — Apr 20 2026 |
| PC-6b | `AssessmentCard`, `ContinueLearningWidget` — use `exam_categories.name/display_name` | [x] DONE — Apr 20 2026 |
| PC-6c | `AssessmentLibrarySection`, `YourAssessmentsSection` — filter inactive categories | [x] DONE — Apr 20 2026 |

### Phase 7 — makeLive Sync
| # | Task | Status |
|---|---|---|
| PC-7a | `makeLive()` in `content-bank.ts` — INSERT into `assessments`, set `assessment_items.assessments_id` | [x] DONE — Apr 20 2026 |
| PC-7b | Idempotent guard — if `assessments_id` set, UPDATE existing row | [x] DONE — Apr 20 2026 |

### Phase 8 — Concept Tag Count Fix (post QB-DB-021 Step B)
| # | Task | Status |
|---|---|---|
| PC-8a | Count query already correct — uses `questions WHERE concept_tag_id = x` (verified) | [x] DONE — Apr 20 2026 |

### Post-Implementation
| # | Task | Status |
|---|---|---|
| POST-1 | Update PRD status → LOCKED | [ ] PENDING |
| POST-2 | Update `CLAUDE-DB.md` — final exam_categories schema | [ ] PENDING |
| POST-3 | Update `CLAUDE-HISTORY.md` — log KSS-SA-PC-001 completion | [ ] PENDING |
| POST-4 | Update memory `project_kss_sa_pc_001.md` | [ ] PENDING |
| POST-5 | `npm run build` — must pass clean | [x] DONE — Apr 20 2026 |

---

## [IN-PROGRESS] KSS-CC-SA-QB-001 — Question Bank (SA + CC)

| # | Task | Status |
|---|------|--------|
| QB-DB-001 | KSS-DB-020 migration — numeric_answer_type/min/max on questions, marks/negative_marks on passage_sub_questions | [x] DONE — confirmed Apr 20 2026 |
| QB-DB-002 | KSS-DB-021 — Add `concept_tag_id UUID REFERENCES concept_tags(id) ON DELETE RESTRICT` (nullable) to `questions`. Backfill by name-match (`concept_tag` text → `concept_tags.concept_name`). Drop legacy `concept_tag` text column. Replace `question_concept_mappings` count query in platform-config with `COUNT(*) FROM questions WHERE concept_tag_id=x`. Retire `question_concept_mappings` table. SQL → SQL-RESPONSE-2.txt | [x] DONE — Apr 20 2026 |
| QB-001 | Write `prds/super-admin/PRD-SA-QUESTIONS.md` — after all QB decisions finalised | [x] DONE — Apr 20 2026 |
| QB-002 | Update CLAUDE-DB.md to reflect KSS-DB-033 + KSS-DB-034 new columns | [x] DONE — Apr 20 2026 |
| QB-003 | Create Assessment question-picker UI — SA picks sources/chapters, system randomly assigns questions at runtime | [ ] PENDING — separate ticket |
| QB-004 | `categories` column on `questions` table — legacy/redundant. Leave as DEFAULT '[]', never write to it. Drop in future cleanup | [ ] DEFERRED |
| QB-005 | TIPTAP-001/002 — Exam player rendering of Tiptap JSONB question_text and options[].text | [ ] PENDING — pre-existing ticket |
| QB-006 | **QuestionForm — options 4–6, drag-to-reorder** | [x] DONE — Apr 20 2026 |
| QB-007 | **PASSAGE_SINGLE stem label fix** | [x] DONE — Apr 20 2026 |
| QB-008 | **PASSAGE_SINGLE marks validation bug** | [x] DONE — Apr 20 2026 |
| QB-009 | **filteredSources race condition** | [x] DONE — Apr 20 2026 |
| QB-010 | **Platform Config concept tag delete fix** — catch FK RESTRICT violation, show "Cannot delete — X questions reference this tag" | [ ] PENDING — separate ticket, must ship before QB-DB-002 goes live |

**All decisions locked (Apr 20 2026):**
- Concept tag: ONE tag per question. `questions.concept_tag_id` UUID FK, ON DELETE RESTRICT, nullable. Backfill by name-match. Drop `concept_tag` text column post-migration. `question_concept_mappings` retired (only reader = platform-config count, replaceable with direct COUNT).
- MCQ options: min 4, max 6 (A–F). Drag reorder via @dnd-kit/sortable. Alphabetical key reflow on drop + correct_answer auto-updates to new key assignments.
- Option removal: disabled at min=4. Also disabled if option is the current correct answer — SA changes answer first.
- Sub-questions: same 4–6 option rules.
- PASSAGE_SINGLE marks: same validation rules as PASSAGE_MULTI sub-questions.
- PASSAGE_SINGLE stem: label updated, shown in exam player only, not in admin preview.

**Built this session (Apr 19–20 2026):**
- `src/components/ui/RichTextRenderer.tsx` — read-only Tiptap+KaTeX renderer
- `src/app/super-admin/question-bank/page.tsx` — Serial #, Question, Type, Difficulty, Created by, Last edited by, Actions eye-only; removed status filter + pencil
- `src/app/super-admin/question-bank/_components/QuestionPreviewModal.tsx` — MCQ/NUMERIC/PASSAGE split-pane preview, Delete warning, Edit routing
- `src/app/super-admin/question-bank/_components/QuestionForm.tsx` — exam category filter, NUMERIC Exact/Range, sub-question marks (PASSAGE_MULTI), parent marks auto-sum, video_url, Edit/Preview tabs, save warning modal, marks validation; bug-fix: question_text always saved (not cleared for PASSAGE types)

---

## [PENDING] KSS-SAT-A02 — SAT Analytics V2 + Platform Config Restructure

**PRD:** `prds/super-admin/PRD-SAT-ANALYTICS-V2.md`

### Phase 1 — DB Migrations ✅ COMPLETE
| # | Migration | Status |
|---|---|---|
| KSS-DB-041 | `sat_tier_bands` + 5 rows seeded | [x] DONE — SQL-RESPONSE-1.txt |
| KSS-DB-042 | `sat_colleges` + 19 colleges seeded | [x] DONE — SQL-RESPONSE-1.txt |
| KSS-DB-043 | `users.target_sat_score` + `target_sat_subject_score` columns | [x] DONE — SQL-RESPONSE-1.txt |
| KSS-DB-044 | `platform_analytics_config` + SAT defaults seeded | [x] DONE — SQL-RESPONSE-1.txt |

### Phase 2 — Platform Config Page Restructure ✅ COMPLETE
All tasks PC-001 through PC-007 done (previous session).

### Phase 3 — New Shared Components ✅ COMPLETE
| # | File | Status |
|---|---|---|
| SC-001 | `src/components/ui/ScoreTrajectoryChart.tsx` | [x] DONE |
| SC-002 | `src/components/ui/DifficultyBreakdownCard.tsx` | [x] DONE |
| SC-003 | `src/components/ui/PreviewSectionWrapper.tsx` | [x] DONE |

### Phase 4 — SAT Analytics Components ✅ COMPLETE
| # | File | Status |
|---|---|---|
| SA-001 | `src/components/assessment-detail/SATHeroScore.tsx` | [x] DONE |
| SA-002 | `src/components/assessment-detail/SATCollegeLadder.tsx` | [x] DONE |
| SA-003 | `src/components/assessment-detail/SATLeveragePanel.tsx` | [x] DONE |
| SA-004 | `src/components/assessment-detail/SATPacingChart.tsx` | [x] DONE — demo data |
| SA-005 | `src/components/assessment-detail/SATMistakeTaxonomy.tsx` | [x] DONE — demo data |

### Phase 5 — SATAnalyticsTab Wiring ✅ COMPLETE
All AT-001 through AT-009 wired. `difficulty` added to questions select. Platform config + tier bands + colleges loaded in parallel. Target score from AppContext. build passes.

### Phase 6 — Assessment Card Target Score Prompt ✅ COMPLETE
| # | Task | Status |
|---|---|---|
| TC-001 | Touch 1 prompt below SAT full-test card CTA (State 4, target null) | [x] DONE |
| TC-002 | Save target → Supabase `UPDATE users` + AppContext `updateUser` | [x] DONE |

### Phase 7 — Solutions Panel Accordion + attempt_answers Seeding ✅ COMPLETE (Apr 20 2026)
| # | Task | Status |
|---|---|---|
| FIX-001 | Trim assessment_question_map to correct Digital SAT counts (27/27/22/22) | [x] DONE — SQL-RESPONSE-1.txt STEP 1-2 (run in Supabase) |
| FIX-002 | Seed attempt_answers for SAT FT Attempt 1 (98 rows with correct/wrong/skipped distribution) | [x] DONE — SQL-RESPONSE-1.txt STEP 5-9 (run in Supabase) |
| FIX-003 | Update attempt_section_results + attempts.score_rw/math | [x] DONE — SQL-RESPONSE-1.txt STEP 3-4 (run in Supabase) |
| FIX-004 | SolutionsPanel.tsx — accordion redesign, remove inline (Correct) label, Marks Earned/Lost panel | [x] DONE — code shipped |
| FIX-005 | SATAnalyticsTab.tsx — add section_id/time_spent_seconds/marks_awarded to query + derivedSectionResults | [x] DONE — code shipped |
| FIX-006 | CLAUDE-RULES.md — Solutions Panel spec updated to match reference image accordion format | [x] DONE |
| FIX-007 | PRD-SAT-ANALYTICS-V2.md §10 — accordion spec + hybrid architecture + marks-per-question concept | [x] DONE |
| FIX-008 | CLAUDE-DB.md — seeding notes for attempt_answers + updated module question counts | [x] DONE |

**Pending (SA runs SQL):** SQL-RESPONSE-1.txt batch must be run in Supabase before DB-side data is live. Code changes are already deployed.

### Post-Exam-Engine (DEFERRED — do not build yet)
| # | Task | Blocked on |
|---|---|---|
| DEFER-001 | Wire Pacing to real per-question time data | Exam engine must record `time_per_question_seconds[]` on submit |
| DEFER-002 | Wire MistakeTaxonomy to real classification | Engine analysis layer + classification algorithm |
| DEFER-003 | Remove Preview badges when real data is live | After DEFER-001 + DEFER-002 |

---

## [IN-PROGRESS] KSS-SA-036 — Sources & Chapters (Pending items)

| # | Migration / Task | Status |
|---|---------|--------|
| KSS-DB-029 | Drop `status` column from `chapters` | [ ] PENDING — run in Supabase |
| SEED-001 | Assign `created_by` + `last_modified_by` on existing chapters | [ ] PENDING |
| SC-004 | Question assignment diagnostic SQL | [ ] DEFERRED |

---

## [IN-PROGRESS] Sections Builder — KSS-SA-030 extension

| # | Issue | Detail |
|---|-------|--------|
| SEC-001 | Sections builder UI not yet built in linear form | FULL_TEST only. SA adds sections (name + questionCount + optional durationMinutes when SECTION_LOCKED). Saved to `assessment_config.sections[]`. |
| SEC-002 | `navigation_policy` SECTION_LOCKED validation | Cannot select SECTION_LOCKED if assessment has < 2 sections. Warn on save. |
| SEC-003 | `total_questions` auto-sum from sections | When sections defined, `total_questions` = sum of section questionCounts. SA should not enter manually. |
| SEC-004 | `total_marks` auto-sum from sections | `total_marks` = sum of (`section.questionCount × section.marksPerQuestion`). Needs marksPerQuestion per section. |

---

## [IN-PROGRESS] Tiptap Rich Text — Exam Player Rendering

| # | Issue | Detail |
|---|-------|--------|
| TIPTAP-001 | Exam player must render Tiptap JSONB `question_text` | Exam player (useExamEngine + LinearExamPlayer) currently renders as plain string — will show raw JSON to students. Must add read-only Tiptap renderer to all question type renderers. |
| TIPTAP-002 | Option text JSONB rendering in exam player | `options[].text` is now Tiptap JSON doc. Option renderer must use read-only Tiptap instance. |

---

## [CRITICAL] Data / Schema

| # | Issue | Detail | Requires |
|---|-------|--------|---------|
| TODO-001 | `assessments` table formal deprecation plan | Legacy B2C engine table. Still canonical for exam engine (useExamEngine reads by slug). Migration plan needed: SA-created `assessment_items` → `assessments` at "Make Live". | Separate ticket |
| TODO-002 | `assessment_items` missing learner-facing columns | `slug`, `total_questions`, `difficulty`, `min_tier`, `is_puzzle_mode`, `rating`, `total_users`, `subject` — needed for full learner detail page once `assessments` is retired as primary source. | KSS-DB-XXX |
| TODO-003 | Learner assessments list page still on `assessments` table | `/assessments/page.tsx` reads via `AssessmentLibrarySection`. Needs migration to `assessment_items` once canonical. | Separate ticket |
| TODO-006 | `MAINTENANCE` status first-class state | Badge: orange-50/orange-700. Learners cannot access MAINTENANCE content. | KSS-DB-XXX |

---

## [HIGH] Analytics — KSS-SA-031 (Remaining production work)

| # | Issue | Detail |
|---|-------|--------|
| ANA-001 | Production: wire `useExamEngine` to write `attempt_answers` rows on submit | Demo done. Production path deferred. |
| ANA-002 | `assessment_question_map.section_name` is fragile for analytics | Text match breaks if section renamed. Future: migrate to `section_id` UUID. |
| ANA-003 | Production: write `attempt_section_results` on submit | Demo done. |
| ANA-004 | Production: write `user_concept_mastery` on submit | Demo done. |
| ANA-005 | Production analytics algorithm — rules engine | Panic detection, guess detection, weak concept identification, improvement velocity. Spec in PRD §6+§7. |
| ANA-008 | SAT score equating not implemented | Scaled scores seeded as static values. Real equating needs CB lookup tables. |
| ANA-009 | SAT adaptive module routing not tracked | `attempt_section_results.section_id` stores module names. Production: track which module 2 variant (easy/hard) received. |

---

## [PARTIAL] Question Seeding — KSS-SA-032

| # | Issue | Detail | Status |
|---|-------|--------|--------|
| QS-001b | NEET questions (180Q) | NEET — all unique, concept_tag, explanation, marks. | [ ] PENDING |
| QS-001c | CLAT questions (~140Q) | Passage-based English, Legal, Logical, Quant, GK. | [ ] PENDING |
| QS-001d | JEE questions (90Q) | Physics, Chemistry, Mathematics — MCQ + NUMERIC. | [ ] PENDING |
| QS-004 | SAT Full Test 2 question mapping | `476083b3` has no questions — no unique set seeded yet. | [ ] PENDING |
| QS-005 | Demo attempt data for new questions | Seed attempt rows + attempt_answers for demo users once NEET/JEE/CLAT/SAT FT2 questions seeded. | [ ] PENDING |

---

## [PARTIAL] PRD Updates (deferred)

| # | Task | Status |
|---|------|--------|
| SAT-A01-T9a | Update `PRD-SAT-ANALYTICS.md` with final decisions post-implementation | [ ] PENDING |
| SAT-A01-T9b | Update `PRD-AI-ANALYTICS.md` §9 components section with new component map | [ ] PENDING |
| SAT-A01-T10d | `AnalyticsTab` concept mastery upgrade — deferred from KSS-SAT-A01 | [ ] DEFERRED |

---

## [DEBT] Type / Code Debt

| # | Issue | Detail | File |
|---|-------|--------|------|
| TODO-008 | `SyllabusSection` type deprecated | After KSS-SA-030, unused. Remove in cleanup. | `src/types/index.ts` |
| TODO-009 | `mockSyllabus` unused after KSS-SA-030 | Remove in cleanup. | `src/data/assessments.ts` |
| TODO-010 | `navigation_policy` vs sections validation | SECTION_LOCKED advisory only until sections builder ships. | `linear/page.tsx` |
| TODO-014 | `ContinueLearningWidget.tsx` still uses `getAttemptData` | Dead mock data keys. Migrate to `useUserAttempts()` hook. | `src/components/dashboard/ContinueLearningWidget.tsx` |
| TODO-015 | `YourAssessmentsSection.tsx` still uses `getAttemptData` | Migrate to `useUserAttempts()` hook. | `src/components/assessment/YourAssessmentsSection.tsx` |
| TODO-016 | `mockAttempts.ts` DEMO_ATTEMPTS map is dead code | After TODO-014/015 migrated, remove the map + function. Keep `MockAttemptData` interface + `DEFAULT_ATTEMPT`. | `src/data/mockAttempts.ts` |

---

## [PENDING] Feature Tickets

| Ticket | Feature | Status |
|--------|---------|--------|
| KSS-SA-007 | Marketing Config | [PENDING] |
| KSS-CA-007 | CA Dashboard | [PENDING] |
| KSS-CA-009 | Audit Log (CA) | [PENDING] |
| KSS-SA-019 | Contract mandatory on CA creation (Phase 2 enforcement) | [CRITICAL] |
| KEYS-485 | Restore archived plan | Spec locked Apr 7 2026, not yet built |
| KEYS-501 | Hard delete plan (ARCHIVED + zero subscribers) | Spec locked Apr 7 2026, not yet built |
| KSS-SA-[TBD] | Build Super Admin login + authentication flow | [PENDING] |
| KSS-CA-[TBD] | Build Client Admin login + authentication flow | [PENDING] |
| KSS-B2C-[TBD] | Build B2C user signup + onboarding flow | [PENDING] |
| KSS-SA-[TBD] | SAT Exam Engine (scoring + adaptive routing) | [BACKLOG] |
| KSS-B2C-[TBD] | Plan cancellation flow UI (end-user) | [PENDING — PRD placeholder in PRD-B2C-END-USER-ASSESS-PLANS.md §4] |
| KSS-B2C-[TBD] | Plan upgrade/downgrade flow UI (end-user) | [PENDING — PRD placeholder §5] |

---

## [DECISION NEEDED] UX / Product Decisions

| # | Issue | Detail |
|---|-------|--------|
| TODO-011 | SECTION_LOCKED + sections count validation | Confirm: block save or just warn? |
| TODO-013 | Empty `what_youll_get` fallback | If `display_config.what_youll_get` is empty, learner sees nothing. Platform-default bullets needed? |

---

## RULES

- This file MUST be updated at the START of every session with new tasks
- Only ACTIVE tasks live here. Completed work → `docs/CLAUDE-HISTORY.md`
- Mark tasks `[IN-PROGRESS]` as work begins, `[x] DONE` on completion, then move to CLAUDE-HISTORY.md at session end
