# PRD — B2C End-User Assessment Analytics: AI-Powered Insights Engine
# Status: DRAFT — Apr 12 2026
# Owner: keySkillset Product
# Ticket: KSS-SA-031 (Analytics) / KSS-SA-032 (Question Seeding)
# Confluence: to be published in EKSS space — B2C Analytics PRD

---

## 1. Purpose

keySkillset is building analytics for B2C exam repeaters (NEET, JEE, CLAT, SAT). The goal is a
**Duolingo-style intelligence layer** that tells the user not just their score, but *why* they got it
wrong, *which topics to focus on next*, and *whether they are panicking or guessing* under pressure —
without requiring any AI training data.

This document specifies:
- The concept tag system (atomic unit of all analytics)
- The deterministic algorithm layer (no AI needed)
- The Claude API integration for narrative insights
- The data model (new tables required)
- The analytics dashboard components
- Engineering notes for production implementation

---

## 2. Problem Statement

Today a student sees: **"You scored 420 / 720."**

What they actually need:
- "Your Biology is strong (78%) but Physics is dragging you down (41%)."
- "In the last 12 minutes you answered 9 questions in under 20 seconds — that's panic mode."
- "You got every Electrochemistry question wrong. Not one attempt. Not time pressure. A knowledge gap."
- "Since Attempt 1, your Respiration score went from 40% → 72%. Keep going."
- "3 questions you changed your answer to the wrong one in the last 30 seconds."

None of this requires AI to compute. It requires structured data and a smart algorithm.
Claude API is used only for the **narrative layer** — converting the computed data into readable,
personalised feedback. This means zero training data needed. Claude reasons from the structured
numbers on every call.

---

## 3. Analytics Engine Architecture

### 3.1 High-Level Flow

```
┌─────────────────────────────────────────────────┐
│             User Submits Attempt                │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│         Record attempt_answers                  │
│  question_id | user_answer | is_correct         │
│  time_spent_seconds | section_name              │
└──────────┬────────────────────────┬─────────────┘
           │                        │
           ▼                        ▼
┌──────────────────┐    ┌───────────────────────────┐
│  Compute Section │    │  Compute Concept Results  │
│  Results         │    │  GROUP BY concept_tag      │
│  score, time,    │    │  → correct_rate, avg_time  │
│  correct/total   │    │  → vs previous attempts    │
└──────────┬───────┘    └──────────────┬────────────┘
           └──────────────┬────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────┐
│           Flag Anomalies (deterministic)        │
│  PANIC    → time < 25% section avg + is_wrong   │
│  RUSHED   → time < 25% section avg + is_correct │
│  PATTERN  → same concept_tag wrong 3+ attempts  │
│  LATE_RUSH→ speed increases >40% in last 20% Qs │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│       Build Claude API Payload (async)          │
│  section_results | concept_results              │
│  anomaly_flags | attempt_number                 │
│  historical_concept_trends (last 3 attempts)    │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              Claude API Call                    │
│  Model: claude-haiku-4-5-20251001               │
│  Role: reasoning engine over structured data    │
│  No training needed — reasons from numbers      │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│      Store Response → attempt_ai_insights       │
│  insights_text | priority_tags[]                │
│  flags[] | recommendations[]                    │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│            Analytics Dashboard                  │
│  • Section breakdown (score bar chart)          │
│  • Concept mastery heatmap (tag × attempt grid) │
│  • AI insight panel (Claude narrative)          │
│  • Attempt comparison timeline                  │
│  • "Focus on these topics" CTA cards            │
│  • Panic/rush heatmap per attempt               │
└─────────────────────────────────────────────────┘
```

### 3.2 What is NOT AI

The following are deterministic — no LLM needed:
- Section-level scores and time
- Concept mastery percentage per tag per attempt
- Panic/rush detection (threshold math)
- Improvement trend (attempt N vs attempt N-1 per tag)
- Weak tag ranking (sorted by correct_rate, weighted by attempt count)
- "Next steps" list (top 3 weakest tags with ≥2 attempts)

### 3.3 What Claude Does

Claude receives **only structured numbers** — never raw question text or user PII.
It converts those numbers into a natural-language insight paragraph + priority action list.

Example input → output:

