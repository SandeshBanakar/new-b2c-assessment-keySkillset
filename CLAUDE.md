# CLAUDE.md — keySkillset Platform
# Version: 5.0 | Updated: March 20, 2026
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
Docs ref:    Context7 — https://context7.com/
             Use Context7 to look up accurate, up-to-date library documentation
             (Next.js, Supabase, Tailwind, Lucide, etc.) before implementing
             any library-specific feature. Prefer Context7 over memory/guesswork.

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

### tenants table — feature_toggle_mode values (locked)
FULL_CREATOR → tenant has Content Creator access + own database usage
RUN_ONLY     → tenant has Client Admin access only; no own DB; relies on SA
               for content. Storage & Hosting section HIDDEN for RUN_ONLY.
               Condition: feature_toggle_mode === 'RUN_ONLY'

### courses table — confirmed columns (KSS-DB-SA-001 + KSS-DB-SA-003)
id (uuid), title (text), description (text), course_type (text),
status (text — LIVE/INACTIVE/DRAFT/ARCHIVED), source (text),
tenant_id (uuid nullable), created_by (uuid nullable),
created_at (timestamptz), updated_at (timestamptz),
audience_type (text — B2C_ONLY/B2B_ONLY/BOTH, nullable),
price (numeric, nullable — null = not priced individually),
currency (text DEFAULT 'INR'),
is_individually_purchasable (boolean DEFAULT false),
stripe_price_id (text, nullable)

MIGRATION KSS-DB-SA-003 (authorised March 19, 2026):
  See Section 27 for full SQL.

### content_items table — confirmed live columns (verified March 20, 2026 via REST API)
id (uuid), title (text),
exam_category_id (uuid FK → exam_categories),
test_type (text), source (text),
status (text — DRAFT/INACTIVE/LIVE/ARCHIVED),
audience_type (text — B2C_ONLY/B2B_ONLY/BOTH, nullable until LIVE),
visibility_scope (text DEFAULT 'GLOBAL' — 'GLOBAL'|'TENANT_PRIVATE'|'PENDING_PROMOTION'),
  tenant_scope_id IS NULL  → always 'GLOBAL' (SA-authored)
  tenant_scope_id NOT NULL → 'TENANT_PRIVATE' (tenant-authored, FULL_CREATOR only)
  'PENDING_PROMOTION' → V2 (push to SA global bank — NOT BUILT IN V1)
tenant_scope_id (uuid nullable),  ← IMPORTANT: column is tenant_scope_id NOT tenant_id
created_by (uuid nullable),
created_at (timestamptz), updated_at (timestamptz)
COLUMNS THAT DO NOT EXIST: description (no such column in live schema)

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

### plans table — full field list (KSS-DB-SA-002 + KSS-DB-SA-003)
plan_type text NOT NULL            — 'WHOLE_PLATFORM' | 'CATEGORY_BUNDLE'
tier text NOT NULL                 — CHECK: 'BASIC'|'PRO'|'PREMIUM'|'ENTERPRISE'
                                   B2C plans use BASIC/PRO/PREMIUM
                                   B2B plans use ENTERPRISE (constraint extended KSS-DB-SA-003)
audience_type text DEFAULT 'B2C'   — legacy column (pre KSS-DB-SA-002), keep as 'B2C'
price_usd_cents integer DEFAULT 0  — price in USD cents. NOT legacy. Live field.
                                   Label in UI: "Price (USD)". Source of truth for
                                   Stripe checkout and B2C pricing page display.
price integer DEFAULT 0            — price in INR. Label in UI: "Price (₹)".
                                   Source of truth for INR Stripe checkout and
                                   B2C pricing page display.
plan_audience text DEFAULT 'B2C'   — 'B2C' | 'B2B'
display_name text (nullable)       — customer-facing name (separate from internal name)
tagline text (nullable)            — 1-sentence pricing card subtitle
feature_bullets jsonb DEFAULT '[]' — ordered array of strings, max 7, 80 chars each
footnote text (nullable)           — small print below CTA on pricing card
is_popular boolean DEFAULT false   — drives "Most Popular" badge
cta_label text (nullable)          — button label override (default: "Get Started")
status text                        — 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' (plans only)
scope text                         — 'PLATFORM_WIDE' | 'CATEGORY_BUNDLE'

B2B plans are ALWAYS platform-wide (scope='PLATFORM_WIDE'). Locked permanently.
B2B plan price = 0 always. Billing via tenant contracts. Never show price in UI.
B2B plans assignable to multiple tenants simultaneously.

### Super Admin Tables (row counts for reference — post KSS-DB-SA-003)
exam_categories(6), tenants(3), admin_users(4), content_items(12),
plans(9 — 6 B2C + 3 B2B), plan_content_map(23+), contracts(2),
departments(6), teams(18), learners(25), audit_logs(5),
courses(9 — 4 B2B LIVE + 4 B2C LIVE + 1 INACTIVE),
tenant_plan_map(3 — Akash Standard→Akash, TechCorp Premium→TechCorp,
                    Enterprise Pro→both tenants)

### learners table — confirmed live columns (verified March 20, 2026 via REST API)
id (uuid), tenant_id (uuid), full_name (text), email (text),
phone (text nullable), department_id (uuid nullable FK → departments),
team_id (uuid nullable FK → teams), status (text — ACTIVE|INACTIVE),
employee_roll_number (text nullable), notes (text nullable),
created_by (uuid nullable), created_at (timestamptz)
NOTE: employee_roll_number + notes + created_by already exist directly on learners.
learner_profiles table was also created by KSS-DB-CA-001 — use learner_profiles for
any additional B2B-specific fields; but employee_roll_number/notes live on learners.

