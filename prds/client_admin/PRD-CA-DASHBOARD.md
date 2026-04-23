# PRD KSS-CA-OVERHAUL-001: Client Admin Dashboard & Profile Overhaul

**Status:** DRAFT  
**Author:** Claude (AI Assistant)  
**Stakeholders:** Engineering (keySkillset Team), Product, QA, Design  
**Target Version:** V1 (Current)

---

## 1. Executive Summary & "The Why"

### 1.1 Problem Statement
The current Client Admin interface has two separate pages (Dashboard and Reports) that don't differentiate between the two tenant modes:
- **FULL_CREATOR** tenants need to see content creation metrics (courses, assessments, questions added)
- **RUN_ONLY** tenants need to see learner progress metrics (completion rates, average scores, attempts)

Additionally, the profile section uses a single "Full Name" field, while the Super Admin uses "First Name" and "Last Name" — creating inconsistency across the platform.

### 1.2 Business Value & ROI
- **Efficiency:** Unified dashboard reduces navigation overhead for client admins
- **Role Clarity:** Differentiated metrics per tenant mode ensures relevant data visibility
- **Consistency:** Name field alignment with Super Admin improves UX consistency

### 1.3 Strategic Alignment
This aligns with the V1 platform consolidation goal — simplifying admin interfaces while maintaining feature parity where needed.

---

## 2. User Personas & Impact

| Persona | Impact / Workflow Change |
| :--- | :--- |
| **FULL_CREATOR Client Admin** | Now sees Content tab (courses, assessments, questions) + Analytics tab on unified dashboard. No longer needs separate Dashboard + Reports navigation for quick stats. |
| **RUN_ONLY Client Admin** | Now sees Overview tab (learner metrics) + Performance tab on unified dashboard. Metrics aligned with Super Admin dashboard patterns. |
| **Content Creator** | Profile name fields split to First/Last Name — consistent with CA profile editing. |

---

## 3. User Flow & System Logic

### 3.1 Functional Flowchart
- **Entry Point:** Client Admin logs in → lands on `/client-admin/{tenant}/dashboard`
- **Process:** System reads `tenants.feature_toggle_mode` to determine role variant
- **Outcome:** 
  - FULL_CREATOR → Content | Analytics tabs
  - RUN_ONLY → Overview | Performance tabs

### 3.2 State Transition Logic
| Trigger | Condition | Result |
|---------|-----------|--------|
| Page load | `tenant.feature_toggle_mode = 'FULL_CREATOR'` | Show Content/Analytics tabs |
| Page load | `tenant.feature_toggle_mode = 'RUN_ONLY'` | Show Overview/Performance tabs |
| Tab click | User switches tab | Update local state, render corresponding content |

---

## 4. Functional Requirements (BDD Style)

### Scenario 1: FULL_CREATOR views Content stats
* **Given** I am a Client Admin with FULL_CREATOR mode
* **When** I navigate to the Dashboard
* **Then** I should see three stat cards: Courses Created, Assessments Created, Questions Added
* **And** Questions count should only include questions created by Content Creators in my tenant

### Scenario 2: RUN_ONLY views Overview stats
* **Given** I am a Client Admin with RUN_ONLY mode
* **When** I navigate to the Dashboard
* **Then** I should see five stat cards: Active Learners, Completion Rate, Certificate Rate, Average Score, Total Attempts
* **And** Completion Rate = (Learners with ≥1 completed attempt / Total active learners) × 100
* **And** Certificate Rate = (Learners with certificate / Total active learners) × 100

### Scenario 3: CA edits profile name
* **Given** I am on the Users & Roles page
* **When** I click "Edit" on my profile name
* **Then** I should see two input fields: First Name and Last Name
* **And** I can edit both fields
* **And** clicking "Save" updates both `first_name` and `last_name` columns in `admin_users`

### Scenario 4: Add Content Creator with split name
* **Given** I am a FULL_CREATOR Client Admin
* **When** I click "Add Content Creator"
* **Then** I should see two input fields: First Name and Last Name
* **And** both fields are required (First Name mandatory, Last Name optional)

