# CLAUDE.md — keySkillset Platform
# Version: 6.7 | Updated: March 25, 2026
# READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE.
# Single source of truth. Maintained by Claude Code sessions — never edit manually.

---

## 1. WHAT THIS CODEBASE IS

Demo app on Vercel + Supabase. Purpose: requirements communication to production engineering team.
Every UI decision and schema choice becomes a specification. Precision is mandatory.

---

## 2. STACK (locked)

Framework:  Next.js 16.1.6 (Turbopack), TypeScript, Tailwind CSS
Deployment: Vercel (auto-deploy on main push)
Database:   Supabase — project ID: uqweguyeaqkbxgtpkhez
            MCP: mcp__claude_ai_Supabase__execute_sql (project_id: uqweguyeaqkbxgtpkhez)
            ALL schema changes via execute_sql — never apply_migration
Repo:       github.com/SandeshBanakar/new-b2c-assessment-keySkillset
Docs ref:   Context7 — https://context7.com/ (use before any library-specific implementation)

---

## 3. DESIGN SYSTEM (enforced)

Primary: blue-700/hover:blue-800 | Destructive: rose-600/hover:rose-700
Background: zinc-50 | Surface: white | Text: zinc-900/zinc-600/zinc-400
Border: zinc-200 | Radius: rounded-md | Weight: font-medium/font-semibold (NEVER font-bold)
Icons: lucide-react ONLY | Colors: Tailwind tokens ONLY — zero custom hex, zero inline styles
Deviation: add comment // DESIGN DEVIATION: [token] — [rationale]

---

## 4. DATABASE RULES (locked — never override)

- RLS OFF on ALL Super Admin tables — permanently. Never add RLS.
- RLS OFF on: users, assessments, attempts
- Never modify schema without KSS-DB-XXX prompt authorised in Claude.ai project chat first

### tenants
id, name, type, feature_toggle_mode, licensed_categories (ARRAY), stripe_customer_id,
is_active, created_at, contact_name, contact_email, contact_phone,
timezone (DEFAULT 'Asia/Kolkata'), date_format (DEFAULT 'DD/MM/YYYY'),
address_line1, address_line2, city, state, country, zip_code,
logo_url (text nullable) — Storage bucket: tenant-logo (public), {tenant_id}.jpg, 500KB PNG/JPG max
feature_toggle_mode: FULL_CREATOR (CC access + own DB) | RUN_ONLY (CA only, hides Storage & Hosting)

### admin_users
id (uuid), email, name, role, tenant_id (uuid), is_active (boolean), created_at,
password_hash (text nullable — demo only)
Valid roles V1: SUPER_ADMIN | CLIENT_ADMIN | CONTENT_CREATOR
TEAM_MANAGER deferred to V2 — never add to V1 code.
Master Org CCs: tenant_id IS NULL. B2B CCs: tenant_id = B2B tenant UUID.

### users (B2C)
id, email, display_name, subscription_tier ('free'|'basic'|'professional'|'premium'),
subscription_status, subscription_start_date, subscription_end_date,
stripe_subscription_id, status ('ACTIVE'|'SUSPENDED'),
last_active_date, user_onboarded, selected_exams, goal, xp, streak, role,
free_attempt_used, organization_id, created_at, updated_at
INACTIVE = UI-computed: status='ACTIVE' AND last_active_date > 30 days (never stored in DB)

Demo B2C UUIDs (locked):
  Free: 9a3b56a5-31f6-4a58-81fa-66157c68d4f0 | Basic: a0c16137-7fd5-44f5-96e6-60e4617d9230
  Pro:  e150d59c-13c1-4db3-b6d7-4f30c29178e9 (Priya Sharma) | Premium: 191c894d-b532-4fa8-b1fe-746e5cdcdcc8
16 demo users: 5 Free, 4 Basic, 3 Pro, 4 Premium. 1 Suspended (Meera Krishnan), 3 Inactive.

### attempts
passed (boolean nullable): true/false = chapter/subject-test (>=60%) | null = full-test/CLAT
Accuracy: correct/(correct+incorrect)*100 (excludes skipped). Avg time: time_spent/total_questions.

