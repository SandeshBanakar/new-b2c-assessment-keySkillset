# /migrate — Supabase Schema Change

## Use this when

- Adding a new table to Supabase
- Modifying an existing table (add/remove columns)
- Updating TypeScript types after schema changes

## CRITICAL — RLS Rules by context

B2C tables (users, assessments, attempts, etc.):
  → RLS policies MUST be added for every new table

Super Admin tables (tenants, plans, content_items,
admin_users, audit_logs, departments, teams,
learners, contracts, etc.):
  → RLS is PERMANENTLY OFF — never add RLS policies
  → This is intentional — demo-only app, no production
  → Do NOT add RLS even if prompted

## Process

Step 1: Identify which context — B2C or Super Admin
Step 2: Write the SQL migration (do NOT run it yet)
Step 3: Show the SQL and wait for approval
Step 4: After approval, provide the SQL to run in
        Supabase Dashboard → SQL Editor
Step 5: Update TypeScript types in src/types/ to match
Step 6: Update any affected Supabase queries

## Rules

- Never auto-run migrations
- Always show SQL before executing
- Test with: npm run build after type updates

## Supabase client

All components (B2C and Super Admin):
  import { supabase } from '@/lib/supabase/client'

Server Components + API routes only:
  import from src/lib/supabase/server.ts