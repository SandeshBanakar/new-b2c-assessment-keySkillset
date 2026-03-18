# CLAUDE.md — keySkillset Platform
# Version: 3.0 | Updated: March 18, 2026
# READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE.
# This file is the single source of truth for Claude Code.
# It is maintained by Claude Code sessions — never edit manually.

---

## 1. WHAT THIS CODEBASE IS

A demo application deployed on Vercel + Supabase.
Purpose: requirements communication to the production engineering team.
Every UI decision and schema choice becomes a specification.
Precision is mandatory. Move fast — but never guess at locked decisions.

---

## 2. STACK (locked — do not modify)

Framework:   Next.js 16.1.6 (Turbopack), TypeScript, Tailwind CSS
Deployment:  Vercel (auto-deploy on main push)
Database:    Supabase — project ID: ugweguyeaqkbxgtpkhez
Repo:        github.com/SandeshBanakar/new-b2c-assessment-keySkillset
Editor:      Claude Code (VS Code)

---

## 3. DESIGN SYSTEM (enforced)

Primary:      blue-700 / hover:blue-800
Destructive:  rose-600 / hover:rose-700
Background:   zinc-50
Surface:      white
Text:         zinc-900 / zinc-600 / zinc-400
Border:       zinc-200
Radius:       rounded-md (default)
Weight:       font-medium / font-semibold (NEVER font-bold)
Icons:        lucide-react ONLY
Colors:       Tailwind tokens ONLY — zero custom hex, zero inline styles

Deviation rule: Deviate ONLY when UI is demonstrably better.
Always add a comment: // DESIGN DEVIATION: [token] — [rationale]

---

## 4. DATABASE RULES (locked — never override)

- RLS is OFF on ALL Super Admin tables — permanently. Never add RLS.
- RLS is OFF on: users, assessments, attempts
- Never modify schema without a KSS-DB-XXX prompt authorised
  in the Claude.ai project chat first

### tenants table — confirmed columns (March 17, 2026)
id, name, type, feature_toggle_mode, licensed_categories (ARRAY),
stripe_customer_id, is_active, created_at,
contact_name, contact_email, contact_phone,
timezone (DEFAULT 'Asia/Kolkata'),
date_format (DEFAULT 'DD/MM/YYYY'),
address_line1, address_line2, city, state, country, zip_code

### admin_users table — confirmed columns (March 17, 2026)
id (uuid), email (text), name (text), role (text),
tenant_id (uuid), is_active (boolean), created_at (timestamptz)
Valid roles (V1): SUPER_ADMIN | CLIENT_ADMIN | CONTENT_CREATOR
TEAM_MANAGER role deferred to V2 — never add it to code in V1.

### Client Admin JOIN (confirmed — no FK constraint, logical only)
SELECT name, email FROM admin_users
WHERE tenant_id = :tenant_id AND role = 'CLIENT_ADMIN'
LIMIT 1

### licensed_categories — METADATA ONLY (locked decision)
licensed_categories on tenants and contracts is informational only.
Content access is derived from Plan membership exclusively.
Never use licensed_categories to gate content assignment.

### Demo B2C User UUIDs (locked — Supabase synced)
Free:    9a3b56a5-31f6-4a58-81fa-66157c68d4f0
Basic:   a0c16137-7fd5-44f5-96e6-60e4617d9230
Pro:     e150d59c-13c1-4db3-b6d7-4f30c29178e9
Premium: 191c894d-b532-4fa8-b1fe-746e5cdcdcc8

### courses table — confirmed columns (March 17, 2026 — KSS-DB-SA-001 complete)
id (uuid), title (text), description (text), course_type (text),
status (text — LIVE/INACTIVE/DRAFT/ARCHIVED), source (text),
tenant_id (uuid nullable), created_by (uuid nullable),
created_at (timestamptz), updated_at (timestamptz)

### content_items table — columns including KSS-DB-SA-002 additions
id (uuid), title (text), description (text),
exam_category_id (uuid FK → exam_categories),
test_type (text), source (text),
status (text — DRAFT/INACTIVE/LIVE/ARCHIVED),
audience_type (text — B2C_ONLY/B2B_ONLY/BOTH, nullable until LIVE),
tenant_id (uuid nullable), created_by (uuid nullable),
created_at (timestamptz), updated_at (timestamptz)