### courses
id, title, description, course_type, status (LIVE/INACTIVE/DRAFT/ARCHIVED), source,
tenant_id, created_by, created_at, updated_at,
audience_type (B2C_ONLY/B2B_ONLY/BOTH nullable), price (INR nullable),
price_usd (numeric nullable — actual dollars e.g. 29.99), currency (DEFAULT 'INR'),
is_individually_purchasable (boolean DEFAULT false), stripe_price_id, last_modified_by (uuid nullable)
9 courses: 1 B2C LIVE (HIPAA), 7 B2B LIVE, 1 INACTIVE (CLAT)

### content_items
id, title, exam_category_id (FK→exam_categories), test_type, source,
status (DRAFT/INACTIVE/LIVE/ARCHIVED), audience_type (nullable until LIVE),
visibility_scope ('GLOBAL'|'TENANT_PRIVATE'|'PENDING_PROMOTION' DEFAULT 'GLOBAL'),
tenant_scope_id (uuid nullable — IMPORTANT: NOT tenant_id), created_by (never changes),
last_modified_by (uuid nullable), created_at, updated_at
NO description column. tenant_scope_id IS NULL = GLOBAL. NOT NULL = TENANT_PRIVATE.

### plans
plan_type, tier (BASIC|PRO|PREMIUM|ENTERPRISE), plan_audience ('B2C'|'B2B'),
plan_category ('ASSESSMENT'|'COURSE_BUNDLE'|'SINGLE_COURSE_PLAN' DEFAULT 'ASSESSMENT'),
scope ('PLATFORM_WIDE'|'CATEGORY_BUNDLE'), price (INR DEFAULT 0),
price_usd (numeric — actual dollars), status (DRAFT|PUBLISHED|ARCHIVED),
display_name, tagline, feature_bullets (jsonb DEFAULT '[]'), footnote,
is_popular (boolean DEFAULT false), cta_label, max_attempts_per_assessment
B2B plans: price=0 always, scope=PLATFORM_WIDE always. No display_name/tagline/feature_bullets/cta_label.
B2C tiers: BASIC/PRO/PREMIUM. B2B tier: ENTERPRISE.
9 plans: 6 B2C + 3 B2B (Akash Standard, TechCorp Premium, Enterprise Pro — all PLATFORM_WIDE/PUBLISHED)

### plan_content_map
content_id (polymorphic — no FK), content_type (ASSESSMENT|COURSE), plan_id
ASSESSMENT rows → content_items.id | COURSE rows → courses.id

### plan_subscribers
id, plan_id, subscriber_count (seeded static), updated_at
MRR = plan.price × subscriber_count (computed, never stored). Active = Math.round(count * 0.8).
B2C plans only. B2B: price=0, billing via contract.

### tenant_plan_map
id, tenant_id (FK→tenants), plan_id (FK→plans), created_at. RLS: OFF.
Akash Standard→Akash | TechCorp Premium→TechCorp | Enterprise Pro→both tenants

### contracts
seat_count, arr, start_date, end_date, stripe_subscription_id, notes, updated_at,
content_creator_seats (DEFAULT 0 — visible ONLY when feature_toggle_mode='FULL_CREATOR')

### b2c_course_progress
id, user_id, course_id, status (IN_PROGRESS|COMPLETED), progress_pct (0-100), started_at, completed_at. RLS: OFF.

### course_modules / course_topics
course_modules: id, course_id (FK), title, order_index, created_at — 5 seeded for HIPAA
course_topics: id, module_id (FK), title, order_index, created_at — 3/module (15 total for HIPAA)

### b2c_module_progress
id, user_id, module_id (FK), topic_id (nullable FK), progress_pct (int),
status (COMPLETED|IN_PROGRESS|NOT_STARTED), updated_at
UNIQUE (user_id, module_id, topic_id). Module-level rows: topic_id IS NULL.

### learners
id, tenant_id, full_name, email, phone, department_id, team_id,
status (ACTIVE|INACTIVE), employee_roll_number, notes, created_by, created_at, last_active_at

### departments
id, tenant_id, name, description, team_manager_id, status (ACTIVE|INACTIVE), created_at

### teams
id, department_id (FK), tenant_id, name, status (ACTIVE|INACTIVE), created_at

### learner_attempts (B2B only — separate from B2C attempts table)
id, learner_id (FK), content_id, content_type (ASSESSMENT|COURSE), tenant_id (FK),
score_pct (numeric 5,2), passed (boolean), attempted_at, time_taken_seconds
Pass: ASSESSMENT >=60% | COURSE = 100%.