### departments table — confirmed live columns (verified March 20, 2026 via REST API)
id (uuid), tenant_id (uuid), name (text), description (text nullable),
team_manager_id (uuid nullable), status (text — ACTIVE|INACTIVE), created_at (timestamptz)

### teams table — confirmed live columns (verified March 20, 2026 via REST API)
id (uuid), department_id (uuid FK → departments), tenant_id (uuid),
name (text), status (text — ACTIVE|INACTIVE), created_at (timestamptz)

### Client Admin Tables (V1 — KSS-DB-CA-001, authorised March 20, 2026)
learner_profiles   — B2B extension per learner: employee_roll_number, notes
                     learner_id (FK → learners), tenant_id (FK → tenants)
content_assignments — CA assigns content to DEPARTMENT|TEAM|INDIVIDUAL
                     Dynamic membership: future learners in target auto-inherit access
                     content_type discriminator: ASSESSMENT | COURSE
learner_content_access — Materialized access records derived from content_assignments
                     source_assignment_id (FK → content_assignments) for traceability
                     revoked_at NULL = active; overlapping assignments handled by multiple rows
certificates        — Course completion certs (V1: courses only)
                     learner_name, content_title, tenant_name denormalised for permanence
                     certificate_number format: KSS-{tenant_short}-{YYYYMMDD}-{seq}
client_audit_log    — Immutable CA-scoped audit trail
                     actor_role: CLIENT_ADMIN | CONTENT_CREATOR
                     before_state + after_state: JSONB
                     RLS: OFF (consistent with all admin tables)

### B2B Plans (seeded — KSS-DB-SA-003)
Akash Standard  — Akash Institute Delhi only, plan_audience='B2B', price=0
TechCorp Premium — TechCorp India only, plan_audience='B2B', price=0
Enterprise Pro  — both tenants, plan_audience='B2B', price=0
All B2B plans: scope='PLATFORM_WIDE', status='PUBLISHED'

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
  └── Content Creator (Master Org only — role=CONTENT_CREATOR, tenant_id=NULL)
Client Admin (B2B org — one per tenant)
  └── Content Creator (FULL_CREATOR tenants only — role=CONTENT_CREATOR, tenant_id=B2B tenant)
        Interface: /content-creator/[tenant]/ — FUTURE SCOPE, NOT BUILT YET
        Mirrors Master Org Content Creator capabilities when built.
  └── B2B Learner
B2C Student / Professional (direct)

Team Manager: DEFERRED TO V2. Not in code, not in UI, not in any role selector.

Content Creator for FULL_CREATOR tenants (locked decisions — March 20, 2026):
  - Assigned by: SA (via Tenant → Users & Roles tab) OR CA (via CA → Users & Roles section)
  - Both SA and CA surfaces show CC management for FULL_CREATOR tenants only
  - SA Users & Roles tab: shows CLIENT_ADMIN + CONTENT_CREATOR (FULL_CREATOR) or CLIENT_ADMIN only (RUN_ONLY)
  - Content created by tenant CC lives in content_items with tenant_id = B2B tenant, visibility_scope = TENANT_PRIVATE
  - /content-creator/[tenant]/ route is locked but NOT BUILT. Persona: Coming Soon placeholder.
  - Sprint tracking: KSS-CA-FUTURE-001 (not scoped for current build)

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
  Section 3 — Address: Line 1, Line 2, City, State, Zip Code,
               Country (searchable combobox dropdown — full country list)
  Section 4 — Locale:
    Timezone — IANA dropdown (Intl.supportedValuesOf('timeZone'))
               Display format: "Asia/Kolkata" (IANA key only, not offset label)
    Date Format — dropdown: DD/MM/YYYY | MM/DD/YYYY | YYYY-MM-DD | DD-MM-YYYY

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

Section 3 — Storage & Hosting (SA only):
  CONDITION: shown ONLY when tenant.feature_toggle_mode !== 'RUN_ONLY'
  When RUN_ONLY: render a quiet note instead —
    "Storage & Hosting is not tracked for Run-Only tenants."
  When FULL_CREATOR: show static mock values:
    Total Storage Used: 12.4 GB (daily snapshot)
    Estimated Hosting Cost: $18.60/month
    Last Snapshot: Mar 18, 2026

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

13. All B2B plans are ALWAYS platform-wide (scope='PLATFORM_WIDE'). LOCKED.
    Never create a B2B CATEGORY_BUNDLE plan. Never show price for B2B plans.
    B2B billing = tenant contract (ARR in Contract tab). Price column hidden.

14. Individual course pricing lives on the course record (NOT plan records).
    See decision 15 for full locked spec. Permission guard: price fields are
    SA-editable only, not Content Creators.

15. Course à la carte pricing (locked — March 19, 2026):
    Fields on course record: price (INR), price_usd_cents (USD),
    is_individually_purchasable (boolean), stripe_price_id (text).
    SA manages from Plans & Pricing → Tab 2 (Course Pricing). Both INR and USD
    prices are editable by SA in Tab 2.
    stripe_price_id for courses = recurring ANNUAL Stripe Price ID (Stripe-managed).
    GATE: is_individually_purchasable = true → course EXCLUDED from all B2C
    subscription plan content assignment. Mutually exclusive. Enforce in UI + query.
    If already in a plan: warn SA → confirm → auto-remove from plans → set purchasable.
    Option X (single-course subscription plan) = REJECTED AND LOCKED. Never build.
    Tab 2 (Course Pricing) is the ONLY surface for course à la carte pricing.

16. B2C subscription tiers: free (default) | basic | professional | premium.
    Stored as subscription_tier on the user/demoUsers record.
    Free = default unsubscribed state. NOT a plan record. Users get:
      - 1 free attempt per assessment (per assessment, all tiers)
      - Access to courses where is_individually_purchasable=false AND price=null
    Plans & Pricing swimlane shows "Free (Default)" as a read-only reference
    column alongside the 3 paid tiers.

