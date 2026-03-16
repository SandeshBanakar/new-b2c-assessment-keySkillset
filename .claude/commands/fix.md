# /fix — Debug and Fix an Error

## Process

Step 1: Read the full error message carefully
Step 2: Identify the exact file and line number
Step 3: Read that file + its imports before touching anything
Step 4: Check if the error is a TypeScript type error,
        a runtime error, or a lint error — they are fixed differently

## Rules

- Fix the root cause, not the symptom
- Do not suppress TypeScript errors with 'as any' or
  '// @ts-ignore' unless there is no alternative —
  if you do, add a comment explaining why
- Do not change unrelated code while fixing
- Do not add new dependencies to fix a simple bug

## After fixing

Run: npm run build && npm run lint
Confirm both pass before reporting done.

## Common patterns — B2C

- 'use client' missing → add it to the top of the file
- Supabase client in Server Component →
  switch to lib/supabase/server.ts
- Icon not found → check lucide-react, only lucide-react allowed
- shadcn component missing →
  npx shadcn@latest add [component-name]

## Common patterns — Super Admin (/super-admin/*)

- Supabase error → check import { supabase }
  from '@/lib/supabase/client' is correct
- 404 on new route → check page.tsx exists in
  src/app/super-admin/[route]/page.tsx
- Active nav not highlighting → check usePathname()
  startsWith logic in layout.tsx
- Icon not found → lucide-react only, check exact name
- RLS error → Super Admin tables have RLS OFF,
  check Supabase dashboard if query fails
- Design token wrong → blue-700 primary (not violet),
  rounded-md only (not rounded-xl)