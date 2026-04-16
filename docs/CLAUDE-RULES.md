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