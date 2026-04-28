# PRD KSS-SA-PC-001: Platform Config — Full Feature Document

**Status:** REVIEW
**Author:** Sandesh Banakar I
**Stakeholders:** Engineering (Radhika, Yashwanthkrishna), Product, QA, Design
**Target Version:** V2 (Active)
**Ticket:** KSS-SA-PC-001

---

## Changelog

| Version | Date | Change |
|---|---|---|
| V1 | Apr 20 2026 | Initial — Exam Category CRUD, DnD reorder, drill-down, is_active wiring, makeLive sync, DB-045/046/047. **COMPLETE.** |
| V2 | Apr 27 2026 | Exam Category table redesign, Section Visibility removal, Analytics Config Create Adaptive form reference. **IN PROGRESS.** |

---

## 1. Executive Summary & "The Why"

### 1.1 Problem Statement

Three gaps remain post-V1:

1. **Exam Category card grid is hard to scan at scale.** The current 3-column card grid works for 6–8 categories but gives no quick status/order visibility and requires scrolling. A table with explicit columns (Status, Display Name, Internal Name, Concept Tags, Actions) is more information-dense and admin-friendly.

2. **Section Visibility toggles are dead code.** The SAT Analytics Config sub-tab shows three toggles (College Ladder, Pacing, Mistake Taxonomy) that are never consumed by any analytics component. They write to `platform_analytics_config` but nothing reads those flags. Showing dead controls creates false confidence that toggling changes something.

3. **Create Adaptive Assessment form has no visibility into the Analytics Config.** When an SA creates an adaptive SAT assessment, there is no way to see or navigate to the tier bands and college config that will be used in the learner analytics view. Platform Config is the single source of truth for this data, but the Create form provides no link or preview.

### 1.2 Business Value

- Table view gives SA instant status + ordering awareness without opening each card
- Removing dead toggles prevents SA confusion ("why doesn't toggling this do anything?")
- Read-only analytics preview on Create Adaptive form reduces context-switching for SA during assessment creation

### 1.3 Strategic Alignment

Prerequisite for KSS-ANA-002 (SAT analytics V2 — CollegeLadder and tier band display). Analytics Config must be stable and linked before adaptive assessment creation workflow is finalized.

---

## 2. User Personas & Impact

| Persona | Impact |
|---|---|
| **Super Admin** | Exam categories shown in scannable table (Status / Display Name / Internal Name / Tags / Actions). Drag-to-reorder via row drag handle. No change to edit slide-over or drill-down flow. Section Visibility toggles removed — analytics sections always visible. When creating an adaptive SAT assessment, sees a read-only widget showing current tier bands and colleges with a direct link to Platform Config Analytics Config. |
| **B2C Learner** | No visible change. College Ladder, Pacing, Mistake Taxonomy sections always render (no toggle gate). |

---

## 3. User Flow & System Logic (V2)

### 3.1 Platform Config Main Page — Table Layout

**Entry point:** `/super-admin/platform-config` (no `?cat` param)

1. Page header: "Platform Config" + subtitle
2. Single **"Exam Category" card** with:
   - Card header row: "Exam Category" label | `{n} categories` badge (right side)
   - **"+ Create Exam Category" button** directly below header, right-aligned, above the table
   - **Table** (inside card):

   | Col | Content | Responsive |
   |---|---|---|
   | Drag handle | GripVertical icon — draggable | Hidden on `< sm` |
   | Status | `Active` (green) / `Inactive` (zinc) badge | Always visible |
   | Display Name | `category.display_name` | Always visible |
   | Internal Name | `category.name` (code, e.g. "JEE") | Hidden on `< sm` |
   | Concept Tags | Count badge | Hidden on `< sm` |
   | Actions | Edit button + View button | Always visible |

   - **Pagination:** 10 rows/page. Controls below table.

3. **Edit button** (Pencil icon, outlined) → opens existing Category slide-over
4. **View button** (outlined, `border border-zinc-200`) → pushes `?cat=[id]` → drill-down view (unchanged)

### 3.2 Drag-to-Reorder (Table Rows)

- DnD via `@dnd-kit/sortable` — `verticalListSortingStrategy` (changed from `rectSortingStrategy` which was for card grid)
- On drop: optimistic `setCategories(reordered)` → `Promise.all` batch of individual `UPDATE display_order` per row
- Drag works within the visible page only; cross-page drag is not supported (acceptable given ≤10 categories per page)

