# /feature — Build a New Feature

## Pre-conditions (verify before starting)

- [ ] /plan has been approved for this feature
- [ ] CLAUDE.md has been read this session
- [ ] Relevant agent_docs/ file has been read

## Detect context before building

Check which route is being modified:
  /super-admin/* → Super Admin context
  anything else  → B2C context

---

## B2C Build Rules

1. Follow the approved plan exactly — no scope creep
2. Check src/components/ first — reuse before creating
3. Use shadcn/ui primitives as base where available
4. Customise only via Tailwind classes
5. Use lucide-react for all icons
6. Add 'use client' to any component with hooks or events
7. All routes go in src/app/ using Next.js App Router
8. Use lib/supabase/client.ts for Client Components
9. Use lib/supabase/server.ts for Server Components
10. Design tokens: violet-600 primary, zinc-50 bg, rounded-xl

## Super Admin Build Rules

1. Follow the approved plan exactly — no scope creep
2. Check src/app/super-admin/_components/ first — reuse before creating
3. No shadcn/ui — Tailwind only
4. Use lucide-react for all icons — no exceptions
5. Add 'use client' to any component with hooks or events
6. All routes go in src/app/super-admin/ using Next.js App Router
7. Use src/lib/supabase/client.ts — import { supabase }
8. No auth, no RLS, no session checks — demo only
9. Design tokens: blue-700 primary, zinc-50 bg, rounded-md only
10. Never use: rounded-xl, rounded-full, font-bold, custom hex values
11. Coming Soon pages use ComingSoonPage component — never a blank page

---

## After building (both contexts)

Run these and fix ALL errors before marking done:
  npm run build
  npm run lint

Report: files created, files modified, files deleted