17. Plans & Pricing page has 3 tabs: Assessment Plans | Course Pricing | B2B Plans.
    Full spec in Section 28. Tab-scoped Create buttons only — no global Create button.
    "Create B2C Plan" (Tab 1) | "Create B2B Plan" (Tab 3) | No button on Tab 2.
    Page subtitle: "Manage B2C and B2B subscription plans and content entitlements"

18. Feature bullets for plans: JSONB array (feature_bullets column).
    B2C plans ONLY — not shown on B2B create/edit form.
    UI: dynamic add/remove list, start with 3 fields, max 7, 80 chars/bullet.
    GripVertical drag handle per row (V1: icon only, drag in V2).
    Display name (display_name column) is customer-facing; name is internal.
    B2B plans have NO display_name, tagline, feature_bullets, is_popular, cta_label.

19. Make Live modal (for both content_items and courses):
    Enhanced single-step: metadata summary + audience radio + plan impact preview.
    For assessments: preview queries existing plans where item becomes eligible
    (matching plan_audience + allowed_assessment_types).
    For courses: shows "This course will become individually purchasable."
    No multi-step wizard. No eligibility check beyond the preview.

20. Edit Details slide-over locale fields use dropdowns (not text inputs):
    Timezone: IANA dropdown (Intl.supportedValuesOf('timeZone')).
    Date Format: enum dropdown (DD/MM/YYYY | MM/DD/YYYY | YYYY-MM-DD | DD-MM-YYYY).
    Country: searchable combobox with full country list.

21. Storage & Hosting section (Contract tab) is hidden for RUN_ONLY tenants.
    Condition: tenant.feature_toggle_mode === 'RUN_ONLY'.
    Show note: "Storage & Hosting is not tracked for Run-Only tenants."

22. B2B plan create/edit form fields (locked — March 19, 2026):
    name (internal)* | description | max_attempts (default 10, range 1–99)
    Scope: read-only badge "Platform-Wide" — never a selector on B2B form.
    Pricing: read-only callout "Pricing managed via tenant contract."
    B2B plans grant ALL assessment types — no allowed_assessment_types field.
    max_attempts editable both in Create form and plan detail Overview tab.

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
Course Creation      Create Course         🟡 pending (route: /super-admin/create-course)
Assessment Creation  Sources & Questions   Coming Soon
Assessment Creation  Question Bank         Coming Soon
Assessment Creation  Create Assessments    Coming Soon
Assessment Creation  Bulk Upload           Coming Soon
Configuration        Marketing Config      Coming Soon
Configuration        Analytics             Coming Soon
Configuration        Audit Log             Coming Soon

Nav group order: Content Management → Master Organisation → Organisations →
  Course Creation → Assessment Creation → Configuration

REMOVED PERMANENTLY: "Course Store" — not in nav, not in code, not in scope.
RENAMED: "Content" + "Monetisation" groups → "Content Management" group.
ADDED: "Course Creation" group above "Assessment Creation".

---

## 19. PERSONA SELECTOR — LOCKED

Admin row (rounded-md avatars):
  Super Admin    → /super-admin               (blue-700)
  Akash Inst.    → /client-admin/akash        (violet-700)
  TechCorp India → /client-admin/techcorp     (teal-700)

Content Creator row (rounded-md avatars, labelled "Content Creator Personas"):
  Akash Content Creator → /content-creator/akash   (amber-700, "Coming Soon" badge)
  Note: TechCorp is RUN_ONLY — no Content Creator persona. Akash only.
  Note: /content-creator/[tenant]/ is FUTURE SCOPE. Clicking shows Coming Soon.

Divider: "Learner Personas"

Learner row (rounded-full avatars):
  Free | Basic | Pro | Premium

Client Admin routes: KSS-CA sprint — built March 20, 2026.
Content Creator routes: FUTURE SCOPE — Coming Soon placeholder only.
No Team Manager persona selector — role permanently removed from V1.

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

✅ KSS-SA-004-ARCH  Content architecture changes — DONE (March 18, 2026):
    - DB: KSS-DB-SA-002 — audience_type on content_items, plan_audience on plans
    - Sidebar nav: Content Management group, Course Store removed
    - Tenant detail: 6 tabs (Content tab removed, Plans tab active)
    - Built PlansTab.tsx + AssignPlanSlideOver.tsx
    - Updated PlanContentTab.tsx (audience gate + multi-tenant callout)
    - Updated AddContentSlideOver.tsx (audience_type filter)
    - Contract tab: Storage & Hosting section (SA only)

🟡 KSS-DB-SA-003  Courses + plans schema + B2B seeding (March 19, 2026):
    - courses: +audience_type, +price, +currency, +is_individually_purchasable,
               +stripe_price_id
    - plans: +display_name, +tagline, +feature_bullets (jsonb), +footnote,
             +is_popular, +cta_label
    - Update 4 LIVE courses → audience_type='B2B_ONLY'
    - Insert 4 new B2C LIVE courses (HIPAA, Call Etiquettes, PF Basics, Employee Policy)
    - Insert 3 B2B plans (Akash Standard, TechCorp Premium, Enterprise Pro)
    - Seed tenant_plan_map

🟡 FIX-SA-005   Tenant detail flags (March 19, 2026):
    - Flag 1: EditDetailsSlideOver locale fields → IANA timezone dropdown,
              date format dropdown, country searchable combobox
    - Flag 2: Contract tab Storage & Hosting hidden for RUN_ONLY tenants
    - Flag 3: B2B plans seeded (via KSS-DB-SA-003) — Plans tab now populated
    - Sidebar: Course Creation group + Create Course item

