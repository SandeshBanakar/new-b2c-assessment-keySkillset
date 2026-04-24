# B2C Assessment Card Design Pattern Analysis

## Overview
The B2C assessments platform uses a **unified card component pattern** for displaying assessments across two main sections:
1. **Your Assessments Section** - Cards for user's attempted assessments
2. **Assessment Library Section** - Cards for all available assessments organized by exam category

---

## Card Component Files

### Primary Component File
- **[src/components/assessment/AssessmentCard.tsx](src/components/assessment/AssessmentCard.tsx)** — Main card component used across all sections
- **[src/app/assessments/page.tsx](src/app/assessments/page.tsx)** — Main assessments page with upgrade modals
- **[src/components/assessment/YourAssessmentsSection.tsx](src/components/assessment/YourAssessmentsSection.tsx)** — Container for user's in-progress assessments
- **[src/components/assessment/AssessmentLibrarySection.tsx](src/components/assessment/AssessmentLibrarySection.tsx)** — Container for assessment library with exam grouping
- **[src/types/assessment.ts](src/types/assessment.ts)** — TypeScript interfaces for assessment data

---

## Card Component Structure & Layout

### Visual Hierarchy (Top to Bottom)

#### 1. **Header Image / Gradient Placeholder**
```
┌─────────────────────────────────────┐
│                                     │
│     160px (h-40)                    │
│    Exam-specific gradient OR        │
│    Thumbnail image                  │
│    (with exam name overlay)         │
│                                     │
└─────────────────────────────────────┘
```
- **Height**: 40 (`h-40` = 160px)
- **Placeholder**: If no `thumbnail_url`, shows exam-specific gradient
- **Gradient colors per exam**: 
  - SAT: `from-blue-100 to-blue-200`
  - JEE: `from-orange-100 to-orange-200`
  - NEET: `from-green-100 to-green-200`
  - PMP: `from-purple-100 to-purple-200`
  - CLAT: `from-rose-100 to-rose-200`
  - BANK: `from-teal-100 to-teal-200`
  - SSC: `from-amber-100 to-amber-200`

#### 2. **Content Section** (Padding: 16px / `p-4`)

**Row 1 — Status Badges**
- Exam category badge (e.g., "SAT", "JEE")
- Conditional badges:
  - "1 Free Attempt" (when free attempt available, State 1 & 3)
  - "Free Attempt Exhausted" (when free attempt used, State 2)

**Row 2 — Assessment Title**
- Font: `text-base` (16px), `font-medium`
- Color: `text-zinc-900` (dark text)
- Example: "Full-Length SAT Practice Test 1"

**Row 3 — Metadata**
- Flex wrap layout with gap
- **Components**:
  - Total questions: `{assessment.total_questions} questions`
  - Duration: `{assessment.duration_minutes}m`
  - Difficulty badge: Easy/Medium/Hard with color coding

**Row 4 — Progress Bar** (Conditional - shown for States 5, 6, 7)
```
Attempts
████████░░ 4/6 used
```
- Label: "Attempts"
- Filled percentage: `(attemptData.attemptsUsed / 6) * 100`
- Bar height: `h-1.5` (6px)
- Fill color: `bg-blue-500`
- Background: `bg-zinc-100`

**Row 5 — Call-to-Action Buttons**
- Full-width buttons stacked vertically
- Gap between buttons: `gap-2`
- **Button styles**:
  - **Primary**: Blue background (`bg-blue-600`) with white text
  - **Secondary**: Border with transparent background (`border border-zinc-300`)
  - **Special**: Blue border variant for resuming tests

---

## Card Props (Interface: AssessmentCardProps)

```typescript
interface AssessmentCardProps {
  assessment: SupabaseAssessment;
  attemptData: MockAttemptData;
  userTier: Tier;
  activePlanInfo?: ActivePlanInfo | null;
}
```

### Assessment Object (SupabaseAssessment)
| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier |
| `title` | string | Assessment name |
| `description` | string | Full description |
| `exam_categories` | ExamCategoryRef | Exam type with display name |
| `assessment_type` | string | "full-test", "subject-test", "chapter-test" |
| `difficulty` | string | "Easy", "Medium", or "Hard" |
| `duration_minutes` | number | Test duration in minutes |
| `total_questions` | number | Question count |
| `min_tier` | Tier | Minimum subscription required |
| `thumbnail_url` | string \| null | Card image URL (optional) |
| `slug` | string | URL-friendly identifier |
| `tags` | string[] | Tags (optional) |

### Attempt Data (MockAttemptData)
| Property | Type | Description |
|----------|------|-------------|
| `attemptsUsed` | number | How many of 6 attempts consumed (0-6) |
| `status` | string | "not_started", "inprogress", or "completed" |
| `isFreeAttempt` | boolean | Whether this was a free attempt |
| `score` | number \| null | Current/final score (optional) |

---

## Card State Machine (7 States)

The card UI adapts based on **7 distinct states** derived from user tier, subscription, and attempt history:

### State 1: Tier Locked + Free Attempt Available
- **Condition**: User doesn't have tier access, free attempt unused
- **Chips**: "1 Free Attempt" badge shown
- **Buttons**: 
  - "Take Free Test" (primary)
  - "Upgrade to Access" (secondary)