MIGRATION KSS-DB-SA-002 (authorised March 18, 2026):
  ALTER TABLE content_items ADD COLUMN audience_type text;
  ALTER TABLE plans ADD COLUMN plan_audience text DEFAULT 'B2C';
  -- Valid plan_audience values: 'B2C' | 'B2B'
  -- audience_type values: 'B2C_ONLY' | 'B2B_ONLY' | 'BOTH'
  -- audience_type is nullable; set at Make Live step only

### tenant_plan_map table — created March 17, 2026
id (uuid PK), tenant_id (uuid FK → tenants), plan_id (uuid FK → plans),
created_at (timestamptz DEFAULT now())
Purpose: assigns B2B plans to tenants. Plans tab queries through this.
RLS: OFF (consistent with all Super Admin tables).

### Content table join path (locked)
Plan content uses content_items table (NOT assessments table).
plan_content_map.content_id → content_items.id for ASSESSMENT rows.
plan_content_map.content_id → courses.id for COURSE rows.

### plans table — plan_audience field (KSS-DB-SA-002)
plan_audience text DEFAULT 'B2C'
Values: 'B2C' (Plans & Pricing page) | 'B2B' (B2B tenants only)
B2B plans are global shared plans — assignable to multiple tenants.

### Super Admin Tables (row counts for reference)
exam_categories(6), tenants(3), admin_users(4), content_items(12),
plans(6), plan_content_map(23+), contracts(2), departments(6),
teams(18), learners(25), audit_logs(5), courses(5),
tenant_plan_map(seeded — all plans × B2B tenants)

---

## 5. CONTENT LIFECYCLE (locked — v2.0, March 18, 2026)

DRAFT    → Creator saves. Not in bank. Not visible to SA.
INACTIVE → Creator submits. In bank. SA reviews. Not visible to learners.
LIVE     → SA promotes with audience selection. Visible via plan membership.
ARCHIVED → Soft removed. History retained. Read-only. Cannot be assigned.

Visibility is ALWAYS derived from plan membership.
audience_type is set by SA at the Make Live step — never by creator.
Never store visibility on content_items directly.

### audience_type values (set at Make Live step)
B2C_ONLY → B2C learners only (via B2C plans in Plans & Pricing)
B2B_ONLY → B2B tenants only (via B2B plans assigned to tenants)
BOTH     → All B2C + all B2B (formerly "GLOBAL" in old schema)

### Audience gate at plan content assignment
B2C plans (plan_audience='B2C'): only B2C_ONLY or BOTH content
B2B plans (plan_audience='B2B'): only B2B_ONLY or BOTH content
Gate enforced in UI (content picker) and at API level.

### Audience reclassification flow
Stage 1: Inline preview on field blur — shows which plans stay vs auto-removed
Stage 2: Confirm modal on Save — auto-removes from incompatible plans
Language: "Stays in" / "Removed from" (NOT "compatible/incompatible")

---

## 6. PLATFORM HIERARCHY (locked — V1)

Super Admin (internal keySkillset)
  └── Content Creator (Master Org only)
Client Admin (B2B org, multi-tenant)
  └── B2B Learner
B2C Student / Professional (direct)

Team Manager: DEFERRED TO V2. Not in code, not in UI, not in any role selector.

---

## 7. GIT RULES

ALWAYS branch before starting work:
  git checkout -b feat/[PROMPT-ID]   (features)
  git checkout -b fix/[PROMPT-ID]    (bug fixes)

Prompt ID format: KSS-[TRACK]-[NNN]
Tracks: SA | CA | B2C | FIX | DB | PERF | UX

Never commit directly to main.

---

## 8. TENANT DETAIL PAGE — 6 TABS (locked v3.0, March 18, 2026)

Tab order (exact — do not reorder):
1. Overview      — read-only 2-col grid + Quick Actions bar
2. Plans         — assign/unassign B2B plans + accordion content preview
3. Users & Roles — Client Admin assignment + role management
4. Learners      — seat indicator + active table + archived collapsible
5. Contract      — contract fields + Stripe mock + Storage & Hosting
6. Audit History — tenant-scoped audit log

