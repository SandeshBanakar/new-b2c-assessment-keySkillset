# TODO Backlog — keySkillset Platform
# Last updated: Apr 18 2026. Active tasks only. Completed work → CLAUDE-HISTORY.md.

---

## [IN-PROGRESS] KSS-SA-039 — Category Plan Gating & Demo Infrastructure (Apr 18 2026)

PRDs: `prds/super-admin/PRD-SA-PLANS-PRICING.md` | `prds/end-user/PRD-B2C-END-USER-ASSESS-PLANS.md`

### DB (run in Supabase — SQL handoff protocol)

| # | Migration | Status |
|---|-----------|--------|
| KSS-DB-039a | Check `exam_categories` table — confirm `.name` values for NEET / JEE / CLAT match `plans.category` strings | [x] DONE Apr 18 |
| KSS-DB-039b | Insert 9 category plans (NEET / JEE / CLAT × BASIC / PRO / PREMIUM), `status = 'PUBLISHED'`, `plan_audience = 'B2C'`, `scope = 'CATEGORY_BUNDLE'` | [x] DONE Apr 18 |
| KSS-DB-039c | Insert 3 demo users into `users` table: Ananya Krishnan (NEET), Rohan Mehta (JEE), Preethi Nair (CLAT) — `subscription_tier = 'free'` | [x] DONE Apr 18 |
| KSS-DB-039d | Insert `b2c_assessment_subscriptions` rows — one per demo user pointing to their respective BASIC plan, `status = 'active'` | [x] DONE Apr 18 |

### Code Tasks

| # | Task | File | Status |
|---|------|------|--------|
| PLANS-001 | Add `active_plan_info` optional field to `DemoUser` type | `src/data/demoUsers.ts` | [x] DONE Apr 18 |
| PLANS-002 | Add 3 category plan demo users to `DEMO_USERS` array | `src/data/demoUsers.ts` | [x] DONE Apr 18 |
| PLANS-003 | Add `activePlanInfo` to `User` type | `src/types/index.ts` | [x] DONE Apr 18 |
| PLANS-004 | Map `active_plan_info → activePlanInfo` in `demoUserToUser()` | `src/context/AppContext.tsx` | [x] DONE Apr 18 |
| PLANS-005 | Add "Category Plan Learners" bay to persona selector | `src/app/page.tsx` | [x] DONE Apr 18 |
| PLANS-006 | Add State 3 (category mismatch) to `deriveCardState()` | `src/components/assessment/AssessmentCard.tsx` | [x] DONE Apr 18 |
| PLANS-007 | Render State 3 UI — "Take Free Test" + "Switch Plan" → `/plans?highlight={category}` | `src/components/assessment/AssessmentCard.tsx` | [x] DONE Apr 18 |
| PLANS-008 | Handle `?highlight=` param: smooth scroll + 2s ring animation on category section | `src/app/plans/page.tsx` | [x] DONE Apr 18 |
| PLANS-009 | `fetchB2CUsers` eager LATERAL JOIN — add plan info to query + `B2CUser` type | `src/lib/supabase/b2c-users.ts` | [x] DONE Apr 18 |
| PLANS-010 | Add "Plan" column to B2C Users list (after Tier column) | `src/app/super-admin/b2c-users/page.tsx` | [x] DONE Apr 18 |
| PLANS-011 | Checkout mutual exclusivity gate — block if active subscription exists | `src/app/checkout/page.tsx` | [x] DONE Apr 18 |

### Doc Tasks (completed this session)

| # | Task | Status |
|---|------|--------|
| DOC-001 | Update CLAUDE-DB.md — `subscription_tier` platform-only rule, category plan notes, demo UUIDs | [x] DONE Apr 18 |
| DOC-002 | Update CLAUDE-PLATFORM.md — persona selector bay spec, State 3, Plan column spec | [x] DONE Apr 18 |
| DOC-003 | Update CLAUDE-RULES.md — mutual exclusivity enforcement section | [x] DONE Apr 18 |
| DOC-004 | Create `prds/super-admin/PRD-SA-PLANS-PRICING.md` | [x] DONE Apr 18 |
| DOC-005 | Create `prds/end-user/PRD-B2C-END-USER-ASSESS-PLANS.md` | [x] DONE Apr 18 |
| DOC-006 | Rewrite TODO-BACKLOG.md (active tasks only) + append CLAUDE-HISTORY.md | [x] DONE Apr 18 |

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
