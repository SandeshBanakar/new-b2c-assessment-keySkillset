# TODO Backlog — keySkillset Platform
# Last updated: May 1 2026 — KSS-CA-EML-DYN-001 + KSS-CLEANUP-001 COMPLETE. Client Admin emails now use dynamic {{company_name}}, content-creator-run-only dead template purged. Build PASSED.

---

## [COMPLETE] KSS-EMAIL-FIX-001 â€” Email Template Payload + HTML Refinement

**Source:** `docs/requirements/emails_fix.txt`  
**Context:** Align 10 email templates with refined dynamic payloads, move stable product copy into HTML/template defaults, remove inherited placeholder fields where they do not support the email purpose, and keep preview UI/rendering consistent across personas.

| # | Task | File | Status |
|---|------|------|--------|
| EF-1 | Read project rules and requirement brief | `CLAUDE.md`, `docs/requirements/emails_fix.txt` | [x] COMPLETE |
| EF-2 | Impact-check generic payload fields (`teamName`, placeholder CTAs, `featureModeLabel`, deactivated login/CTA data) | `src/lib/email-templates/*`, `src/email-templates/html/*` | [x] COMPLETE |
| EF-3 | Update preview payloads for CA onboarding, CC Full, CA deactivated/reactivated, B2C suspended/restored, B2B learner onboarding/completion/deactivated/report card | `src/lib/email-templates/data.ts` | [x] COMPLETE |
| EF-4 | Rewrite/refine the matching HTML templates so the email purpose is explicit and not empty/token-heavy | `src/email-templates/html/*.html` | [x] COMPLETE |
| EF-5 | Update preview variables/text fallback if removed fields become optional | `src/lib/email-templates/types.ts`, `src/lib/email-templates/render.ts`, email preview pages | [x] COMPLETE |
| EF-6 | Run `npm run build` and fix TypeScript/render regressions | â€” | [x] COMPLETE |
| EF-7 | Move completed task summary to history after verification | `docs/CLAUDE-HISTORY.md` | [x] COMPLETE |

---

## [COMPLETE] KSS-EMAIL-FIX-002 - Hardcode Purpose Copy Inside Email HTML

**Source:** User correction after KSS-EMAIL-FIX-001  
**Context:** Purpose-copy values such as intro eyebrow, hero title/subtitle, assignment summary, completion summary, role labels, and CTA labels must not remain dynamic template placeholders. Keep only agreed business-variable placeholders such as names, company logo/name where explicitly needed, URLs, course/certificate values, and report-card metrics.

| # | Task | File | Status |
|---|------|------|--------|
| EF2-1 | Audit all HTML templates for leftover purpose-copy tokens | `src/email-templates/html/*` | [x] COMPLETE |
| EF2-2 | Replace purpose-copy tokens in requested templates with fixed HTML messaging from requirement brief | `src/email-templates/html/*` | [x] COMPLETE |
| EF2-3 | Adjust render/data/types if no longer needed by HTML variables | `src/lib/email-templates/*` | [x] COMPLETE |
| EF2-4 | Run `npm run build` | - | [x] COMPLETE |
| EF2-5 | Update history and final self-critique | `docs/CLAUDE-HISTORY.md` | [x] COMPLETE |

---

## [COMPLETE] KSS-B2C-EML-SUSP-001 — B2C User Account Suspension/Restoration Email Templates

**Source:** `prds/end-user/PRD-B2C-EML-001-SUSPEND-REVOKE-EMAILS.md`  
**Context:** Rebuild B2C suspension and restoration email templates with correct messaging (not certificate copy), aligned to PRD variable contract, with appropriate color theming and support/CTA flows.

| # | Task | File | Status |
|---|------|------|--------|
| SUSP-1 | Review PRD, existing templates, and clarify messaging/CTA/variable requirements | PRD + attachments | [x] COMPLETE |
| SUSP-2 | Rebuild `b2c-user-suspended.html` with rose-700 theme, reason display, support email link, no CTA button | `src/email-templates/html/b2c-user-suspended.html` | [x] COMPLETE |
| SUSP-3 | Rebuild `b2c-access-restored.html` with emerald-700 theme, "Rewalk the Path" CTA button, welcome-back message | `src/email-templates/html/b2c-access-restored.html` | [x] COMPLETE |
| SUSP-4 | Update template variables in data.ts — remove certificate/tenant fields, add `reason`, align to Salesforce payload contract | `src/lib/email-templates/data.ts` | [x] COMPLETE |
| SUSP-5 | Run `npm run build` and verify no errors | — | [x] COMPLETE |
| SUSP-6 | Document changes and move to history | `docs/CLAUDE-HISTORY.md` (pending) | [x] COMPLETE |

