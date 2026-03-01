# /ux-review — keySkillset UX Review Checklist

Run this command after any feature build to audit the last modified
files against keySkillset's UX standards before committing.

## Instructions for Claude
1. Identify the last 5–10 modified files from recent changes
2. Run every checklist item below against those files
3. Output results as PASS / WARN / FAIL for each item
4. For every WARN or FAIL, state: what the issue is, which file/line,
   and the recommended fix
5. Do NOT auto-fix — report only. Developer decides what to action.

---

## CHECKLIST

### CTA Rules
- [ ] Every CTA button has a descriptive label (no "Click here", no "Submit")
- [ ] Primary CTA is visually dominant (filled, violet-600)
- [ ] Secondary CTA is visually subordinate (outline or ghost, never same fill)
- [ ] Locked cards show: Take Free Test (primary) + Upgrade to Access (secondary),
      stacked vertically — NOT side by side
- [ ] Premium users see NO upgrade CTAs anywhere on the assessments page
- [ ] No button has pointer-events-none without a tooltip or visual explanation

### Tier-Aware Logic
- [ ] Free user: all library cards locked except free attempt CTA
- [ ] Basic: Full Tests unlocked, Subject + Chapter locked
- [ ] Professional: Full Tests + Subject Tests unlocked, Chapter locked
- [ ] Premium: all unlocked — no lock icons, no upgrade CTAs
- [ ] simulateTierChange() is used for all tier updates — no direct Supabase
      writes in demo mode
- [ ] TierBanner renders correct copy per tier (free/basic/professional/premium)
- [ ] Premium TierBanner shows "You're all set ✓" badge — NOT a CTA button

### Navigation & Routing
- [ ] All upgrade CTAs navigate to /plans (not /checkout directly)
- [ ] Take Free Test → /assessments/[id]
- [ ] Start Your Test → /assessments/[id]
- [ ] Resume Test → /assessments/[id]
- [ ] View Analysis → /assessments/[id]
- [ ] Continue Your Test → /assessments/[id]
- [ ] No assessment card navigates to /checkout directly

### Empty States
- [ ] Category sections with 0 results show the category header + empty state
      message (not a blank space or hidden section)
- [ ] Empty state message format: "No [Exam] [Type] [Status] yet."
- [ ] Empty state uses dashed border + italic zinc-400 text

### Progress Bar
- [ ] Free/locked cards: no progress bar shown
- [ ] Subscribed, untouched cards: no progress bar — CTA alone ("Start Your Test")
- [ ] Subscribed, 1+ attempts used: progress bar visible (attempts used / 6)
- [ ] Free attempt exhausted: "Free Attempt Exhausted" amber chip shown,
      bar remains, CTA changes to "Continue Your Test"
- [ ] "1 Free Attempt" chip: shown on unstarted locked AND unlocked cards
- [ ] "1 Free Attempt" chip style: violet-50 bg, violet-200 border, violet-700 text

### Accessibility & Interaction
- [ ] All interactive elements have aria-label or visible label
- [ ] Disabled buttons have title attribute with explanation text
- [ ] Cards are keyboard-navigable (tabIndex, onKeyDown handler)
- [ ] No color is the only differentiator for state (icon or label also present)

### Layout & Visual Hierarchy
- [ ] "Continue Where You Left Off" section on /dashboard is above all other widgets
- [ ] TierBanner on /assessments is below "Continue Where You Left Off" (if shown)
      and above Assessment Library heading
- [ ] Category section headers are visible even when cards are 0
- [ ] Mobile: cards stack to 1 column, CTAs remain full width
- [ ] No content is clipped or overflowing on 375px viewport

### Footer
- [ ] Footer present on all PageWrapper pages
- [ ] Left: "Copyright © keySkillset 2026"
- [ ] Right: "Contact support" is a mailto: hyperlink (text-violet-600)

### Performance & State
- [ ] No hardcoded user tier in any component — always reads from AppContext
- [ ] simulateTierChange() triggers re-render across TierBanner, cards, plans page
- [ ] sessionStorage 'justSubscribed' key is cleared after success banner renders
- [ ] No console.error or console.warn in production paths

---

## Output Format

For each checklist item output one of:
✅ PASS — [brief confirmation]
⚠️ WARN — [issue description] → [file:line] → [recommended fix]
❌ FAIL — [issue description] → [file:line] → [required fix before commit]

End with a summary:
Total: X PASS / Y WARN / Z FAIL
Verdict: SAFE TO COMMIT / REVIEW WARNINGS FIRST / DO NOT COMMIT
