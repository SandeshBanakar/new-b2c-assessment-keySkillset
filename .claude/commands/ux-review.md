# /ux-review — keySkillset UX Review Checklist

Run after any feature build to audit modified files
against keySkillset's UX standards before committing.

## Instructions for Claude

1. Detect context from modified files:
   src/app/super-admin/* → run Super Admin checklist
   anything else         → run B2C checklist
   both modified         → run both

2. Run every checklist item against modified files
3. Output PASS / WARN / FAIL for each item
4. For every WARN or FAIL state:
   what the issue is, which file/line, recommended fix
5. Do NOT auto-fix — report only

---

## B2C CHECKLIST

### CTA Rules
- [ ] Every CTA has a descriptive label
      (no "Click here", no "Submit")
- [ ] Primary CTA: filled violet-600
- [ ] Secondary CTA: outline or ghost, never same fill
- [ ] Locked cards show: Take Free Test (primary) +
      Upgrade to Access (secondary), stacked vertically
- [ ] Premium users see NO upgrade CTAs on assessments
- [ ] No button has pointer-events-none without tooltip

### Tier-Aware Logic
- [ ] Free: all library cards locked except free CTA
- [ ] Basic: Full Tests unlocked, Subject + Chapter locked
- [ ] Professional: Full + Subject unlocked, Chapter locked
- [ ] Premium: all unlocked, no lock icons, no upgrade CTAs
- [ ] simulateTierChange() used for all tier updates
- [ ] TierBanner shows correct copy per tier
- [ ] Premium TierBanner shows "You're all set ✓" badge

### Navigation & Routing
- [ ] All upgrade CTAs navigate to /plans
- [ ] No assessment card navigates to /checkout directly

### Empty States
- [ ] Category sections with 0 results show header +
      empty state message
- [ ] Format: "No [Exam] [Type] [Status] yet."
- [ ] Empty state: dashed border + italic zinc-400 text

### Progress Bar
- [ ] Free/locked cards: no progress bar
- [ ] Subscribed untouched: no bar, CTA only
- [ ] Subscribed 1+ attempts: bar visible
- [ ] Free attempt exhausted: amber chip shown

### Layout & Visual Hierarchy
- [ ] Continue Where You Left Off above all widgets
- [ ] TierBanner below Continue, above Assessment Library
- [ ] Mobile: cards stack 1 col, CTAs full width
- [ ] No overflow on 375px viewport

### Footer
- [ ] Footer present on all PageWrapper pages
- [ ] Left: "Copyright © keySkillset 2026"
- [ ] Right: "Contact support" is a mailto: link
      (text-violet-600)

---

## SUPER ADMIN CHECKLIST

### Design Tokens
- [ ] Primary color: blue-700 — not violet, not blue-600
- [ ] Hover: blue-800
- [ ] Destructive: rose-600
- [ ] Background: zinc-50
- [ ] Surface: white
- [ ] Text hierarchy: zinc-900 / zinc-600 / zinc-400
- [ ] Border: zinc-200
- [ ] Radius: rounded-md only
      FAIL if rounded-xl or rounded-full found
- [ ] Weight: font-medium or font-semibold only
      FAIL if font-bold found
- [ ] Icons: lucide-react only
- [ ] No custom hex values — Tailwind tokens only

### Data & State
- [ ] All data fetched from Supabase — no hardcoded values
- [ ] Loading skeleton shown (animate-pulse bg-zinc-100)
      while Supabase query is in flight
- [ ] Error state shown on query failure
      (text-zinc-400 text-sm "Failed to load")
- [ ] No auth checks, no session guards, no login redirect
- [ ] No RLS-related code in any Super Admin component

### Structure & Navigation
- [ ] Page renders inside super-admin layout
      (no duplicate sidebar, no duplicate header)
- [ ] Active nav item highlights correctly
      (bg-blue-50 text-blue-700 border-l-2 border-blue-700)
- [ ] Unbuilt routes show ComingSoonPage — not blank, not 404
- [ ] Breadcrumbs present on detail pages
- [ ] Back links use ChevronLeft icon + text label

### Tables
- [ ] Table has bg-white rounded-md border border-zinc-200
- [ ] Empty table state shown — not a blank table body
- [ ] Status badges use correct color pairs:
      ACTIVE / PUBLISHED / LIVE → green-50 / green-700
      DRAFT / INACTIVE → amber-50 / amber-700
      ARCHIVED → zinc-100 / zinc-500
- [ ] Action buttons per row are conditional on status

### Modals
- [ ] Destructive actions have a confirmation modal
- [ ] Modal cancel button: zinc outline
- [ ] Modal confirm button: blue-700 (or rose-600 if destructive)
- [ ] Warning modals use amber-50 bg amber-700 text

---

## Output Format

For each item output one of:
✅ PASS — [brief confirmation]
⚠️ WARN — [issue] → [file:line] → [recommended fix]
❌ FAIL — [issue] → [file:line] → [required fix before commit]

End with:
Total: X PASS / Y WARN / Z FAIL
Verdict: SAFE TO COMMIT / REVIEW WARNINGS FIRST / DO NOT COMMIT