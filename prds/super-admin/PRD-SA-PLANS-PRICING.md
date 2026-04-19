# PRD KSS-SA-039: Category Plan Gating & Demo Infrastructure

**Status:** DRAFT  
**Author:** Sandesh Banakar I  
**Stakeholders:** Engineering (Radhika, Yashwanthkrishna), Product, QA, Design  
**Target Version:** V1 (Current)

---

## 1. Executive Summary & "The Why"

### 1.1 Problem Statement

Three gaps exist after the category plans schema was introduced (KSS-SA-038):

1. **No assessment gating for category plans.** A Free user who subscribes to a NEET Basic category plan has a valid `b2c_assessment_subscriptions` row but gains no actual access to NEET assessments. `AppContext` only exposes `subscriptionTier` (platform tier). Every gating check in the app — `AssessmentCard.deriveCardState()`, exam instructions, catalog — reads only this field. Category plan subscriptions are completely invisible to all gating logic.

2. **Demo infrastructure is incomplete.** There are no demo personas for category plan users in the persona selector. Engineers testing the platform cannot experience or validate the category plan flow end-to-end without manually patching AppContext or running ad-hoc SQL.

3. **SA visibility gap in B2C Users.** The B2C Users list shows only `subscription_tier` (platform tier). A user with a NEET Basic category plan is indistinguishable from a genuinely Free user. Super Admins cannot distinguish platform plan holders from category plan holders at a glance.

### 1.2 Business Value & ROI

Enables the engineering team to demo and validate the full category plan subscription loop:
- Category plan purchase → assessment access gating
- Cross-category lock UX (State 3) and the "Switch Plan" flow
- SA visibility of mixed plan types in B2C Users
- Mutual exclusivity enforcement at checkout

### 1.3 Strategic Alignment

Prerequisite for the B2C demo-ready milestone. Category plans already exist in Plans & Pricing (SA side); this ticket makes them functional and demonstrable from the learner's perspective, and visible to the Super Admin.

---

## 2. User Personas & Impact

| Persona | Impact / Workflow Change |
| :--- | :--- |
| **Super Admin** | B2C Users list now has a "Plan" column showing each user's active platform plan OR category plan. No longer conflates Free-platform users with category plan subscribers. |
| **Internal Team / Demo Engineer** | Three new learner personas available in persona selector: Ananya Krishnan (NEET Basic), Rohan Mehta (JEE Basic), Preethi Nair (CLAT Basic). Each has a seeded subscription and `activePlanInfo` wired into AppContext. |
| **B2C Learner (End User)** | Experiences correct assessment gating. NEET Basic plan → access to NEET assessments. Attempting to start a JEE/CLAT/SAT assessment shows State 3: "Take Free Test" + "Switch Plan" CTA. Full end-user spec: `prds/end-user/PRD-B2C-END-USER-ASSESS-PLANS.md`. |

---

## 3. User Flow & System Logic

### 3.1 SA: B2C Users — Plan Column

- **Entry Point:** SA navigates to `/super-admin/b2c-users`
- **Process:** `fetchB2CUsers` performs a LATERAL JOIN on `b2c_assessment_subscriptions` (most recent active, non-expired row per user) and resolves plan display name, scope, tier, and category from `plans`.
- **Outcome:**
  - Platform plan holder → Plan column shows `Basic` / `Professional` / `Premium` with tier badge colour
  - Category plan holder → Plan column shows `NEET Basic` / `JEE Pro` etc. with category badge
  - No active plan → `—`
  - The existing "Tier" column still shows `subscription_tier` (platform tier only). These two columns are intentionally different for category plan users (Tier = Free, Plan = NEET Basic).

### 3.2 Persona Selector — Category Plan Learners Bay

- **Entry Point:** `localhost:3000` before login
- **Process:** A new "Category Plan Learners" section renders below the existing "Learner Personas" section. Three cards with distinct icons and colours (see §6.2).
- **Outcome:** On click, `switchPersona(userId)` sets `subscriptionTier: 'free'` (platform tier) AND `activePlanInfo: { scope: 'CATEGORY_BUNDLE', tier: 'BASIC', category: 'NEET' | 'JEE' | 'CLAT' }`. User routes to `/assessments`.

### 3.3 Assessment Card — State 3: Category Mismatch

Full spec in `prds/end-user/PRD-B2C-END-USER-ASSESS-PLANS.md §2`. Summary:
- Category plan user on an assessment outside their plan category → State 3
- CTA: "Take Free Test" (if free attempt unused) + "Switch Plan" → `/plans?highlight={examCategory}`
- Free attempt exhausted on wrong-category assessment → "View Analysis" + "Switch Plan" secondary

