# CLAUDE.md — keySkillset Platform
# READ THIS ENTIRE FILE BEFORE ANY ACTION. DO NOT WRITE CODE UNTIL YOU HAVE.

---

## AMBIGUITY PROTOCOL — READ FIRST

If a task touches schema, locked behaviours, or platform hierarchy and the rule does
not explicitly cover the edge case:
**STOP. State the ambiguity. List 2–3 options with tradeoffs. Wait for confirmation.**
Never make a silent assumption. Never write code to "unblock" an unclear rule.

---

## WHAT THIS CODEBASE IS

Demo app on Vercel + Supabase. Every UI decision and schema choice becomes a
specification for the production engineering team. Precision is mandatory.

**Stack:** Next.js 16.1.6 (Turbopack), TypeScript, Tailwind CSS
**Repo:** github.com/SandeshBanakar/new-b2c-assessment-keySkillset
**Supabase project ID:** uqweguyeaqkbxgtpkhez
**Docs ref:** Context7 — https://context7.com/ (consult before any library implementation)

---

## SUPPLEMENTARY FILES — READ WHEN RELEVANT

Before starting any task, identify which files below apply and read them first.

| File | Read when... |
|---|---|
| `@docs/CLAUDE-DB.md` | Any DB query, schema change, or data model question |
| `@docs/CLAUDE-PLATFORM.md` | Any UI, nav, roles, tenant, plan, or content question |
| `@docs/CLAUDE-HISTORY.md` | Asked "what changed", debugging unexpected behaviour, or verifying completed work |

---

## TIER 1 — NEVER VIOLATE (enforced on every task, no exceptions)

These rules apply regardless of task type. Violating any of these is a blocking error.

**Database**
- RLS OFF permanently on ALL tables — never add RLS to any table, ever
- Never modify schema without an authorised `KSS-DB-XXX` prompt confirmed in chat first
- All schema changes via `execute_sql` — never `apply_migration`
- `tenant_scope_id` on `content_items` is NOT `tenant_id` — column name is critical, never confuse them

**Design system** (full token table in `@docs/CLAUDE-PLATFORM.md`)
- Tailwind tokens ONLY — zero custom hex values, zero inline styles
- NEVER use `font-bold` — only `font-medium` or `font-semibold`

**Permanently removed — never re-add**
- Course Store | Content tab on Tenant detail | Duplicate Tenant action
- Team Manager role or persona anywhere in V1 (deferred to V2)
- Exam engine: never modify locked behaviours without explicit "Override locked behaviour" instruction

**Git**
- Never commit directly to main
- Branch format: `feat/KSS-[TRACK]-[NNN]` or `fix/KSS-[TRACK]-[NNN]`
- `npm run build` must pass before any commit

---

## TIER 2 — ACTIVE BUILD STATE

**Currently pending (do not mark done without shipping):**
- 🟡 KSS-SA-007 Marketing Config
- 🟡 KSS-CA-007 CA Dashboard
- 🟡 KSS-CA-009 Audit Log (CA)
- 🔴 KSS-B2C-FIX-023 Back button + ChevronLeft on instructions page
- 🔴 KSS-B2C-FIX-024 Previous cross-section NTA navigation
- 🔴 KSS-B2C-FIX-025-FINAL Exam engine state machine
- 🔴 KSS-B2C-FIX-026 Mobile hard block modal (< 768px)
- 🔴 KSS-B2C-FIX-027 MCQ_MULTI + NUMERIC renderers
- 🔴 KSS-B2C-FIX-028 Draggable on-screen calculator

**Open bugs (deferred — do not touch):**
- BUG-001 Analytics tab empty after results redirect
- BUG-002 Upgrade banner not showing after free attempt

**Open decisions (do not resolve without product owner confirmation):**
1. B2C questions table vs SA content_items — merge or keep separate
2. licensed_categories sync between tenants + contracts — single source TBD

---

## DEVELOPMENT WORKFLOW

```
1. Read CLAUDE.md fully → read relevant supplementary file(s) → branch
2. Schema change: write SQL with IF NOT EXISTS → show user → wait approval
   → execute_sql → verify → update CLAUDE-DB.md → npm run build
3. Data-only fix: confirm intent → run directly
4. Code: read file before editing → minimal targeted changes → no unused imports
   → no commented-out code → npm run build must pass
5. Commit: git status + diff → stage specific files (not -A)
   → imperative message + prompt ID → Co-authored-by: Claude Sonnet 4.6
6. PRD: update Confluence via MCP after build passes
```

---

## SELF-CHECK (4 questions — run before every commit)

1. Did I touch schema without an authorised KSS-DB-XXX prompt? → **STOP if yes**
2. Does `npm run build` pass? → **STOP if no**
3. Did I add RLS to any table? → **STOP if yes**
4. Is there anything in this diff I'm uncertain about? → **Ask before committing**