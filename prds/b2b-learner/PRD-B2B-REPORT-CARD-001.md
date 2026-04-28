# PRD KSS-B2B-RC-001: B2B Learner Report Card + Salesforce Delivery

**Status:** LOCKED  
**Author:** Sandesh Banakar  
**Date:** Apr 28 2026 (revised from Apr 27 2026 draft)  
**Area:** B2B Learner Portal — Analytics + Communications

---

## Change Log

| Version | Date | Change |
|---------|------|--------|
| DRAFT | Apr 27 2026 | Initial draft — on-demand request model |
| LOCKED | Apr 28 2026 | Revised to auto-send per-attempt model. Added Salesforce payload contract, per-question time spec, co-branding, re-send flow, B2B Learner email persona. |

---

## 1. Executive Summary

B2B learners receive an **automatic assessment report card** delivered to their registered email after **every attempt** — not on-demand. The report card is a Salesforce-generated PDF (Marketing Cloud / Service Cloud) triggered by a webhook from the platform exam engine. Engineering sends a structured JSON payload; the Salesforce team owns the template rendering and delivery.

This PRD covers:
1. The in-app Analytics tab — report card banner + modal (info + re-send flow)
2. The Salesforce payload contract (per-attempt)
3. The email template specification (incl. placeholder sections for V2)
4. The B2B Learner email persona in the QA template system

---

## 2. User Personas & Impact

| Persona | Impact |
|---------|--------|
| **B2B Learner** | Automatically receives a Salesforce PDF report card after every attempt. Can request a re-send from the Analytics tab if email was not received. |
| **Client Admin** | Can audit which learners received report cards (V2 — `report_card_requests` table). |
| **Salesforce Admin / Dev** | Receives this PRD as the payload contract + template spec to configure the journey and build the PDF template. |

---

## 3. In-App Report Card Banner (Analytics Tab)

### 3.1 Entry Point
`/b2b-learner/[tenant]/assessments/[id]` → Analytics tab → **Report Card banner** (top of tab)

### 3.2 Banner States

| State | Subtitle | Button |
|-------|----------|--------|
| 0 attempts | "Will be automatically emailed after your first attempt." | Details (info icon) |
| 1+ attempts | "Sent to your email after each attempt via Salesforce." | Details (info icon) |
| Re-send requested | "Re-send requested — check your registered email inbox." | Details (info icon) |

The banner button always opens the modal. No download action occurs — nothing is generated in-browser.

### 3.3 Report Card Modal

**Title:** Assessment Report Card  
**Subtitle:** Auto-delivered via Salesforce after every attempt

**Delivery notice (1+ attempts):**
> "Your report card was automatically emailed to your registered address after completing this attempt. Please check your inbox. Didn't receive it? Use 'Request Re-send' below."

**Delivery notice (0 attempts):**
> "Your report card will be automatically emailed to your registered address after you complete your first attempt. No action needed — it's sent by Salesforce."

**What's in your report card** — Salesforce payload fields displayed to learner:
- Learner name & email → `learner_name, learner_email`
- Institution (co-branded) → `company_name + platform_name`
- Assessment title → `assessment_title`
- Attempt number → `attempt_number`
- Score percentage → `score_pct`
- Pass / Fail outcome → `passed`
- Total time taken → `time_taken_seconds`
- Per-question time (raw) → `time_per_question[]` *(production exam engine only)*
- Avg · Slowest · Fastest time → `avg/slowest/fastest_question_time_seconds`
- All attempt scores (trend) → `attempt_history[]`
- Average & best score → `average_score_pct, best_score_pct`
- Certificate eligibility → `certificate_eligible`
- Certificate number → `certificate_number`

**Coming in V2 note:** Section Breakdown · Concept Mastery · Pacing Analysis · Mistake Taxonomy

**Modal buttons:**
- Close (secondary)
- Request Re-send (primary, disabled if 0 attempts)

### 3.4 Re-send Behavior (V1)
- Clicking "Request Re-send" sets `requested = true` (session state, no DB write)
- Banner subtitle updates to "Re-send requested — check your registered email inbox."
- Modal closes
- V2: Write to `report_card_requests` table + trigger Salesforce re-send journey

---

## 4. Salesforce Payload Contract

### 4.1 Trigger
After each `learner_attempts` record is created → platform sends webhook to Salesforce → Salesforce triggers transactional journey.

**Demo:** Not wired (exam engine not integrated). Session state only.  
**Production:** Exam engine completion → webhook → Salesforce.