### 3.4 Checkout — Mutual Exclusivity Gate

- **Entry Point:** User navigates to `/checkout`
- **Process:** On mount, `/checkout` calls `fetchActivePlanForUser(user.id)`. If a non-null active subscription is returned, checkout is blocked.
- **Outcome:** Full-page blocker: "You already have an active plan. Cancel it from your profile before purchasing a new one." + CTA → `/plans`. No payment form rendered.
- **V1 scope:** UI-level enforcement only. No DB trigger or server-side constraint.

---

## 4. Subscription Tier Process — Platform Plan vs Category Plan

This section is the canonical reference for `users.subscription_tier` and `activePlanInfo`. **Read before modifying any subscription or gating code.**

### 4.1 Platform Plan Subscription

| Step | What happens |
|------|-------------|
| User purchases platform plan (Basic / Pro / Premium) | `b2c_assessment_subscriptions` row inserted: `plan_id` → PLATFORM_WIDE plan, `status = 'active'` |
| `users.subscription_tier` | Updated to `'basic'` / `'professional'` / `'premium'` |
| `activePlanInfo` in AppContext | `{ scope: 'PLATFORM_WIDE', tier: 'BASIC' / 'PRO' / 'PREMIUM', category: null }` |
| **In demo** | Both fields seeded via SQL (`users.subscription_tier`) and hardcoded in `demoUsers.ts` (`active_plan_info`). |
| **In production** | Stripe webhook updates `users.subscription_tier`. `activePlanInfo` fetched once from `b2c_assessment_subscriptions` on session load. |

### 4.2 Category Plan Subscription

| Step | What happens |
|------|-------------|
| User purchases category plan (e.g. NEET Basic) | `b2c_assessment_subscriptions` row inserted: `plan_id` → CATEGORY_BUNDLE plan, `status = 'active'` |
| `users.subscription_tier` | **Stays `'free'`. Category plans NEVER write to this field.** |
| `activePlanInfo` in AppContext | `{ scope: 'CATEGORY_BUNDLE', tier: 'BASIC', category: 'NEET' }` |
| **In demo** | `b2c_assessment_subscriptions` row seeded via SQL. `demoUsers.ts` hardcodes `subscription_tier: 'free'` + `active_plan_info`. |
| **In production** | No webhook in demo codebase. `activePlanInfo` fetched from `b2c_assessment_subscriptions` on session load. `subscription_tier` is never updated for category plans — it is a platform-only field. |

> **Rule locked in CLAUDE-DB.md:** `users.subscription_tier` reflects platform plan tier ONLY. It is NEVER set by a category plan subscription. This is permanent.

### 4.3 Plan Switching — Mutual Exclusivity Rules

A user holds **exactly one** active assessment plan at a time: either a platform plan OR a category plan, never both simultaneously.

| Switch scenario | Process |
|----------------|---------|
| Platform → Category | User cancels platform plan first (at `/plans`). Then purchases category plan. `subscription_tier` reset to `'free'` on cancel. |
| Category → Platform | User cancels category plan first. Then purchases platform plan. `subscription_tier` updated to new tier on purchase. |
| Category → Different Category | Cancel first, then purchase. |
| Platform → Platform (upgrade, same tier group) | No cancel required — same scope, higher tier. CTA: "Upgrade". |
| Category → Category (upgrade, same exam) | No cancel required — same scope + category, higher tier. CTA: "Upgrade". |

### 4.4 `activePlanInfo` — Shape & Lifecycle

```typescript
// Added to User type in src/types/index.ts
activePlanInfo?: {
  scope: 'PLATFORM_WIDE' | 'CATEGORY_BUNDLE'
  tier: 'BASIC' | 'PRO' | 'PREMIUM' | null
  category: string | null  // exam category name e.g. 'NEET' — null for PLATFORM_WIDE
} | null
```

- **Demo:** Set statically in `demoUsers.ts` per persona. Loaded into AppContext via `demoUserToUser()` on persona select.
- **Production (future):** Fetched **once on session start** from `b2c_assessment_subscriptions` (most recent active, non-expired row, ordered by `current_period_end DESC`). Stored in AppContext for the session. Never re-fetched mid-session.
- **No active plan:** `activePlanInfo = null`. User treated as free for all gating.

---

## 5. Functional Requirements (BDD Style)

### Scenario 1: SA views category plan holder in B2C Users list

