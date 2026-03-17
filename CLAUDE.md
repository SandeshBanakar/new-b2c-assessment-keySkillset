# CLAUDE.md — keySkillset Platform
# Version: 2.2 | Updated: March 17, 2026
# READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE.
# This file is the single source of truth for Claude Code.
# It is maintained by Claude.ai (project chat) — never edit manually.

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

### Super Admin Tables (row counts for reference)
exam_categories(6), tenants(3), admin_users(4), content_items(12),
plans(6), plan_content_map(23), contracts(2), departments(6),
teams(18), learners(25), audit_logs(5)

---

## 5. CONTENT LIFECYCLE (locked)

DRAFT    → Creator saves. Not in bank.
INACTIVE → Creator publishes. In bank. Not visible to learners.
LIVE     → Super Admin assigns to published plan. Visible.
ARCHIVED → Soft removed. History retained. Read-only.

Visibility is ALWAYS derived from plan membership.
Never store visibility on content_items.

---

## 6. PLATFORM HIERARCHY (locked)

Super Admin (internal keySkillset)
  └── Content Creator (Master Org only — 3 types)
Client Admin (B2B org, multi-tenant)
  └── Team Manager
       └── B2B Learner
B2C Student / Professional (direct)

---

## 7. GIT RULES

ALWAYS branch before starting work:
  git checkout -b feat/[PROMPT-ID]   (features)
  git checkout -b fix/[PROMPT-ID]    (bug fixes)

Prompt ID format: KSS-[TRACK]-[NNN]
Tracks: SA | CA | B2C | FIX | DB | PERF | UX

Never commit directly to main.

---

## 8. TENANT DETAIL PAGE — 7 TABS (locked v2.0)

Tab order (exact — do not reorder):
1. Overview      — read-only 2-col grid + Quick Actions bar
2. Plans         — placeholder (pending SA-004)
3. Users & Roles — role management
4. Learners      — seat indicator + active table + archived collapsible
5. Content       — plan-scoped platform content, grouped by plan
6. Contract      — contract fields + Stripe static mock sub-section
7. Audit History — tenant-scoped audit log

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

## 13. CONTENT TAB — SPEC (built March 17, 2026)

Component: src/components/tenant-detail/ContentTab.tsx

Shows ONLY content assigned to this tenant via its Plans.
Platform content only. LIVE status only.
No tenant-created content. No all-platform content.

Controls row:
  Left:  "Collapse all / Expand all" text toggle
  Right: Plan filter dropdown — "All Plans" | [plan names]

Grouped by plan sections (collapsible):
  Section header: [ChevronDown/Right] [Plan Name] — [N items]
  Default: all expanded

Assessment sub-section per plan:
  Columns: TITLE | CATEGORY | TYPE | STATUS (LIVE green-600)
  Duplicate badge: ⚠ In N plans (amber-600, amber-50 bg,
    amber-200 border, rounded-full) — shown when same assessment
    appears in multiple plans assigned to this tenant.
    Informational only. No blocking. Visible to SA and CA.

Course sub-section: placeholder always
  BookOpen icon + "Courses module coming soon"

Empty state (no plans assigned — correct state until SA-004):
  LayoutGrid icon (zinc-300)
  "No plans assigned to this tenant yet."
  "Assign plans in the Plans tab to make content available."
  Button: "Go to Plans tab" → setActiveTab('plans')

Content removal: via Plans tab only — not here.

FALLBACK RULE: if plan_content_map has no tenant path yet
  (SA-004 pending), empty state renders. DO NOT mock data.

---

## 14. CONTRACT TAB — SPEC

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

Empty state if no Stripe ID:
  "No Stripe subscription linked. Add a Stripe Subscription ID
   in the Contract Details section above to enable payment tracking."

Client Admin: view only, cannot edit.

---

## 15. PLANS TAB — PLACEHOLDER

Current state: Lock icon placeholder.
Copy: "Plans assigned to this tenant will appear here. Plans control
      which assessments and courses learners in this tenant can access."
Status: pending SA-004.
PRD: https://keyskillset-product-management.atlassian.net/
     wiki/spaces/EKSS/pages/93093890

---

## 16. KEY ARCHITECTURAL DECISIONS (locked)

1. licensed_categories = metadata only. Access via Plans exclusively.
   Never use it to gate content in any query.

2. Plans contain both assessments AND courses in V1.
   plan_content_map uses single table with content_type discriminator
   (ASSESSMENT | COURSE). Open Decision #9 pending KSS-DB-SA-001.

3. Duplicate Tenant = removed from scope entirely. Never add it back.

4. Client Admin reassignment = separate protected action with its own
   warning modal. Not part of Edit Details slide-over.

5. Learner removal = two-tier: Archive (operational) vs
   Hard Delete (GDPR only). Both available to SA and CA.

6. Content tab = plan-scoped only. Empty state is correct state
   until SA-004 wires plans to tenants.

---

## 17. EXAM ENGINE — LOCKED BEHAVIOURS

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

## 18. KEY FILES

src/app/super-admin/tenants/[id]/page.tsx
  — Main tenant detail page (7 tabs)
  — Quick Actions bar inside Overview tab block only
  — No Duplicate button anywhere in this file