🟡 KSS-SA-009   Content Bank (unified assessments + courses table, Make Live workflow)
🟡 KSS-SA-004   Plans & Pricing — 3-tab page (decisions finalised March 19, 2026):
               Tab 1: B2C swimlane (Free/Basic/Pro/Premium) + category plans
               Tab 2: Course Pricing à la carte (INR + USD, annual Stripe recurring)
               Tab 3: B2B card grid (no price shown)
               Create B2C Plan + Create B2B Plan — tab-scoped entry points
               PRD: https://keyskillset-product-management.atlassian.net/
                    wiki/spaces/EKSS/pages/93093890
🟡 KSS-SA-005   Audit Log
🟡 KSS-SA-006   Analytics
🟡 KSS-SA-007   Marketing Config
🟡 KSS-SA-008   Master Organisation
🟡 KSS-SA-010   Dashboard (last)

Client Admin (pending — KSS-CA sprint, March 20, 2026):
🟡 KSS-DB-CA-001  CA schema migration (visibility_scope on content_items + 5 new tables + Akash seed)
🟡 KSS-CA-001     CA Layout + Navigation (sidebar, persona routing, feature_toggle_mode guards)
🟡 KSS-CA-002     Organisation (Departments + Teams CRUD + learner assignment to dept/team)
🟡 KSS-CA-003     Learner Management (list, manual add, CSV upload, profile, deactivate/reactivate, password reset)
🟡 KSS-CA-004     Catalog (browse + assign to Dept/Team/Individual, dynamic membership model)
🟡 KSS-CA-005     Content Bank (FULL_CREATOR only — INACTIVE → CA makes LIVE, archive)
🟡 KSS-CA-006     Reports (R3: Per-Learner Score, R5: Content Performance, R6: Certificates, R7: Activity Log)
🔵 KSS-CA-FUTURE-001  Content Creator interface /content-creator/[tenant]/ — FUTURE SCOPE (not scoped)

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
13. V2 DEFERRED: Assessments and courses in one plan — a single B2C/B2B plan
    will contain both assessment content AND course content together.
    Currently: assessments and courses are managed separately within plans.
    Do not build. Do not reference in V1 code.
14. Course à la carte + plan subscription coexistence — if a course is
    is_individually_purchasable = true, can a subscriber who has it in their
    plan retain access after unsubscribing? Not resolved for V1.
    Gate is: purchasable courses cannot be IN plans (mutually exclusive in V1).

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

## 25. SELF-CRITIQUE — AT EVERY ITERATION AND BEFORE EVERY COMMIT

IMPORTANT: Self-critique is not only for commits. Run it at every design
decision, every component choice, every data model change. Ask: "Is there
a simpler/more correct approach?" before writing any code.

Run this full checklist before presenting any code:

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
[ ] Storage & Hosting hidden for RUN_ONLY (feature_toggle_mode check)
[ ] All B2B plans are PLATFORM_WIDE — never CATEGORY_BUNDLE
[ ] B2B plan price never shown in UI (always "Via tenant contract")
[ ] Feature bullets stored as JSONB, max 7, 80 chars each
[ ] display_name used for customer-facing plan names
[ ] Course pricing fields are SA-editable only (not content creators)
[ ] Free tier is NOT a plan record — default unsubscribed state only
[ ] Create B2C Plan form creates assessment subscription plans ONLY — no course plans
[ ] Create B2B Plan form: name + description + max_attempts (default 10) ONLY
    No display_name, tagline, feature_bullets, is_popular, cta_label on B2B form
[ ] B2B plans grant ALL assessment types — no allowed_assessment_types filter
[ ] B2B max_attempts default = 10, editable in form and plan detail Overview tab
[ ] is_individually_purchasable courses EXCLUDED from B2C plan content pickers
[ ] Course à la carte: stripe_price_id = annual recurring Stripe Price ID
[ ] Tab 2 Course Pricing shows LIVE courses with audience_type B2C_ONLY or BOTH
[ ] Plans & Pricing page subtitle: "Manage B2C and B2B subscription plans and content entitlements"
[ ] No global Create Plan button in page header — tab-scoped buttons only
[ ] derivePlanType() must use actual scope column from DB, not name heuristics
[ ] price_usd_cents labeled "Price (USD)" everywhere — never "legacy USD" in UI or code
[ ] Tab 2 (Course Pricing) shows LIVE courses only — audience_type B2C_ONLY or BOTH
[ ] Purchasable courses greyed out in AddContentSlideOver with tooltip
[ ] MRR strip inside Tab 1 only — not in page header, not in Tab 2 or Tab 3

---

## 26. DEVELOPMENT WORKFLOW PROCEDURES

### A. Starting Any New Feature or Fix
1. Read CLAUDE.md fully before touching any code.
2. Read all relevant files before proposing changes.
3. Branch: git checkout -b feat/KSS-[TRACK]-[NNN] or fix/KSS-[TRACK]-[NNN]
4. If schema change needed: write SQL, present for approval, wait. Never auto-run.

### B. UX Research (run before any new UI component)
1. Launch Explore or general-purpose agent with specific research questions.
2. Research: industry patterns, 2-3 comparable platforms, UX tradeoffs.
3. Present findings + recommendation with rationale.
4. Get user decision before writing any code.

### C. Self-Critique (at every design/code decision)
1. After drafting any solution, ask: Is there a simpler approach?
2. Check all locked decisions in CLAUDE.md Sections 15 + 25.
3. Check design system compliance (Section 3).
4. Run the full Section 25 checklist before any commit.

### D. Schema Migration
1. Write SQL migration with IF NOT EXISTS guards.
2. Show full SQL to user — label it KSS-DB-SA-NNN.
3. Wait for explicit approval. Never run without it.
4. After user confirms run: update TypeScript types in src/lib/supabase/.
5. Update CLAUDE.md Section 4 schema docs.
6. Run npm run build to verify no type errors.