* **Given** user Ananya Krishnan has an active `b2c_assessment_subscriptions` row with `plan_id` pointing to a NEET Basic CATEGORY_BUNDLE plan
* **When** a Super Admin views `/super-admin/b2c-users`
* **Then** Ananya's "Tier" column shows `Free` (platform tier) and "Plan" column shows `NEET Basic` with a category plan badge
* **And** she appears under the "Free" tier tab filter

### Scenario 2: SA views platform plan holder in B2C Users list

* **Given** user Priya Sharma has `subscription_tier = 'professional'`
* **When** SA views `/super-admin/b2c-users`
* **Then** Priya's "Tier" column shows `Professional` and "Plan" column also shows `Professional` (or the plan display name)

### Scenario 3: Demo engineer selects NEET Basic persona

* **Given** persona selector is visible at `localhost:3000`
* **When** engineer clicks "Ananya Krishnan" in the "Category Plan Learners" bay
* **Then** AppContext sets `subscriptionTier = 'free'` and `activePlanInfo = { scope: 'CATEGORY_BUNDLE', tier: 'BASIC', category: 'NEET' }`
* **And** user is routed to `/assessments`

### Scenario 4: NEET Basic user views a NEET assessment

* **Given** `activePlanInfo.category = 'NEET'` and `activePlanInfo.tier = 'BASIC'`
* **And** the assessment is a NEET Full Test with `min_tier = 'basic'`
* **When** the assessment card renders
* **Then** normal plan-access states (4/5/6/7) apply — assessment is accessible

### Scenario 5: NEET Basic user views a JEE assessment (State 3)

* **Given** `activePlanInfo.category = 'NEET'` and assessment exam category = `'JEE'`
* **When** the assessment card renders
* **Then** State 3 renders: primary CTA "Take Free Test" (if free attempt unused), secondary "Switch Plan" → `/plans?highlight=JEE`

### Scenario 6: User with active plan tries to checkout

* **Given** user has any non-null active subscription (`fetchActivePlanForUser` returns non-null)
* **When** they navigate to `/checkout`
* **Then** a full-page blocker renders: "You already have an active plan. Cancel it before purchasing a new one."
* **And** a CTA button routes to `/plans`. No payment form is shown.

---

## 6. Technical Specifications

### 6.1 DB Seed (Authorised KSS-DB-039a–d)

| Migration | Description |
|-----------|-------------|
| KSS-DB-039a | Check `exam_categories.name` values — confirm strings for NEET / JEE / CLAT match `plans.category` |
| KSS-DB-039b | Insert 9 category plans (NEET / JEE / CLAT × BASIC / PRO / PREMIUM), `status = 'PUBLISHED'`, `plan_audience = 'B2C'`, `plan_category = 'ASSESSMENT'`, `scope = 'CATEGORY_BUNDLE'` |
| KSS-DB-039c | Insert 3 demo users into `users` table with `subscription_tier = 'free'` |
| KSS-DB-039d | Insert `b2c_assessment_subscriptions` rows (one per demo user, `status = 'active'`, `plan_id` → respective BASIC plan) |

**Demo user seeds:**

| User | UUID | Email | `subscription_tier` | Category Plan |
|------|------|-------|---------------------|---------------|
| Ananya Krishnan | `c1a2e3b4-5f6a-7b8c-9d0e-f1a2b3c4d5e6` | `neet@keyskillset.com` | `free` | NEET Basic |
| Rohan Mehta | `d2b3f4c5-6a7b-8c9d-0e1f-a2b3c4d5e6f7` | `jee@keyskillset.com` | `free` | JEE Basic |
| Preethi Nair | `e3c4a5d6-7b8c-9d0e-1f2a-b3c4d5e6f7a8` | `clat@keyskillset.com` | `free` | CLAT Basic |

### 6.2 Persona Selector — Category Plan Learners Bay

Visual spec for the 3 new cards (rendered below "Learner Personas" divider, same grid):

| User | Avatar colour | Icon | Badge label |
|------|---------------|------|-------------|
| Ananya Krishnan | `bg-green-700` | `FlaskConical` | `NEET · Basic` |
| Rohan Mehta | `bg-orange-600` | `Atom` | `JEE · Basic` |
| Preethi Nair | `bg-purple-700` | `Scale` | `CLAT · Basic` |

- Avatar shape: `rounded-full` (matches existing learner personas)
- Section divider label: "Category Plan Learners"

### 6.3 `fetchB2CUsers` — Eager Plan Join

```sql
SELECT
  u.*,
  p.display_name  AS active_plan_display_name,
  p.name          AS active_plan_name,
  p.scope         AS active_plan_scope,
  p.tier          AS active_plan_tier,
  p.category      AS active_plan_category
FROM users u
LEFT JOIN LATERAL (
  SELECT plan_id
  FROM b2c_assessment_subscriptions
  WHERE user_id = u.id
    AND status = 'active'
    AND current_period_end > NOW()
  ORDER BY current_period_end DESC
  LIMIT 1
) bas ON true
LEFT JOIN plans p ON p.id = bas.plan_id
```

