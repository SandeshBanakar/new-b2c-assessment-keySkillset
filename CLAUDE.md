# CLAUDE.md — keySkillset

## What is this project?

keySkillset is a gamified, subscription-based exam-prep 
assessment platform for Indian and global learners.

Supported exams: SAT, IIT-JEE, NEET, PMP
Content type: Assessments ONLY (no courses, no eBooks)
Courses and eBooks nav items → Coming Soon pages only

## Tech stack

- Next.js 15 App Router + TypeScript
- Tailwind CSS v3 — utility classes only
- shadcn/ui — base components, always in src/components/ui/
- lucide-react — ONLY icon library (shadcn already uses it)
- Supabase — auth + PostgreSQL database
- Vercel — deployment + preview URLs
- npm — package manager

## Absolute constraints (never violate)

- No inline styles except dynamic values (e.g. progress bar widths)
- No other CSS methods — Tailwind only
- No icon library other than lucide-react
- No component library other than shadcn/ui
- shadcn/ui components live in src/components/ui/ — never edit them directly
- Customise shadcn only via Tailwind classes at usage site
- 'use client' required on any component using hooks, state, events, or browser APIs
- Never commit .env.local
- Never run npm audit fix or npm audit fix --force

## Before starting any task

1. Read the relevant agent_docs/ file for the area you are working in
2. Check src/components/ before creating any new component
3. Run: npm run build → must pass with zero TypeScript errors
4. Run: npm run lint  → must pass with zero ESLint errors

## agent_docs reference

agent_docs/architecture.md → routes, folder map, data models, Supabase client usage
agent_docs/domain-rules.md → exams, subscription tiers, assessment types, access logic, gamification rules
agent_docs/design-system.md → Tailwind tokens, color system, light/dark mode rules
agent_docs/component-library.md → all built components, props, file locations

## How to run

npm run dev

## Subscription tiers (critical — shapes all access logic)

Free         → Daily Quiz only
Basic        → Full Tests (all exams)
Professional → Full Tests + Subject Tests
Premium      → Full Tests + Subject Tests + Chapter Tests

## Assessment types

Full Test    → Complete exam simulation (e.g. 98 Qs, 2h 14m for SAT)
Subject Test → Single subject focus (e.g. SAT Math only)
Chapter Test → Single concept (e.g. Linear Equations, 25 Qs)

Puzzle Mode → A question FORMAT variant, NOT a separate assessment type. Available on Subject Tests (Professional+) and all types (Premium)

## Routes

/                          → Home / Dashboard
/onboarding                → Exam selection (first login)
/quiz/daily                → Daily Quiz (free for all)
/quiz/results              → Post-quiz results + XP
/assessments               → Assessment Library
/assessments/[id]          → Assessment Detail (3 tabs)
/plans                     → Subscription Plans
/quest                     → Quest Map + Game Hub

## Design tokens

Primary:        violet-600  (#7C3AED)
Gamification:   amber-500   (#F59E0B)
Success:        emerald-500 (#10B981)
Danger:         rose-500    (#F43F5E)
Light bg:       zinc-50
Dark bg:        zinc-950 (Quest Map + Daily Quiz in-session)
Card surface:   white (light) / zinc-900 (dark)
Border:         zinc-200 (light) / zinc-800 (dark)

## Never auto-generate with /init

This CLAUDE.md was written deliberately.
Do not regenerate or overwrite it.
