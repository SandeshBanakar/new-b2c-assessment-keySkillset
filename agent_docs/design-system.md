# agent_docs/design-system.md — keySkillset Design System Reference

## 1. Color Tokens

All colors are expressed as Tailwind utility classes only. Never use hex values directly in JSX or CSS.

| Role | Tailwind Class | Hex |
|---|---|---|
| Primary | `violet-600` | `#7C3AED` |
| Primary hover | `violet-700` | `#6D28D9` |
| Gamification / XP | `amber-500` | `#F59E0B` |
| Success | `emerald-500` | `#10B981` |
| Danger / Error | `rose-500` | `#F43F5E` |
| Warning | `orange-400` | `#FB923C` |
| Light background | `zinc-50` | `#FAFAFA` |
| Dark background | `zinc-950` | `#09090B` |
| Card surface (light) | `white` | `#FFFFFF` |
| Card surface (dark) | `zinc-900` | `#18181B` |
| Border (light) | `zinc-200` | `#E4E4E7` |
| Border (dark) | `zinc-800` | `#27272A` |
| Text primary (light) | `zinc-900` | `#18181B` |
| Text primary (dark) | `zinc-50` | `#FAFAFA` |
| Text secondary (light) | `zinc-500` | `#71717A` |
| Text secondary (dark) | `zinc-400` | `#A1A1AA` |

### Usage patterns

```tsx
// Primary button
<Button className="bg-violet-600 hover:bg-violet-700 text-white" />

// XP / gamification accent
<span className="text-amber-500 font-semibold">{xp} XP</span>

// Success state
<Badge className="bg-emerald-500 text-white">Correct</Badge>

// Danger / error state
<Badge className="bg-rose-500 text-white">Incorrect</Badge>

// Card on light background
<Card className="bg-white border border-zinc-200" />

// Card on dark background
<Card className="bg-zinc-900 border border-zinc-800" />
```

---

## 2. Mode Rules — Light vs Dark

Pages are statically assigned a mode. Do not use Tailwind's `dark:` prefix for page-level mode switching unless a page is explicitly adaptive. Use explicit background and text classes instead.

### Light mode pages

Apply `bg-zinc-50` to the page wrapper and `text-zinc-900` as the default text color.

| Route | Page |
|---|---|
| `/assessments` | Assessment Library |
| `/plans` | Subscription Plans |
| `/onboarding` | Exam Selection |
| `/quiz/results` | Post-quiz Results |

### Dark mode pages

Apply `bg-zinc-950` to the page wrapper and `text-zinc-50` as the default text color.

| Route | Page | Note |
|---|---|---|
| `/quest` | Quest Map + Game Hub | Always dark |
| `/quiz/daily` | Daily Quiz in-session | Dark during active session only |

### Adaptive pages

Follow the system preference using Tailwind's `dark:` modifier.

| Route | Page |
|---|---|
| `/` | Home / Dashboard |

---

## 3. Component Radius Rules

| Component | Tailwind Class |
|---|---|
| Cards | `rounded-2xl` |
| Buttons | `rounded-xl` |
| Badges | `rounded-full` |
| Inputs | `rounded-lg` |
| Modals / Dialogs | `rounded-2xl` |

These values are non-negotiable. Do not override them at individual usage sites without a documented reason.

---

## 4. Typography Scale

All typography uses Tailwind's font-size and font-weight utilities. Never use custom font sizes.

| Role | Classes | Usage |
|---|---|---|
| Page title | `text-2xl font-bold` | `<h1>` at the top of each page |
| Section header | `text-lg font-semibold` | `<h2>` for named sections within a page |
| Card title | `text-base font-semibold` | Title inside a card component |
| Body | `text-sm` | Default paragraph and list text |
| Caption | `text-xs text-zinc-500` | Supplementary labels, timestamps, metadata |

### Additional rules
- Font family: Tailwind's default (system sans-serif). No custom font imports.
- Line height: use Tailwind defaults. Do not set `leading-` unless correcting a visual issue.
- Font weight: use only `font-normal`, `font-medium`, `font-semibold`, `font-bold`. Avoid `font-light` and `font-extrabold`.

---

## 5. Spacing Conventions

Use these values consistently. Do not introduce arbitrary padding/margin values.

### Page-level padding

```tsx
// Mobile
<div className="px-4 py-6">

// Desktop (apply via responsive prefix)
<div className="px-4 py-6 md:px-8 md:py-8">
```

### Card padding

```tsx
// Compact card (badges, small info cards)
<Card className="p-4">

// Standard card (assessment cards, plan cards)
<Card className="p-6">
```

### Section spacing (vertical stacking of sections)

```tsx
// Tight — sub-sections within a card or close-related items
<div className="space-y-4">

// Standard — major sections on a page
<div className="space-y-6">
```

### Grid / flex gap

```tsx
// Tight — inline items, badges, icons
<div className="flex gap-3">

// Standard — card grids, option lists
<div className="grid gap-4">
```

---

## 6. shadcn/ui Usage Rules

### Installed components

The following shadcn/ui components are installed and available:

| Component | Import path |
|---|---|
| `Button` | `@/components/ui/button` |
| `Badge` | `@/components/ui/badge` |
| `Card`, `CardHeader`, `CardContent`, `CardFooter` | `@/components/ui/card` |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | `@/components/ui/tabs` |
| `Progress` | `@/components/ui/progress` |
| `Separator` | `@/components/ui/separator` |
| `Avatar`, `AvatarImage`, `AvatarFallback` | `@/components/ui/avatar` |

### Rules

1. **Never edit files in `src/components/ui/` directly.** These are managed by shadcn/ui and may be regenerated. Edits will be lost.
2. **Customise only via Tailwind classes at the usage site.** Pass `className` props to override styles.
3. **Do not install additional shadcn/ui components** without updating this document and verifying there is no existing component that covers the use case.
4. When a shadcn component variant does not meet requirements, build a wrapper component in `src/components/shared/` or the relevant subfolder — do not patch the ui/ file.

### Example — correct customisation

```tsx
// Correct: customise at usage site via className
<Button className="bg-violet-600 hover:bg-violet-700 w-full rounded-xl">
  Start Assessment
</Button>

// Incorrect: do not edit src/components/ui/button.tsx
```

---

## 7. Icon Rules

- **lucide-react is the only permitted icon library.** Do not install or use any other icon library (Heroicons, Radix Icons, FontAwesome, etc.).
- shadcn/ui already depends on lucide-react; no additional install is needed.

### Standard sizes

| Context | Classes |
|---|---|
| Inline with text | `w-4 h-4` |
| Standard UI icon | `w-5 h-5` |
| Large / feature icon | `w-6 h-6` |

### Usage pattern

```tsx
import { BookOpen, Star, Trophy } from 'lucide-react';

// Inline with text (button label, badge)
<BookOpen className="w-4 h-4 mr-1" />

// Standard UI icon (card icon, nav item)
<Star className="w-5 h-5 text-amber-500" />

// Large icon (empty state, feature illustration)
<Trophy className="w-6 h-6 text-violet-600" />
```

### Rules
- Always pair icon with a text label or `aria-label` for accessibility. Do not use icon-only buttons without an `aria-label`.
- Use `text-{color}` to color icons — never `fill-` or `stroke-` utilities directly.
- Do not scale icons with `transform scale-` — choose the appropriate size class.