`B2CUser` type gains: `activePlanDisplayName`, `activePlanScope`, `activePlanTier`, `activePlanCategory` (all nullable).

### 6.4 Assessment Card State 3 — `deriveCardState()` Change

State 3 is evaluated **before** States 4–7 (plan-access states). Condition:

```
activePlanInfo !== null
  AND activePlanInfo.scope === 'CATEGORY_BUNDLE'
  AND assessmentExamCategory !== activePlanInfo.category
```

Where `assessmentExamCategory` = `assessment.exam` from the `assessments` table (the field already available in card props).

| Sub-state | Condition | Primary CTA | Secondary |
|-----------|-----------|-------------|-----------|
| 3a | Free attempt not used | "Take Free Test" | "Switch Plan" → `/plans?highlight={examCategory}` |
| 3b | Free attempt used + COMPLETED | "View Analysis" | "Switch Plan" → `/plans?highlight={examCategory}` |
| 3c | Attempt in-progress | "Resume Test" | "Switch Plan" (subtle, below CTA) |

---

## 7. Impacted Existing Components

| Component | Change |
|-----------|--------|
| `src/data/demoUsers.ts` | Add `active_plan_info` optional field to `DemoUser` type + 3 new users |
| `src/types/index.ts` | Add `activePlanInfo` to `User` type |
| `src/context/AppContext.tsx` | Map `active_plan_info` → `activePlanInfo` in `demoUserToUser()` |
| `src/app/page.tsx` | New "Category Plan Learners" bay with 3 personas |
| `src/components/assessment/AssessmentCard.tsx` | `deriveCardState()` State 3 logic + UI render |
| `src/app/plans/page.tsx` | `?highlight=` param → scroll + 2s ring animation (cross-ref end-user PRD §1.3) |
| `src/lib/supabase/b2c-users.ts` | `fetchB2CUsers` LATERAL JOIN + `B2CUser` type |
| `src/app/super-admin/b2c-users/page.tsx` | Add "Plan" column after "Tier" column |
| `src/app/checkout/page.tsx` | Block render if `fetchActivePlanForUser` returns non-null |

---

## 8. Scope Boundaries

### 8.1 IN SCOPE (V1 — this ticket)
- DB seed SQL for 9 category plans + 3 demo users + 3 subscription rows
- `activePlanInfo` in `AppContext` (static from `demoUsers.ts`)
- Persona selector "Category Plan Learners" bay
- Assessment card State 3 (category mismatch gating)
- B2C Users "Plan" column (eager join)
- `/plans?highlight=` scroll + 2s ring animation
- Checkout mutual exclusivity gate (UI-level)
- Doc updates: CLAUDE-DB.md, CLAUDE-PLATFORM.md, CLAUDE-RULES.md

### 8.2 OUT OF SCOPE (V2 / Deferred)
- Real Stripe webhook updating `subscription_tier` or `activePlanInfo`
- Production session-based `activePlanInfo` fetch (no auth system yet)
- Plan cancellation flow UI (placeholder in end-user PRD)
- Plan upgrade/downgrade within same group flow
- Category plan analytics
- Course plans gating

---

## 9. Edge Cases & Risk Mitigation

| Edge Case | Mitigation |
|-----------|-----------|
| `exam_categories.name` strings don't match `plans.category` strings | KSS-DB-039a verifies match before 039b seeds plans. Gating uses exact string match — misalignment = no access granted (fail-safe). |
| User has two active subscription rows (data inconsistency) | `fetchActivePlanForUser` returns only the most recent active row. Mutual exclusivity enforced at UI prevents this; LATERAL JOIN in `fetchB2CUsers` also takes only 1 row per user. |
| Category plan demo user visits `/plans` | `fetchActivePlanForUser(user.id)` reads from real DB subscription row (seeded in 039d). CTA logic renders correctly (Current Plan badge on NEET Basic). |
| `activePlanInfo` null for existing platform users (backwards compat) | All existing gating reads `subscriptionTier` first. `activePlanInfo` is only consulted when `scope === 'CATEGORY_BUNDLE'`. Null `activePlanInfo` = no category plan = existing behaviour unchanged. |
| `?highlight=` param references a category with no PUBLISHED plans | Param is silently ignored — no scroll, no animation. Page renders normally. |

---

## 10. Success Metrics

