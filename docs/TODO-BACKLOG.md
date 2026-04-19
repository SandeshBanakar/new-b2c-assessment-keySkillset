# TODO Backlog — keySkillset Platform
# Last updated: Apr 19 2026 — KSS-SAT-A02 PRD locked. Active tasks only. Completed work → CLAUDE-HISTORY.md.

---

## [PENDING] KSS-SAT-A02 — SAT Analytics V2 + Platform Config Restructure

**PRD:** `prds/super-admin/PRD-SAT-ANALYTICS-V2.md`

### Phase 1 — DB Migrations (run in Supabase before any code)
| # | Migration | SQL | Status |
|---|---|---|---|
| KSS-DB-041 | Create `sat_tier_bands` + seed 5 rows | PRD §5 | [ ] PENDING |
| KSS-DB-042 | Create `sat_colleges` + seed 19 colleges | PRD §5 | [ ] PENDING |
| KSS-DB-043 | `ALTER TABLE users ADD target_sat_score + target_sat_subject_score` | PRD §5 | [ ] PENDING |
| KSS-DB-044 | Create `platform_analytics_config` + seed SAT defaults | PRD §5 | [ ] PENDING |

### Phase 2 — Platform Config Page Restructure
| # | Task | File | Status |
|---|---|---|---|
| PC-001 | Refactor page to exam-category tabs (from `exam_categories` DB) | `src/app/super-admin/platform-config/page.tsx` | [ ] PENDING |
| PC-002 | Add [Concept Tags] sub-tab per category (existing CRUD, filtered) | same | [ ] PENDING |
| PC-003 | Add [Analytics Display] sub-tab per category | same | [ ] PENDING |
| PC-004 | Build Analytics Display — SAT: Section Visibility toggles → `platform_analytics_config` | new component | [ ] PENDING |
| PC-005 | Build Analytics Display — SAT: Tier Bands inline-edit table → `sat_tier_bands` | new component | [ ] PENDING |
| PC-006 | Build Analytics Display — SAT: College Targets table + Add/Edit slideover + Delete | new component | [ ] PENDING |
| PC-007 | Analytics Display — NEET/JEE/CLAT: "Coming Soon" placeholder | same | [ ] PENDING |

### Phase 3 — New Shared Components
| # | Task | File | Status |
|---|---|---|---|
| SC-001 | `ScoreTrajectoryChart` — SVG line chart, props: attempts, scoreMax, target? | `src/components/ui/ScoreTrajectoryChart.tsx` | [ ] PENDING |
| SC-002 | `DifficultyBreakdownCard` — Easy/Medium/Hard bars from diffMap | `src/components/ui/DifficultyBreakdownCard.tsx` | [ ] PENDING |
| SC-003 | `PreviewSectionWrapper` — Preview badge + explanatory copy wrapper | `src/components/ui/PreviewSectionWrapper.tsx` | [ ] PENDING |

### Phase 4 — SAT Analytics Components
| # | Task | File | Status |
|---|---|---|---|
| SA-001 | `SATHeroScore` — score + target progress bar + SVG chart + edit/remove target | `src/components/assessment-detail/SATHeroScore.tsx` | [ ] PENDING |
| SA-002 | `SATCollegeLadder` — tier rail + college cards, full test only | `src/components/assessment-detail/SATCollegeLadder.tsx` | [ ] PENDING |
| SA-003 | `SATLeveragePanel` — top-3 concepts + impact calc + dark card | `src/components/assessment-detail/SATLeveragePanel.tsx` | [ ] PENDING |
| SA-004 | `SATPacingChart` — module pacing bars + target line, demo data | `src/components/assessment-detail/SATPacingChart.tsx` | [ ] PENDING |
| SA-005 | `SATMistakeTaxonomy` — donut + 4 categories, demo data | `src/components/assessment-detail/SATMistakeTaxonomy.tsx` | [ ] PENDING |

### Phase 5 — SATAnalyticsTab Wiring
| # | Task | Notes | Status |
|---|---|---|---|
| AT-001 | Replace score-grid Block 1 with `SATHeroScore` | Reads target from user context | [ ] PENDING |
| AT-002 | Add `SATCollegeLadder` after AttemptPillFilter, full test only | Reads `sat_colleges` + `sat_tier_bands` | [ ] PENDING |
| AT-003 | Enhance Section Breakdown with time display | `time_spent_seconds` already in DB | [ ] PENDING |
| AT-004 | Add `DifficultyBreakdownCard` — new data load step (JOIN attempt_answers → questions) | See PRD §6.4 | [ ] PENDING |
| AT-005 | Replace "Where You Lost Points" with `SATLeveragePanel` | Impact formula in PRD §6.5 | [ ] PENDING |
| AT-006 | Add `SATPacingChart` after ConceptMasteryPanel — conditionally shown via platform config | Preview badge | [ ] PENDING |
| AT-007 | Add `SATMistakeTaxonomy` after Pacing — conditionally shown via platform config | Preview badge | [ ] PENDING |
| AT-008 | Load `platform_analytics_config` for SAT on mount — gate Preview sections | See PRD §4.2 | [ ] PENDING |
| AT-009 | Load `users.target_sat_score` / `target_sat_subject_score` on mount | From AppContext or direct query | [ ] PENDING |

### Phase 6 — Assessment Card Target Score Prompt (Touch 1)
| # | Task | File | Status |
|---|---|---|---|
| TC-001 | Add soft target-score prompt below SAT Full Test card CTA when target is null | `AssessmentCard.tsx` | [ ] PENDING |
| TC-002 | Save on dropdown select → `UPDATE users SET target_sat_score` | Supabase call | [ ] PENDING |

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
