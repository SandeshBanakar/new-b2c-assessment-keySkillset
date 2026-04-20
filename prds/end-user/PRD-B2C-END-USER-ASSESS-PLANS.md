# PRD: B2C End-User Assessment Plans

**Status:** DRAFT — Section 1 LOCKED, Sections 2–5 PLACEHOLDER  
**Author:** Sandesh Banakar I  
**Stakeholders:** Engineering (Radhika, Yashwanthkrishna), Product, QA, Design  
**Target Version:** V1 (Current)  
**Related SA PRD:** `prds/super-admin/PRD-SA-PLANS-PRICING.md` (KSS-SA-039)

---

## Overview

This PRD covers the full end-user assessment plans experience — plan discovery, purchase, gating, upgrade, and cancellation. **Section 1 (`/plans` page) is fully specified.** Sections 2–5 are structural placeholders to be filled in future tickets as each flow is designed.

---

## Section 1: /plans Page

**Route:** `/plans`  
**Auth:** Requires active persona (AuthGuard). Unauthenticated users are redirected to `/` (persona selector).

---

### 1.1 Page Layout

The page renders two groups of plan cards stacked vertically.

**Group A — Platform Plans**  
Scope: `PLATFORM_WIDE`. Three cards (BASIC / PRO / PREMIUM), ordered ascending by price.  
Fetched via `fetchLivePlatformPlans()`:
```
plan_audience = 'B2C'
plan_category = 'ASSESSMENT'
scope = 'PLATFORM_WIDE'
status = 'LIVE'
ORDER BY price ASC
```

**Group B — Category Plans**  
Scope: `CATEGORY_BUNDLE`. Grouped by `plans.category` (e.g. NEET, JEE, CLAT). Each category shows 3 cards: BASIC / PRO / PREMIUM.

Fetched via `fetchLiveCategoryPlansGrouped()`:
```
plan_audience = 'B2C'
plan_category = 'ASSESSMENT'
scope = 'CATEGORY_BUNDLE'
status = 'LIVE'
feature_bullets != '[]'
ORDER BY price ASC
```

> **Guard:** A category is only shown if all 3 tiers (BASIC, PRO, PREMIUM) exist and are LIVE. Partial categories are silently excluded from the page. This is intentional — showing 1 or 2 tier cards with no upgrade path creates a confusing UX.

---

### 1.2 CTA Logic per Plan Card

Each card CTA is determined by `getPlanCTA(plan, activePlan)` where `activePlan` comes from `fetchActivePlanForUser(user.id)`.

**`activePlan` shape:**
```typescript
{
  planId: string
  scope: 'PLATFORM_WIDE' | 'CATEGORY_BUNDLE'
  category: string | null
  tier: 'BASIC' | 'PRO' | 'PREMIUM' | null
}
```

| User state | CTA label | CTA enabled | Style |
|-----------|-----------|-------------|-------|
| No active plan | plan's `cta_label` or "Get [Plan Name]" | ✓ | `primary` (blue filled) |
| Viewing their current plan | "Current Plan" | ✗ | `current` (zinc, disabled) |
| Upgrade within same group | "Upgrade to [Plan Name]" | ✓ | `primary` |
| Downgrade within same group | "Unable to Downgrade" | ✗ | `muted` (opacity-50) |
| Different scope or different category | "Cancel current plan first" | ✗ | `blocked` (opacity-50) |

**"Same group" definition:** `plan.scope === activePlan.scope` AND either both are `PLATFORM_WIDE` or `plan.category === activePlan.category`.

---

### 1.3 `/plans?highlight={category}` Behaviour

Used when a learner arrives via a "Switch Plan" CTA from an assessment card (State 3 — category mismatch). Designed to direct the user to the relevant category section without cognitive overhead.

**Parameter:** `?highlight=NEET` (or `JEE`, `CLAT` — must match `plans.category` exactly, case-sensitive).

