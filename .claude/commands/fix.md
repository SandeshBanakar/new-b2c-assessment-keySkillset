# /fix — Debug and Fix an Error

## Process

Step 1: Read the full error message carefully
Step 2: Identify the exact file and line number
Step 3: Read that file + its imports before touching anything
Step 4: Check if the error is a TypeScript type error, a runtime error, or a lint error — they are fixed differently

## Rules

- Fix the root cause, not the symptom
- Do not suppress TypeScript errors with 'as any' or '// @ts-ignore' unless there is no alternative — and if you do, add a comment explaining why
- Do not change unrelated code while fixing
- Do not add new dependencies to fix a simple bug

## After fixing

Run: npm run build && npm run lint
Confirm both pass before reporting done.

## Common patterns in this codebase

- 'use client' missing → add it to the top of the file
- Supabase client used in Server Component → switch to lib/supabase/server.ts
- Icon not found → check lucide-react docs, only lucide-react icons are allowed
- shadcn component missing → npx shadcn@latest add [component-name]