---

## [COMPLETE] KSS-CA-EML-DYN-001 — Client Admin Email Dynamic Company Name

**Source:** User follow-up to KSS-B2C-EML-SUSP-001  
**Context:** Two Client Admin templates had hardcoded "Akash Institute" company names in hero headers. Made dynamic using `{{company_name}}` variable already declared in data.ts.

| # | Task | File | Status |
|---|------|------|--------|
| CA-1 | Make `client-admin-deactivated.html` hero header dynamic | `src/email-templates/html/client-admin-deactivated.html` | [x] COMPLETE |
| CA-2 | Make `client-admin-reactivated.html` hero header dynamic | `src/email-templates/html/client-admin-reactivated.html` | [x] COMPLETE |
| CA-3 | Verify build passes | — | [x] COMPLETE |

---

## [COMPLETE] KSS-CLEANUP-001 — Remove Dead Template: Content Creator Run-Only

**Source:** User cleanup request  
**Context:** `content-creator-run-only` template is dead code — RUN_ONLY tenants have no content creators, making the template nonsensical. Removed completely from codebase.

| # | Task | File | Status |
|---|------|------|--------|
| CLEANUP-1 | Delete HTML file | `src/email-templates/html/content-creator-run-only.html` | [x] COMPLETE |
| CLEANUP-2 | Remove from EmailTemplateId union | `src/lib/email-templates/types.ts` | [x] COMPLETE |
| CLEANUP-3 | Remove template definition object | `src/lib/email-templates/data.ts` | [x] COMPLETE |
| CLEANUP-4 | Remove preview payload function | `src/lib/email-templates/data.ts` | [x] COMPLETE |
| CLEANUP-5 | Verify build passes | — | [x] COMPLETE |

---

## [IN PROGRESS] KSS-CONCEPT-MASTERY-RESTRUCTURE-001 — Concepts → Chapters Architecture (All Exams)

**Source:** Concept Mastery Design Session - May 1 2026  
**PRD:** `prds/PRD-CONCEPT-MASTERY-CHAPTERS-RESTRUCTURE.md` (APPROVED & BEING REFINED)  
**Context:** Unify Sources/Chapters architecture across all exams (NEET, JEE, CLAT, BANK, SSC). Concepts become chapters (1:1). Auto-migrate existing concept tags. Update analytics to show "Chapter Mastery". Refactor questions to use chapter_id FK instead of concept_tag text field.

**Sequencing: Option B (PRD Refinement) → Option A (Implementation) → Option C (Exam Engine Coordination)**

---

### **OPTION B: PRD Refinement (In Progress — Target: May 2 2026)**

Comprehensive refinement covering DB schema, UI specs, migration plan, and validation.

| # | Task | File | Status |
|---|------|------|--------|
| PREP-1 | Finalize DB schema details — column types, indexes, FKs | `prds/PRD-CONCEPT-MASTERY-CHAPTERS-RESTRUCTURE.md` | [x] IN PROGRESS |
| PREP-2 | Write SQL template skeletons for all 5 exam migrations (NEET, JEE, CLAT, BANK, SSC) | PRD §5 | [ ] PENDING |
| PREP-3 | Define ChapterPicker component specs for Adaptive Assessment | PRD §4 Component Changes | [ ] PENDING |
| PREP-4 | Create detailed validation checklist + acceptance criteria (build + backfill + create + analytics + staging test) | PRD §7 | [ ] PENDING |
| PREP-5 | Document rollback plan + runbook for each phase | PRD §8 | [ ] PENDING |
| PREP-6 | Lock staggered exam rollout: NEET → JEE (1 week) → CLAT (1 week) → BANK+SSC parallel | PRD §9 | [ ] PENDING |
| PREP-7 | Update CLAUDE-DB.md with "Concept Mastery Restructure" section | `docs/CLAUDE-DB.md` | [ ] PENDING |
| PREP-8 | Update CLAUDE-PLATFORM.md with concept mastery + platform config clarification | `docs/CLAUDE-PLATFORM.md` | [ ] PENDING |
| PREP-9 | Finalize & freeze PRD (all decisions locked, ready for implementation) | PRD | [ ] PENDING |

---

### **OPTION A: Phase 1-5 Implementation (Starts After PRD Freeze — Target: Weeks 1-5)**

Staged implementation starting with NEET, then parallel exams.

#### **Phase 1: NEET Migration — Staging First (Weeks 1-2)**

