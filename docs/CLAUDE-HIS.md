# CLAUDE-HISTORY.md — Changelog, Completed Work & References
# NOT loaded every session. Read only when: debugging unexpected behaviour,
# asked "what changed", or verifying whether something was already built.

---

## COMPLETED WORK LOG

### April 4, 2026 — KSS-SA-018 Invite User smart update shipped
- SA tenant detail → Users & Roles: Invite User slideover always opens (never disabled)
- Inline rose error shown on submit if active Client Admin already exists:
  "An active Client Admin already exists. Remove the current one before inviting a new one."
- Applies to both FULL_CREATOR and RUN_ONLY tenants

### April 2, 2026 — All B2C exam engine fixes shipped
- KSS-B2C-FIX-023: Back button + ChevronLeft on instructions page
- KSS-B2C-FIX-024: Previous cross-section NTA navigation
- KSS-B2C-FIX-025-FINAL: Exam engine state machine (final resolution)
- KSS-B2C-FIX-026: Mobile hard block modal (< 768px)
- KSS-B2C-FIX-027: MCQ_MULTI + NUMERIC question type renderers
- KSS-B2C-FIX-028: Draggable on-screen calculator

### March 31, 2026 — B2C user profile unified redesign
- `max_attempts_per_assessment` updated to 6 (1 free + 5 paid) for all 8 B2C plans
- `b2c_certificates` table created. RLS OFF. 4 demo rows seeded (HIPAA completions).
  Format: `KSS-{shortCode}-{YYYYMMDD}-{seq}`
- B2C user profile page fully rebuilt into single "Subscriptions & Activity" section
  replacing three separate sections (SubscriptionsHistory, AssessmentPerformanceSection, CoursePerformanceSection)
- `AttemptHistorySlideOver` added (slide-over, page-level single instance)
- Pass/fail removed from SA B2C profile UI only — DB column and exam engine untouched
- `b2c-users.ts`: removed `fetchUserAttempts`, `computeAssessmentSummary`, `UserAttempt`, `AssessmentSummary`
  Added: `fetchPlanAssessments`, `fetchAssessmentAttempts`, `fetchFreeAccessAttempts`,
  `fetchPlanCoveredAssessmentIds`, `fetchB2CCertificate`
  `AssessmentSubscription` type now includes `maxAttempts`
- `recharts` installed (was in package.json but missing from node_modules)

### March 30, 2026 — B2C subscription tables + SA user list/profile upgrades
- DB: `b2c_assessment_subscriptions` table created (RLS OFF, 11 seeded rows)
- DB: `b2c_course_subscriptions` table created (RLS OFF, 11 seeded rows)
- Open Decision #3 resolved: assessment plan + course plan subscriptions coexist freely
- B2C user profile: Subscriptions History rewritten (2 sub-sections: Assessment Plan + Course Plans)
- B2C user profile: Course Performance paginated (10/page) + 'Free' badge
- B2C users list: client-side pagination (20/page), URL param state, Suspense wrapper

### March 27, 2026 — formatCourseType + SINGLE_COURSE_PLAN enforcement
- `formatCourseType()` utility added to `src/lib/utils.ts`, applied platform-wide (10 locations)
- SINGLE_COURSE_PLAN Content tab: Add Course button disabled with Tailwind tooltip when `courses.length >= 1`
- `AddContentSlideOver`: `singleSelect` prop added (radio buttons for SINGLE_COURSE_PLAN)
- DB: 6 course rows corrected from `DOCUMENT → VIDEO`

### March 25, 2026 — Minor upgrades
- Module status icons: CheckCircle2/CircleDot/Circle per COMPLETED/IN_PROGRESS/NOT_STARTED
- Course % recomputed from module averages (Option A — no DB change)
- Email immutable after creation on all edit surfaces
- Content Creators list: Actions column (View + Edit + Deactivate/Reactivate)
- Assessment Plans cards: 3-dot menu → Pencil icon Edit button in card footer
- PlanContentTab validation: ASSESSMENT plans hide Add Course; COURSE_BUNDLE plans hide Add Assessment
- `plan_category` type extended to include `'SINGLE_COURSE_PLAN'`
- Dashboard: Assessments tab added (4th tab) — 4 KPI cards + dual-series AreaChart + per-assessment table

### Previously completed
- KSS-SA-004 through KSS-SA-017
- KSS-SA-008 / 009 / 010
- KSS-DB-CA-001
- KSS-CA-001 through KSS-CA-006
- KSS-CA-008
- All BUG-SA and FIX-SA items

---

## RESOLVED DECISIONS

**#1 (April 4, 2026):** Unified questions table — MERGE decision.
One `questions` table shared across the platform. SA/Content Creators write. B2C + B2B read.
`content_items` renamed to `assessment_items` (not `assessments` — corrects DB-TODO-001).
Assessment Creation nav group (Sources & Questions, Question Bank, Create Assessments, Bulk Upload)
will all be built on this unified schema. Schema design pending KSS-DB-XXX authorisation.

**#2 (April 2, 2026):** `licensed_categories` on `tenants` + `contracts` is metadata only — informational display.
Never use it to gate content access. Access control is via Plans only. No sync mechanism needed.
Column stays on both tables independently. Single source of truth question is moot — it is never the authority.

**#3 (March 30, 2026):** Assessment plan + individual course plan subscriptions coexist freely.
A user may hold 1 assessment plan (PLATFORM_WIDE OR CATEGORY_BUNDLE — not both) AND N course plan
subscriptions simultaneously. Independent Stripe subscriptions. Cancelling one does not affect the other.
`subscription_tier` on users reflects assessment plan tier only.

---

## PHASE 2 ITEMS

Doc: https://keyskillset-product-management.atlassian.net/wiki/x/AYCeBg (Atlassian MCP — reconnect if 401)
Key Phase 2 item tracked here: KSS-SA-019 — contract mandatory on CA creation + CC seat enforcement per contract.

---

## CONFLUENCE LINKS

Base: https://keyskillset-product-management.atlassian.net/wiki/spaces/EKSS/pages/

| Document | Page ID |
|---|---|
| SA Master PRD | 91226113 |
| SA Sub-PRD 1 Nav | 98664450 |
| SA Sub-PRD 2 Content | 93421571 |
| SA Sub-PRD 3 Tenant/RBAC | 93913089 |
| SA Sub-PRD 4 Plans | 93093890 |
| SA Sub-PRD 5 Marketing | 93323269 |
| SA Sub-PRD 6 Analytics | 94928898 |
| CA Master PRD | 93552656 |
| CA Sub-PRD 1 Org/RBAC | 95420418 |
| CA Sub-PRD 2 Learners | 96272385 |
| CA Sub-PRD 3 Content | 96862209 |
| CA Sub-PRD 4 Reports | 97452044 |

---

## DEMO SEED REFERENCE

**B2C demo users (16 total):** 6 Free, 4 Basic, 3 Pro, 3 Premium. 1 Suspended (Meera Krishnan), 3 Inactive.

**Courses (9 total):**
- 1 B2C ARCHIVED: HIPAA Compliance Training (`425b71f4`, `is_individually_purchasable=true`, $12.99)
- 7 B2B LIVE
- 1 INACTIVE: CLAT

**Plans (9 total):** 6 B2C + 3 B2B (Akash Standard, TechCorp Premium, Enterprise Pro — all PLATFORM_WIDE/PUBLISHED)

**tenant_plan_map:**
- Akash Standard → Akash Institute
- TechCorp Premium → TechCorp India
- Enterprise Pro → both tenants

**b2c_certificates:** 4 demo rows seeded for HIPAA completions (Premium, Priya, Basic, Siddharth)