### CA Tables (V1 — KSS-DB-CA-001)
learner_profiles — learner_id+tenant_id FK, employee_roll_number, notes
content_assignments — tenant_id, content_id (polymorphic), content_type, target_type (DEPARTMENT|TEAM|INDIVIDUAL), target_id, assigned_by, removed_at
learner_content_access — learner_id, content_id, content_type, tenant_id, source_assignment_id, granted_at, revoked_at
certificates — learner_id, content_id, content_type='COURSE', tenant_id, learner_name, content_title, tenant_name, certificate_number (KSS-{short}-{YYYYMMDD}-{seq}), issued_at
client_audit_log — tenant_id, actor_id, actor_name, actor_role (CLIENT_ADMIN|CONTENT_CREATOR), action, entity_type, entity_id, before_state (jsonb), after_state (jsonb), ip_address, created_at

### licensed_categories — METADATA ONLY
Informational on tenants + contracts. Never use to gate content. Access via Plans only.

### Tenant IDs (locked)
Akash Institute Delhi: ec1bc005-e76d-4208-ab0f-abe0d316e260 (FULL_CREATOR)
TechCorp India:        7caa0566-e31a-41b6-962d-30fb3d6cb011 (RUN_ONLY)

---

## 5. CONTENT LIFECYCLE (locked)

DRAFT → creator saves, not visible to SA.
INACTIVE → creator submits, SA reviews, not visible to learners.
LIVE → SA promotes with audience selection, visible via plan membership.
ARCHIVED → soft removed, read-only, history retained.

audience_type set by SA at Make Live step only — nullable on DRAFT/INACTIVE. Never by creator.
B2C plans: B2C_ONLY or BOTH content only. B2B plans: B2B_ONLY or BOTH content only.
Reclassification: inline preview (Stays in / Removed from) → confirm modal auto-removes incompatible plan rows.

---

## 6. PLATFORM HIERARCHY (locked — V1)

Super Admin → Content Creator (tenant_id=NULL, Master Org)
Client Admin (one per tenant) → Content Creator (FULL_CREATOR only, tenant_id=B2B tenant)
  /content-creator/[tenant]/ — FUTURE SCOPE, NOT BUILT. Coming Soon placeholder only.
B2C Student / Professional (direct)
Team Manager: DEFERRED TO V2. Never add to V1 code or UI.

---

## 7. GIT RULES

Branch before all work: feat/KSS-[TRACK]-[NNN] or fix/KSS-[TRACK]-[NNN]
Tracks: SA | CA | B2C | FIX | DB | PERF | UX. Never commit directly to main.

---

## 8. TENANT DETAIL PAGE — 6 TABS (locked)

Tab order: Overview | Plans | Users & Roles | Learners | Contract | Audit History
CONTENT TAB REMOVED PERMANENTLY — never re-add, never import ContentTab.tsx.

Overview tab: Quick Actions bar INSIDE Overview tab only (above two-card row) — Edit Details | Deactivate/Reactivate. REMOVED: Duplicate Tenant. Left card: Tenant Name, Type, Feature Mode, Status, Created, Client Admin. Right card: Seat Usage bar (blue-700 <90%, amber-500 ≥90%, rose-600 100%). Below: Contact/Address (read-only, "—" for nulls).

Edit Details SlideOver: 3 sections — (1) Tenant Setup: name, feature mode, logo drag-drop (500KB PNG/JPG → tenant-logo bucket/{tenant_id}.jpg); (2) Address & Locale: address fields, country combobox, IANA timezone combobox, date format dropdown; (3) Client Profile: contact fields + inline CA assignment. Unsaved changes guard. On save: logo upload/removal → UPDATE tenants → audit TENANT_UPDATED.

Plans tab (PlansTab.tsx): Docebo accordion. Assign Plan → AssignPlanSlideOver (B2B plans not yet assigned). Each plan row expands to Assessments (Title|Category|Type|Status) + Courses (Title|Type|Status). Duplicate badge ⚠ In N plans → ContentPlanUsageModal. Content removal via Plan detail page only. Data: tenant_plan_map → plans → plan_content_map → content_items/courses.

Learners tab: Archive (reversible, seat decremented, audit LEARNER_ARCHIVED) vs Hard Delete (GDPR two-step, tombstone row [Deleted User], irreversible). Kebab menu per row. No bulk actions V1.

