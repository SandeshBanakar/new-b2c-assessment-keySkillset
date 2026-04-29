# TODO Backlog — keySkillset Platform
# Last updated: Apr 30 2026 — KSS-B2B-CAD-001 COMPLETE. Email template QA structure fixed, B2B learner deactivated login + email built. Build ✅ PASSED. All prior complete items moved to CLAUDE-HISTORY.md.

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
