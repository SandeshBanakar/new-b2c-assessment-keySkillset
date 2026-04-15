# PRD [KSS-ID]: [Feature Name]
**Status:** DRAFT / REVIEW / LOCKED
**Author:** [Your Name]
**Target Version:** V1 (Locked) / V2 (Deferred)

---

## 1. Executive Summary & "The Why"
*One paragraph on the problem we are solving for the user (e.g., B2B Learner organization) and the business value (e.g., reducing churn).*

## 2. User Personas & Impacts
- **Client Admin:** [How it changes their workflow]
- **Learner:** [The end-user experience]
- **Super Admin:** [Management overhead]

## 3. Functional Requirements (BDD Style)
*Use "Given-When-Then" format to avoid ambiguity.*
- **Scenario:** Creating a new [Entity]
  - **Given** I am a Client Admin on a FULL_CREATOR tenant
  - **When** I submit a unique name and description
  - **Then** a new record is created with status 'ACTIVE' and an audit log is generated.

## 4. Technical Constraints & Data Model (The "Claude" Section)
*Crucial: Explicitly link to `CLAUDE-DB.md` rules here.*
- **Schema:** Requires new table `[table_name]`? (Yes/No)
- **RLS:** Must remain OFF.
- **Tenant Scope:** Use `tenant_id` for ownership; `tenant_scope_id` for content visibility.
- **Polymorphism:** If linking to content, specify `content_type` (COURSE/ASSESSMENT).

## 5. Scope Boundaries (V1 vs. V2)
- **IN SCOPE:** [Bullet list of mandatory features]
- **OUT OF SCOPE (V2):** [Deferred features to avoid scope creep]

## 6. Edge Cases & Error Handling
- What happens if the tenant hits their seat limit?
- What happens if a duplicate name is submitted? (Case-insensitivity check).

## 7. Success Metrics
- [Metric 1]: e.g., 20% reduction in manual support tickets.
- [Metric 2]: e.g., 100% audit coverage for all CRUD actions.