| # | Task | File | Status | Acceptance |
|---|------|------|--------|-----------|
| CM-1 | Write DB migration KSS-DB-061-063: chapters + refactor questions | `docs/scripts/KSS-DB-061-chapters-section-name.sql` | [ ] PENDING | SQL syntax valid |
| CM-2 | Write NEET migration script: create source + chapters from concept tags | `docs/scripts/migrate-concepts-to-chapters-NEET.sql` | [ ] PENDING | Script runs on staging |
| CM-3 | Execute on staging: Create source + chapters for NEET | Staging DB | [ ] PENDING | 48 chapters created |
| CM-4 | Backfill: questions.chapter_id for all NEET questions | Staging DB | [ ] PENDING | 100% NEET questions have chapter_id |
| CM-5 | Validate: Build passes, TypeScript clean | `npm run build` | [ ] PENDING | Exit code 0 |
| CM-6 | Test: Create Linear Assessment picks chapters | Manual test + staging user | [ ] PENDING | Chapter picker works |
| CM-7 | Test: Create Adaptive Assessment picks chapters | Manual test + staging user | [ ] PENDING | Adaptive chapter picker works |
| CM-8 | Test: Analytics tab renders chapter mastery | Manual test + staging user attempt | [ ] PENDING | Chapter mastery displays |
| CM-9 | QA sign-off: Staging validation complete | QA review | [ ] PENDING | QA approval |

**Acceptance Criteria for NEET:** Build ✓ + 100% backfill ✓ + Create Assessment ✓ + Analytics render ✓ + Staging user test ✓

#### **Phase 2: Update Assessment Forms (Weeks 2-3)**

| # | Task | File | Status |
|---|------|------|--------|
| CM-10 | Verify: Linear Assessment already uses chapters (SourceChapterPicker) | `src/app/super-admin/create-assessments/linear/page.tsx` | [ ] PENDING |
| CM-11 | Update Adaptive Assessment: Replace ConceptTagPicker with ChapterPicker | `src/app/super-admin/create-assessments/adaptive/_components.tsx` | [ ] PENDING |
| CM-12 | Add chapter filter to Question Bank (alongside concept_tag filter for backward compat) | `src/app/super-admin/question-bank/page.tsx` | [ ] PENDING |
| CM-13 | Update types: FoundationModule + VariantModule add chapter_ids | `src/types/index.ts` | [ ] PENDING |
| CM-14 | Test: Create/Edit assessments use chapters (not concepts) | Manual test | [ ] PENDING |
| CM-15 | Build passes, all tests green | `npm run build` | [ ] PENDING |

#### **Phase 3: Update Analytics (Weeks 3-4)**

| # | Task | File | Status |
|---|------|------|--------|
| CM-16 | Update AnalyticsTab: Show chapter mastery panel (keyed on chapter_id) | `src/components/assessment-detail/AnalyticsTab.tsx` | [ ] PENDING |
| CM-17 | Update SATAnalyticsTab: Rename Concept Mastery → Chapter Mastery | `src/components/assessment-detail/SATAnalyticsTab.tsx` | [ ] PENDING |
| CM-18 | Update Leverage section: Show weak chapters | `src/components/assessment-detail/AnalyticsTab.tsx` | [ ] PENDING |
| CM-19 | Test: Analytics render chapter mastery correctly | Manual test + staging user | [ ] PENDING |
| CM-20 | Build passes, all tests green | `npm run build` | [ ] PENDING |

#### **Phase 4: Other Exams — STAGGERED (Weeks 4-8)**

**Staggered approach for safety:** JEE → (1 week) → CLAT → (1 week) → BANK+SSC parallel

| # | Task | File | Status | Timing |
|---|------|------|--------|--------|
| CM-21 | Write JEE migration + run on staging | `docs/scripts/migrate-concepts-to-chapters-JEE.sql` | [ ] PENDING | Week 4 |
| CM-22 | Validate JEE: Build + 100% backfill + tests | QA | [ ] PENDING | Week 4 |
| CM-23 | Write CLAT migration + run on staging | `docs/scripts/migrate-concepts-to-chapters-CLAT.sql` | [ ] PENDING | Week 5 |
| CM-24 | Validate CLAT: Build + 100% backfill + tests | QA | [ ] PENDING | Week 5 |
| CM-25 | Write BANK + SSC migrations (parallel scripts) | `docs/scripts/migrate-concepts-to-chapters-BANK.sql` + `SSC.sql` | [ ] PENDING | Week 6-7 |
| CM-26 | Validate BANK + SSC: Build + backfill + tests | QA | [ ] PENDING | Week 7 |
| CM-27 | Verify SAT consistency (already has chapters) | Validation query | [ ] PENDING | Week 8 |
| CM-28 | Update database.schema.json with unified structure | `database.schema.json` | [ ] PENDING | Week 8 |

