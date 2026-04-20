# CLAUDE-RULES.md — Infrastructure & Workflow
# Read ONLY before starting a development task or committing code.

---

## MACHINE CONFIGURATION
| Machine | Drive | Project Path |
|---|---|---|
| Office laptop | C: | C:\Projects\new-b2c-assessment-keySkillset |
| Home laptop | D: | D:\Projects\new-b2c-assessment-keySkillset |
*Always detect the current machine's drive before running path-dependent commands.*

---

## SUPABASE / SQL WORKFLOW
- **Supabase MCP is permanently disabled.** Never attempt `mcp__supabase__*` calls.
- All SQL runs manually by the user in the Supabase SQL editor.
- **SQL handoff protocol:**
  1. Write the SQL query into `docs/SQL-RESPONSE.txt` (overwrite the file).
  2. Tell the user to run it and paste the JSON response back into `SQL-RESPONSE.txt`.
  3. Once the user confirms the file is updated, read `SQL-RESPONSE.txt` to get the result.
- If `SQL-RESPONSE.txt` is empty or stale, write the next pending query there and wait.

---

## DEVELOPMENT WORKFLOW
1. **Init:** Read `CLAUDE.md` → check `@docs/CLAUDE-HIS.md` → branch.
2. **Schema:** Write SQL with `IF NOT EXISTS` → show user → wait for approval → user runs in Supabase → pastes result to `SQL-RESPONSE.txt`.
3. **Execution:** Read file → minimal targeted changes → no unused imports → `npm run build`.
4. **Commit:** `git status` + `diff` → stage specific files (not -A).
   - Message: Imperative + [KSS-ID] + Co-authored-by: Claude Sonnet 4.6
5. **PRD:** Update local `.md` file in `/prds/` (Manual upload to Atlassian by PO).

---

## GIT & BUILD STANDARDS
- **Branching:** `feat/KSS-[TRACK]-[NNN]` or `fix/KSS-[TRACK]-[NNN]`.
- **Pre-Commit:** `npm run build` MUST pass. No exceptions.
- **Commits:** Never commit directly to `main`.

---

## SELF-CHECK (Run before every commit)
1. Did I touch schema without an authorized KSS-DB-XXX prompt?
2. Does `npm run build` pass?
3. Did I add RLS to any table? (Forbidden)
4. Is there anything in this diff I'm uncertain about?

---

## B2C ASSESSMENT PLAN TIER CASCADE (Locked — KSS-SA-040, Apr 19 2026)

`allowed_assessment_types` on B2C ASSESSMENT plans is **always derived from tier** — it is never free-form.

| Tier | `allowed_assessment_types` |
|------|---------------------------|
| BASIC | `['FULL_TEST']` |
| PRO | `['FULL_TEST', 'SUBJECT_TEST']` |
| PREMIUM | `['FULL_TEST', 'SUBJECT_TEST', 'CHAPTER_TEST']` |

**Why:** Product guarantees that a BASIC plan holder only sees full tests. Letting SAs override this creates access inconsistency between the plan tile on `/plans` and what the learner can actually access post-subscribe.

**How to apply:** Wherever `allowed_assessment_types` is set (create form, edit slideover, plan lib), compute it from `TIER_ALLOWED_TYPES[tier]`. Never read it from form state. Never show a free-form toggle. `EditPlanSlideOver` displays tier as read-only — tier itself is not editable post-creation.

## ASSESSMENT PLAN UNIQUENESS GUARD (Locked — KSS-SA-040, Apr 19 2026)

Only **one LIVE B2C ASSESSMENT plan** may occupy each tier+scope slot at a time.

- PLATFORM_WIDE: unique on `(tier, scope='PLATFORM_WIDE', plan_audience='B2C', plan_category='ASSESSMENT', status='LIVE')`
- CATEGORY_BUNDLE: unique on `(tier, scope='CATEGORY_BUNDLE', category, plan_audience='B2C', plan_category='ASSESSMENT', status='LIVE')`

Guard function: `checkLivePlanExistsForTierScope(tier, scope, category, excludePlanId?)` in `src/lib/supabase/plans.ts`. Returns `boolean`. Called before making a plan LIVE in both the Create form and the PlanOverviewTab "Make Live" button. If `true`, the action is blocked and an inline error is shown. `excludePlanId` prevents self-conflict on the detail page.

**Why:** Prevents two BASIC PLATFORM plans being LIVE simultaneously, which would cause ambiguous access rules for subscribers.

**How to apply:** Never skip this check when transitioning a plan to LIVE. Drafts are exempt — the guard only fires on the LIVE transition, not on save-as-draft.

---

## ASSESSMENT PLAN MUTUAL EXCLUSIVITY (Locked — KSS-SA-039, Apr 18 2026)

A B2C user holds **at most one** active assessment plan at a time — either a PLATFORM_WIDE plan OR a CATEGORY_BUNDLE plan, never both simultaneously.

- **`/plans` page CTA:** If user has an active plan of a different scope or category, button shows "Cancel current plan first" (disabled). This is the primary enforcement point.
- **`/checkout` gate:** On mount, call `fetchActivePlanForUser(user.id)`. If non-null, render a full-page blocker — no payment form. CTA → `/plans`. This prevents double-subscription even if user bypasses the `/plans` CTA.
- **Switching:** Cancel current plan → purchase new plan. Both directions (platform→category and category→platform) follow this flow.
- **Upgrade within same group** (same scope + same category, or both PLATFORM_WIDE): no cancel required. CTA "Upgrade to [Plan]" is enabled.
- **V1 enforcement level:** UI-only. No DB trigger or server-side constraint. Production would enforce via Stripe webhook validation.

