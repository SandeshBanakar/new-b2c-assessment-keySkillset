# TODO Backlog — keySkillset Platform
# Updated Apr 12 2026. Pick up items as separate tickets with KSS-DB-XXX authorisation where required.

---

## [CRITICAL] — Data / Schema

| # | Issue | Detail | Requires |
|---|-------|--------|---------|
| TODO-001 | `assessments` table formal deprecation plan | Legacy B2C engine table. Still canonical for exam engine (useExamEngine reads by slug). Needs migration plan: SA-created assessment_items → assessments at "Make Live". Document promotion sync logic. | Separate ticket |
| TODO-002 | `assessment_items` missing learner-facing columns | `slug`, `total_questions`, `difficulty`, `min_tier`, `is_puzzle_mode`, `rating`, `total_users`, `subject` — needed for full learner detail page once `assessments` table is retired as primary source. | KSS-DB-XXX |
| TODO-003 | Learner assessments list page still on `assessments` table | `/assessments/page.tsx` reads via `AssessmentLibrarySection`. Needs migration to `assessment_items` once that table is canonical. | Separate ticket |
| TODO-006 | `DB-TODO-002` — MAINTENANCE status first-class state | Badge: orange-50/orange-700. Learners cannot access MAINTENANCE content. | KSS-DB-XXX |

---

## [HIGH] Analytics — KSS-SA-031 (new ticket — not yet built)

| # | Issue | Detail | Requires |
|---|-------|--------|---------|
| ANA-001 | Per-question timing data missing | `attempt_answers` needs `time_spent_seconds` column to power panic/guess detection. | KSS-DB-XXX |
| ANA-002 | `assessment_question_map.section_name` is fragile for analytics | Text match can break if section renamed. Future: migrate to `section_id` UUID referencing assessment_config.sections[].id at "Make Live" time. | KSS-DB-XXX |
| ANA-003 | Section-level results table needed | `attempt_section_results (id, attempt_id, section_id, section_name, correct_count, incorrect_count, skipped_count, total_marks, scored_marks, time_spent_seconds)` — required for section breakdown in analytics. | KSS-DB-XXX |
| ANA-004 | Topic/concept mastery table needed | `user_concept_mastery (user_id, concept_tag, total_attempts, correct_count, last_attempted_at, mastery_pct)` — drives "Where to improve" and "Next steps" algorithm. | KSS-DB-XXX |
| ANA-005 | Analytics algorithm spec needed | Rules-based (no AI): panic detection (< threshold time + wrong), guess detection (answer changed in last 10s), weak concept identification, improvement velocity across attempts, next-steps ranking by (frequency x recency x severity). | Spec + KSS-DB-XXX |
| ANA-006 | End-user analytics dashboard not built | Post-attempt and historical: section breakdown, concept mastery heatmap, attempt comparison, panic/guess flags, "Focus on these topics next" recommendations. | After ANA-001–005 |

---

## [HIGH] Question Seeding — KSS-SA-032 (new ticket — not yet built)

| # | Issue | Detail | Requires |
|---|-------|--------|---------|
| QS-001 | Real questions needed for 4 full tests | NEET (180Q), CLAT (~120–150Q), JEE (90Q), SAT (98Q) — all unique per full test. Subject/chapter tests can reuse. Questions must have concept_tag, explanation, marks. | Separate ticket |
| QS-002 | Sources + chapters must be seeded before questions | sources (NEET BIO 12TH SYLLABUS, NEET PHYS, etc.), chapters within each source, then questions linked to source+chapter. | After QS-001 |
| QS-003 | assessment_question_map rows needed | After questions seeded: link questions to full test assessments with section_name. | After QS-001 + QS-002 |
| QS-004 | Subject and chapter tests need creating in assessments table | NEET Bio subject test, NEET Phy subject test, chapter tests per subject — reusing existing questions. | After QS-001 |
| QS-005 | Demo attempt data needed for analytics | Seed attempt rows + attempt_answers for demo users to demonstrate analytics algorithm. | After ANA-003 + QS-001 |

---

## [IN-PROGRESS] Sections Builder — KSS-SA-030 extension

| # | Issue | Detail |
|---|-------|--------|
| SEC-001 | Sections builder UI not yet built in linear form | FULL_TEST only. SA adds sections (name + questionCount + optional durationMinutes when SECTION_LOCKED). Saved to assessment_config.sections[]. |
| SEC-002 | navigation_policy SECTION_LOCKED validation | Cannot select SECTION_LOCKED if assessment has < 2 sections. Warn on save. |
| SEC-003 | total_questions auto-sum from sections | When sections are defined, total_questions = sum of section questionCounts. SA should not enter it manually. |
| SEC-004 | total_marks auto-sum from sections | total_marks = sum of (section.questionCount x section.marksPerQuestion). Needs marksPerQuestion per section. |

---

## [IN-PROGRESS] Tiptap Rich Text — Exam Player Rendering (separate ticket from SA form wiring)

| # | Issue | Detail | Requires |
|---|-------|--------|---------|
| TIPTAP-001 | Exam player must render Tiptap JSONB question_text | After KSS-DB-018/019 migrate question_text/explanation/passage_text to JSONB, the exam player (useExamEngine + LinearExamPlayer) currently renders question_text as a plain string — will show raw JSON to students. Must add read-only Tiptap renderer to all question type renderers in the player. | Separate ticket — being handled in parallel instance |
| TIPTAP-002 | Option text JSONB rendering in exam player | options[].text is now Tiptap JSON doc. Exam player option renderer must use read-only Tiptap instance for each option. | Same ticket as TIPTAP-001 |

---

## [DEBT] Type / Code Debt

| # | Issue | Detail | File |
|---|-------|--------|------|
| TODO-008 | `SyllabusSection` type deprecated | After KSS-SA-030, unused. Remove in cleanup. | `src/types/index.ts` |
| TODO-009 | `mockSyllabus` unused after KSS-SA-030 | Remove in cleanup. | `src/data/assessments.ts` |
| TODO-010 | `navigation_policy` vs sections validation | SECTION_LOCKED advisory only until sections builder ships. | `linear/page.tsx` |

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

---

## [DONE] Completed / Resolved

| # | Issue | Resolution |
|---|-------|------------|
| ~~TODO-004~~ | Rename content_items → assessment_items | KSS-DB-001 applied Apr 11 2026 |
| ~~TODO-005~~ | Unified questions table + sources + chapters | KSS-DB-009/010/011/012 applied Apr 11 2026 |
| ~~TODO-007~~ | assessment_config needs marks fields | assessment_config JSONB with sections[] added KSS-DB-017 |
| ~~TODO-012~~ | Slug vs UUID routing decision | Path C implemented: UUID lookup on assessment_items first, slug fallback on assessments |

---

## [DECISION NEEDED] UX / Product Decisions

| # | Issue | Detail |
|---|-------|--------|
| TODO-011 | SECTION_LOCKED + sections count validation | Confirm: block save or just warn? |
| TODO-013 | Empty what_youll_get fallback | If display_config.what_youll_get is empty, learner sees nothing. Platform-default bullets needed? |