### 4.2 Payload JSON Schema (per attempt)

```json
{
  "learner_id": "uuid",
  "learner_name": "Ananya Krishnan",
  "learner_email": "ananya.krishnan@akash.example.com",
  "tenant_id": "uuid",
  "company_name": "Akash Institute",
  "company_logo_url": "https://...",
  "platform_name": "keySkillset",
  "support_email": "contact@keyskillset.com",
  "assessment_id": "uuid",
  "assessment_title": "SAT Full Mock Test 1",
  "attempt_number": 2,
  "score_pct": 72,
  "passed": true,
  "time_taken_seconds": 5400,
  "attempted_at": "2026-04-22T10:45:00Z",
  "time_per_question": [
    { "question_number": 1, "time_seconds": 135 },
    { "question_number": 2, "time_seconds": 420 }
  ],
  "avg_time_per_question_seconds": 135,
  "slowest_question_time_seconds": 420,
  "fastest_question_time_seconds": 18,
  "attempt_history": [
    {
      "attempt_number": 1,
      "score_pct": 58,
      "passed": false,
      "time_taken_seconds": 5700,
      "attempted_at": "2026-03-15T09:00:00Z"
    },
    {
      "attempt_number": 2,
      "score_pct": 72,
      "passed": true,
      "time_taken_seconds": 5400,
      "attempted_at": "2026-04-22T10:45:00Z"
    }
  ],
  "average_score_pct": 65,
  "best_score_pct": 72,
  "certificate_eligible": true,
  "certificate_number": "KSS-2026-0042",
  "certificate_issued_at": "2026-04-22T12:00:00Z"
}
```

**Note on `time_per_question[]`:** This field is captured by the production exam engine only. Not available in demo. The array is provided raw — Salesforce computes `avg/slowest/fastest_question_time_seconds` summaries or they are pre-computed by engineering before sending.

### 4.3 V2 Payload Fields (future — exam engine required)

```json
{
  "section_breakdown": [
    { "section_name": "Math", "questions_attempted": 44, "correct": 32, "accuracy_pct": 73, "time_pct": 48 }
  ],
  "concept_mastery": [
    { "concept_name": "Algebra", "section": "Math", "proficiency_pct": 80, "status": "strong" }
  ],
  "mistake_taxonomy": {
    "conceptual_errors": 5,
    "careless_errors": 7,
    "unattempted": 3
  },
  "pacing_analysis": {
    "rushed_questions_count": 4,
    "optimal_questions_count": 30,
    "slow_questions_count": 10,
    "pacing_rating": "moderate"
  }
}
```

### 4.4 Salesforce Object Mapping

| Payload field | Salesforce object |
|---|---|
| `learner_email` | Contact.Email |
| `company_name` | Account.Name |
| `assessment_title` | Custom: Assessment_Result__c.Assessment_Title__c |
| `attempted_at` | Custom: Assessment_Result__c.Attempted_At__c |
| `attempt_number` | Custom: Assessment_Result__c.Attempt_Number__c |

### 4.5 Email Subject
```
[{{company_name}}] Your Assessment Report Card — {{assessment_title}} · Attempt {{attempt_number}}
```

---

## 5. Email Template Specification

**Template ID:** `b2b-learner-report-card`  
**Filename:** `b2b-learner-report-card.html`  
**Delivery:** Salesforce (not AWS SES)  
**Format:** HTML email (Salesforce renders PDF attachment in V2)

### 5.1 Template Sections (V1)

| # | Section | Data source | Status |
|---|---------|-------------|--------|
| 1 | Hero — co-branded header | `company_name`, `platform_name`, `assessment_title`, `attempt_number`, `attempted_at` | ✅ V1 |
| 2 | Learner info row | `full_name`, `recipient_email`, `company_name` | ✅ V1 |
| 3 | Attempt result banner | `score_pct`, `passed`, `time_taken_display` | ✅ V1 |
| 4 | Score stats | `average_score_pct`, `best_score_pct`, `certificate_eligible` | ✅ V1 |
| 5 | Per-question time summary | `avg/slowest/fastest_question_display` | ✅ V1 (production only) |
| 6 | Attempt history table | `attempt_history[]` loop | ✅ V1 |
| 7 | Certificate status | `certificate_status_display`, `certificate_number` | ✅ V1 |
| 8 | Section Breakdown | `section_breakdown[]` loop | 🔲 V2 placeholder |
| 9 | Concept Mastery | `concept_mastery[]` loop | 🔲 V2 placeholder |
| 10 | Pacing Analysis | `pacing_analysis` object | 🔲 V2 placeholder |
| 11 | Mistake Taxonomy | `mistake_taxonomy` object | 🔲 V2 placeholder |
| 12 | Footer | `support_email`, `unsubscribe_url` | ✅ V1 |