### 3.3 Drill-Down (Unchanged from V1)

1. View button → `?cat=[id]` → category detail view
2. Sub-tabs: **Concept Tags** | **Analytics Config** (SAT only) | **Rank Prediction** (NEET/JEE/CLAT only)
3. Back / breadcrumb → returns to table view

### 3.4 SAT Analytics Config — Section Visibility Removal

The "Section Visibility" panel (College Ladder toggle, Pacing toggle, Mistake Taxonomy toggle) is removed from `SATAnalyticsDisplayConfig`.

**What remains:** Tier Bands CRUD table (inline edit min/max score), College CRUD (add/edit/delete, country filter, cutoff score + aid %).

**DB:** `platform_analytics_config` rows for `show_college_ladder`, `show_pacing_preview`, `show_mistake_taxonomy_preview` are not dropped (migration deferred) — UI simply no longer writes or reads them. Analytics components already render unconditionally; no consumer-side change needed.

### 3.5 Create Adaptive Assessment — Analytics Config Reference Widget (KSS-ANA-002)

**Entry point:** `/super-admin/create-assessments/adaptive` (new assessment) or `/super-admin/create-assessments/adaptive/[id]` (edit)

When `exam_category` is SAT, a read-only **"Analytics Config"** widget appears in the form:

```
┌─ Analytics Config ────────────────────────────────── [Edit in Platform Config →] ┐
│  Tier Bands: 5 bands configured (400–1600)                                        │
│  Colleges: 12 colleges (8 US · 4 IN)                                              │
└───────────────────────────────────────────────────────────────────────────────────┘
```

- Data fetched from `sat_tier_bands` (count) and `sat_colleges` (count, grouped by country)
- "Edit in Platform Config →" opens `/super-admin/platform-config?cat=[SAT-id]` in a new tab
- Widget is read-only — no editing inline
- Widget only shown when `exam_category === 'SAT'` (other categories: widget hidden)

---

## 4. Functional Requirements (BDD Style)

### Scenario 1: Table view renders correctly
- **Given** I am on Platform Config with no `?cat` param
- **When** the page loads
- **Then** I see a single "Exam Category" card with a table of all exam categories
- **And** each row has Status badge, Display Name, Internal Name, Concept Tag count, Edit + View buttons

### Scenario 2: Drag to reorder in table
- **Given** I drag the SAT row from position 5 to position 1
- **When** I drop it
- **Then** `exam_categories.display_order` updates for all affected rows via Promise.all
- **And** the table re-renders with the new order immediately (optimistic)

### Scenario 3: Pagination
- **Given** there are 12 exam categories
- **When** I am on page 1
- **Then** I see 10 rows and a "Next" page control
- **When** I click Next
- **Then** I see the remaining 2 rows on page 2

### Scenario 4: View button drills down
- **Given** I click the "View" button on the NEET row
- **When** the router updates
- **Then** the URL changes to `?cat=[NEET-id]`
- **And** I see the NEET drill-down with Concept Tags sub-tab active

### Scenario 5: Section Visibility toggles removed
- **Given** I navigate to Platform Config → SAT → Analytics Config
- **When** the page loads
- **Then** I see Tier Bands and Colleges panels only
- **And** there is no "Section Visibility" card with toggles

### Scenario 6: SAT analytics always rendered
- **Given** the toggles are removed
- **When** a B2C learner views a SAT assessment result
- **Then** College Ladder, Pacing, and Mistake Taxonomy sections render unconditionally (no flag check)

### Scenario 7: Analytics Config widget on Create Adaptive (SAT)
- **Given** I am creating/editing an adaptive assessment with exam_category = SAT
- **When** the form renders
- **Then** I see a read-only "Analytics Config" widget showing tier band count and college count
- **And** "Edit in Platform Config →" link opens the SAT Analytics Config in a new tab

### Scenario 8: Analytics Config widget hidden for non-SAT
- **Given** I am creating/editing an adaptive assessment with exam_category = NEET
- **When** the form renders
- **Then** the Analytics Config widget is not shown

---

## 5. Technical Specifications (V2)

### 5.1 Files Changed