Never remove or loosen this gate without an explicit "Override mutual exclusivity" instruction.

---

## ANALYTICS ACCESS RULES (Locked — Apr 16 2026)
> Violations here cause demo regressions. Read carefully before touching any analytics file.

### Analytics Tab Visibility
- Analytics tab is **ALWAYS VISIBLE** for all tiers (Free / Basic / Pro / Premium).
- Never gate the tab itself. The tab shows an empty state ("Complete your first attempt") when there are no completed attempts.
- `hasAnalyticsAccess` guard has been **permanently removed** from `page.tsx`.

### AI Insights Section — Pro + Premium ONLY
- `isAiEligible = userTier === 'professional' || userTier === 'premium'`
- For **Free / Basic**: render a **locked panel** (lock icon + "Upgrade to Pro or Premium" CTA). Do NOT render the "What went well" / "Next Steps" boxes.
- For **Pro / Premium with `aiInsight = null`**: render the section but show "AI insights are not available for this attempt." Do NOT show the upgrade teaser.
- For **Pro / Premium with real `aiInsight`**: render full content.
- The "Unlock AI Insights" nudge button in the tab bar is shown for Free/Basic **only when `activeTab === 'analytics'`**.
- Component: `src/components/assessment-detail/AnalyticsTab.tsx` — `userTier` prop drives all gating.

### Solutions Panel — All Tiers
- Solutions panel (Block 11 in SAT Analytics) is visible to **all tiers** with completed attempts.
- **Accordion/table-row design** (reference images: `reference_images/b2c_user_prod/`).
- **Module tabs** at top (R&W Module 1, R&W Module 2, Math Module 1, Math Module 2 for Full Test).
- **Collapsed row** (desktop grid, mobile stacked): `Q{n} | Status badge | Time | Your Ans | Correct | [View Q & Explanation ▸]`
  - Status badges: `✓ Correct` (emerald), `✗ Incorrect` (rose), `— Skipped` (zinc), `· No data` (zinc-400)
  - Time: `{seconds}s` from `attempt_answers.time_spent_seconds`; `—` if no data
  - Your Ans: the letter/value the user selected; `—` for skipped or no data
  - Correct: the first value of `questions.correct_answer[]`
  - View button toggles expanded state per question; label flips to "Hide" when open
- **Expanded detail** (inside accordion, bg-zinc-50): passage → question text → options (colour-coded) → Marks Earned / Marks Lost two-column → explanation.
  - Options: no inline `(Correct)` or `(Your answer)` text — colour only (emerald = correct, rose = user wrong)
  - Marks panel: `marks_awarded` from `attempt_answers` (1 = correct, 0 = wrong/skipped, no negative marking in SAT).
- Pagination: PAGE_SIZE = 25 per module tab.
- `(Correct)` inline label in option rows is NEVER rendered — color-coding only.

### Attempt Count Per Tier (Product Rules)
| Tier | Full Tests | Subject Tests | Chapter Tests |
|------|-----------|--------------|--------------|
| Free | 1 free attempt | 1 free attempt | 1 free attempt |
| Basic | 1 free + 1 paid | 1 free (access gate) | 1 free (access gate) |
| Pro | 1 free + 1 paid | 1 free + 1 paid | 1 free (access gate) |
| Premium | 1 free + 2 paid | 1 free + 2 paid | 1 free + 2 paid |

- "Access gate" = tier prevents taking paid attempts on that test type. Users CAN still take the 1 free attempt and see full analytics on it.
- Free attempt is tracked **per assessment** via `is_free_attempt = true` on the `attempts` row. The `users.free_attempt_used` boolean is a global indicator only — per-assessment free tracking is the source of truth.
- `max_attempts_per_assessment = 6` (1 free + 5 paid) is the platform ceiling. Tiers restrict below this.

### Attempts Tab Ghost Rows — PERMANENTLY REMOVED
- When `useDb = true` (DB has real attempt rows), the ghost "Upgrade to Access" locked rows are **never shown**.
- `isSubscribed()` (in-memory check) is irrelevant when the DB has data — DB is source of truth.
- Component: `src/components/assessment-detail/AttemptsTab.tsx`

### SAT Analytics — DO NOT TOUCH
- `SATAnalyticsTab.tsx` is a separate component managed in another chat session.
- The gate removal in `page.tsx` intentionally exposes SAT analytics to all tiers (Basic users have SAT attempts). This is correct.
- Never add tier-gating logic inside `SATAnalyticsTab.tsx` without explicit instruction.

### Attempt Answers Seeding Notes (Demo Data)
- `attempt_answers.question_id` must reference **real DB UUIDs** from `assessment_question_map → questions`.
- The exam engine uses mock IDs (`english-language-q1` etc.) — these are NOT stored in `attempt_answers`.
- PASSAGE_MULTI questions: answers keyed to parent question ID. Sub-questions fetched from `passage_sub_questions` and displayed nested in expanded accordion.
- AI insight rows go in `attempt_ai_insights` table. One row per `attempt_id`. Pro and Premium eligible attempts should have rows seeded.