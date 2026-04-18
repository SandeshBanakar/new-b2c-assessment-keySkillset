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
status = 'PUBLISHED'
ORDER BY price ASC
```

**Group B — Category Plans**  
Scope: `CATEGORY_BUNDLE`. Grouped by `plans.category` (e.g. NEET, JEE, CLAT). Each category shows 3 cards: BASIC / PRO / PREMIUM.

Fetched via `fetchLiveCategoryPlansGrouped()`:
```
plan_audience = 'B2C'
plan_category = 'ASSESSMENT'
scope = 'CATEGORY_BUNDLE'
status = 'PUBLISHED'
feature_bullets != '[]'
ORDER BY price ASC
```

> **Guard:** A category is only shown if all 3 tiers (BASIC, PRO, PREMIUM) exist and are PUBLISHED. Partial categories are silently excluded from the page. This is intentional — showing 1 or 2 tier cards with no upgrade path creates a confusing UX.

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

**[PLACEHOLDER — Ticket KSS-SA-039 covers State 3 (category mismatch). Full gating spec across all states and plan types to be written in a future ticket.]**

Key rules locked in KSS-SA-039:

| Rule | Detail |
|------|--------|
| Platform plan gating | `assessments.min_tier` vs `activePlanInfo.tier` (cumulative coverage: BASIC ⊂ PRO ⊂ PREMIUM) |
| Category plan gating | `assessment.exam` (exam category) must equal `activePlanInfo.category`, then tier coverage applies within that category |
| State 3 — Category Mismatch | Category plan user on wrong-category assessment. Primary: "Take Free Test" (if unused). Secondary: "Switch Plan" → `/plans?highlight={examCategory}`. |

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
