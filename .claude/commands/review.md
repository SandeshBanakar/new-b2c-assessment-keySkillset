# /review — Review Changes Before Committing

## Step 1 — Detect context

Check which files were modified:
  src/app/super-admin/* → Super Admin review
  anything else         → B2C review
  both modified         → run both checklists

---

## B2C Checklist

### Correctness
- [ ] Code does what the plan said
- [ ] Edge cases handled
- [ ] Subscription tier access logic correct
      (Free / Basic / Professional / Premium)

### Code quality
- [ ] No inline styles except dynamic values
- [ ] No icons from libraries other than lucide-react
- [ ] No shadcn/ui component files directly modified
- [ ] 'use client' present where needed
- [ ] No hardcoded user data in production components
- [ ] TypeScript types defined, no implicit 'any'

---

## Super Admin Checklist

### Correctness
- [ ] Data loads from Supabase — no hardcoded mock data
- [ ] Loading skeleton shown while fetching
- [ ] Error state shown on Supabase query failure
- [ ] No auth checks or session guards anywhere

### Design tokens
- [ ] Primary color: blue-700 (not violet, not blue-600)
- [ ] Background: zinc-50
- [ ] Surface: white
- [ ] Border: zinc-200
- [ ] Radius: rounded-md only — no rounded-xl, no rounded-full
- [ ] Weight: font-medium or font-semibold — no font-bold
- [ ] Icons: lucide-react only
- [ ] No custom hex values anywhere

### Structure
- [ ] New page renders inside super-admin layout
      (no duplicate sidebar or header)
- [ ] New route has a page.tsx in
      src/app/super-admin/[route]/
- [ ] Unbuilt routes use ComingSoonPage component
- [ ] Nav item added to layout.tsx for new route

---

## Build check (both contexts)

- [ ] npm run build passes
- [ ] npm run lint passes

## Output format

List: what looks good
List: what needs fixing before commit
Recommendation: COMMIT / FIX FIRST