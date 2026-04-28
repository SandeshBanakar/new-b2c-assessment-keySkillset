# PRD KSS-B2B-RC-001: B2B Learner Report Card + Salesforce Delivery

**Status:** DRAFT  
**Author:** Sandesh Banakar  
**Date:** Apr 27 2026  
**Area:** B2B Learner Portal — Analytics + Communications

---

## 1. Executive Summary

B2B learners need a downloadable, comprehensive assessment performance report ("Report Card") that consolidates all attempt history, score analysis, certificate status, and recommendations into a single deliverable. The report card is triggered by learner request from the Analytics tab and delivered to the learner's registered email via Salesforce (Marketing Cloud or Service Cloud), not generated on-demand in-browser.

This PRD covers:
1. The in-app request flow (Analytics tab modal → confirmation)
2. The report card content specification
3. The Salesforce delivery requirement
4. The Super Admin / Client Admin visibility model

---

## 2. User Personas & Impact

| Persona | Impact |
|---------|--------|
| **B2B Learner** | Receives a single professional document summarizing assessment performance — useful for personal records, employer sharing, and progress tracking |
| **Client Admin** | Can audit which learners requested report cards; ties into CRM activity tracking |
| **Salesforce Admin** | Needs the data payload and template specification to configure the email journey |

---

## 3. In-App Request Flow

### 3.1 Entry Point
`/b2b-learner/[tenant]/assessments/[id]` → Analytics tab → **Report Card section** (top of tab)

### 3.2 Report Card Section (Analytics Tab)
- Blue-50 card with `FileSpreadsheet` icon + "Report Card" heading
- Subtitle: "Comprehensive performance report delivered to your email"
- **Download button** (blue-700, disabled if 0 attempts)
- On click: opens `ReportCardModal`

### 3.3 Modal Behavior
**Modal contents:**
- Header: "Request Report Card" + subtitle
- "What's included" section — 6 bullet points (see §4)
- Eligibility notice (amber-50): "Complete at least one attempt to request"
- Delivery notice (blue-50): "Your report card will be generated and sent to your registered email via our Salesforce-powered platform within 24 hours"
- CTA: **"Request Report Card"** (disabled if 0 attempts) + Cancel

**On Request click:**
- Modal closes
- Report Card section shows "Requested" pill badge
- Subtitle updates to: "Request submitted — your report card will be emailed within 24 hours."
- State: `requested = true` persists for current session (no DB write in V1)

### 3.4 Eligibility Rule (V1)
- Minimum 1 completed attempt required
- No passing requirement — learners in progress are eligible

---

## 4. Report Card Content Specification

The report card document (rendered by Salesforce or a PDF service) must include:

### Section 1 — Header
- Tenant logo + name (white-label from `tenants` table)
- keySkillset branding (co-branded)
- Assessment title
- Learner full name + email
- Report generated date

### Section 2 — Score Summary
- Total attempts used (X / 5)
- Best score achieved (highest `score_pct`)
- Latest score
- Average score across all attempts
- Pass / Fail overall status (passed if any attempt is passing)

### Section 3 — Attempt History Table
| Attempt | Date | Score | Time Taken | Result |
|---------|------|-------|------------|--------|
| 1 | DD-MMM-YYYY | 58% | 90 min | Fail |
| 2 | DD-MMM-YYYY | 72% | 85 min | Pass |
| ... | | | | |

### Section 4 — Score Trajectory Chart (static image)
- Bar chart showing score_pct per attempt (emerald = pass, rose = fail)
- Generated server-side as SVG/PNG embed

### Section 5 — Certificate Status
- If certificate issued: certificate number + issued date + download link
- If pending: "Eligible — certificate being processed"
- If not yet earned: "Complete an attempt with ≥80% to earn certificate"

### Section 6 — Recommendations (hardcoded for V1)
- "Review areas where you scored below 70%"
- "Re-attempt within 48 hours for best retention"
- "Contact your administrator for additional study resources"
- "View your course curriculum to reinforce weak areas"

### Section 7 — Footer
- keySkillset platform URL
- Salesforce unsubscribe / preferences link
- Tenant contact information

---

## 5. Salesforce Integration Requirement