- All 3 category plan personas load in persona selector without errors
- NEET Basic persona: NEET assessments show States 4–7 (accessible), JEE/CLAT/SAT show State 3
- SA B2C Users: 3 new demo users appear with correct "Plan" column values; existing users unaffected
- `/checkout` blocks a second subscription attempt with clear message
- `/plans?highlight=NEET` scrolls to NEET section and plays 2s ring animation
- `npm run build` and `npm run lint` pass with zero errors

---

## 11. Addendum — KSS-SA-040 (Apr 19 2026): Plan Status + Tier Cascade + Seeding

**Follow-on ticket to KSS-SA-039. Covers four shipped tasks:**

### 11.1 Plan Status Standardization

**Problem:** All B2C assessment plan cards showed "Draft" badge despite plans being live. Root cause: `PlanStatusBadge` had no `PUBLISHED` config key, so `status='PUBLISHED'` fell through to the Draft fallback. Additionally, `fetchLivePlatformPlans` and `fetchLiveCategoryPlansGrouped` queried `.eq('status','PUBLISHED')` — the end-user `/plans` page returned zero plans.

**Fix:** Standardized the entire platform to `LIVE | DRAFT | DELETED`. All code references to `PUBLISHED` replaced with `LIVE`. DB migration: `UPDATE plans SET status = 'LIVE' WHERE status = 'PUBLISHED'`. New DB column: `allowed_assessment_types text[] DEFAULT '{}'`.

### 11.2 Tier Cascade for `allowed_assessment_types`

When a SA creates or views a B2C ASSESSMENT plan, the allowed test types are automatically derived from tier — the SA cannot freely toggle them.

| Tier | Allowed Types |
|------|--------------|
| BASIC | `['FULL_TEST']` |
| PRO | `['FULL_TEST', 'SUBJECT_TEST']` |
| PREMIUM | `['FULL_TEST', 'SUBJECT_TEST', 'CHAPTER_TEST']` |

In the Create form: Section 4 shows read-only tiles (blue = included, dim = excluded). In EditPlanSlideOver: same read-only tiles with subtitle "Allowed types are derived from tier and cannot be changed." Tier field added to Edit form as read-only coloured badge.

### 11.3 Uniqueness Guard

Before any B2C ASSESSMENT plan is made LIVE, `checkLivePlanExistsForTierScope(tier, scope, category, excludePlanId?)` is called:
- Returns `true` if a conflict exists → action blocked with inline error
- PLATFORM_WIDE: unique on tier
- CATEGORY_BUNDLE: unique on tier+category
- `excludePlanId` prevents self-conflict on the detail page
- Guard fires at: Create form "Make Live" + PlanOverviewTab "Make Live"
- Drafts are exempt — guard only fires on the LIVE transition

### 11.4 Plan Seeding — 18 Plans

18 fresh B2C ASSESSMENT plans seeded (`docs/SQL-SEED-PLANS.txt`):

| Scope | Category | BASIC UUID | PRO UUID | PREMIUM UUID |
|-------|----------|-----------|----------|-------------|
| PLATFORM_WIDE | — | `a1000001-...-0001` | `a1000001-...-0002` | `a1000001-...-0003` |
| CATEGORY_BUNDLE | NEET | `a2000001-...-0001` | `a2000001-...-0002` | `a2000001-...-0003` |
| CATEGORY_BUNDLE | JEE | `a3000001-...-0001` | `a3000001-...-0002` | `a3000001-...-0003` |
| CATEGORY_BUNDLE | SAT | `a4000001-...-0001` | `a4000001-...-0002` | `a4000001-...-0003` |
| CATEGORY_BUNDLE | CLAT | `a5000001-...-0001` | `a5000001-...-0002` | `a5000001-...-0003` |
| CATEGORY_BUNDLE | PMP | `a6000001-...-0001` | `a6000001-...-0002` | `a6000001-...-0003` |

Pricing: Platform BASIC=₹299/PRO=₹499/PREMIUM=₹699. Category BASIC=₹99/PRO=₹299/PREMIUM=₹499. max_attempts=5 (1 free always included). Assessments linked via `plan_content_map` using JOIN on `exam_categories.name`.

### 11.5 DB Migrations Required (PENDING — user to run)

| Key | SQL |
|-----|-----|
| KSS-DB-040a | `ALTER TABLE plans ADD COLUMN IF NOT EXISTS allowed_assessment_types text[] DEFAULT '{}'` |
| KSS-DB-040b | `UPDATE plans SET status = 'LIVE' WHERE status = 'PUBLISHED'` |
| KSS-DB-040c | Full 18-plan seed from `docs/SQL-SEED-PLANS.txt` |