```
Input:
{
  "attempt_number": 3,
  "exam": "NEET",
  "section_results": [
    { "section": "Biology", "correct": 63, "total": 90, "pct": 70, "avg_time_s": 58 },
    { "section": "Physics", "correct": 16, "total": 45, "pct": 36, "avg_time_s": 71 },
    { "section": "Chemistry", "correct": 28, "total": 45, "pct": 62, "avg_time_s": 65 }
  ],
  "concept_results": [
    { "tag": "Electrochemistry", "correct": 0, "total": 4, "pct": 0, "trend": "same" },
    { "tag": "Neural Control",   "correct": 3, "total": 4, "pct": 75, "trend": "up" },
    { "tag": "Laws of Motion",   "correct": 2, "total": 5, "pct": 40, "trend": "down" }
  ],
  "anomalies": {
    "panic_count": 7,
    "late_rush": true,
    "repeated_wrong_tags": ["Electrochemistry", "Laws of Motion"]
  },
  "previous_scores": [310, 368, 410]
}

Output:
{
  "insight": "Your Biology is solid at 70%, and you're improving overall (310 → 368 → 410). Physics is your main gap — especially Laws of Motion, which has dropped since last attempt. Electrochemistry is a knowledge gap, not a timing issue: 0/4 with average 71 seconds per question shows you're spending time but not getting it. You had 7 panic responses in the final section — recognisable by under-20-second answers that were wrong. Work on Electrochemistry and Laws of Motion before your next attempt.",
  "priority_tags": ["Electrochemistry", "Laws of Motion", "Current Electricity"],
  "flags": ["physics_gap", "panic_detected", "late_acceleration"],
  "recommendations": [
    "Revise Electrochemistry redox equations — your answers suggest confusion between oxidation states",
    "Laws of Motion: check Newton's 3rd law application problems specifically",
    "Pace yourself in Physics — you're rushing the last 20% of that section"
  ]
}
```

---

## 4. Concept Tag System

### 4.1 What is a concept_tag?

`concept_tag` is a single free-text label on every question in the `questions` table.
It identifies the **narrowest meaningful curriculum unit** the question tests.

Rules (confirmed CT-1/CT-2/CT-3, Apr 11 2026):
- **One tag per question** — not an array
- **Optional** at question creation (creator can add later)
- **Free text** — no controlled vocabulary table in V1
- Granularity: one NCERT chapter or one exam skill domain. Not "Biology" (too broad). Not "Describe the electron transport chain in step 4 of the chemiosmotic gradient" (too narrow).

### 4.2 Why concept_tag is the analytics foundation

```
Without concept_tag:    "Biology: 70%"           — actionable? No.
With concept_tag:       "Electrochemistry: 0%"   — actionable? Yes. Revise it.
                        "Photosynthesis: 90%"     — actionable? Yes. Don't waste time here.
```

The chain:
```
question.concept_tag
    → attempt_answers.question_id (join)
    → GROUP BY concept_tag, user_id, attempt_id
    → correct_rate per (user, concept, attempt)
    → user_concept_mastery.mastery_pct (rolling aggregate)
    → dashboard heatmap + AI context
```

### 4.3 Canonical taxonomy by exam

The following tags are used when seeding questions (KSS-SA-032).
Engineering team should enforce this vocabulary when building the question creation UI validation.

#### NEET — Biology (90 questions in full test)

```
Cell Structure & Function | Cell Division | Photosynthesis | Respiration in Plants
Plant Growth & Development | Plant Kingdom | Morphology of Flowering Plants
Anatomy of Flowering Plants | Transport in Plants | Mineral Nutrition
Reproduction in Plants | Animal Kingdom | Human Digestion | Human Respiratory System
Circulatory System | Excretory System | Locomotion & Movement | Neural Control
Endocrine System | Human Reproduction | Reproductive Health
Mendelian Genetics | Molecular Basis of Inheritance | Evolution
Human Health & Disease | Biotechnology Principles | Biotechnology Applications
Ecology & Ecosystem | Biodiversity & Conservation | Environmental Issues
```

#### NEET — Physics (45 questions)

```
Laws of Motion | Work Energy Power | Rotational Motion | Gravitation
Mechanical Properties of Solids | Mechanical Properties of Fluids
Thermal Properties of Matter | Thermodynamics | Kinetic Theory | Oscillations | Waves
Electrostatics | Current Electricity | Magnetism | Electromagnetic Induction
Alternating Current | Electromagnetic Waves | Ray Optics | Wave Optics
Photoelectric Effect | Atomic Structure | Nuclear Physics | Semiconductor Devices
```

#### NEET — Chemistry (45 questions)

```
Some Basic Concepts | Atomic Structure | Periodic Table | Chemical Bonding
States of Matter | Thermodynamics (Chem) | Chemical Equilibrium | Redox Reactions
Solutions | Electrochemistry | Chemical Kinetics | Surface Chemistry
Hydrogen | s-Block Elements | p-Block Elements (13-14) | p-Block Elements (15-18)
d-Block & f-Block Elements | Coordination Compounds | Hydrocarbons | Haloalkanes
Alcohols & Ethers | Aldehydes & Ketones | Carboxylic Acids | Amines
Biomolecules | Polymers | Chemistry in Everyday Life
```