Contract tab: Read-only default + Edit button. Section 1: Learner Seats, ARR (Math.max(0,Number||0)), Start/End Date, Stripe ID, Notes; Creator Seats ONLY for FULL_CREATOR. Section 2: Payment Overview (static mock). Section 3: Storage & Hosting — HIDDEN for RUN_ONLY (show note), mock values for FULL_CREATOR.

---

## 9. EXAM ENGINE — LOCKED BEHAVIOURS

NEVER modify without explicit "Override locked behaviour" instruction.

5 question states: not_visited | answered | marked_for_review | visited_unanswered | answered_and_marked
Previous: navigates only, no save. Disabled on Q1 Section 1 only.
Mark for Review: one-directional. Unmark only via Save & Next. Timer: never pauses. Auto-submits at 00:00:00.
Types: MCQ_SINGLE ✅ | MCQ_MULTI (FIX-027) | PASSAGE_SINGLE ✅ | PASSAGE_MULTI ✅ | NUMERIC (FIX-027)

---

## 10. KEY FILES

src/app/super-admin/tenants/[id]/page.tsx — 6-tab tenant detail (no Content tab, no Duplicate)
src/components/tenant-detail/EditDetailsSlideOver.tsx — Edit slide-over, exports TenantRow
src/components/tenant-detail/PlansTab.tsx — B2B plan accordion
src/components/tenant-detail/AssignPlanSlideOver.tsx — Assign B2B plan to tenant
src/components/tenant-detail/ContentTab.tsx — OBSOLETE. Do not import.
src/app/super-admin/plans/[id]/page.tsx — Plan detail (audience gate in AddContentSlideOver)
src/components/plans/AddContentSlideOver.tsx — audience_type gate by plan.plan_audience
src/components/plans/PlanContentTab.tsx — multi-tenant callout, audience badges
src/components/plans/ContentPlanUsageModal.tsx — ⚠ In N plans modal
src/components/plans/EditPlanSlideOver.tsx — B2C/B2B/Bundle routing by plan_category; SingleCoursePlanEditSlideOver
src/app/super-admin/plans-pricing/page.tsx — 4-tab: Assessment | Single Course | Bundle | B2B
src/app/super-admin/plans-pricing/new/page.tsx — Create forms (?audience=B2C|B2B, ?category=SINGLE_COURSE_PLAN|COURSE_BUNDLE)
src/lib/supabase/plans.ts — fetchPlans, createPlan, updatePlan, fetchB2BPlansForGrid, fetchCourseBundlePlans,
  fetchSingleCoursePlans, createSingleCoursePlan, updateSingleCoursePlan, syncCourseFromPlan, fetchPlansContainingContent
src/lib/supabase/content-creators.ts | src/lib/supabase/b2c-users.ts | src/lib/supabase/content-bank.ts
src/app/super-admin/content-creators/page.tsx + /[id]/page.tsx
src/app/super-admin/b2c-users/page.tsx + /[id]/page.tsx
src/app/super-admin/dashboard/page.tsx — 3-tab analytics (Platform Health | Revenue | Client Admins)
src/app/assessments/[id]/exam/page.tsx — LinearExamPlayer
src/hooks/useExamEngine.ts — state machine, timer, localStorage
src/data/demoUsers.ts | src/data/assessments.ts | src/lib/supabase/client.ts

---

## 11. SIDEBAR NAV (locked v4.0, March 25, 2026)

(none)               Dashboard             ✅ built (analytics merged here)
Content Management   Content Bank          ✅ built
Content Management   Plans & Pricing       ✅ built
Master Org           B2C Users             ✅ built
Master Org           Content Creators      ✅ built
Organisations        Tenants               ✅ built
Course Creation      Create Course         🟡 pending (/super-admin/create-course)
Assessment Creation  Sources & Questions   Coming Soon
Assessment Creation  Question Bank         Coming Soon
Assessment Creation  Create Assessments    Coming Soon
Assessment Creation  Bulk Upload           Coming Soon
Configuration        Marketing Config      Coming Soon
Compliance           Audit Log             Coming Soon

REMOVED PERMANENTLY: Analytics nav item (merged to Dashboard) | Course Store
Nav group order: Content Management → Master Organisation → Organisations → Course Creation → Assessment Creation → Configuration → Compliance