### State 2: Tier Locked + Free Attempt Exhausted
- **Condition**: User doesn't have tier access, free attempt used
- **Chips**: "Free Attempt Exhausted" badge shown
- **Buttons**:
  - "Continue Your Test" (primary - to view incomplete attempt)
  - "Upgrade to Access" (secondary)

### State 3: Category Plan Mismatch
- **Condition**: User has category-scoped plan but assessment is outside their category
- **Buttons**: Varies by attempt status
  - If in-progress: "Resume Test" (border variant)
  - If attempted: "View Analysis" (secondary)
  - If not started: "Take Free Test" (primary)
  - Secondary: "Switch Plan"

### State 4: Tier Allows + No Attempts
- **Condition**: User has sufficient tier access, no attempts yet
- **Buttons**: "Start Your Test" (primary)
- **Special**: SAT full tests show target score picker on first attempt (touch-1 interaction)

### State 5: Tier Allows + In Progress
- **Condition**: User has tier access, attempt in progress
- **Progress Bar**: Shown
- **Buttons**: "Resume Test" (border variant with blue text)

### State 6: Tier Allows + Completed (Attempts Remain)
- **Condition**: User has tier access, attempt completed, <6 total attempts
- **Progress Bar**: Shown
- **Buttons**: "View Analysis" (secondary)

### State 7: All Attempts Exhausted
- **Condition**: User has used all 6 attempts
- **Progress Bar**: Shown (100% filled)
- **Buttons**: "View Analysis" (secondary, read-only)

---

## Card Grid Layout (Mobile-First)

### Desktop Breakpoints
```
Mobile (default):     grid-cols-1      (1 card per row)
Tablet (sm):          sm:grid-cols-2   (2 cards per row)
Desktop (lg):         lg:grid-cols-3   (3 cards per row)
Large Desktop (xl):   xl:grid-cols-4   (4 cards per row)
```

### Container Classes
```typescript
// Your Assessments Section
"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"

// Assessment Library Section
"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
```

### Gap Between Cards
- `gap-4` = 16px spacing between cards
- Consistent on all breakpoints

### Card Container
```typescript
"bg-white border border-zinc-200 rounded-2xl overflow-hidden 
 shadow-sm hover:shadow-md transition-shadow"
```
- **Border**: 1px solid zinc-200
- **Border Radius**: `rounded-2xl` (16px)
- **Shadow**: `shadow-sm` (0 1px 2px rgba), hover: `shadow-md`
- **Hover Effect**: Shadow increases on hover

---

## Mobile-First Layout Details

### Mobile (< 640px)
- **Single column layout** (`grid-cols-1`)
- **Card width**: Full available width minus padding
- **Buttons**: Full width, stacked vertically
- **Metadata**: Wraps to multiple lines
- **Badges**: Can wrap if space-constrained
- **Spacing**: Generous padding (16px) for touch targets
- **Image height**: Still 160px (h-40)

### Tablet (640px - 1024px)
- **Two column layout** (`sm:grid-cols-2`)
- **Cards**: 50% width (minus gap)
- **Gap**: 16px between cards
- **All content**: Readable without horizontal scrolling

### Desktop (1024px+)
- **Three column layout** (`lg:grid-cols-3`)
- **Large Desktop (1280px+)**: Four column layout (`xl:grid-cols-4`)
- **Optimal card size**: ~300-350px width
- **Density**: 3-4 cards visible without scrolling

### Responsive Considerations
1. **Buttons remain full-width** on all breakpoints
2. **Button height**: `py-2.5` (10px top/bottom padding = ~40px total height)
3. **Font sizes**: Fixed at `text-sm` (14px) - no responsive scaling
4. **Metadata wraps** naturally with `flex-wrap`
5. **Badges wrap** to new line if needed with `flex flex-wrap gap-2`

---

## Tab-Like Features (Non-Traditional Tabs)

While `AssessmentDetailTabs.tsx` exists, it's **not yet implemented**. Instead, the platform uses:

### 1. **Type Tabs** in Assessment Library
Located in [src/components/assessment/AssessmentLibrarySection.tsx](src/components/assessment/AssessmentLibrarySection.tsx)

```typescript
type ActiveType = 'full-test' | 'subject-test' | 'chapter-test';
```

**Styling** (button-based tabs):
- **Inactive**: `text-zinc-500 px-4 py-1.5 text-sm hover:text-zinc-700`
- **Active**: `bg-white border border-blue-300 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm`
- **Behavior**: Clicking tab resets exam and progress filters

### 2. **Filter Dropdowns** (Not Traditional Tabs)

#### Your Assessments Section Filters:
- **Exam Filter**: All Exams → [dynamically populated]
- **Type Filter**: All Types → Full Test, Subject Test, Chapter Test
- **Status Filter**: All Status → Not Started, In Progress, Completed

#### Assessment Library Filters:
- **Type Buttons**: Full Tests, Subject Tests, Chapter Tests (tab-like)
- **Exam Dropdown**: All Exams → [dynamically populated]
- **Progress Dropdown**: All Progress → Not Started, In Progress, Completed