src/components/tenant-detail/EditDetailsSlideOver.tsx
  — Edit Details slide-over (4 sections)
  — Exports: EditDetailsSlideOver, TenantRow

src/components/tenant-detail/ContentTab.tsx
  — Content tab component (plan-scoped, grouped, duplicate badge)
  — Props: tenantId, onGoToPlans

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

## 19. SIDEBAR NAV — LOCKED v2.0

Section        Item                  Status
──────────────────────────────────────────────────
(none)         Dashboard             Coming Soon
Content        Content Bank          Coming Soon
Monetisation   Plans & Pricing       🟡 KSS-SA-004 next
Monetisation   Course Store          Coming Soon
Master Org     B2C Users             Coming Soon
Master Org     Content Creators      Coming Soon
Organisations  Tenants               ✅ KSS-SA-003 built
Assessment     Sources & Questions   Coming Soon
Assessment     Question Bank         Coming Soon
Assessment     Create Assessments    Coming Soon
Assessment     Bulk Upload           Coming Soon
Configuration  Marketing Config      Coming Soon
Configuration  Analytics             Coming Soon
Configuration  Audit Log             Coming Soon

---

## 20. PERSONA SELECTOR — LOCKED

Admin row (rounded-md avatars):
  Super Admin    → /super-admin          (blue-700)
  Akash Inst.    → /client-admin/akash   (violet-700)
  TechCorp India → /client-admin/techcorp (teal-700)

Divider: "Learner Personas"

Learner row (rounded-full avatars):
  Free | Basic | Pro | Premium

Client Admin routes → 404 until sprint scoped.

---

## 21. CURRENT BUILD QUEUE

✅ BUG-SA-001      Quick actions bar placement — DONE
✅ BUG-SA-002      ARR NaN fix — DONE
✅ BUG-SA-003-EDITLINK  Inline Edit link removed — DONE
✅ BUG-SA-001-FINAL     Header cleanup, Duplicate removed — DONE
✅ BUG-SA-002-FINAL     ARR NaN fully resolved — DONE
✅ FIX-SA-003-OVERVIEW-v2  Overview tab rebuilt — DONE
✅ FIX-SA-003-CONTENT      Content tab built — DONE

🔴 KSS-DB-SA-001   courses table migration — NEXT (before SA-004)
               Branch: feat/KSS-DB-SA-001
               PRD: https://keyskillset-product-management.atlassian.net/
                    wiki/spaces/EKSS/pages/93093890

🟡 KSS-SA-004   Plans & Pricing
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

## 22. OPEN BUGS

BUG-001  Analytics tab empty after results redirect
         Deferred — depends on Analytics page build (KSS-SA-006)

BUG-002  Upgrade banner not showing after free attempt
         Deferred — depends on DB-003 revisit

---

## 23. OPEN DECISIONS (do not resolve without product owner confirmation)

1.  questions table (B2C) vs content_items (SA) — merge or keep separate
2.  Supabase vs AWS RDS migration — pending engineering decision
3.  Client Admin routes build sprint — pending
4.  Course Store Stripe integration in demo — not decided
5.  Licensed Categories sync between tenant + contract — update save logic
6.  Confluence MCP for PRD updates — handled in Claude.ai project chat
7.  FIX-SA-003-MODAL-PLANS — Section 5 Plans picker (post SA-004)
8.  courses table schema — pending KSS-DB-SA-001 design
9.  plan_content_map — single discriminator table (working assumption)
    vs two tables (plan_assessments + plan_courses)
10. Sub-PRD 4 Plans & Entitlements — update once SA-004 build starts

---

## 24. PRD CONFLUENCE LINKS

Sub-PRD 2 — Tenant, RBAC & Licensing (v2.1):
  https://keyskillset-product-management.atlassian.net/wiki/spaces/EKSS/pages/93913089

Sub-PRD 4 — Plans & Entitlements (v2.0):
  https://keyskillset-product-management.atlassian.net/wiki/spaces/EKSS/pages/93093890

Super Admin Master PRD:
  https://keyskillset-product-management.atlassian.net/wiki/x/AQBwBQ

---

## 25. WORKFLOW — HOW CLAUDE.AI AND CLAUDE CODE INTERACT

Claude.ai (project chat):
  - Reads PRDs via Confluence MCP
  - Makes product decisions and writes prompts
  - Updates CLAUDE.md after each session
  - Generates handoff MD for upload to Project Files
  - Writes PRD updates to Confluence via MCP

Claude Code (VS Code):
  - Reads CLAUDE.md automatically on startup
  - Receives build prompts pasted by the user
  - Executes against live codebase
  - NEVER edits CLAUDE.md directly
  - NEVER writes to Confluence

CLAUDE.md is updated only by Claude.ai at session end.
Commit CLAUDE.md to repo root after every session update.

---

## 26. SELF-CRITIQUE BEFORE EVERY COMMIT

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

---

*CLAUDE.md — keySkillset v2.2 — Updated March 17, 2026*
*Source of truth: Claude.ai project (keySkillset)*
*For PRD updates: use Claude.ai with Confluence MCP connector*
*Never edit this file manually*