CONTENT TAB: REMOVED PERMANENTLY.
Content is viewed inside the Plans tab as an accordion under each plan.
Never add a "Content" tab back. Never reference ContentTab.tsx in tenant page.

---

## 9. QUICK ACTIONS BAR (locked)

Location: INSIDE Overview tab ONLY.
Rendered above the two-card row inside activeTab === 'overview' block.
NEVER in the page header. NEVER persistent across tabs.

Actions (final V1 — no additions without explicit authorisation):
- Edit Details   → EditDetailsSlideOver.tsx (Pencil icon, zinc border)
- Deactivate     → rose-600 button + confirmation modal (PowerOff icon)
                   shown when tenant.is_active === true
- Reactivate     → blue-700 button + confirmation modal (Power icon)
                   shown when tenant.is_active === false

REMOVED PERMANENTLY: Duplicate Tenant — not in codebase, not in scope.
Do not add it. Do not reference it.

---

## 10. OVERVIEW TAB — SPEC (built March 17, 2026)

LEFT CARD — "Tenant Details":
  Tenant Name | Type (badge) | Feature Mode (badge) |
  Status (badge) | Created | Client Admin (name + email, or
  "Not assigned" in text-zinc-400 if null)

RIGHT CARD — "Seat Usage":
  [N] / [total] large number + h-2 progress bar
  Colour: blue-700 (<90%) | amber-500 (≥90%) | rose-600 (100%)
  "Active learners" label below bar

CONTACT & ADDRESS section (full width, below cards):
  Left col: Contact Name, Contact Email, Contact Phone,
            Timezone, Date Format
  Right col: Address Line 1, Line 2, City, State, Country, Zip Code
  Null fields render "—" in text-zinc-400

All fields read-only. Edit via Quick Actions → Edit Details only.
No inline edit links on any card header.

---

## 11. EDIT DETAILS SLIDE-OVER (built March 17, 2026)

Component: src/components/tenant-detail/EditDetailsSlideOver.tsx
Pattern: right-side panel, 480px wide, fixed overlay bg-black/30

4 sections (single scroll, no wizard):
  Section 1 — Platform Setup: Tenant Name*, Feature Toggle Mode
  Section 2 — Contact: Contact Name, Contact Email, Contact Phone
  Section 3 — Address: Line 1, Line 2, City, State, Country, Zip Code
  Section 4 — Locale: Timezone, Date Format

NOT editable here: Contract fields (Seat Count, ARR, dates)
  → those are edited in Contract tab only

NOT editable here: Client Admin reassignment
  → that is a separate protected action with its own warning modal

Unsaved changes guard: dirty form + Cancel/overlay click
  → "Discard changes?" modal with Keep Editing | Discard

On save: UPDATE tenants SET ... WHERE id = :tenant_id
  + write TENANT_UPDATED audit entry
  + success toast
  + close panel

---

## 12. LEARNERS TAB — TWO-TIER REMOVAL MODEL (locked)

ARCHIVE (operational — not GDPR):
  - Access revoked immediately on confirm
  - Seat decremented immediately
  - Record + history fully retained
  - Reversible — unarchive restores access + consumes seat
  - Confirmation modal required
  - Audit: LEARNER_ARCHIVED

HARD DELETE (GDPR erasure only — not operational):
  - Two-step: (1) warning modal, (2) type learner name + reason
  - All PII permanently destroyed
  - Tombstone row written to archived section
  - Audit entry LEARNER_HARD_DELETED retained permanently
  - Irreversible

Archived section: collapsible sub-section below active table.
  Default: collapsed. Info highlight box when expanded explains
  why deleted users still appear.

Tombstone row: [Deleted User] | — | — | — | Date | GDPR Erasure
  Read-only. Permanent. No actions.

Row actions: kebab menu per row (Archive | Hard Delete)
Single remove only in V1 — no bulk actions.

Unarchive blocked if at seat limit.
Hard delete blocked if learner has active exam session.

---

## 13. PLANS TAB — ACTIVE MERGED SURFACE (locked v3.0, March 18, 2026)

Component: src/components/tenant-detail/PlansTab.tsx (BUILD THIS)

This tab has replaced the former Content tab entirely.
Pattern: Docebo accordion — assign plans + view content per plan in one surface.

