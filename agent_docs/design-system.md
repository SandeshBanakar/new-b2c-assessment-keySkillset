## Design Philosophy
Precision tool for serious exam prep. Not playful. Not corporate.
Closest references: Linear (structure), Notion (typography), Khan Academy (educational clarity).

## Color System

PRIMARY (brand actions, active states, nav underlines):
  bg-blue-700         #1D4ED8   — primary buttons, active nav
  hover:bg-blue-800   #1E40AF   — button hover
  bg-blue-50          #EFF6FF   — light tint backgrounds
  border-blue-200     #BFDBFE   — subtle branded borders
  text-blue-700                   — links, active labels

GAMIFICATION (streak, XP, badges — warm contrast against blue):
  text-amber-500      #F59E0B   — Flame, Zap, Trophy icons + values
  bg-amber-50                     — gamification widget backgrounds
  border-amber-200                — gamification widget borders

SUCCESS / ERROR / WARNING:
  text-emerald-600    #059669   — correct answers, active plan badge
  bg-emerald-50                   — success backgrounds
  text-rose-600       #DC2626   — incorrect answers, error states
  bg-rose-50                      — error backgrounds
  text-amber-600      #D97706   — warnings, in-progress states

NEUTRAL (structure, text, surfaces):
  text-zinc-900                 — primary text
  text-zinc-600                 — secondary text
  text-zinc-400                 — muted/disabled text
  bg-white                      — page background
  bg-zinc-50                    — section / widget background
  bg-zinc-100                   — input backgrounds
  border-zinc-200               — default borders (when used)

EXAM BADGE COLORS (pill badges on cards):
  SAT:  bg-blue-100  text-blue-800
  JEE:  bg-purple-100 text-purple-800
  NEET: bg-green-100 text-green-800
  PMP:  bg-orange-100 text-orange-800

## Border Radius
System default: rounded-md (6px) — applied everywhere
Exceptions:
  Badges/pills:    rounded-full
  Modals:          rounded-lg (8px) only
  Inline inputs:   rounded-md
  NEVER use:       rounded-xl, rounded-2xl, rounded-3xl

## Shadow vs Border
Cards and widgets: shadow-sm ONLY — no border
Navigation, inputs, tables: border border-zinc-200 — no shadow
Modals: shadow-lg — no border
Buttons: no shadow, no border (relies on bg color only)

## Typography
Page titles (h1):       text-2xl font-semibold text-zinc-900
Section headers (h2):   text-lg font-medium text-zinc-900
Card titles:            text-base font-medium text-zinc-900
Body text:              text-sm font-normal text-zinc-600
Muted/meta text:        text-xs font-normal text-zinc-400
Labels/badges:          text-xs font-medium (uppercased where relevant)

NEVER use:
  font-bold (except logo wordmark)
  text-3xl or above on content pages
  text-zinc-500 (use zinc-600 or zinc-400 — not in between)

## Iconography
Library: lucide-react ONLY — no other icon library, no emojis
Size system:
  Inline with text:     w-4 h-4 (16px)
  Widget/card icons:    w-5 h-5 (20px)
  Empty state icons:    w-8 h-8 (32px)
  Never use:            w-6 h-6 except in nav

Gamification icons → always text-amber-500
Platform/structure icons → text-zinc-500 or text-blue-700
Locked state → text-zinc-400
Status icons (correct/incorrect) → text-emerald-600 / text-rose-600

## Light / Dark Mode
Light mode ONLY across the entire platform.
bg-white or bg-zinc-50 as page background on all routes.
No dark mode. No bg-zinc-950. No dark: Tailwind variants anywhere.

## Spacing System
Page padding:         px-4 sm:px-6 lg:px-8
Section gap:          gap-6
Widget internal:      p-6
Card internal:        p-4 sm:p-6
Narrow inputs:        p-3
Table rows:           py-3 px-4

## Component Defaults (override shadcn at usage site via Tailwind)
Button primary:   bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm font-medium
Button outline:   border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 rounded-md
Button ghost:     hover:bg-zinc-100 text-zinc-600 rounded-md
Badge:            rounded-full text-xs font-medium px-2.5 py-0.5
Input:            border border-zinc-300 rounded-md bg-zinc-50 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 text-sm
Card:             bg-white rounded-md shadow-sm p-6