### E. Code Editing
1. Read file before editing. Never edit blind.
2. Make minimal targeted changes — no scope creep.
3. No unused imports. No commented-out code.
4. After changes: npm run build must pass before committing.

### F. Git Commit
1. git status + git diff to confirm scope.
2. Stage specific files (not git add -A).
3. Commit message: imperative mood, references prompt ID.
4. Co-authored-by: Claude Sonnet 4.6.
5. Never commit directly to main.

### G. PRD Update (Confluence)
1. Use MCP Atlassian tools (updateConfluencePage).
2. Update after ALL code for a feature is committed and build passes.
3. Update: version number, date, changed sections only.
4. Sections to always check: Data Model, API, UI Spec, Status.

---

## 27. CONTENT BANK SPEC (KSS-SA-009)

Unified table showing both content_items (assessments) AND courses.

### Columns
Title | Type (Assessment/Course) | Category | Status badge |
Audience badge | Created By | Created Date | Plan Count (N plans)

### Default view
Filter: Status = INACTIVE (primary SA review queue)
Sort: Created Date descending (newest first)

### Filters (filter bar above table)
Status (multi-select: INACTIVE/LIVE/DRAFT/ARCHIVED) |
Content Type (Assessment / Course) |
Audience (B2C_ONLY/B2B_ONLY/BOTH/Unset) |
Category (multi-select from exam_categories) |
Source (Internal/External)

### Row actions
INACTIVE items: "Make Live" button (blue-700) + "Archive" (zinc)
LIVE items: "Reclassify" + "Archive"
ARCHIVED items: read-only

### Make Live modal (enhanced single-step)
1. Metadata summary (read-only): title, type, category/course_type
2. Audience radio: B2C_ONLY | B2B_ONLY | BOTH
   Each option shows a one-line description.
3. Plan impact preview (computed on radio change):
   - Assessments: "Eligible for: [plan names matching audience + allowed types]"
   - Courses: "This course will become individually purchasable."
4. Confirm button: "Make Live"
No multi-step wizard. No blocking validation (content is pre-reviewed at INACTIVE).

### Bulk Make Live
Only permitted when all selected items share the same audience classification.
Otherwise: require individual promotion.

---

## 28. PLANS & PRICING PAGE SPEC (KSS-SA-004)

Route: /super-admin/plans-pricing (existing route, 3-tab structure)
Page subtitle: "Manage B2C and B2B subscription plans and content entitlements"
MRR strip: Total Platform MRR shown at top (global, covers all B2C plans)
Header: NO global "+ Create Plan" button. Create buttons live inside each tab.

### Tab 1 — Assessment Plans (B2C)
MRR strip: shown INSIDE Tab 1 only (not above the tabs — removed from page header area).
  Shows B2C plans MRR only. B2B plans excluded (price=0, billing via contract).

Layout: Swimlane comparison table
Columns: Free (Default) [read-only] | Basic | Professional | Premium
  Column headers = tier display labels (hardcoded). Maps to plans.tier:
    Basic → tier='BASIC', plan_audience='B2C'
    Professional → tier='PRO', plan_audience='B2C'
    Premium → tier='PREMIUM', plan_audience='B2C'
Below swimlane: category-specific plans in a separate section
  (SAT Pro, NEET Pro, JEE Premium — shown as table rows with same columns)

Swimlane row attributes (rows of the comparison table):
  Price (₹/month) | Subscriber Count | MRR | Status badge |
  Scope | Allowed Types | Max Attempts | Feature Bullets count
  Scope values display as: "Platform-wide" | "Category Bundle"

Actions: Edit button per plan → opens EditPlanSlideOver (480px right panel)
  Edit slide-over sections:
    Plan Identity: name (internal), display_name, tagline, is_popular, cta_label
    Scope: PLATFORM_WIDE / CATEGORY_BUNDLE (segmented control)
    Pricing: price (INR/month), billing cycle
    Access Rules: allowed_assessment_types checkboxes, max_attempts
    Feature Bullets + Footnote

Create: "Create B2C Plan" button (blue-700, top-right of Tab 1)
  → /super-admin/plans-pricing/new?audience=B2C
  Creates assessment subscription plans ONLY. No course plans. (Option Z — locked)

### Tab 2 — Course Pricing (B2C à la carte)
Layout: Table of LIVE B2C courses (audience_type = B2C_ONLY or BOTH only — no NULL/INACTIVE)
Columns: Course Title | Course Type | Status | Price (₹) | Price (USD) | Purchasable | Actions
SA edits per course row (inline or slide-over):
  price (INR) | price_usd_cents — shown as "Price (USD)", LIVE field, source of truth
  for Stripe checkout AND B2C pricing page display | is_individually_purchasable | stripe_price_id
stripe_price_id = recurring ANNUAL Stripe Price ID (managed by Stripe, not the platform)
price_usd_cents: NOT a legacy field. Rename everywhere as "Price (USD)". Live field.
  price (INR) + price_usd_cents (USD) = source of truth for Stripe checkout and
  end-user B2C pricing page display.
Empty state: "No courses available for pricing. Promote courses to Live in the Content Bank first."

GATE (locked): A course with is_individually_purchasable = true cannot be assigned
  to any B2C subscription plan.
  In AddContentSlideOver (course picker): show purchasable courses greyed out with
  tooltip: "This course is sold individually and cannot be added to a plan."
  If a course already in a plan is marked purchasable from Tab 2:
    → Show warning modal: "This will remove the course from [plan names]. Confirm?"
    → On confirm: remove from plans, set is_individually_purchasable = true
    → On cancel: revert the toggle

No "Create" button on Tab 2. SA enables à la carte from existing course rows only.

