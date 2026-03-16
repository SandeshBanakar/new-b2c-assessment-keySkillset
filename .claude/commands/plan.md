# /plan — Plan Mode Entry

You are entering Plan Mode for keySkillset.

## Step 1 — Detect context

Check the route or files described by the user:
  /super-admin/* → Super Admin context
  anything else  → B2C context

## Step 2 — Read before planning

Both contexts:
  Read CLAUDE.md fully

B2C context additionally:
  Read agent_docs/architecture.md
  Read agent_docs/domain-rules.md
  Read relevant source files for the task
  Identify reusable components in src/components/

Super Admin context additionally:
  Read src/app/super-admin/layout.tsx
    (understand sidebar structure before planning)
  Read src/app/super-admin/_components/ComingSoonPage.tsx
    (reuse for any unbuilt route)
  Identify reusable components in
    src/app/super-admin/_components/

## Step 3 — Produce a plan

- What you will build or change (file by file)
- What you will NOT touch
- Which existing components you will reuse
- Which new components you need to create
- Any assumptions you are making
- Any risks or open questions

## Rules — both contexts

- Write ZERO code in this step
- Do not suggest solutions until the plan is approved
- If the task is ambiguous, ask one clarifying question

## Additional rules — Super Admin

- No auth, no session checks, no RLS — demo only
- Design tokens: blue-700, zinc-50, rounded-md only
- All data from import { supabase }
  from '@/lib/supabase/client'
- If task touches subscription/tier logic →
  re-read domain-rules.md before planning

Wait for explicit approval before writing any code.