---

## 12. PERSONA SELECTOR (locked)

Admin (rounded-md): Super Admin (/super-admin, blue-700) | Akash (/client-admin/akash, violet-700) | TechCorp (/client-admin/techcorp, teal-700)
Content Creator (rounded-md): Akash CC (/content-creator/akash, amber-700, "Coming Soon") — TechCorp is RUN_ONLY, no CC persona
Learner (rounded-full): Free | Basic | Pro | Premium
No Team Manager persona — permanently removed from V1.

---

## 13. CURRENT BUILD QUEUE

Completed: All KSS-SA-004 through KSS-SA-017, KSS-SA-008/009/010, KSS-DB-CA-001, KSS-CA-001 through KSS-CA-006, KSS-CA-008, all BUG-SA and FIX-SA items — DONE.

Pending:
🟡 KSS-SA-005   Audit Log (SA)
🟡 KSS-SA-007   Marketing Config
🟡 KSS-CA-007   CA Dashboard — active learner count, seat bar, dept/team counts, catalog items, quick links
🟡 KSS-CA-009   Audit Log (CA) — build after all CA pages write audit entries
🔵 KSS-CA-FUTURE-001  /content-creator/[tenant]/ — FUTURE SCOPE (not scoped)

B2C pending:
🔴 KSS-B2C-FIX-023  Back button + ChevronLeft on instructions page
🔴 KSS-B2C-FIX-024  Previous cross-section NTA navigation
🔴 KSS-B2C-FIX-025-FINAL  Exam engine state machine
🔴 KSS-B2C-FIX-026  Mobile hard block modal (< 768px)
🔴 KSS-B2C-FIX-027  MCQ_MULTI + NUMERIC renderers
🔴 KSS-B2C-FIX-028  Draggable on-screen calculator

---

## 14. OPEN BUGS

BUG-001  Analytics tab empty after results redirect — deferred
BUG-002  Upgrade banner not showing after free attempt — deferred (DB-003 revisit)

---

## 15. OPEN DECISIONS (do not resolve without product owner confirmation)

1. B2C questions table vs SA content_items — merge or keep separate. Static files currently.
2. licensed_categories sync between tenants + contracts — currently not synced. Single source TBD.
3. Course à la carte + plan subscription coexistence post-unsubscribe. V1: mutually exclusive gate.

---

## 16. PRD CONFLUENCE LINKS

Base: https://keyskillset-product-management.atlassian.net/wiki/spaces/EKSS/pages/
SA Master PRD: 91226113 | SA Sub-PRD 1 Nav: 98664450 | SA Sub-PRD 2 Content: 93421571
SA Sub-PRD 3 Tenant/RBAC: 93913089 | SA Sub-PRD 4 Plans: 93093890 | SA Sub-PRD 5 Marketing: 93323269 | SA Sub-PRD 6 Analytics: 94928898
CA Master PRD: 93552656 | CA Sub-PRD 1 Org/RBAC: 95420418 | CA Sub-PRD 2 Learners: 96272385
CA Sub-PRD 3 Content: 96862209 | CA Sub-PRD 4 Reports: 97452044

---

## 17. DEVELOPMENT WORKFLOW

### Starting work
1. Read CLAUDE.md fully. Read relevant files. Branch feat/KSS-[TRACK]-[NNN] or fix/KSS-[TRACK]-[NNN].
2. Schema change: write SQL with IF NOT EXISTS → show user → wait approval → run via execute_sql → verify → update CLAUDE.md → npm run build.
3. Data-only fix: run directly after confirming intent. No approval gate.

### Code Editing
Read before editing. Minimal targeted changes. No unused imports. No commented-out code. npm run build must pass before committing.

### Git Commit
git status + diff. Stage specific files (not -A). Imperative commit message + prompt ID. Co-authored-by: Claude Sonnet 4.6. Never commit to main.

### PRD Update
Use MCP Atlassian updateConfluencePage after all code committed and build passes. Update version, date, changed sections only.

---

## 18. SELF-CRITIQUE CHECKLIST (run at every decision AND before every commit)