#### **Phase 5: Production Cutover & Monitoring**

| # | Task | File | Status |
|---|------|------|--------|
| CM-29 | Create production migration runbook | `docs/RUNBOOK-CONCEPT-MASTERY-CUTOVER.md` | [ ] PENDING |
| CM-30 | Execute production migration (all exams, one-shot) | Production DB | [ ] PENDING |
| CM-31 | Monitor: Questions table query perf + backfill completion | Monitoring | [ ] PENDING |
| CM-32 | Verify: All exams have 100% chapter_id NOT NULL | Validation query | [ ] PENDING |
| CM-33 | Full build + QA regression testing | CI/CD | [ ] PENDING |

---

### **OPTION C: Exam Engine Coordination (Async, Parallel to A) (Target: Complete by Week 5)**

Coordinate with exam engine for chapter_id support (solo dev = async + documentation).

| # | Task | File | Status |
|---|------|------|--------|
| ENG-1 | Document exam engine integration contract (questions.chapter_id + user_chapter_mastery) | `docs/EXAM-ENGINE-INTEGRATION.md` (NEW) | [ ] PENDING |
| ENG-2 | Create integration test fixtures for exam engine → chapter_id wiring | `__tests__/exam-engine-chapter-integration.ts` (NEW) | [ ] PENDING |
| ENG-3 | Create PR template for exam engine team with required changes | `docs/EXAM-ENGINE-PR-TEMPLATE.md` (NEW) | [ ] PENDING |
| ENG-4 | Async coordinate with exam engine team (Slack/email) — share integration contract | Out-of-band | [ ] PENDING |
| ENG-5 | Once engine is ready: Wire questions.chapter_id reads + user_chapter_mastery writes | Phase TBD | [ ] PENDING |
| ENG-6 | Soft-deprecate concept_tag from questions (keep for backward compat 1 release) | Deprecation wave | [ ] PENDING |

**Notes:** 
- Solo developer: async coordination via documentation + test fixtures
- Engine integration is NOT a blocker for Phases 1-3; it's a follow-on integration
- Phases 1-3 ready by end of week 5; engine wiring TBD by their timeline

---

### **Decision Lock (May 1, 2026)**

- ✅ **Sequencing:** Option B (PRD freeze) → Option A (Implementation) → Option C (Engine async)
- ✅ **Start Timing:** Phase 1 (NEET) begins this week after PRD freeze
- ✅ **Stage First:** All migrations tested on staging before production
- ✅ **Parallel Exams:** After NEET validation, JEE/CLAT staggered (safer), BANK+SSC parallel (Week 7)
- ✅ **Validation:** Thorough — build + backfill + create assessment + analytics + staging user test
- ✅ **chapter_section_map:** CREATE in Phase 1.1 (reserved for future)
- ✅ **Solo Dev:** Exam engine coordination async (documentation + test fixtures)

---

## [PENDING] KSS-SA-ASSESS-PLANS-001 — Assessment Plan Associations in Create Assessments Table

---

## [PENDING] KSS-SA-ASSESS-PLANS-001 — Assessment Plan Associations in Create Assessments Table

**Source:** `docs/requirements/super_admin_changes.txt` — Task 2  
**Context:** Create Assessments list table should show how many plans each assessment is linked to, with a clickable badge that opens the existing `ContentPlanUsageModal`.

| # | Task | File | Status |
|---|------|------|--------|
| AP-1 | Batch fetch plan counts after assessments load — single query: `plan_content_map GROUP BY content_item_id` | `create-assessments/page.tsx` | [ ] PENDING |
| AP-2 | Build `Map<assessmentId, number>` for plan counts | same | [ ] PENDING |
| AP-3 | Add `planCounts` state to `CreateAssessmentsPage` | same | [ ] PENDING |
| AP-4 | Add "Plans" column header to table (after "Status", before "Created by") | same | [ ] PENDING |
| AP-5 | Render amber "⚠ In N plans" badge per row (only when count > 0) — matching Plans & Pricing style | same | [ ] PENDING |
| AP-6 | Wire `ContentPlanUsageModal` on badge click (reuse existing component) | same | [ ] PENDING |
| AP-7 | Handle modal `onRemoved` → re-fetch plan counts | same | [ ] PENDING |
| AP-8 | `npm run build` / TypeScript check passes | — | [ ] PENDING |

---

## [DEFERRED] KSS-ANA-002 — Analytics V2: Advanced Shared Components