### Tab 3 — B2B Plans
Layout: Card grid
Each card: Plan Name | Assigned Tenants count | Content Items count | Status badge
No price shown anywhere on B2B cards.
Note at section top: "B2B plan pricing is managed per-tenant via the Contract tab."
Actions per card: "View" → plan detail page (/super-admin/plans-pricing/[id])

Create: "Create B2B Plan" button (blue-700, top-right of Tab 3)
  → /super-admin/plans-pricing/new?audience=B2B

### Create B2C Plan form (/new?audience=B2C)
Assessment subscription plans only. Sections:
  1. Plan Identity: name (internal)*, display_name (customer-facing),
     tagline, is_popular toggle, cta_label
  2. Scope: segmented control — Platform-Wide / Category Bundle
     (if Category Bundle: show category selector)
  3. Pricing: price (₹/month)*, billing cycle (Monthly — Annual V2)
  4. Access Rules: allowed_assessment_types* (checkboxes), max_attempts*
  5. Feature Bullets (dynamic list, max 7, 80 chars each) + Footnote
  Save as Draft | Publish Plan

### Create B2B Plan form (/new?audience=B2B)
B2B enterprise plans. Sections:
  1. Plan Identity: name (internal)*, description
  2. Max Attempts: number input, default 10, range 1–99
     (note: "Free attempt always included — 1 per assessment, all tiers")
  3. Scope: read-only badge — "Platform-Wide"
     caption: "B2B plans are always platform-wide."
  4. Pricing: read-only callout — "Pricing is managed per tenant via the
     Contract tab. No price is set on B2B plans."
  No display_name | No tagline | No feature_bullets | No is_popular | No cta_label
  All assessment types granted — no allowed_assessment_types restriction
  Save as Draft | Publish Plan

### Feature Bullets input component (B2C plans only — EditPlanSlideOver + Create B2C form)
Pattern: Dynamic add/remove list
- Start with 3 empty text inputs (placeholder: e.g. "Full-length Tests included")
- Each row: GripVertical icon | text input (80 char max, live counter) | Trash icon
- Add Bullet button (disabled at 7 items, shows "N of 7 max")
- Trash icon disabled on last remaining item
- State: JSONB array stored in plans.feature_bullets

---

## 29. KSS-DB-SA-003 MIGRATION SQL (authorised March 19, 2026)

Run in Supabase Dashboard → SQL Editor. RLS: OFF (Super Admin tables).

-- 1. courses table additions
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS audience_type text
    CHECK (audience_type IN ('B2C_ONLY', 'B2B_ONLY', 'BOTH')),
  ADD COLUMN IF NOT EXISTS price numeric,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS is_individually_purchasable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- 2. plans table additions
ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS tagline text,
  ADD COLUMN IF NOT EXISTS feature_bullets jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS footnote text,
  ADD COLUMN IF NOT EXISTS is_popular boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cta_label text;

-- 3. Update 4 existing LIVE courses → B2B_ONLY
UPDATE courses SET audience_type = 'B2B_ONLY' WHERE status = 'LIVE';

-- 4. Insert 4 new B2C LIVE courses
INSERT INTO courses
  (id, title, description, course_type, status, source, audience_type, currency)
VALUES
  (gen_random_uuid(), 'HIPAA Compliance Training',
   'Essential HIPAA compliance training covering PHI handling, breach protocols, and privacy rules.',
   'VIDEO', 'LIVE', 'PLATFORM', 'B2C_ONLY', 'INR'),
  (gen_random_uuid(), 'Call Centre Etiquettes',
   'Professional communication skills and call handling best practices for customer-facing roles.',
   'VIDEO', 'LIVE', 'PLATFORM', 'B2C_ONLY', 'INR'),
  (gen_random_uuid(), 'Provident Fund Basics',
   'Complete guide to EPF, VPF contributions, withdrawal rules, and employer compliance.',
   'VIDEO', 'LIVE', 'PLATFORM', 'B2C_ONLY', 'INR'),
  (gen_random_uuid(), 'Employee Policy Handbook',
   'Understanding workplace policies, code of conduct, leave entitlements, and HR procedures.',
   'VIDEO', 'LIVE', 'PLATFORM', 'B2C_ONLY', 'INR');

-- 5. Insert 3 B2B plans (all platform-wide, price=0)
INSERT INTO plans
  (id, name, display_name, description, price, billing_cycle, status,
   max_attempts_per_assessment, scope, category, plan_audience)
VALUES
  (gen_random_uuid(), 'Akash Standard', 'Akash Standard',
   'Platform-wide assessment and course access for Akash Institute Delhi learners.',
   0, 'MONTHLY', 'PUBLISHED', 99, 'PLATFORM_WIDE', NULL, 'B2B'),
  (gen_random_uuid(), 'TechCorp Premium', 'TechCorp Premium',
   'Premium platform-wide access for TechCorp India employees.',
   0, 'MONTHLY', 'PUBLISHED', 99, 'PLATFORM_WIDE', NULL, 'B2B'),
  (gen_random_uuid(), 'Enterprise Pro', 'Enterprise Pro',
   'Shared enterprise platform-wide plan for multi-tenant access.',
   0, 'MONTHLY', 'PUBLISHED', 99, 'PLATFORM_WIDE', NULL, 'B2B');

-- 6. Assign B2B plans to tenants
-- Akash Standard → Akash Institute Delhi
INSERT INTO tenant_plan_map (tenant_id, plan_id)
SELECT 'ec1bc005-e76d-4208-ab0f-abe0d316e260', id FROM plans WHERE name = 'Akash Standard';

-- TechCorp Premium → TechCorp India
INSERT INTO tenant_plan_map (tenant_id, plan_id)
SELECT '7caa0566-e31a-41b6-962d-30fb3d6cb011', id FROM plans WHERE name = 'TechCorp Premium';

