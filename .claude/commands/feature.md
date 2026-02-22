# /feature — Build a New Feature

## Pre-conditions (verify before starting)

- [ ] /plan has been approved for this feature
- [ ] CLAUDE.md has been read this session
- [ ] Relevant agent_docs/ file has been read

## Build rules

1. Follow the approved plan exactly — no scope creep
2. Check src/components/ first — reuse before creating
3. Use shadcn/ui primitives as base where available
4. Customise only via Tailwind classes
5. Use lucide-react for all icons
6. Add 'use client' to any component with hooks or events
7. All routes go in src/app/ using Next.js App Router
8. Use lib/supabase/client.ts for Client Components
9. Use lib/supabase/server.ts for Server Components

## After building

Run these and fix ALL errors before marking done:
  npm run build
  npm run lint

Report: files created, files modified, files deleted
