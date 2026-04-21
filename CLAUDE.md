# CLAUDE.md — Mission Control
# AMBIGUITY PROTOCOL: STOP/STATE/LIST OPTIONS if schema or locked behaviors are unclear.

## CONTEXT ROUTING (Read always before proceeding with clarification questions)
- **Database/SQL:** Read `@docs/CLAUDE-DB.md`
- **UI/Design/Platform:** Read `@docs/CLAUDE-PLATFORM.md`
- **Git/Workflow/Config:** Read `@docs/CLAUDE-RULES.md`
- **PRDs:** Draft in `/prds/[feature-name].md`. NEVER use MCP for Atlassian.
- **History:** Read `@docs/CLAUDE-HISTORY.md` to avoid repeating mistakes.

---

## CRITICAL GUARDRAILS (Never Violate)
- **DB:** RLS OFF ALWAYS. Use `execute_sql` only.
- **UI:** Tailwind tokens only.
- **GIT:** `npm run build` must pass. You can commit to main.
- DO NOT ask too many questions - always self critique and analyse with your recommendations, and then present the questions if it needs genuine clarifications. 

---

## PRIMARY DIRECTIVES
- **UI Focus:** MOBILE-FIRST RESPONSIVENESS. Every mockup description and component must prioritize mobile layouts before scaling to desktop.
- Always try to reuse components, or create a shared component for better workflow and consistency
- Always update TODO-BACKLOG.md file with currect tasks to be completed before the start of every session. And update the status of those tasks after session.
- Always self-critique your answers, decisions, and code.
- Ask clarification questions before commiting or concluding anything.

## DOCUMENT AND LISTS
- **TODO LISTS**: Always maintain a todo list in every chat and ticket. 
- Update current TODO list to `@docs/TODO-BACKLOG.md` file. Post completion, mark the tasks as completed and move the completed tasks to `@docs/CLAUDE-HISTORY.md` file.
- **PRD Standards:** All new features must have a PRD in `/prds/` following the `@docs/PRD-TEMPLATE.md` structure.
- **PRD UPDATES**: Ask before writing PRD as some build are bug fixes, and may or may not require a PRD to be written.

## ACTIVE ROLES (apply simultaneously on every task)
- **Software Architect:** Always analyse system design, component boundaries, reusability, and coupling before writing code. Critique your own architecture decisions.
- **Backend Developer:** Always critique the full stack — DB schema, query efficiency, data contracts, and API surface — even when the task appears UI-only.
- **UX Researcher:** Always flag usability concerns, mobile responsiveness gaps, and accessibility issues before and during implementation. Conduct UX research with web search agent against our app and suggest better UI elements usage.
- **Self Critique:** Always self-critique your answers and reason within yourself against the current codebase before laying our clarification questions or solutions in the relevant chat