#### JEE — Mathematics (30 questions)

```
Limits & Derivatives | Integration | Differential Equations | Complex Numbers
Quadratic Equations | Matrices & Determinants | Probability
Permutations & Combinations | Circles | Parabola & Ellipse | Straight Lines
3D Geometry | Vectors | Inverse Trigonometry | Properties of Triangles
Sequences & Series | Binomial Theorem
```

#### JEE — Physics / Chemistry
Identical tags to NEET Physics / Chemistry above (NTA draws from same NCERT syllabus).

#### CLAT (120 questions)

```
Reading Comprehension | Vocabulary in Context | Inference & Critical Reading
Legal Principles Application | Constitutional Law | Contract Law
Tort Law | Criminal Law Principles
Syllogisms | Analogies | Critical Reasoning | Statement & Assumption | Logical Sequences
Current Affairs | Static GK | Legal & Constitutional Awareness
Percentages & Ratios | Data Interpretation | Number Systems
```

### 4.4 Design rationale

These tags were chosen to satisfy three constraints simultaneously:
1. **Actionable at study level** — a student knows exactly which chapter to revise
2. **Sufficient data density** — 3–8 questions per tag per full test → patterns emerge in 2–3 attempts
3. **Cross-exam consistency** — NEET/JEE share Physics/Chemistry tags → future cross-exam mastery possible

---

## 5. Data Model — New Tables Required

All changes require KSS-DB-XXX authorisation before execution.

### 5.1 attempt_answers (extend existing)

Add `time_spent_seconds INT` column:
```sql
ALTER TABLE attempt_answers
  ADD COLUMN IF NOT EXISTS time_spent_seconds INT DEFAULT NULL;
```

Also add `section_name TEXT` if not already present (for section-level grouping).

### 5.2 attempt_section_results (new table)

One row per section per attempt. Computed server-side after submission.