### Controls row
Left:  "Assign Plan" button (blue-700) → opens AssignPlanSlideOver
Right: Plan filter dropdown (if ≥2 plans assigned)

### Assigned plans list (accordion per plan)
Each plan row:
  [ChevronDown/Right] [Plan Name] [plan_audience badge: B2C/B2B] [N items]
  [Unassign] button (rose-600, far right) → confirmation modal

On expand → shows content accordion inside:
  Assessment sub-section:
    Columns: TITLE | CATEGORY | TYPE | STATUS (LIVE badge green-600)
    Duplicate badge: ⚠ In N plans (amber-600, amber-50 bg, amber-200 border)
      Shown when same item appears in multiple plans for this tenant.
      Informational only. No blocking.
  Course sub-section:
    BookOpen icon + "Courses module coming soon" placeholder

### Assign Plan Slide-Over (AssignPlanSlideOver.tsx — BUILD THIS)
  Pattern: right-side panel, 480px wide
  Dropdown: shows all B2B plans (plan_audience = 'B2B') NOT already assigned
  On save: INSERT INTO tenant_plan_map + audit PLAN_ASSIGNED_TO_TENANT

### Empty state (no plans assigned)
  LayoutGrid icon (zinc-300)
  "No plans assigned to this tenant yet."
  "Assign a plan to make content available to this tenant's learners."
  "Assign Plan" button (blue-700)

### Data path
  tenant_plan_map → plans (plan_audience='B2B') →
  plan_content_map → content_items (LIVE) / courses (LIVE)

Content removal: via Plan detail page Content tab only.
Plans tab is read-only for content — assign/unassign plans only.

---

## 14. CONTRACT TAB — SPEC (v2.0, March 18, 2026)

Section 1 — Contract Details (editable by SA):
  Seat Count | ARR ($) | Start Date | End Date |
  Stripe Subscription ID | Notes
  "Save Contract" + "Last updated [date]"

ARR fix (resolved BUG-SA-002):
  Read: Math.max(0, Number(value) || 0) — never NaN
  Save: validate non-negative number before submitting
  Error: "ARR must be a valid positive number." inline below field

Section 2 — Payment Overview (static mock in demo):
  Stripe Customer ID: cus_demo_placeholder
  Subscription Status: Active
  Latest Invoice Status: Paid
  Latest Invoice Amount: $4,200.00
  Renewal Date: 01-01-2027
  MRR: ARR / 12
  Stripe Dashboard Link: # (placeholder)

Section 3 — Storage & Hosting (SA only — hidden from Client Admin):
  Total Storage Used: [N] GB (daily snapshot)
  Estimated Hosting Cost: $[X]/month
  Last Snapshot: [date]
  Static mock values in demo. SA only — check role before rendering.

Empty state if no Stripe ID:
  "No Stripe subscription linked. Add a Stripe Subscription ID
   in the Contract Details section above to enable payment tracking."

Client Admin: can view Sections 1 and 2 (read-only). Cannot see Section 3.

---

## 15. KEY ARCHITECTURAL DECISIONS (locked — v3.0)

1. licensed_categories = metadata only. Access via Plans exclusively.
   Never use it to gate content in any query.

2. Plans contain both assessments AND courses in V1.
   plan_content_map uses single table with content_type discriminator
   (ASSESSMENT | COURSE). Decision closed: single table confirmed.

3. Duplicate Tenant = removed from scope entirely. Never add it back.

4. Client Admin reassignment = separate protected action with its own
   warning modal. Not part of Edit Details slide-over.

5. Learner removal = two-tier: Archive (operational) vs
   Hard Delete (GDPR only). Both available to SA and CA.

6. Content tab = REMOVED from tenant detail page (March 18, 2026).
   Functionality merged into Plans tab (Docebo accordion pattern).
   ContentTab.tsx is obsolete — do not import it in tenant page.

7. PlanContentTab = manual add/remove. No auto-include engine.
   Assessments: content_items (LIVE). Courses: courses table (LIVE).
   Add Assessment / Add Course buttons open separate slide-overs.
   Remove: inline trash icon → confirm modal.
   audience_type gate enforced: B2C plans show only B2C_ONLY/BOTH content.
   B2B plans show only B2B_ONLY/BOTH content.