**PRD:** `prds/analytics/PRD-ANA-002.md` (to be written when prioritised)  
**Context:** Deferred analytics improvements — MistakeTaxonomy live 6-category, PacingAnalysis live, unified ConceptMastery per attempt/section, Solutions Panel UI unification, SAT HeroScore responsive fix. Builds on KSS-ANA-001 (Linear, complete) and KSS-SAT-A02 (SAT, complete).

**Locked decisions (do not contradict when building):**
- Attempt naming: `attempt_number=1` → "Free Attempt", others → "Attempt {N}" — no DB change
- Pacing formula: `(assessment.duration × 60) / assessment.questionCount` s/q target — shown in UI
- MistakeTaxonomy: 6-category classification (same as `MistakeIntelligence`) — replaces `SATMistakeTaxonomy`
- Leverage Panels: remove from both SAT and Linear entirely
- Stats card (Score/Accuracy/Attempts): remove from Linear AnalyticsTab
- Target score input: `<input type="number" min=1 max=10000>` (replaces dropdown) — both SAT and Linear
- PreviewSectionWrapper: remove from Pacing + MistakeTaxonomy
- Solutions Panel: keep separate SAT (`SolutionsPanel.tsx`) and Linear (inline) implementations — match UI only

---

## COMPLETED ITEMS (reference)

All completed work has been moved to `docs/CLAUDE-HISTORY.md`.  
Memory index at: `~/.claude/projects/.../memory/MEMORY.md`

| Ticket | Completed | Notes |
|--------|-----------|-------|
| KSS-ANA-KEY-001 | Apr 30 2026 | AnalyticsTab duplicate React key warning fixed via normalized option identity + fallback labels for missing option keys |
| KSS-ANALYTICS-FIXES-001 | Apr 30 2026 | Solutions/Mistake Intelligence/Concept Mastery for CLAT/NEET/JEE — see notes below |
| KSS-B2B-CAD-001 | Apr 29 2026 | Email QA fixes + B2B learner CA deactivated email + login state |
| KSS-PC-SST-001 | Apr 29 2026 | Scale Score Templates in Platform Config, adaptive form refactor |
| KSS-SA-SCALE-SCORE-FIX-001 | Apr 28 2026 | Scale score input reset bug — lazy initializer fix |
| KSS-SA-CONTRACT-001 | Apr 28 2026 | 5 new contract fields, CreateTenant form, CA billing display |
| KSS-B2B-RC-001 | Apr 28 2026 | B2B report card modal redesign + Salesforce email template |
| KSS-B2B-PORTAL-POLISH | Apr 28 2026 | Navbar fix, cert cards, assessment filters, PRD-B2B-PORTAL-001 |
| KSS-CA-CHANGES-001 | Apr 28 2026 | CA dashboard refactor, Users & Roles fix, Billing page |
| KSS-SA-BILLING-001 | Apr 28 2026 | SA/CA billing payment details + history, KSS-DB-058 |
| KSS-B2C-BUNDLE-001 | Apr 28 2026 | B2C user bundle course display |
| KSS-AUTH-001 | Apr 28 2026 | B2C/CA login + auth screens + suspended/deactivated states |
| KSS-SA-ASSESS-PLANS-001 (badge) | Apr 28 2026 | Plan badge in Create Assessments title cell (different from AP-1..8 table above) |
| KSS-B2B-UI-FIXES | Apr 27 2026 | Tailwind gradient bug, assessment 400 error, navbar single row |
| KSS-ANA-001 / KSS-ANA-DB-001 | Apr 27 2026 | Linear Analytics V2, DB-056 + DB-057 |
| KSS-B2B-UI-001 | Apr 27 2026 | B2B portal UI overhaul (courses, course detail, assessments) |
| KSS-CA-LEARNER-FIXES | Apr 26-27 2026 | B2B content access gate, dashboard fixes, login improvements |
| KSS-LINT-001 | Apr 26 2026 | React hooks/set-state-in-effect sweep (18 files) |
| KSS-B2B-LEARNER-001 | Apr 24 2026 | B2B learner portal, login, nav, context, DB-053 |
| KSS-CA-CHANGES-001 (dashboard v1) | Apr 24 2026 | CA dashboard + profile overhaul |
| KSS-SA-FIXES-001 | Apr 27 2026 | 5 SA bug fixes, platform config table redesign |
| KSS-CA-EMAIL-001 | Apr 27 2026 | Client Admin white-label email template center |
| KSS-SA-CA-001 | Apr 21-22 2026 | Create Assessment feature set (linear + adaptive forms) |
| KSS-SA-PC-001 | Apr 27 2026 | Platform Config exam category CRUD + table redesign |
