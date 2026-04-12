# CLAUDE-PACKAGES.md — Third-Party Package Registry
# Records every non-standard package added to the project, why, and where it is used.
# Update this file whenever a new package is installed or removed.

---

## Installed Packages

| Package | Version | Installed | Feature / Ticket | Used In | Purpose |
|---------|---------|-----------|-----------------|---------|---------|
| `@dnd-kit/core` | `^6.3.1` | 2026-04-11 | KSS-SA-030 | `src/app/super-admin/create-assessments/linear/page.tsx` | DnD context provider, sensors, drag events |
| `@dnd-kit/sortable` | `^10.0.0` | 2026-04-11 | KSS-SA-030 | `src/app/super-admin/create-assessments/linear/page.tsx` | `useSortable`, `SortableContext`, `arrayMove` for reorderable lists |
| `@dnd-kit/utilities` | `^3.2.2` | 2026-04-11 | KSS-SA-030 | `src/app/super-admin/create-assessments/linear/page.tsx` | `CSS.Transform.toString` for drag transform styles |

---

## Pre-existing Notable Packages (not added by this team — for reference)

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.97.0` | Supabase client (DB queries) |
| `@supabase/ssr` | `^0.8.0` | Supabase SSR helpers |
| `lucide-react` | `^0.575.0` | Icon library — only source of icons platform-wide |
| `recharts` | `^3.8.0` | Charts (dashboard analytics) |
| `radix-ui` | `^1.4.3` | Headless UI primitives |
| `tailwind-merge` | `^3.5.0` | Merge Tailwind class conflicts |
| `clsx` | `^2.1.1` | Conditional className utility |
| `flag-icons` | `^7.5.0` | Country flag icons |

---

## Rules

- Never install `react-beautiful-dnd` — deprecated and unmaintained. Use `@dnd-kit` instead.
- Never install a date library — use native `Intl.DateTimeFormat` or `new Date()`.
- Never install a form library (react-hook-form, formik) — all forms are plain controlled state.
- Never install a separate markdown renderer — display_config fields are plain text only.
- Always record the ticket number that introduced the package.