8. B2B plans are GLOBAL SHARED plans.
   A single plan object can be assigned to multiple tenants simultaneously.
   SA creates B2B plans from Plans & Pricing page.
   SA assigns B2B plans to tenants from Tenant Plans tab.

9. Course Store = REMOVED FROM SCOPE ENTIRELY. Never add it back.
   Courses are managed through Plans (same mechanism as assessments).

10. Team Manager = DEFERRED TO V2. Remove from all role selectors and
    permission matrices in V1 code.

11. audience_type is set at the Make Live step by SA only.
    Content creators cannot set audience_type.
    audience_type is nullable on DRAFT and INACTIVE items.
    Audience gate prevents B2C_ONLY content in B2B plans and vice versa.

12. Reclassification auto-removes from incompatible plans on confirm.
    Inline preview shows impact before confirm. SA cannot skip the preview.

---

## 16. EXAM ENGINE — LOCKED BEHAVIOURS

NEVER modify without explicit "Override locked behaviour" instruction.

Question status transitions (5 states):
  not_visited     → answered | marked_for_review | visited_unanswered
  answered        → answered_and_marked | visited_unanswered (clear)
  marked_for_review → answered_and_marked | visited_unanswered
  answered_and_marked → marked_for_review (clear) | answered (save&next)

Navigation rules:
  Previous: navigates only, no save. Disabled on Q1 Section 1 only.
  Save & Next last Q non-final section: silently → Q1 next section.
  Save & Next last Q final section: wrap to Q1 Section 1.
  Mark for Review: one-directional. Never unmarks.
    Only unmark path: Save & Next.
  Timer: never pauses. Auto-submits at 00:00:00.

Question types:
  MCQ_SINGLE (built) | MCQ_MULTI (FIX-027) |
  PASSAGE_SINGLE (built) | PASSAGE_MULTI (built) |
  NUMERIC (FIX-027, keyboard disabled)

---

## 17. KEY FILES

src/app/super-admin/tenants/[id]/page.tsx
  — Main tenant detail page (6 tabs — Content tab REMOVED)
  — Quick Actions bar inside Overview tab block only
  — No Duplicate button anywhere in this file
  — No Content tab import

src/components/tenant-detail/EditDetailsSlideOver.tsx
  — Edit Details slide-over (4 sections)
  — Exports: EditDetailsSlideOver, TenantRow

src/components/tenant-detail/PlansTab.tsx  [BUILD — KSS-SA-004-ARCH]
  — Plans tab: assign B2B plans + accordion content preview
  — Props: tenantId, onGoToPlans (unused — kept for compat)

src/components/tenant-detail/AssignPlanSlideOver.tsx  [BUILD — KSS-SA-004-ARCH]
  — Slide-over to assign a B2B plan to a tenant

src/components/tenant-detail/ContentTab.tsx  [OBSOLETE — do not import]
  — Superseded by PlansTab.tsx accordion. File may remain but is unused.

src/app/super-admin/plans/[id]/page.tsx  [Plan detail — existing]
  — Plan Content tab lives here
  — audience gate enforced in AddContentSlideOver

src/components/plans/AddContentSlideOver.tsx  [UPDATE — KSS-SA-004-ARCH]
  — Add content to a plan slide-over
  — Must enforce audience_type gate: filter by plan.plan_audience

src/components/plans/PlanContentTab.tsx  [UPDATE — KSS-SA-004-ARCH]
  — Multi-tenant callout: "This plan is assigned to N tenants"
  — audience_type badge on each content row

src/app/assessments/[id]/exam/page.tsx
  — LinearExamPlayer, ExamHeader, ExamFooter,
    PaletteSidebar, QuestionArea, ExitConfirmModal, SubmitConfirmModal

src/hooks/useExamEngine.ts
  — State machine, timer, localStorage
  — Actions: SELECT_OPTION, SAVE_AND_NEXT, PREVIOUS,
    MARK_FOR_REVIEW, MARK_AND_NEXT, CLEAR_RESPONSE,
    JUMP_TO_QUESTION, SWITCH_SECTION, TICK, SUBMIT_EXAM