**Placeholder section design:** V2 sections are shown in the template at 50% opacity with `{{field_name}}` tokens visible — Salesforce dev can see the planned structure and wire up loops once data is available.

### 5.2 Co-branding
Header: tenant logo + pipe divider + "powered by keySkillset"  
Footer: "{{company_name}} · Powered by {{platform_name}}"

### 5.3 No CTA, No Solutions Panel
Report card is **informational only**. No CTA buttons. No question-level answer review or correct answer display. Performance summary only.

---

## 6. B2B Learner Email Persona (QA System)

A new `b2b-learner` tenant slug has been added to the email template QA system:

| Property | Value |
|---|---|
| Slug | `b2b-learner` |
| Feature mode | `B2B_LEARNER` |
| Display name | B2B Learner |
| Company (demo) | Akash Institute |
| Accent | Emerald |
| Route | `/email-templates/b2b-learner` |
| Persona selector tile | "B2B End User Emails" (emerald) |

The template detail page shows a Salesforce badge instead of SES guardrails, clarifying this is not an AWS SES send path.

---

## 7. DB Requirements

### V1 — No migration needed
Session-state only for the re-send button. No DB write.

### V2 — `report_card_requests` table (future)
```sql
create table report_card_requests (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references b2b_learners(id),
  tenant_id uuid references tenants(id),
  assessment_id uuid references assessment_items(id),
  attempt_number integer not null,
  triggered_at timestamptz default now(),
  resend_requested_at timestamptz,
  status text default 'SENT', -- SENT / RESEND_PENDING / FAILED
  salesforce_journey_id text
);
```

---

## 8. Scope Boundaries

### In Scope (V1 — this build)
- Analytics tab report card banner (info-only, Details button → modal)
- Modal: delivery notice + payload field reference + re-send button
- B2B Learner email template HTML (`b2b-learner-report-card.html`)
- B2B Learner email persona in QA system (`/email-templates/b2b-learner`)
- Persona selector tile "B2B End User Emails"
- PRD (this document) as Salesforce payload contract

### Out of Scope (Deferred)
| Item | Reason |
|------|--------|
| Salesforce webhook integration | Requires Salesforce org + credentials |
| PDF attachment | Requires Salesforce PDF generation config |
| DB write for re-send tracking | V2 — `report_card_requests` table |
| V2 analytics sections in email | Requires exam engine section/concept-level data |
| CA audit view of report cards | Separate CA dashboard ticket |

---

## 9. Build Order

```
Phase 1 (COMPLETE — Apr 28 2026):
  - Analytics tab banner redesign (info button, auto-send copy)
  - ReportCardModal — payload field reference + re-send button
  - b2b-learner-report-card.html — full template with V2 placeholders
  - b2b-learner TenantEmailSlug + profile + template definition wired
  - Persona selector "B2B End User Emails" tile
  - Template detail page: Salesforce badge, all-variables display, B2B_LEARNER labels
  - PRD locked

Phase 2 (Future — Salesforce setup):
  - Webhook trigger on learner_attempts creation
  - Salesforce journey configuration using this payload contract
  - report_card_requests DB table + re-send trigger

Phase 3 (Future — exam engine + section data):
  - V2 payload fields: section_breakdown[], concept_mastery[], pacing_analysis, mistake_taxonomy
  - Remove placeholder opacity from email template sections
```

---

## 10. Success Criteria

- [x] Analytics tab banner shows auto-send copy, no "Download" label
- [x] Modal shows payload field reference + re-send button with correct eligibility gating
- [x] `b2b-learner-report-card.html` renders all V1 sections + V2 placeholders with SF dev notes
- [x] `/email-templates/b2b-learner` persona accessible, shows Salesforce badge
- [x] Persona selector "B2B End User Emails" tile navigates correctly
- [x] `npm run build` passes
- [ ] Salesforce webhook fires on attempt completion (Phase 2)
- [ ] PDF delivered within 24 hours of attempt (Phase 2)
- [ ] V2 analytics sections populated from exam engine (Phase 3)