[ ] Tailwind tokens only — no custom hex, no inline styles
[ ] Correct git branch format (feat/ or fix/)
[ ] No RLS added to any Super Admin table
[ ] No schema changes without authorised KSS-DB-XXX prompt
[ ] Works for all 4 demo user tiers (Free/Basic/Pro/Premium)
[ ] Quick Actions bar ONLY inside Overview tab block — never in page header
[ ] No Duplicate Tenant action anywhere in any file
[ ] licensed_categories never gates content in any query
[ ] Locked exam engine behaviours untouched
[ ] Build passes: npm run build ✓ Compiled successfully
[ ] No unused imports
[ ] Tenant detail page has exactly 6 tabs — no Content tab
[ ] No Team Manager role anywhere in V1 code
[ ] No Course Store anywhere in nav or code
[ ] audience_type gate enforced in plan content pickers
[ ] plan_audience used to determine B2C vs B2B plan identity
[ ] Storage & Hosting hidden for RUN_ONLY (feature_toggle_mode check)
[ ] All B2B plans are PLATFORM_WIDE — never CATEGORY_BUNDLE
[ ] B2B plan price never shown in UI — always "Via tenant contract"
[ ] Feature bullets: JSONB, max 7, 80 chars each (B2C plans only)
[ ] display_name used for customer-facing plan names
[ ] Course pricing fields are SA-editable only (not content creators)
[ ] Free tier is NOT a plan record — default unsubscribed state only
[ ] Create B2C Plan form creates assessment subscription plans ONLY
[ ] Create B2B Plan form: name + description + max_attempts (default 10) ONLY
[ ] B2B plans have NO display_name, tagline, feature_bullets, is_popular, cta_label
[ ] B2B plans grant ALL assessment types — no allowed_assessment_types filter
[ ] B2B max_attempts default = 10, editable in form and plan detail Overview tab
[ ] is_individually_purchasable managed ONLY via SINGLE_COURSE_PLAN plan lifecycle — no manual toggle
[ ] is_individually_purchasable courses EXCLUDED from B2C subscription plan pickers
[ ] SingleCoursePlanEditSlideOver used for Edit in Plan Records table
[ ] On SINGLE_COURSE_PLAN PUBLISHED: sync price+price_usd+stripe_price_id to course + purchasable=true
[ ] On SINGLE_COURSE_PLAN ARCHIVED: set is_individually_purchasable=false on course (prices kept)
[ ] Purchasable courses ALLOWED in course bundles (CP-Q1e=B) — no gate for bundles
[ ] Purchasable courses greyed out in AddContentSlideOver with tooltip
[ ] price_usd (numeric, actual dollars) everywhere — never price_usd_cents
[ ] MRR strip inside Tab 1 only — not in page header or Tab 2/3
[ ] Tab 2 Plan Records: Plan Name | Course Name | Price (USD) | Status | Actions (View + Edit)
[ ] plan_category = 'COURSE_BUNDLE' for bundle plans (not 'ASSESSMENT')
[ ] Course bundle plans: B2C only, platform-wide, annual, no tier, no is_popular/cta_label
[ ] derivePlanType() uses plan.scope column — never plan.name
[ ] CourseBundleEditForm shown for plan_category === 'COURSE_BUNDLE' in EditPlanSlideOver
[ ] Contract tab: read-only by default — Edit button unlocks editing
[ ] "Learner Seats" label everywhere in Contract tab (NOT "Seat Count")
[ ] Creator Seats visible ONLY when feature_toggle_mode === 'FULL_CREATOR'
[ ] Global Toast via useToast() from @/components/ui/Toast — no local toast state in pages
[ ] SA sidebar: "B2C Users" under "Master Organisation" nav group
[ ] "Client Admin" used in SA tenants pages + nav (display/UI only — not in DB)
[ ] B2C User Profile: no 4 info cards in Assessment section — stats shown inline
[ ] Course row in B2C profile: inline accordion showing modules + topics + progress %
[ ] Module progress uses b2c_module_progress (progress_pct int, status text) — NOT completed/completed_at
[ ] B2C Create Plan form Section 6: Assessment picker (LIVE B2C assessments, additive only)
[ ] EditPlanSlideOver B2CEditForm Section 6: Add Assessments (additive only)
[ ] Tenant logo: drag-drop in CreateTenantSlideOver + EditDetailsSlideOver Section 1; shown on Overview tab
[ ] CA sidebar: logo replaces initials when logo_url present; fallback = initials badge
[ ] last_modified_by updated on every save to content_items + courses (uuid of editor)
[ ] created_by never changes — always original author
[ ] content_items column is tenant_scope_id (NOT tenant_id) — column name critical
[ ] Plans & Pricing subtitle: "Manage B2C and B2B subscription plans and content entitlements"
[ ] No global Create Plan button in page header — tab-scoped buttons only
[ ] Assessment Plans tab: card grid (not swimlane); count badge → PlanAssessmentsSlideOver (read-only)
[ ] Content Creators page: /super-admin/content-creators — list + detail + create/edit + deactivate
[ ] /super-admin/analytics permanently redirects to /super-admin/dashboard
[ ] Learner removal: Archive (reversible, LEARNER_ARCHIVED) vs Hard Delete (GDPR two-step, tombstone)
[ ] Plans contain both assessments AND courses via plan_content_map (content_type discriminator)
[ ] plan_content_map.content_id is polymorphic — no FK. content_items for ASSESSMENT, courses for COURSE
[ ] Content plan_content_map uses content_items (NOT assessments table) for ASSESSMENT rows
[ ] B2B plans assignable to multiple tenants simultaneously (global shared plans)
[ ] PENDING_PROMOTION = V2, not built — never add this workflow in V1
[ ] Audience reclassification: inline preview (Stays in / Removed from) → confirm → auto-removes incompatible
[ ] SA Content Bank shows GLOBAL content only — never TENANT_PRIVATE
[ ] CA Content Bank: FULL_CREATOR only (RUN_ONLY redirected to Global Catalog)
[ ] CA Global Catalog: "keySkillset Content" badge on ALL GLOBAL rows always; "Your Organisation" on TENANT_PRIVATE
[ ] CA dept deactivation cascade: deactivates child teams + nullifies learner dept/team assignments
[ ] Content assignment dynamic membership: future learners added to DEPARTMENT/TEAM auto-inherit access
[ ] licensed_categories is metadata only — never used to gate content assignment
[ ] Duplicate Tenant REMOVED PERMANENTLY — never reference or add back