src/data/exams/clat-full-test-1.ts
src/data/exams/neet-full-test-1.ts
src/data/demoUsers.ts
src/utils/assessmentUtils.ts
src/data/assessments.ts               — mockAttempts (static, not DB yet)
src/lib/supabase/client.ts
src/components/assessment-detail/AttemptsTab.tsx
src/components/assessment-detail/AnalyticsTab.tsx
src/components/assessment-detail/OverviewTab.tsx
src/app/assessments/[id]/page.tsx
src/app/assessments/[id]/results/page.tsx
src/app/assessments/[id]/instructions/page.tsx

---

## 18. SIDEBAR NAV — LOCKED v3.0 (March 18, 2026)

Section              Item                  Status
────────────────────────────────────────────────────────
(none)               Dashboard             Coming Soon
Content Management   Content Bank          🟡 KSS-SA-009 pending
Content Management   Plans & Pricing       🟡 KSS-SA-004 next
Master Org           B2C Users             Coming Soon
Master Org           Content Creators      Coming Soon
Organisations        Tenants               ✅ KSS-SA-003 built
Assessment           Sources & Questions   Coming Soon
Assessment           Question Bank         Coming Soon
Assessment           Create Assessments    Coming Soon
Assessment           Bulk Upload           Coming Soon
Configuration        Marketing Config      Coming Soon
Configuration        Analytics             Coming Soon
Configuration        Audit Log             Coming Soon

REMOVED PERMANENTLY: "Course Store" — not in nav, not in code, not in scope.
RENAMED: "Content" + "Monetisation" groups → "Content Management" group.

---

## 19. PERSONA SELECTOR — LOCKED

Admin row (rounded-md avatars):
  Super Admin    → /super-admin          (blue-700)
  Akash Inst.    → /client-admin/akash   (violet-700)
  TechCorp India → /client-admin/techcorp (teal-700)

Divider: "Learner Personas"

Learner row (rounded-full avatars):
  Free | Basic | Pro | Premium

Client Admin routes → 404 until sprint scoped.
No Team Manager persona selector — role removed from V1.

---

## 20. CURRENT BUILD QUEUE

✅ BUG-SA-001      Quick actions bar placement — DONE
✅ BUG-SA-002      ARR NaN fix — DONE
✅ BUG-SA-003-EDITLINK  Inline Edit link removed — DONE
✅ BUG-SA-001-FINAL     Header cleanup, Duplicate removed — DONE
✅ BUG-SA-002-FINAL     ARR NaN fully resolved — DONE
✅ FIX-SA-003-OVERVIEW-v2  Overview tab rebuilt — DONE
✅ FIX-SA-003-CONTENT      Content tab built (v1) — DONE
✅ KSS-DB-SA-001          courses table migration — DONE (seeded 5 courses)
✅ FIX-SA-003-CONTENT-V2  Content tab rebuilt — plan-grouped, read-only,
                           tenant_plan_map data path, duplicate badge — DONE
✅ KSS-SA-004-CONTENT     Plan Content tab rebuilt — manual add/remove,
                           Assessments + Courses sections, no auto-include — DONE

🟡 KSS-SA-004-ARCH  Content architecture changes (March 18, 2026 session):
    - DB: KSS-DB-SA-002 — audience_type on content_items, plan_audience on plans
    - Sidebar nav: Content Management group, Course Store removed
    - Tenant detail: 6 tabs (Content tab removed, Plans tab active)
    - Build PlansTab.tsx (Docebo accordion — assign + content preview)
    - Build AssignPlanSlideOver.tsx
    - Update PlanContentTab.tsx (audience gate + multi-tenant callout)
    - Update AddContentSlideOver.tsx (audience_type filter)
    - Contract tab: Storage & Hosting section (SA only)

🟡 KSS-SA-004   Plans & Pricing — full feature (B2C pricing page config,
               plan lifecycle, swimlane layout, B2B plan management)
               PRD: https://keyskillset-product-management.atlassian.net/
                    wiki/spaces/EKSS/pages/93093890

🟡 KSS-SA-005   Audit Log
🟡 KSS-SA-006   Analytics
🟡 KSS-SA-007   Marketing Config
🟡 KSS-SA-008   Master Organisation
🟡 KSS-SA-009   Content Bank
🟡 KSS-SA-010   Dashboard (last)