| File | Change |
|---|---|
| `platform-config/page.tsx` | Replace `SortableExamCard` + card grid → `SortableExamRow` + table inside "Exam Category" card. Change `rectSortingStrategy` → `verticalListSortingStrategy`. Add pagination state. Remove Section Visibility panel from `SATAnalyticsDisplayConfig`. Remove `AnalyticsConfig` interface, `analyticsConfig` state, `configSaving/configSaved`, `saveConfig()`, `platform_analytics_config` query. |
| `create-assessments/adaptive/page.tsx` | Add `AnalyticsConfigWidget` component. Fetch `sat_tier_bands` count + `sat_colleges` count when exam_category is SAT. |
| `create-assessments/adaptive/[id]/page.tsx` | Same widget. |

### 5.2 DnD Strategy Change

```typescript
// Before (card grid):
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
<SortableContext items={...} strategy={rectSortingStrategy}>

// After (table rows):
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
<SortableContext items={...} strategy={verticalListSortingStrategy}>
```

### 5.3 Drag Save — Promise.all replacement

```typescript
// Before: sequential for-loop (blocking)
for (const { id, display_order } of updates) {
  await supabase.from('exam_categories').update({ display_order }).eq('id', id)
}

// After: parallel batch
await Promise.all(
  updates.map(({ id, display_order }) =>
    supabase.from('exam_categories').update({ display_order }).eq('id', id)
  )
)
```

### 5.4 Analytics Config Widget (Adaptive Form)

```typescript
// Fetched on mount when examCategory === 'SAT'
const [bandCount, setBandCount] = useState(0)
const [collegeCounts, setCollegeCounts] = useState({ us: 0, in: 0 })

// Read-only display — no mutations
```

### 5.5 DB — No New Migrations Required

- `platform_analytics_config` rows stay (no DROP); UI simply stops reading/writing the 3 toggle keys
- `sat_tier_bands`, `sat_colleges` tables unchanged
- `verticalListSortingStrategy` change is front-end only

---

## 6. Scope Boundaries (V2)

### 6.1 IN SCOPE (V2)
- Exam Category table redesign (card grid → table inside single card)
- Drag-to-reorder as table rows with `verticalListSortingStrategy`
- Pagination (10/page)
- Section Visibility toggles removed from SAT Analytics Config
- `AnalyticsConfig` interface + related state/functions removed from `platform-config/page.tsx`
- Read-only Analytics Config reference widget on Create Adaptive Assessment form (SAT only)

### 6.2 OUT OF SCOPE (Deferred)
- DROP `platform_analytics_config` rows for toggle keys (DB cleanup — separate migration)
- Analytics Display config for NEET/JEE/CLAT/BANK/SSC ("Coming Soon" state unchanged)
- Audit logging for exam category mutations
- Drag across pagination pages

---

## 7. Edge Cases & Risk Mitigation

- **Drag within page 2:** `handleDragEnd` uses `findIndex` on full `categories` array — page offset handled correctly
- **Section Visibility DB rows:** Orphaned `platform_analytics_config` rows for the 3 keys are harmless; no query reads them outside `platform-config/page.tsx` (grep-confirmed)
- **Analytics Config widget when SAT has 0 tier bands:** Show "Not configured" state with the Platform Config link still visible
- **Mobile table:** Hide drag handle, Internal Name, Concept Tags columns below `sm` breakpoint. Drag-to-reorder unavailable on very small screens (touch users see truncated row — acceptable for an SA-only page)

---

## 8. Success Metrics

- `npm run build` passes clean after V2 implementation
- Platform Config main page renders exam categories as a sortable table with pagination
- SAT Analytics Config sub-tab shows only Tier Bands + Colleges (no Section Visibility card)
- Create Adaptive form shows tier band/college summary when SAT is selected
- Zero TS errors on removed `AnalyticsConfig` type references

---

## V1 Completed Items (Reference)

| Item | Status |
|---|---|
| Exam Category CRUD (create/edit slide-over, delete guard) | ✅ DONE |
| Drag-to-reorder card grid + `display_order` DB save | ✅ DONE |
| Drill-down via `?cat` URL param | ✅ DONE |
| `display_name` column added (Option B) | ✅ DONE |
| DB-045 (description + display_order + display_name columns) | ✅ DONE |
| DB-046 (assessments.exam_category_id FK) | ✅ DONE |
| DB-047 (exam_categories seed — display names + order) | ✅ DONE |
| `is_active` wiring in SA dropdowns | ✅ DONE |
| Concept Tags panel (per category) | ✅ DONE |
| Analytics Config sub-tab (SAT — tier bands + colleges) | ✅ DONE |
| Rank Prediction sub-tab (NEET/JEE/CLAT) | ✅ DONE |
