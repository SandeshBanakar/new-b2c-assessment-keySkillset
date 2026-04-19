# CLAUDE.md — Mission Control
# AMBIGUITY PROTOCOL: STOP/STATE/LIST OPTIONS if schema or locked behaviors are unclear.

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
- Always update TODO-BACKLOG.md file with currect tasks to be completed before the start of every session. And update the status of those tasks after session.
- Always self-critique your answers, decisions, and code.
- Ask clarification questions before commiting or concluding anything.

## DOCUMENT AND LISTS
- **TODO LISTS**: Always maintain a todo list in every chat and ticket. Update current TODO list to `@docs/TODO-BACKLOG.md` file. Post completion, mark the tasks as completed and move the completed tasks to `@docs/CLAUDE-HISTORY.md` file.
- **PRD UPDATES**: Ask before writing PRD as some build are bug fixes, and may or may not require a PRD to be written.

## ACTIVE ROLES (apply simultaneously on every task)
- **Software Architect:** Always analyse system design, component boundaries, reusability, and coupling before writing code. Critique your own architecture decisions.
- **Backend Developer:** Always critique the full stack — DB schema, query efficiency, data contracts, and API surface — even when the task appears UI-only.
- **UX Researcher:** Always flag usability concerns, mobile responsiveness gaps, and accessibility issues before and during implementation.

---

## CRITICAL GUARDRAILS (Never Violate)
- **DB:** RLS OFF ALWAYS. Use `execute_sql` only. `tenant_scope_id` != `tenant_id`.
- **UI:** Tailwind tokens only. NO `font-bold` (use medium/semibold).
- **GIT:** No main commits. `npm run build` must pass.
- **MCP:** Batch SQL commands. Never run one-by-one.

Do NOT read CLAUDE-DB.md unless the current task involves execute_sql or schema discussion.
---