-- Enterprise Pro → both tenants
INSERT INTO tenant_plan_map (tenant_id, plan_id)
SELECT 'ec1bc005-e76d-4208-ab0f-abe0d316e260', id FROM plans WHERE name = 'Enterprise Pro';
INSERT INTO tenant_plan_map (tenant_id, plan_id)
SELECT '7caa0566-e31a-41b6-962d-30fb3d6cb011', id FROM plans WHERE name = 'Enterprise Pro';

---

---

## 30. CLIENT ADMIN PLATFORM — ARCHITECTURE (V1, locked March 20, 2026)

### Routes (locked)
/client-admin/[tenant]/             — CA dashboard landing
/client-admin/[tenant]/org          — Departments + Teams
/client-admin/[tenant]/learners     — Learner management
/client-admin/[tenant]/catalog      — Content catalog + assignment
/client-admin/[tenant]/content-bank — Content Bank (FULL_CREATOR only)
/client-admin/[tenant]/reports      — Reports (R3, R5, R6, R7)
/content-creator/[tenant]/          — FUTURE SCOPE — NOT BUILT IN V1

### Tenant Slug → Tenant ID Map (locked)
akash    → ec1bc005-e76d-4208-ab0f-abe0d316e260  (Akash Institute Delhi, FULL_CREATOR)
techcorp → 7caa0566-e31a-41b6-962d-30fb3d6cb011  (TechCorp India, RUN_ONLY)

### Auth Pattern (demo)
Persona-selector based — same as SA. No JWT. tenant_id injected from URL slug.
All Supabase queries include .eq('tenant_id', tenantId) from slug resolution.

### Feature Mode Guards
FULL_CREATOR (Akash):  Content Bank page visible. Content Creator management available.
RUN_ONLY (TechCorp):   Content Bank hidden. Content Creator management hidden.
Guard: tenant.feature_toggle_mode === 'FULL_CREATOR' | 'RUN_ONLY'

### What is PERMANENTLY EXCLUDED from V1 (never add to CA code)
- Team Manager role — V2. No TEAM_MANAGER in admin_users for CA. All functions = CLIENT_ADMIN only.
- Groups — V2. No groups, learner_group_membership tables.
- Learning Paths — V2. No learning_paths, steps, enrollments, step_progress tables.
- Group as content assignment target — V2.
- Assessment completion certificates — V2 (V1: course completion only).
- R1 (Tenant Overview Dashboard) — V2 (needs learning path data for full value).
- R2 (Department Completion Rates) — V2 (needs learning path enrollments).
- R4 (Overdue Learners) — V2 (needs learning path deadlines).
- Push TENANT_PRIVATE content to SA global bank — V2.
- Learner-facing certificate download — V2 (learner-facing side out of scope V1).
- Content Creator interface /content-creator/[tenant]/ — FUTURE SCOPE.

### Content Model (locked — March 20, 2026)
content_items.tenant_id:
  NULL         → SA-authored content (GLOBAL — available to all tenants via plans)
  [tenant_id]  → Tenant-authored content (TENANT_PRIVATE — visible within owning tenant only)

content_items.visibility_scope:
  GLOBAL            → SA content. Appears in plan content pickers. Visible via B2B plan assignment.
  TENANT_PRIVATE    → Tenant content. Visible in that tenant's CA Catalog + CA Content Bank only.
  PENDING_PROMOTION → V2 (push to SA global bank workflow — NOT BUILT IN V1)

CA Catalog query rules:
  FULL_CREATOR tenant:
    GLOBAL content from plans assigned to this tenant (LIVE, B2B_ONLY or BOTH, via tenant_plan_map)
    + TENANT_PRIVATE LIVE content WHERE tenant_id = :this_tenant
  RUN_ONLY tenant:
    GLOBAL content from plans assigned to this tenant (LIVE, B2B_ONLY or BOTH) ONLY

SA Content Bank (KSS-SA-009) filter:
  Shows content WHERE visibility_scope = 'GLOBAL' (SA content only)
  Never shows TENANT_PRIVATE content in SA Content Bank

### CA Content Bank Page (FULL_CREATOR only — locked)
Source: content_items WHERE tenant_id = :tenant_id AND status IN ('INACTIVE', 'LIVE', 'ARCHIVED')
Default filter: status = 'INACTIVE' (CA review queue)
Make Live: sets status = 'LIVE'. visibility_scope stays TENANT_PRIVATE. No audience_type needed (not B2C).
Archive: sets status = 'ARCHIVED'.
Push to SA bank: V2 (PENDING_PROMOTION state — not built).

### Content Assignment Model (locked — V1)
Targets: DEPARTMENT | TEAM | INDIVIDUAL (all three in V1)
Groups as target: V2
Dynamic membership: YES
  ON assignment to DEPARTMENT/TEAM: all current members get learner_content_access records
  ON new learner added to that DEPARTMENT/TEAM: system creates learner_content_access for them
  ON learner removed from target: learner_content_access.revoked_at = NOW()
  Overlapping assignments: multiple learner_content_access rows; must revoke ALL to lose access
Content types: ASSESSMENT (from content_items) | COURSE (from courses table)

### Certificates V1 (locked)
Trigger: course completion (100% screens viewed). Assessment certificates = V2.
Contents: learner_name, content_title, tenant_name, completion_date, certificate_number
Format:   KSS-{tenant_short}-{YYYYMMDD}-{seq}   e.g. KSS-AKS-20260320-001
Learner download: in-app (learner-facing side V2 — not built)
CA visibility: Reports → R6 Certificates Issued Log (CA sees all certs for their tenant)