B2C (pending):
🔴 KSS-B2C-FIX-023  Back button + ChevronLeft on instructions page
🔴 KSS-B2C-FIX-024  Previous cross-section NTA navigation
🔴 KSS-B2C-FIX-025-FINAL  Exam engine state machine (merged)
🔴 KSS-B2C-FIX-026  Mobile hard block modal (< 768px)
🔴 KSS-B2C-FIX-027  MCQ_MULTI and NUMERIC renderers
🔴 KSS-B2C-FIX-028  Draggable on-screen calculator

---

## 21. OPEN BUGS

BUG-001  Analytics tab empty after results redirect
         Deferred — depends on Analytics page build (KSS-SA-006)

BUG-002  Upgrade banner not showing after free attempt
         Deferred — depends on DB-003 revisit

---

## 22. OPEN DECISIONS (do not resolve without product owner confirmation)

1.  questions table (B2C) vs content_items (SA) — merge or keep separate
2.  Supabase vs AWS RDS migration — pending engineering decision
3.  Client Admin routes build sprint — pending
4.  ~~Course Store~~ — CLOSED: removed from scope entirely
5.  Licensed Categories sync between tenant + contract — update save logic
6.  Confluence MCP for PRD updates — handled in Claude Code sessions
7.  ~~FIX-SA-003-MODAL-PLANS~~ — CLOSED: Plans tab is now active surface
8.  ~~courses table schema~~ — CLOSED: confirmed via KSS-DB-SA-001
9.  ~~plan_content_map~~ — CLOSED: single discriminator table confirmed
10. ~~Sub-PRD 4~~ — CLOSED: updated to v2.2 March 18, 2026
11. CA self-serve plan assignment (V2 deferred — SA-curated model in V1)
12. B2B Stripe integration (V2 — billing via contract in V1)

---

## 23. PRD CONFLUENCE LINKS

Sub-PRD 2 — Content Bank & Taxonomy (v3.0):
  https://keyskillset-product-management.atlassian.net/wiki/spaces/EKSS/pages/93421571

Sub-PRD 3 — Tenant, RBAC & Licensing (v2.3):
  https://keyskillset-product-management.atlassian.net/wiki/spaces/EKSS/pages/93913089

Sub-PRD 4 — Plans & Entitlements (v2.2):
  https://keyskillset-product-management.atlassian.net/wiki/spaces/EKSS/pages/93093890

Super Admin Master PRD (v2.0):
  https://keyskillset-product-management.atlassian.net/wiki/spaces/EKSS/pages/91226113

---

## 24. WORKFLOW — HOW CLAUDE CODE OPERATES

Claude Code (VS Code):
  - Reads CLAUDE.md automatically on startup
  - Receives build prompts pasted by the user
  - Executes against live codebase
  - Updates CLAUDE.md at the end of each architectural session
  - Writes PRD updates to Confluence via MCP tools

CLAUDE.md is updated at the end of sessions with architectural changes.
Commit CLAUDE.md to repo root after every session update.

---

## 25. SELF-CRITIQUE BEFORE EVERY COMMIT

Run this checklist before presenting any code:

[ ] Tailwind tokens only — no custom hex, no inline styles
[ ] Correct git branch format (feat/ or fix/)
[ ] No RLS added to any Super Admin table
[ ] No schema changes without an authorised KSS-DB-XXX prompt
[ ] Works for all 4 demo user tiers (Free/Basic/Pro/Premium)
[ ] Quick Actions bar ONLY inside Overview tab block
[ ] No Duplicate Tenant action anywhere in any file
[ ] licensed_categories never used to gate content in any query
[ ] Locked exam engine behaviours untouched
[ ] Build passes: npm run build returns ✓ Compiled successfully
[ ] No unused imports left behind after any removal
[ ] Tenant detail page has 6 tabs — no Content tab
[ ] No Team Manager role anywhere in V1 code
[ ] No Course Store anywhere in nav or code
[ ] audience_type gate enforced in plan content pickers
[ ] plan_audience used to determine B2C vs B2B plan identity
[ ] Storage & Hosting section in Contract tab is SA-only (role check)

---

*CLAUDE.md — keySkillset v3.0 — Updated March 18, 2026*
*Source of truth for Claude Code sessions*
*PRD updates: use Confluence MCP tools in Claude Code or Claude.ai*
*Do not edit this file manually*