**Behaviour on mount:**
1. Parse `highlight` from `useSearchParams()`
2. Find the DOM element for the category section with that key (ref'd via `data-category` attribute)
3. `element.scrollIntoView({ behavior: 'smooth', block: 'start' })`
4. Apply ring classes to the section container: `ring-2 ring-blue-500 ring-offset-2 rounded-md`
5. After 2000ms, remove ring classes (CSS transition `duration-700 ease-out` handles fade)

**Failure case:** If the `highlight` param references a category not present on the page (no PUBLISHED plans for that category), the param is silently ignored. Page renders normally with no scroll or animation.

**Implementation note:** The ring state is managed via a `highlightedCategory` state variable set on mount. The 2s timeout clears it via `setTimeout(() => setHighlightedCategory(null), 2000)` inside a `useEffect` with a cleanup to clear the timeout on unmount.

---

### 1.4 Mutual Exclusivity Messaging on Card

When a user has an active plan and views a card in a **different group**:
- CTA: **"Cancel current plan first"** (disabled button, `blocked` style)
- No tooltip or inline explanation in V1
- The full cancellation flow is in §4 (PLACEHOLDER)

This ensures the user understands the constraint without needing a modal or interstitial. The path: see the "Cancel" CTA → go to their profile → cancel → return to `/plans` to purchase the new plan.

---

### 1.5 Mobile Responsiveness

| Element | Mobile | Desktop (md+) |
|---------|--------|---------------|
| Platform plans | Single-column card stack | 3-column grid |
| Category section label | Full-width, sticky top for scroll context | Standard header |
| Category plan cards | Horizontally scrollable row (`overflow-x-auto`, card min-width: `min-w-[240px]`) | 3-column grid |
| Plan card CTA | Full-width button | Standard width |

---

### 1.6 State: No Plans Available

If `fetchLivePlatformPlans` returns an empty array AND `fetchLiveCategoryPlansGrouped` returns an empty object:
- Show a single empty state: "No plans available right now. Check back soon."
- No group headers rendered.

---

## Section 2: Assessment Card Gating

**Status:** LOCKED (KSS-B2C-001, Apr 20 2026)

---

### 2.1 Assessment Min-Tier Assignment

Each assessment has a `min_tier` column that controls which subscription tier unlocks paid attempts. The canonical mapping (applied unconditionally via DB migration KSS-DB-045):

| `assessment_type` | `min_tier` |
|-------------------|-----------|
| `full-test`       | `basic`   |
| `subject-test`    | `professional` |
| `chapter-test`    | `premium` |

This implements cumulative coverage: BASIC unlocks full-tests only; PRO unlocks full + subject; PREMIUM unlocks all three types.

---

### 2.2 Effective Tier Resolution

Access is granted when `effectiveTierAllows` is true. Resolution order:

1. **Platform plan:** `TIER_ORDER[userSubscriptionTier] >= TIER_ORDER[assessment.min_tier]`  
   `TIER_ORDER = { free: 0, basic: 1, professional: 2, premium: 3 }`

2. **Category plan (if platform check fails and `activePlanInfo.scope === 'CATEGORY_BUNDLE'`):**
   - `activePlanInfo.category` must equal `normalizeExam(assessment.exam_type)` (normalise: `IIT-JEE` → `JEE`)
   - Map plan tier to platform tier: `{ BASIC→basic, PRO→professional, PREMIUM→premium }`
   - Then apply same `TIER_ORDER` check

If either check passes, the user has paid access for that assessment.

---

### 2.3 Card States (7 total)

`deriveCardState()` returns a `CardState` value `1–7`. States are evaluated in priority order:

| State | Name | Condition | Primary CTA | Secondary CTA |
|-------|------|-----------|-------------|---------------|
| 7 | All attempts used | `attemptsUsed >= 6` | "View Analysis" | — |
| 3 | Category mismatch | `activePlanInfo.scope === 'CATEGORY_BUNDLE'` AND `exam !== activePlanInfo.category` | "Take Free Test" (or "Resume" / "View Analysis" if prior attempts) | "Switch Plan" → `/plans?highlight={exam}` |
| 4 | Subscribed, not started | `effectiveTierAllows` AND `attemptsUsed === 0` | "Start Your Test" | Optional: score target widget (SAT full-test only, first time) |
| 5 | Subscribed, in progress | `effectiveTierAllows` AND `status === 'inprogress'` | "Resume Test" | — |
| 6 | Subscribed, completed (attempts remain) | `effectiveTierAllows` AND `attemptsUsed > 0 && < 6` | "View Analysis" | — |
| 1 | Locked, free attempt available | `!effectiveTierAllows` AND `!freeAttemptUsed` | "Take Free Test" | "Upgrade to Access" → `/plans` |
| 2 | Locked, free attempt exhausted | `!effectiveTierAllows` AND `freeAttemptUsed` | "Continue Your Test" (leads to locked gate) | "Upgrade to Access" → `/plans` |

> State 3 fires before the effective-tier check. A category plan user on a wrong-exam assessment always lands in State 3, even if that exam's assessment has a `min_tier` their tier would satisfy.

---

### 2.4 Attempts Tab — 6-Row Rule

The Attempts tab always renders **exactly 6 rows**: 1 Free Attempt row + 5 paid Attempt rows. This applies to ALL users regardless of tier, plan scope, or attempt history.

**Free Attempt row:**
- Always visible
- States: `not_started` (show "Start Free Attempt"), `in_progress` (show "Resume Test"), `completed` (show "View Analysis"), `abandoned` (show status badge, no action)

**Paid Attempt rows 1–5:**
Sequential unlock: Attempt N is unlocked only after Attempt N-1 is `completed` or `abandoned`.  
The free attempt is the prerequisite for Attempt 1.

Row states for each paid row:

| Condition | Display | Button |
|-----------|---------|--------|
| `!hasPaidAccess` (no plan for this exam/tier) | Dimmed (opacity-60) + Lock icon | "Upgrade to Unlock" → `/plans` |
| `hasPaidAccess` AND prev not complete/abandoned | Dimmed + "Complete [prev] to unlock" label | — |
| `hasPaidAccess` AND unlocked AND `not_started` | Full opacity | "Start Now" |
| `hasPaidAccess` AND `in_progress` | Full opacity | "Resume Test" + "Abandon" link |
| `hasPaidAccess` AND `completed` | Full opacity | "View Analysis" |
| `hasPaidAccess` AND `abandoned` | Full opacity + badge | — |

**`hasPaidAccess`** uses the same effective-tier resolution as §2.2 (checks platform tier, then category plan for matching exam).

**Data source:** DB rows from `attempts` table when available; mock fallback from `mockAttempts` dataset when no DB rows exist (demo users and pre-launch).

---

### 2.5 `selected_exams` Filter

Not used as a dashboard visibility gate. The `selected_exams` user preference is onboarding/profile-only. All exam assessments are always shown on the dashboard regardless of `selected_exams`. Filtering by exam is a future V2 feature.

---

## Section 3: Checkout Flow

**[PLACEHOLDER — to be specified when Stripe test mode integration enters scope.]**

Key rules locked in KSS-SA-039:

| Rule | Detail |
|------|--------|
| Mutual exclusivity at checkout | If `fetchActivePlanForUser(user.id)` returns non-null on mount, show full-page blocker. No payment form rendered. |
| Blocker copy | "You already have an active plan. Cancel it from your profile before purchasing a new one." + CTA → `/plans` |

---

## Section 4: Plan Cancellation

**[PLACEHOLDER — cancellation flow not yet designed. Will be specified in a future ticket.]**

Required for the "Cancel current plan first" CTA to be actionable.

---

## Section 5: Plan Upgrade / Downgrade

**[PLACEHOLDER — upgrade and downgrade flows (within the same group) to be specified in a future ticket.]**

Key rules established:
- Upgrade (higher tier, same scope + category): always enabled. No cancel required.
- Downgrade (lower tier, same scope + category): blocked. "Unable to Downgrade" CTA.
- Cross-group switch: cancel required first.