### Reports V1 (locked scope)
R3 — Per-Learner Score & Attempts     ✅ V1 (from content_assignments + attempts data)
R5 — Content Item Performance          ✅ V1 (avg score, pass rate, total attempts)
R6 — Certificates Issued Log           ✅ V1 (certificates table)
R7 — Learner Activity Log              ✅ V1 (last login, days since active)
R1 — Tenant Overview Dashboard         ❌ V2
R2 — Department Completion Rates       ❌ V2 (needs learning paths)
R4 — Overdue Learners                  ❌ V2 (needs learning path deadlines)

### CA Sidebar Navigation (locked V1)
Group          Item                 Visibility
────────────────────────────────────────────────
(none)         Dashboard            All CA
Organisation   Departments          All CA
Organisation   Teams (within dept)  All CA
Learners       Learners             All CA
Catalog        Catalog              All CA
Content Bank   Content Bank         FULL_CREATOR only (hidden for RUN_ONLY)
Reports        Reports              All CA (R3, R5, R6, R7)
Settings       Users & Roles        All CA
Settings       Audit Log            All CA (placeholder V1)

---

## 31. KSS-DB-CA-001 MIGRATION SQL (authorised March 20, 2026)

Run in Supabase Dashboard → SQL Editor. RLS: OFF (consistent with all admin tables).

-- 1. Add visibility_scope to content_items
ALTER TABLE content_items
  ADD COLUMN IF NOT EXISTS visibility_scope text NOT NULL DEFAULT 'GLOBAL'
    CHECK (visibility_scope IN ('GLOBAL', 'TENANT_PRIVATE', 'PENDING_PROMOTION'));

-- All existing rows are SA-authored (tenant_id IS NULL) → GLOBAL is correct default.
-- No UPDATE needed for existing rows.

-- 2. learner_profiles table
CREATE TABLE IF NOT EXISTS learner_profiles (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id           uuid NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  tenant_id            uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_roll_number text,
  notes                text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  UNIQUE (learner_id, tenant_id)
);

-- 3. content_assignments table
CREATE TABLE IF NOT EXISTS content_assignments (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  content_id   uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('ASSESSMENT', 'COURSE')),
  target_type  text NOT NULL CHECK (target_type IN ('DEPARTMENT', 'TEAM', 'INDIVIDUAL')),
  target_id    uuid NOT NULL,
  assigned_by  uuid NOT NULL REFERENCES admin_users(id),
  assigned_at  timestamptz DEFAULT now(),
  removed_at   timestamptz
);

-- 4. learner_content_access table
CREATE TABLE IF NOT EXISTS learner_content_access (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id           uuid NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  content_id           uuid NOT NULL,
  content_type         text NOT NULL CHECK (content_type IN ('ASSESSMENT', 'COURSE')),
  tenant_id            uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_assignment_id uuid REFERENCES content_assignments(id),
  granted_at           timestamptz DEFAULT now(),
  revoked_at           timestamptz
);

-- 5. certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  learner_id         uuid NOT NULL REFERENCES learners(id),
  content_id         uuid NOT NULL,
  content_type       text NOT NULL DEFAULT 'COURSE'
    CHECK (content_type IN ('COURSE')),
  tenant_id          uuid NOT NULL REFERENCES tenants(id),
  learner_name       text NOT NULL,
  content_title      text NOT NULL,
  tenant_name        text NOT NULL,
  certificate_number text NOT NULL UNIQUE,
  issued_at          timestamptz DEFAULT now()
);

-- 6. client_audit_log table
CREATE TABLE IF NOT EXISTS client_audit_log (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id     uuid NOT NULL REFERENCES admin_users(id),
  actor_name   text NOT NULL,
  actor_role   text NOT NULL CHECK (actor_role IN ('CLIENT_ADMIN', 'CONTENT_CREATOR')),
  action       text NOT NULL,
  entity_type  text NOT NULL,
  entity_id    uuid,
  before_state jsonb,
  after_state  jsonb,
  ip_address   text,
  created_at   timestamptz DEFAULT now()
);

-- 7. Seed INACTIVE tenant content for Akash Institute Delhi (FULL_CREATOR demo)
-- Akash tenant_id: ec1bc005-e76d-4208-ab0f-abe0d316e260
-- NEET exam_category_id: 23d482e7-81c3-4a10-bd60-52fd458595d6
-- FIXED March 20, 2026: removed description (no such column); tenant_scope_id NOT tenant_id

INSERT INTO content_items
  (id, title, exam_category_id, test_type, source,
   status, tenant_scope_id, visibility_scope, audience_type, created_at, updated_at)
VALUES
  (gen_random_uuid(),
   'Akash Institute — NEET Foundation Batch Notes',
   '23d482e7-81c3-4a10-bd60-52fd458595d6', 'CHAPTER_TEST', 'TENANT',
   'INACTIVE', 'ec1bc005-e76d-4208-ab0f-abe0d316e260', 'TENANT_PRIVATE', NULL, now(), now()),
  (gen_random_uuid(),
   'Akash Institute — Physics Mechanics Practice Set',
   '23d482e7-81c3-4a10-bd60-52fd458595d6', 'SUBJECT_TEST', 'TENANT',
   'INACTIVE', 'ec1bc005-e76d-4208-ab0f-abe0d316e260', 'TENANT_PRIVATE', NULL, now(), now()),
  (gen_random_uuid(),
   'Akash Institute — NEET Internal Mock Test Series 1',
   '23d482e7-81c3-4a10-bd60-52fd458595d6', 'FULL_TEST', 'TENANT',
   'INACTIVE', 'ec1bc005-e76d-4208-ab0f-abe0d316e260', 'TENANT_PRIVATE', NULL, now(), now());

---

*CLAUDE.md — keySkillset v5.0 — Updated March 20, 2026*
*Source of truth for Claude Code sessions*
*PRD updates: use Confluence MCP tools in Claude Code or Claude.ai*
*Do not edit this file manually*