---

## Badge & Color System

### Exam Badges (Tailwind Classes)
```typescript
const EXAM_BADGE: Record<string, string> = {
  SAT:  'bg-blue-50 text-blue-700 border border-blue-200',
  JEE:  'bg-orange-50 text-orange-700 border border-orange-200',
  NEET: 'bg-green-50 text-green-700 border border-green-200',
  PMP:  'bg-purple-50 text-purple-700 border border-purple-200',
  CLAT: 'bg-rose-50 text-rose-700 border border-rose-200',
  BANK: 'bg-teal-50 text-teal-700 border border-teal-200',
  SSC:  'bg-amber-50 text-amber-700 border border-amber-200',
};
```

### Difficulty Badges
```typescript
const DIFF_BADGE: Record<string, string> = {
  easy:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  hard:   'bg-red-50 text-red-700 border border-red-200',
};
```

### Status Badges
- **Free Attempt**: `bg-blue-50 border border-blue-200 text-blue-700`
- **Exhausted**: `bg-amber-50 border border-amber-200 text-amber-700`

---

## Component Composition

### Page Structure Hierarchy
```
/assessments
  ├── Upgrade Success Modal
  ├── Plan Success Banner
  ├── TierGateBanner
  └── AssessmentLibrarySection
       ├── Type Tabs (Full/Subject/Chapter)
       ├── Filter Dropdowns
       └── ExamCategorySection (per exam)
            └── Grid of AssessmentCards (4 visible, "Show all" button)

/assessments/[id]
  ├── DetailHeader
  ├── AssessmentDetailTabs (NOT YET IMPLEMENTED)
  └── Content
```

### Related Components
- **[src/components/assessment/TierGateBanner.tsx](src/components/assessment/TierGateBanner.tsx)** — Tier upgrade awareness banner
- **[src/components/assessment/SubscribeModal.tsx](src/components/assessment/SubscribeModal.tsx)** — Modal for plan upgrades
- **[src/components/assessment/StartAssessmentButton.tsx](src/components/assessment/StartAssessmentButton.tsx)** — CTA button component (reusable)
- **[src/components/assessment/AttemptHistoryList.tsx](src/components/assessment/AttemptHistoryList.tsx)** — Attempt history display

---

## Key Design Principles

1. **State-Driven UI**: Card appearance and CTAs change based on user tier + attempt history
2. **Mobile-First Progressive Enhancement**: 1 column → 2 columns → 3-4 columns
3. **Consistency**: Single `AssessmentCard` component reused across all contexts
4. **Accessibility**: All buttons have hover states and proper focus indicators
5. **Color Coding**: Exam types and difficulty levels use distinct color schemes
6. **Touch-Friendly**: Minimum 40px button height, generous spacing on mobile
7. **Context Awareness**: Filters and tabs reset related state to prevent confusion

---

## Responsive Button Behavior

### Mobile (< 640px)
- Buttons: 100% width of card
- Stacked vertically
- Height: 40px (py-2.5)
- Text: 14px (text-sm)

### All Breakpoints
- Full-width within card
- Proper touch target size (44px+ recommended, currently 40px)
- Consistent styling across responsive states
- No button text truncation due to width

---

## Tailwind Utility Usage

**Key utility classes in card**:
- Layout: `flex`, `flex-col`, `flex-wrap`, `grid`
- Spacing: `p-4`, `gap-2`, `gap-3`, `gap-4`, `mb-1`, `mb-3`
- Sizing: `w-full`, `h-40`, `h-1.5`
- Typography: `text-xs`, `text-sm`, `text-base`, `font-medium`, `font-semibold`
- Colors: All Tailwind zinc, blue, emerald, amber, etc.
- Borders: `border`, `border-2`, `rounded-2xl`, `rounded-lg`, `rounded-full`
- Shadows: `shadow-sm`, `shadow-md`, `hover:shadow-md`
- Interactive: `hover:`, `transition-`, `cursor-pointer`, `disabled:`

---

## Filtering & Grouping Logic

### Your Assessments Section
**Filter Order**:
1. Show only assessments with activity (`attemptsUsed > 0` OR `status !== 'not_started'`)
2. Apply exam filter
3. Apply type filter
4. Apply status filter

### Assessment Library Section
**Grouping Order**:
1. Filter by active exam categories
2. Filter by assessment type (Full/Subject/Chapter)
3. Group by exam category
4. Apply exam dropdown filter
5. Apply progress filter within each group

**Display Logic**:
- Show 4 cards per exam category
- "Show all" button reveals remaining cards
- Empty state when no results match filters

---

## Future Considerations

1. **AssessmentDetailTabs** ([src/components/assessment/AssessmentDetailTabs.tsx](src/components/assessment/AssessmentDetailTabs.tsx)) - Currently a stub, placeholder for future tabs on assessment detail pages
2. **Score Display** - Currently only "Attempts used/6", no actual score shown
3. **Card Animations** - Currently only hover shadow, could add entrance animations
4. **Loading States** - Spinner shown while loading assessments, but individual cards don't have skeleton loaders
