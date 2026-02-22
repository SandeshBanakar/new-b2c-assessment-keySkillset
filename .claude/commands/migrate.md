# /migrate — Supabase Schema Change

## Use this when

- Adding a new table to Supabase
- Modifying an existing table (add/remove columns)
- Adding RLS (Row Level Security) policies
- Updating TypeScript types after schema changes

## Process

Step 1: Describe the schema change needed
Step 2: Write the SQL migration (do NOT run it yet)
Step 3: Show the SQL and wait for approval
Step 4: After approval, provide the SQL to run in Supabase Dashboard → SQL Editor
Step 5: Update TypeScript types in src/types/ to match the new schema
Step 6: Update any affected Supabase queries in src/lib/ or server components

## Rules

- Never auto-run migrations
- Always show SQL before executing
- RLS policies must be added for every new table
- Test with: npm run build after type updates

## Supabase client reminders

Browser / Client Components → src/lib/supabase/client.ts
Server Components + API     → src/lib/supabase/server.ts