---

## 5. Technical Specifications (Production Grade)

### 5.1 Data Entities & Logic

#### Database Changes
```sql
-- KSS-DB-052: Add name split columns to admin_users
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS first_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS last_name TEXT NULL;

-- Migration: Split existing name
UPDATE admin_users
SET 
  first_name = split_part(name, ' ', 1),
  last_name = CASE 
    WHEN position(' ' IN name) > 0 
    THEN substr(name, position(' ' IN name) + 1)
    ELSE NULL
  END;
```

#### Queries
| Metric | Query |
|--------|-------|
| Courses Created | `SELECT COUNT(*) FROM courses WHERE tenant_id = :tenantId` |
| Assessments Created | `SELECT COUNT(*) FROM assessment_items WHERE tenant_scope_id = :tenantId` |
| Questions Added | `SELECT COUNT(*) FROM questions WHERE created_by IN (SELECT id FROM admin_users WHERE tenant_id = :tenantId AND role = 'CONTENT_CREATOR')` |
| Active Learners | `SELECT COUNT(*) FROM learners WHERE tenant_id = :tenantId AND status = 'ACTIVE'` |
| Completion Rate | `SELECT COUNT(DISTINCT learner_id) / COUNT(*) * 100 FROM learner_attempts WHERE tenant_id = :tenantId` |
| Certificate Rate | `SELECT COUNT(DISTINCT learner_id) / (SELECT COUNT(*) FROM learners WHERE tenant_id = :tenantId AND status = 'ACTIVE') * 100 FROM certificates WHERE tenant_id = :tenantId` |
| Average Score | `SELECT AVG(score) FROM learner_attempts WHERE tenant_id = :tenantId AND score IS NOT NULL` |

### 5.2 API Requirements
- No new API endpoints required
- Use existing Supabase queries via `@/lib/supabase/client`

### 5.3 UI Components
| Component | Location | Description |
|-----------|----------|-------------|
| StatCard | Inline in dashboard/page.tsx | Reusable stat display with icon, value, label |
| TabButton | Inline in dashboard/page.tsx | Tab navigation button |
| ContentStats | dashboard/page.tsx | FULL_CREATOR content metrics |
| OverviewStats | dashboard/page.tsx | RUN_ONLY learner metrics |

---

## 6. Scope Boundaries (V1 vs. V2)

### 6.1 IN SCOPE (V1)
- [x] Unified dashboard with role-based tabs
- [x] FULL_CREATOR: Content tab (courses, assessments, questions)
- [x] RUN_ONLY: Overview tab (learner metrics)
- [x] Name field split in Users & Roles (CA profile + CC management)
- [x] Backward compatibility: Reports page still accessible

### 6.2 OUT OF SCOPE (V2)
- [ ] Full analytics integration (Reports tabs 1-5) — placeholder only
- [ ] Learner detail drill-down from dashboard stats
- [ ] Export functionality on dashboard
- [ ] Date range filters on dashboard

---

## 7. Files Modified

| File | Change |
|------|--------|
| `docs/requirements/SQL-CA-MIGRATIONS.txt` | Added KSS-DB-052 migration |
| `src/app/client-admin/[tenant]/users-roles/page.tsx` | Split name fields in CA profile, CC add/edit/view |
| `src/app/client-admin/[tenant]/dashboard/page.tsx` | Unified dashboard with role-based tabs |
| `src/app/client-admin/[tenant]/layout.tsx` | Added note about Reports merge |

---

## 8. Verification Checklist

- [ ] `npm run build` passes
- [ ] FULL_CREATOR (Akash Institute) sees Content + Analytics tabs
- [ ] RUN_ONLY (TechCorp) sees Overview + Performance tabs
- [ ] CA profile shows First Name + Last Name fields
- [ ] Edit opens both name fields
- [ ] Content Creator add/edit shows split name fields
- [ ] Avatar initials use first_name + last_name