---

## 19. CONTENT BANK SPEC (KSS-SA-009 — built)

Unified table: content_items (assessments) + courses. Default: INACTIVE filter, newest first.
Columns: Title | Type | Category | Status | Audience | Created By | Date | Plan Count
Filters: Status | Content Type | Audience | Category | Source
Row actions: INACTIVE → Make Live + Archive | LIVE → Reclassify + Archive | ARCHIVED → read-only
Make Live modal (single-step): metadata summary + audience radio (B2C_ONLY|B2B_ONLY|BOTH) + plan impact preview. No wizard.
Reclassify modal: Stays in / Removed from preview → auto-removes from incompatible plans on confirm.
Bulk Make Live: only if all selected items share same audience classification.
SA Content Bank shows GLOBAL content only — never TENANT_PRIVATE.

---

## 20. PLANS & PRICING SPEC (KSS-SA-004 — built)

Route: /super-admin/plans-pricing | No global Create button — tab-scoped only.
Subtitle: "Manage B2C and B2B subscription plans and content entitlements"

Tab 1 — Assessment Plans: Card grid, two sections: Platform Plans (PLATFORM_WIDE B2C) + Category Plans (CATEGORY_BUNDLE B2C). Each card: Plan Name | Tier badge | Assessment count badge (→ PlanAssessmentsSlideOver read-only) | Subscriber Count | Status | 3-dot Edit. Tier colours: BASIC=zinc-100/zinc-600, PRO=blue-50/blue-700, PREMIUM=amber-50/amber-700, ENTERPRISE=violet-50/violet-700. MRR strip inside Tab 1 only.

Tab 2 — Single Course Plan: Plan Records table (Plan Name | Course Name | Price USD | Status | Actions: View + Edit). Edit → SingleCoursePlanEditSlideOver (name, display_name, ₹+USD price, Stripe ID, status). PUBLISHED syncs course record + purchasable=true. ARCHIVED sets purchasable=false.

Tab 3 — Course Bundle Plans: Table (Plan Name | Display Name | Price ₹/year | Courses | Status | View). B2C only, PLATFORM_WIDE, annual, no tier, no is_popular/cta_label. Create button top-right only — NOT in empty state.

Tab 4 — B2B Plans: Card grid. No price shown. "B2B plan pricing managed per-tenant via Contract tab." Create B2B Plan button in info strip.