```sql
CREATE TABLE IF NOT EXISTS attempt_section_results (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id        UUID NOT NULL,      -- FK → attempts.id
  section_name      TEXT NOT NULL,      -- matches assessment_config.sections[].name
  correct_count     INT DEFAULT 0,
  incorrect_count   INT DEFAULT 0,
  skipped_count     INT DEFAULT 0,
  total_questions   INT DEFAULT 0,
  scored_marks      NUMERIC(8,2) DEFAULT 0,
  total_marks       NUMERIC(8,2) DEFAULT 0,
  time_spent_seconds INT DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 user_concept_mastery (new table)

Rolling aggregate — updated after every attempt.

```sql
CREATE TABLE IF NOT EXISTS user_concept_mastery (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,      -- FK → users.id
  concept_tag     TEXT NOT NULL,
  exam_category   TEXT,               -- 'NEET' | 'JEE' | 'CLAT' | 'SAT'
  total_seen      INT DEFAULT 0,      -- questions encountered with this tag
  total_correct   INT DEFAULT 0,
  mastery_pct     NUMERIC(5,2) DEFAULT 0,  -- correct / total * 100
  last_seen_at    TIMESTAMPTZ,
  attempt_count   INT DEFAULT 0,      -- number of attempts that included this tag
  trend           TEXT DEFAULT 'neutral', -- 'up' | 'down' | 'neutral'
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, concept_tag)
);
```

### 5.4 attempt_ai_insights (new table)

Stores Claude API response per attempt. Async — inserted after attempt_section_results.

```sql
CREATE TABLE IF NOT EXISTS attempt_ai_insights (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id       UUID NOT NULL UNIQUE,
  insight_text     TEXT,             -- Claude narrative paragraph
  priority_tags    JSONB DEFAULT '[]', -- array of concept_tag strings in priority order
  flags            JSONB DEFAULT '[]', -- e.g. ["panic_detected", "late_acceleration"]
  recommendations  JSONB DEFAULT '[]', -- array of action strings
  model_used       TEXT,             -- 'claude-haiku-4-5-20251001' or 'meta-llama-3.3-70b'
  tokens_used      INT,
  latency_ms       INT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. Deterministic Algorithm (No AI Required)

These run synchronously after attempt submission, before Claude is called.

### 6.1 Panic Detection

```
expected_time_per_q = section.time_spent_seconds / section.total_questions

for each answer in section:
  if answer.time_spent_seconds < (0.25 × expected_time_per_q)
    AND answer.is_correct = false:
      flag as PANIC
```

Rationale: A question answered in under 25% of the section average time and wrong = rushed + wrong.
This is a proxy for panic. It does not require per-question expected time from historical data.
Works from attempt 1.

### 6.2 Late-Section Acceleration

```
first_half_avg = avg(time_spent) for questions 1 to N/2
second_half_avg = avg(time_spent) for questions N/2 to N

if second_half_avg < 0.6 × first_half_avg:
  flag as LATE_RUSH
```

Catches the "running out of time" pattern common in NEET Physics section.

### 6.3 Concept Mastery Calculation

```
For each concept_tag in this attempt:
  correct_this_attempt = count(is_correct=true WHERE concept_tag=tag)
  total_this_attempt   = count(*) WHERE concept_tag=tag

  Update user_concept_mastery:
    total_seen    += total_this_attempt
    total_correct += correct_this_attempt
    mastery_pct    = total_correct / total_seen × 100
    trend:
      prev_mastery = mastery_pct before this attempt
      if new > prev + 5  → 'up'
      if new < prev - 5  → 'down'
      else               → 'neutral'
```

### 6.4 Next Steps Ranking

```
weak_tags = user_concept_mastery
  WHERE mastery_pct < 60
  AND attempt_count >= 2        -- needs at least 2 data points
  ORDER BY
    (1 - mastery_pct/100) × 0.6   -- weight: weakness magnitude
    + recency_weight × 0.4        -- weight: seen recently = more relevant
  LIMIT 3
```

`recency_weight = 1 if last_seen_at > 7 days ago, else 0.5`

---

## 7. Claude API Integration

### 7.1 Model Selection

| Use case | Model | Reason |
|----------|-------|--------|
| Post-attempt insight (every attempt) | `claude-haiku-4-5-20251001` | Fast (~1s), cheap (~$0.001/call), sufficient for structured data reasoning |
| Deep analysis (attempt 3+ comparison) | `claude-sonnet-4-6` | Better narrative quality, used sparingly |
| Demo environment | `claude-haiku-4-5-20251001` | Default for all demo calls |

### 7.2 API Route

```
POST /api/analytics/generate-insight
Body: { attempt_id: string }
```

Flow:
1. Load attempt + attempt_answers + attempt_section_results from DB
2. Join attempt_answers → questions → concept_tag
3. Load last 2 attempts for same assessment (historical context)
4. Build payload (see §3.3 example)
5. Call Claude API with system prompt + structured payload
6. Parse JSON response
7. Upsert into attempt_ai_insights
8. Return { insight_text, priority_tags, flags, recommendations }

This route runs **async** — does not block the attempt submission response.
The client polls `/api/analytics/insight-status?attempt_id=X` until ready.

### 7.3 System Prompt Template

```
You are an exam analytics engine for Indian competitive exams (NEET, JEE, CLAT) and SAT.
You receive structured performance data — never raw questions or personal information.
Your job is to identify patterns and produce:
1. A 3–4 sentence insight paragraph (empathetic, direct, specific — like a good tutor)
2. A ranked list of concept tags to focus on (max 3)
3. Specific, actionable recommendations (max 3 bullet points)
4. Anomaly flags from the provided list

Rules:
- Do not mention student name or any PII
- Do not invent data not present in the payload
- Reference specific concept tags, section names, and numbers from the payload
- Tone: warm but direct. Not preachy. Not vague ("work harder"). Specific ("review Electrochemistry redox")
- Return valid JSON matching the schema: { insight, priority_tags, flags, recommendations }
```

### 7.4 Environment Variable

```
ANTHROPIC_API_KEY=sk-ant-...
```

Never hardcoded. Never committed to git. Set in Vercel environment variables.

### 7.5 Rate Limiting & Cost Control

- One Claude call per attempt submission (not per question)
- Haiku: ~$0.001 per call at current pricing
- Cap: implement a `max_ai_calls_per_user_per_day = 10` guard in the API route
- Failed calls: store `flags: ["ai_unavailable"]`, show deterministic data only

---

## 8. Alternative: Meta Llama

Meta Llama 3.3 70B is a viable alternative for production at scale.

| Factor | Claude API (Anthropic) | Meta Llama 3.3 70B |
|--------|------------------------|---------------------|
| Demo setup | Instant (API key only) | Requires hosting |
| Cost at 10k users/month | ~$100–300 | ~$50–150 (self-hosted on A100) |
| Cost at 100k+ users/month | $1k–3k | $200–500 (amortised GPU) |
| Response quality | Excellent for structured JSON | Good, needs more prompt tuning |
| Data privacy | Data sent to Anthropic | Fully self-hosted option |
| Latency | ~1s (haiku) | ~2–4s (70B on GPU) |
| Compliance (future) | SOC 2 compliant | Self-controlled |

**Recommendation:** Use Claude API for demo (zero infra, fastest to ship).
Evaluate Llama migration at the 50k-user mark if cost becomes a concern.
The API route is abstracted (`/api/analytics/generate-insight`) — swapping the model requires
changing only the provider call inside that route. The DB schema, payload format, and dashboard
are model-agnostic.

---

## 9. Analytics Dashboard Components (End-User Facing)

Displayed on the attempt detail page after submission and via the `/analytics` tab on the
assessment detail page.

### 9.1 Post-Attempt Summary (immediate)

Shown right after submission. Deterministic — no Claude wait needed.

- **Score header**: `410 / 720 — 56.9%`
- **Section breakdown**: horizontal bar per section with score% and time
- **Concept mastery delta**: tags where mastery changed ±10% this attempt (green/red pills)
- **Anomaly banner**: if panic_count > 3 → "7 rushed responses detected in Physics"

### 9.2 AI Insight Panel (async, appears within ~2s)

- Loading skeleton while Claude call is in-flight
- Once ready: narrative paragraph + 3 priority topic cards with "Revise Now" CTA
- "Focus before your next attempt:" tag chips (priority_tags from Claude response)

### 9.3 Concept Mastery Heatmap (historical)

- Grid: rows = concept_tags user has seen, columns = attempt 1–5
- Cell colour: green (≥70%) → yellow (40–69%) → red (<40%) → grey (not seen)
- Hover: shows correct/total for that tag × attempt

### 9.4 Attempt Comparison Timeline

- Line chart: score% per attempt across all attempts for this assessment
- Overlay: concept mastery for top 3 weak tags

### 9.5 Panic / Rush Map

- Per-attempt: question index on x-axis, time_spent_seconds on y-axis
- Colour-coded: green (answered correctly), red (wrong), orange (panic-flagged)
- Helps the student see WHERE in the test they rushed

---

## 10. Implementation Phases

| Phase | Scope | Prerequisite |
|-------|-------|--------------|
| 1 — Data capture | Add `time_spent_seconds` to attempt_answers; create attempt_section_results table | KSS-DB-XXX |
| 2 — Algorithm layer | Compute section results + concept mastery after each attempt | Phase 1 |
| 3 — Claude integration | API route + attempt_ai_insights table | Phase 2 + API key |
| 4 — Dashboard UI | Post-attempt panel + mastery heatmap | Phase 3 |
| 5 — Historical view | Attempt timeline + concept trend over all attempts | Phase 4 |

---

## 11. Engineering Notes

### Concept tag coverage at launch

At KSS-SA-032 seeding (NEET → JEE → CLAT):
- Every seeded question will have `concept_tag` set
- Legacy questions in `assessments` table may not have tags — analytics falls back gracefully:
  if concept_tag IS NULL, exclude from concept mastery but include in section score

### Analytics does not break if Claude is down

All deterministic data (section scores, concept mastery, panic flags) is computed and stored
before the Claude call. If the API call fails, the dashboard shows deterministic data only.
The AI insight panel shows "Detailed insights are being prepared" and retries in the background.

### Section-level analytics when random draw is used

With the question pool model (SA selects sources + chapters + N questions per attempt),
different users draw different questions. Analytics is concept_tag-based, not question_id-based.
This is intentional — the tag is the skill being measured, not the specific question.
Aggregate by (user_id, concept_tag) across all drawn questions regardless of which they were.

### Data privacy

Claude API receives:
- Aggregated numeric data (correct/total per tag, avg_time per section)
- Exam category and attempt number
- NO question text, NO answer text, NO user name, NO email, NO user ID

The attempt_id in the API call is internal. Strip user PII at the API route layer before
constructing the Claude payload.

---

## 12. Open Questions (product owner decision needed)

| # | Question |
|---|----------|
| OQ-1 | Should the AI insight be shown on attempt 1, or only from attempt 2+ (when historical context exists)? |
| OQ-2 | Should the mastery heatmap be visible to SA/CA in reporting, or B2C users only? |
| OQ-3 | Should concept tags be visible to the student on the question review page, or internal only? |
| OQ-4 | Panic detection threshold — 25% of section average. Confirm or adjust. |
| OQ-5 | Should the "Focus on these topics" CTA link to a subject/chapter test for that tag, if one exists? |

---

*Document version: 1.0 — Apr 12 2026*
*Next review: after Phase 1 DB changes are authorised*