### 5.1 Trigger
When a learner clicks "Request Report Card" in the modal:
- Platform sends a webhook / API call to Salesforce with the data payload
- Salesforce triggers a transactional email journey

### 5.2 Data Payload (to Salesforce)
```json
{
  "learner_id": "uuid",
  "learner_email": "email@example.com",
  "learner_name": "Full Name",
  "tenant_id": "uuid",
  "tenant_name": "Akash Institute Delhi",
  "tenant_logo_url": "https://...",
  "assessment_id": "uuid",
  "assessment_title": "SAT Full Mock Test 1",
  "requested_at": "2026-04-27T12:00:00Z",
  "attempts": [
    {
      "attempt_number": 1,
      "score_pct": 58,
      "passed": false,
      "attempted_at": "2026-02-26T...",
      "time_taken_seconds": 5400
    }
  ],
  "best_score_pct": 72,
  "avg_score_pct": 65,
  "certificate_number": "KSS-2026-0042",
  "certificate_issued_at": "2026-03-14T..."
}
```

### 5.3 Salesforce Template Requirements
- **Template type:** Transactional HTML email (not marketing)
- **From address:** `noreply@keyskillset.com` (or white-labeled from tenant config)
- **Subject:** `[{{tenant_name}}] Your Assessment Report Card — {{assessment_title}}`
- **Content:** Renders the 7 sections defined in §4 as HTML email
- **Attachments (V2):** PDF version of the report card (requires PDF generation service)
- **SLA:** Delivered within 24 hours of request trigger

### 5.4 Salesforce Object Mapping
| Platform field | Salesforce object |
|---|---|
| `learner_email` | Contact.Email |
| `tenant_name` | Account.Name |
| `assessment_title` | Custom Object: Assessment_Result__c |
| `requested_at` | Custom Object: Report_Card_Request__c |

---

## 6. DB Requirements (V1 — No Migration Needed)

V1 does not write the request to the DB. The modal interaction is session-only. The `requested` state resets on page refresh.

**V2 (future):** Add a `report_card_requests` table:
```sql
create table report_card_requests (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references b2b_learners(id),
  tenant_id uuid references tenants(id),
  assessment_id uuid references assessment_items(id),
  requested_at timestamptz default now(),
  status text default 'PENDING', -- PENDING / SENT / FAILED
  sent_at timestamptz
);
```

---

## 7. Scope Boundaries

### 7.1 In Scope
- Analytics tab report card section UI (Download button + modal)
- Modal content: sections, eligibility, delivery notice, Salesforce mention
- Data payload specification for Salesforce
- Report card content sections specification
- Salesforce template field mapping

### 7.2 Out of Scope (Deferred)
| Item | Reason |
|------|--------|
| Actual Salesforce API integration | Requires Salesforce org setup + credentials |
| PDF generation on platform | Requires separate PDF rendering service |
| DB write for request tracking | V2 feature — `report_card_requests` table |
| Client Admin report card audit view | CA dashboard feature — separate ticket |
| Bulk report card generation for CA | Separate SA/CA reporting feature |
| White-labelled PDF with custom fonts | Requires font licensing + PDF service |

---

## 8. Build Order (Implementation Phases)

```
Phase 1 (COMPLETE — Apr 27 2026):
  - Analytics tab report card section (blue card, Download button)
  - ReportCardModal component (sections, eligibility, Salesforce notice)
  - Session-state "Requested" confirmation

Phase 2 (Future — pending Salesforce setup):
  - Webhook trigger on "Request Report Card" click
  - Salesforce journey configuration
  - `report_card_requests` DB table + write on request

Phase 3 (Future — after Phase 2 stable):
  - PDF generation + attachment
  - CA audit view of report card requests
  - White-label PDF branding
```

---

## 9. Success Criteria

- [x] Report Card section visible in Analytics tab for all B2B learners
- [x] Download button disabled if 0 attempts
- [x] Modal shows all 6 content sections, eligibility, and Salesforce delivery notice
- [x] "Request Report Card" click shows "Requested" confirmation, modal closes
- [ ] Salesforce webhook fires on request (Phase 2)
- [ ] Email delivered within 24 hours (Phase 2)
- [ ] PDF attachment available (Phase 3)