Create B2C Plan (?audience=B2C): Identity (name, display_name, tagline, is_popular, cta_label) | Scope | Pricing ₹/month | Access Rules (allowed_assessment_types, max_attempts) | Feature Bullets+Footnote | Section 6: Assessment picker (additive only).
Create B2B Plan (?audience=B2B): name + description + max_attempts only. Scope/Pricing read-only callouts.
Create Single Course Plan (?category=SINGLE_COURSE_PLAN): Identity | Course picker (LIVE B2C) | Pricing (₹ + USD + Stripe ID).
Create Bundle Plan (?category=COURSE_BUNDLE): Identity | Pricing | Feature Bullets | Course picker (B2C LIVE — purchasable courses show "Also sold individually" note, not blocked).

Feature Bullets (B2C only): dynamic list, start 3 inputs, max 7, 80 chars each. GripVertical icon per row. Stored as JSONB.

---

## 21. CLIENT ADMIN PLATFORM (V1 — locked)

Routes: /client-admin/[tenant]/ | /org | /learners | /catalog | /content-bank (FULL_CREATOR only) | /reports | /users-roles
Tenant slugs: akash → ec1bc005-... (FULL_CREATOR) | techcorp → 7caa0566-... (RUN_ONLY)
Auth: persona-selector demo, no JWT. tenant_id injected from URL slug.

CA Sidebar: Dashboard | Organisation (Depts+Teams) | Learners | Global Catalog | Content Bank (FULL_CREATOR only) | Reports | Users & Roles | Audit Log (placeholder)

Content model: tenant_scope_id=NULL → GLOBAL (SA content) | NOT NULL → TENANT_PRIVATE (tenant content)
CA Catalog: FULL_CREATOR = GLOBAL from assigned plans + TENANT_PRIVATE LIVE | RUN_ONLY = GLOBAL from assigned plans only
CA Content Bank: TENANT_PRIVATE items only (INACTIVE/LIVE/ARCHIVED). Make Live keeps visibility_scope=TENANT_PRIVATE. No audience_type.
Source badges (locked CC2): "keySkillset Content" (zinc) on ALL GLOBAL rows always | "Your Organisation" (amber) on TENANT_PRIVATE rows.

Content assignment: targets DEPARTMENT|TEAM|INDIVIDUAL. Dynamic membership — future learners auto-inherit.
Dept deactivation cascade: child teams → INACTIVE, learner dept/team assignments → NULL. Learners stay in platform.
Certificates: course completion only (V1). Format: KSS-{short}-{YYYYMMDD}-{seq}.
Reports V1: R3 Per-Learner Scores | R5 Content Performance | R6 Certificates | R7 Learner Activity. Per-tab CSV export.

Users & Roles page: Section 1 — My Profile (name editable inline, email read-only, role read-only). Section 2 — Content Creators (FULL_CREATOR only): Deactivate/Reactivate, Add CC (Name+Email+Password+Confirm), "Coming Soon" badge on interface.

V1 EXCLUDED (never add): Team Manager | Groups | Learning Paths | Assessment certs | R1/R2/R4 reports | PENDING_PROMOTION | /content-creator/[tenant]/

Known Spec Gaps (pending): Archive vs Deactivate for depts/teams | phone required on learner | password at creation | profile page vs slide-over.

---

## 22. SUBSCRIBER COUNT (demo)

plan_subscribers: id, plan_id, subscriber_count (seeded static), updated_at.
Active count = Math.round(subscriber_count * 0.8) — computed in UI, not stored.
MRR = plan.price × subscriber_count — computed, never stored.
Production phases (V1 AWS job + Stripe, V2 subscriptions table) — engineering team to implement. Not in demo.

---

## 23. CONTENT PLAN USAGE MODAL

Component: src/components/plans/ContentPlanUsageModal.tsx
Props: contentId, contentTitle, tenantId? (present=tenant-scoped, absent=platform-wide), onClose, onRemoved
Columns: Plan Name | Audience badge | Status badge | Remove (trash → inline confirm, no nested modals)
Auto-closes when < 2 plans remain. Used in: PlansTab (tenant-scoped) + PlanContentTab (platform-wide).

---

*CLAUDE.md — keySkillset v6.7 — Updated March 25, 2026*
*Source of truth for Claude Code sessions. PRD updates via Confluence MCP tools.*
*Do not edit manually.*
