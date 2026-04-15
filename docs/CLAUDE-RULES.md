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

## DEVELOPMENT WORKFLOW
1. **Init:** Read `CLAUDE.md` → check `@docs/CLAUDE-HIS.md` → branch.
2. **Schema:** Write SQL with `IF NOT EXISTS` → show user → wait for approval → execute batch.
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