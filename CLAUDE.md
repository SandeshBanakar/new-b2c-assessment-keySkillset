# CLAUDE.md — Mission Control
# AMBIGUITY PROTOCOL: STOP/STATE/LIST OPTIONS if schema or locked behaviors are unclear.

## CURRENT TASK STATUS
**Task:** [one line description]
**Status:** [In progress / Blocked]

Maintain this status while each task is being conducted. If there are two tasks running at a time, then record:
**TASK 1:** [one line description]
**Status 1:** [In progress / Blocked]

**TASK 2:** [one line description]
**Status 2:** [In progress / Blocked]
---

## CONTEXT ROUTING (Read ONLY when relevant)
- **Database/SQL:** Read `@docs/CLAUDE-DB.md`
- **UI/Design/Platform:** Read `@docs/CLAUDE-PLATFORM.md`
- **Git/Workflow/Config:** Read `@docs/CLAUDE-RULES.md`
- **PRDs:** Draft in `/prds/[feature-name].md`. NEVER use MCP for Atlassian.
- **History:** Read `@docs/CLAUDE-HISTORY.md` to avoid repeating mistakes.

---

## PRIMARY DIRECTIVES
- **PRD Standards:** All new features must have a PRD in `/prds/` following the `@docs/PRD-TEMPLATE.md` structure.
- **UI Focus:** MOBILE-FIRST RESPONSIVENESS. [cite_start]Every mockup description and component must prioritize mobile layouts before scaling to desktop[cite: 1, 4].
- **Reuse First:** Always check the `Impacted Existing Components` section in the PRD to avoid duplicate UI work.

---

## CRITICAL GUARDRAILS (Never Violate)
- **DB:** RLS OFF ALWAYS. Use `execute_sql` only. `tenant_scope_id` != `tenant_id`.
- **UI:** Tailwind tokens only. NO `font-bold` (use medium/semibold).
- **GIT:** No main commits. `npm run build` must pass.
- **MCP:** Batch SQL commands. Never run one-by-one.

Do NOT read CLAUDE-DB.md unless the current task involves execute_sql or schema discussion.
---