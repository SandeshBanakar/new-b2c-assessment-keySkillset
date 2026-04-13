# PRD — B2C End-User Assessment Analytics: AI-Powered Insights Engine
# Status: UPDATED — Apr 13 2026
# Owner: keySkillset Product
# Ticket: KSS-SA-031 (Analytics) / KSS-SA-032 (Question Seeding)
# Confluence: https://keyskillset-product-management.atlassian.net/wiki/x/CgBEBw
# Release: Release 32 — Phase 2

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
- Demo implementation notes (V1 static approach)
- Time tracking: current deferred state and production implementation plan

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

### 2.1 Core Product Insight

Repeaters don't fail due to lack of effort. They fail due to lack of clarity.

Current platforms provide: scores, accuracy, solutions, more tests.
What repeaters actually need after a test:
- Why am I stuck?
- What exactly is wrong?
- What should I change tomorrow?

This product is a **post-test decision engine**, not an LMS or coaching platform.

### 2.2 The 5 Output Blocks (locked for V1)

Every analytics view produces exactly these 5 blocks, in this order:

| Block | Type | Emotional Hook |
|---|---|---|
| 1. Score Summary | Deterministic | Achievement framing |
| 2. Marks Lost | Deterministic | Loss aversion — "You left 47 marks on the table" |
| 3. Weak Topics | Deterministic | Clarity — "Electrochemistry: 0%" |
| 4. Error Breakdown | Deterministic + Flags | Diagnosis — panic vs. gap vs. carelessness |
| 5. Action Plan (What went well / Next Steps) | AI narrative | Direction |

### 2.3 Design Principles (non-negotiable)

1. **Don't fake insights**: If attempt < 30% or accuracy < 20%, show "Not enough data yet."
2. **Keep it relative**: Accuracy % over raw scores — works across NEET, JEE, CLAT, SAT.
3. **Diagnosis over visualization**: Dashboards that only show metrics don't drive improvement.
   Effectiveness increases when feedback is actionable and structured.
4. **Limit dimensions in V1**: Topic-level insights only. Not question type breakdown.
   Not excessive sub-category splits.

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
│  time_spent_seconds | section_name | concept_tag│
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
│  what_went_well | next_steps                    │
│  priority_tags[] | flags[] | recommendations[]  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│            Analytics Dashboard                  │
│  • Score Summary + Marks Lost (prominent rose)  │
│  • Section breakdown (score bar chart)          │
│  • AI Insight: What went well / Next Steps      │
│  • Concept mastery heatmap (tag × attempt grid) │
│  • Attempt comparison timeline                  │
│  • "Focus on these topics" CTA cards            │
│  • Panic/rush flags banner                      │
└─────────────────────────────────────────────────┘
```

### 3.2 Who Decides the Messaging — Critical Architecture Note

**The algorithm decides. Claude narrates.**

This is the most important architectural separation in this product:

```
STEP 1 — Algorithm (deterministic, no AI):
  Input:  attempt_answers joined to questions.concept_tag
  Output: "Physics: 36%, Biology: 71%, Chemistry: 62%"
          "Electrochemistry: 0/4 correct"
          "7 panic responses in Physics section"

STEP 2 — Decision tree (rule-based, humans write the rules):
  Rules fire based on the numbers:
    IF section_accuracy < 40%          → primary_problem = 'section_gap'
    IF concept_correct_rate = 0        → flag as 'knowledge_gap'
    IF panic_count > 3                 → flag as 'panic_detected'
    IF tag wrong across 2+ attempts    → flag as 'persistent_gap'
  Output: structured priority object with specific tags and action types

STEP 3 — Claude (narration only):
  Input:  the structured output from Steps 1 and 2 — never raw question text, never PII
  Output: human-readable insight split into "What went well" and "Next Steps"

  Claude does NOT decide what the problem is. It converts structured numbers to prose.
  If Claude is unavailable: show deterministic data only. Never block the dashboard.
```

The decision tree (Step 2) is the proprietary intellectual property. Claude is a commodity narrator.
Swapping Claude for Llama requires only changing the API call inside the route — no logic changes.

### 3.3 What is NOT AI

The following are deterministic — no LLM needed, computable from raw DB data:
- Section-level scores and time
- Concept mastery percentage per tag per attempt
- Panic/rush detection (threshold math)
- Improvement trend (attempt N vs attempt N-1 per tag)
- Weak tag ranking (sorted by correct_rate, weighted by attempt count)
- Marks lost calculation (incorrect_count × abs(negative_marks))
- "Next steps" list (top 3 weakest tags with ≥2 attempts)

### 3.4 What Claude Does — Exact Input/Output Contract

Claude receives **only structured numbers** — never raw question text or user PII.
It produces a response split into two sections: "What went well" and "Next Steps."

Example input → output:

```json
Input:
{
  "attempt_number": 2,
  "exam": "NEET",
  "section_results": [
    { "section": "Biology",   "correct": 65, "total": 90, "pct": 72, "avg_time_s": 55 },
    { "section": "Physics",   "correct": 18, "total": 45, "pct": 40, "avg_time_s": 68 },
    { "section": "Chemistry", "correct": 28, "total": 45, "pct": 62, "avg_time_s": 63 }
  ],
  "concept_results": [
    { "tag": "Electrochemistry", "correct": 1, "total": 4, "pct": 25, "trend": "up" },
    { "tag": "Neural Control",   "correct": 3, "total": 4, "pct": 75, "trend": "up" },
    { "tag": "Laws of Motion",   "correct": 2, "total": 5, "pct": 40, "trend": "neutral" }
  ],
  "anomalies": {
    "panic_count": 4,
    "late_rush": false,
    "repeated_wrong_tags": ["Laws of Motion"]
  },
  "previous_scores": [376, 428]
}

Output:
{
  "what_went_well": "Biology is your strongest section at 72% — up from last attempt. Neural Control improved to 75%, and your Electrochemistry is moving in the right direction (0% → 25%). Overall score is tracking upward: 376 → 428.",
  "next_steps": "Physics is still below the threshold at 40%. Laws of Motion has appeared in both attempts and remains at 40% — this needs a focused revision session before attempt 3. You still had 4 rushed responses in Physics; slow down on the first 10 questions in that section to set a better pace.",
  "priority_tags": ["Laws of Motion", "Electrochemistry", "Current Electricity"],
  "flags": ["physics_gap", "panic_detected", "persistent_gap"],
  "recommendations": [
    "Revise Laws of Motion — Newton's 2nd and 3rd law application problems specifically",
    "Electrochemistry is improving but needs 2 more revision sessions on redox equations",
    "Pace Physics: spend the first 5 minutes on the first 3 questions to avoid late panic"
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
- Granularity: one NCERT chapter or one exam skill domain.
  Too broad: "Biology". Too narrow: "Step 4 of the chemiosmotic gradient". Correct: "Photosynthesis".

### 4.2 Why concept_tag is the analytics foundation

```
Without concept_tag:  "Biology: 70%"           — actionable? No.
With concept_tag:     "Electrochemistry: 0%"   — actionable? Yes. Revise it.
                      "Photosynthesis: 90%"     — actionable? Yes. Don't waste time here.
```

The aggregation chain:
```
question.concept_tag
    → attempt_answers.question_id (join)
    → GROUP BY concept_tag, user_id, attempt_id
    → correct_rate per (user, concept, attempt)
    → user_concept_mastery.mastery_pct (rolling aggregate)
    → dashboard heatmap + AI context
```

### 4.3 Tag Quality Warning (Production Risk)

**The concept tag quality IS the product quality.** If a question creator tags "Electrochemistry"
on 2 questions and "Electrochem" on 3 others, the mastery aggregation splits into two tags and
both show artificially low confidence.

V1 mitigation (engineering must implement):
- Normalise tags at aggregation time: `LOWER(TRIM(concept_tag))`
- Question creation UI: free-text with autocomplete from existing tags in the same exam category
- Long-term: controlled vocabulary picker with validation (Phase 2)

### 4.4 Canonical Taxonomy by Exam

Used when seeding questions (KSS-SA-032). Engineering should enforce this vocabulary in the
question creation UI autocomplete.

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

#### CLAT (140 questions — 5 sections × 28)
```
Reading Comprehension | Vocabulary in Context | Inference & Critical Reading
Legal Principles Application | Constitutional Law | Contract Law
Tort Law | Criminal Law Principles
Syllogisms | Analogies | Critical Reasoning | Statement & Assumption | Logical Sequences
Current Affairs | Static GK | Legal & Constitutional Awareness
Percentages & Ratios | Data Interpretation | Number Systems
```

#### SAT — Reading & Writing
```
Craft & Structure | Information & Ideas | Standard English Conventions | Expression of Ideas
```

#### SAT — Math
```
Algebra | Advanced Math | Problem Solving & Data Analysis | Geometry & Trigonometry
```

---

## 5. Data Model — New Tables (KSS-DB-020 to KSS-DB-023)

All four tables were created April 13 2026 via `execute_sql` (project: uqweguyeaqkbxgtpkhez).
RLS is OFF on all tables (platform-wide rule — no exceptions).

### 5.1 attempt_answers (KSS-DB-020)

One row per question per attempt. Written at attempt submission time.
`time_spent_seconds` is deferred in V1 demo — see §12 for production plan.

```sql
CREATE TABLE IF NOT EXISTS attempt_answers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id          UUID NOT NULL,
  assessment_id       UUID NOT NULL,
  user_id             UUID NOT NULL,
  question_id         TEXT NOT NULL,
  section_name        TEXT NOT NULL,
  concept_tag         TEXT,
  user_answer         TEXT,
  is_correct          BOOLEAN NOT NULL DEFAULT false,
  time_spent_seconds  INT DEFAULT NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt ON attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_user ON attempt_answers(user_id);
```

### 5.2 attempt_section_results (KSS-DB-021)

One row per section per attempt. Computed after submission, stored for fast retrieval.

```sql
CREATE TABLE IF NOT EXISTS attempt_section_results (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id          UUID NOT NULL,
  assessment_id       UUID NOT NULL,
  user_id             UUID NOT NULL,
  section_name        TEXT NOT NULL,
  correct_count       INT DEFAULT 0,
  incorrect_count     INT DEFAULT 0,
  skipped_count       INT DEFAULT 0,
  total_questions     INT DEFAULT 0,
  scored_marks        NUMERIC(8,2) DEFAULT 0,
  total_marks         NUMERIC(8,2) DEFAULT 0,
  time_spent_seconds  INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attempt_section_results_attempt ON attempt_section_results(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_section_results_user ON attempt_section_results(user_id, assessment_id);
```

### 5.3 user_concept_mastery (KSS-DB-022)

Rolling aggregate — one row per (user, concept_tag). Updated after every attempt.
UNIQUE constraint prevents duplicate rows; use upsert (INSERT ... ON CONFLICT DO UPDATE).

```sql
CREATE TABLE IF NOT EXISTS user_concept_mastery (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  concept_tag     TEXT NOT NULL,
  exam_category   TEXT,
  total_seen      INT DEFAULT 0,
  total_correct   INT DEFAULT 0,
  mastery_pct     NUMERIC(5,2) DEFAULT 0,
  last_seen_at    TIMESTAMPTZ,
  attempt_count   INT DEFAULT 0,
  trend           TEXT DEFAULT 'neutral',
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, concept_tag)
);
CREATE INDEX IF NOT EXISTS idx_user_concept_mastery_user ON user_concept_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_user_concept_mastery_exam ON user_concept_mastery(user_id, exam_category);
```

### 5.4 attempt_ai_insights (KSS-DB-023)

One row per attempt. Stores the AI-generated insight split into two display sections.

```sql
CREATE TABLE IF NOT EXISTS attempt_ai_insights (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id       UUID NOT NULL UNIQUE,
  assessment_id    UUID NOT NULL,
  user_id          UUID NOT NULL,
  what_went_well   TEXT,
  next_steps       TEXT,
  priority_tags    JSONB DEFAULT '[]',
  flags            JSONB DEFAULT '[]',
  recommendations  JSONB DEFAULT '[]',
  model_used       TEXT DEFAULT 'static_demo',
  tokens_used      INT,
  latency_ms       INT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attempt_ai_insights_attempt ON attempt_ai_insights(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_ai_insights_user ON attempt_ai_insights(user_id);
```

**Schema note (Apr 13 2026):** `insight_text TEXT` from earlier PRD drafts was replaced by
`what_went_well TEXT` + `next_steps TEXT` to match the two-section display format in the
analytics dashboard. `model_used` defaults to `'static_demo'` for V1 seeded data.

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

A question answered in under 25% of the section average time and wrong = rushed + wrong.
This is a proxy for panic. Works from attempt 1. No historical baseline required.

### 6.2 Late-Section Acceleration

```
first_half_avg  = avg(time_spent) for questions 1 to N/2
second_half_avg = avg(time_spent) for questions N/2 to N

if second_half_avg < 0.6 × first_half_avg:
  flag as LATE_RUSH
```

Catches "running out of time" — most common in NEET Physics and CLAT Quantitative.

### 6.3 Concept Mastery Calculation

```
For each concept_tag in this attempt:
  correct_this_attempt = count(is_correct=true WHERE concept_tag=tag)
  total_this_attempt   = count(*) WHERE concept_tag=tag

  Upsert into user_concept_mastery:
    total_seen    += total_this_attempt
    total_correct += correct_this_attempt
    mastery_pct    = total_correct / total_seen × 100
    trend:
      if new_mastery > prev_mastery + 5  → 'up'
      if new_mastery < prev_mastery - 5  → 'down'
      else                               → 'neutral'
```

### 6.4 Marks Lost Calculation

```
marks_lost_by_section = incorrect_count × abs(exam.negative_marks)

Example for NEET Physics:
  incorrect_count = 27
  negative_marks  = 1
  marks_lost      = 27

Display: "You left 27 marks on the table in Physics alone."
```

### 6.5 Next Steps Ranking

```
weak_tags = user_concept_mastery
  WHERE mastery_pct < 60
  AND attempt_count >= 2
  ORDER BY
    (1 - mastery_pct/100) × 0.6   -- weight: weakness magnitude
    + recency_weight × 0.4         -- weight: seen recently = more relevant
  LIMIT 3

recency_weight = 0.5 if last_seen_at > 7 days ago, else 1.0
```

### 6.6 "Not Enough Data" Guard

```
IF answered_count < (total_questions × 0.30):
  skip concept mastery computation
  skip Claude call
  show: "Complete at least 30% of the assessment for topic-level insights."

IF accuracy < 0.20 AND answered_count < 10:
  same guard applies
```

This prevents misleading analytics from abandoned or random-click attempts.

---

## 7. Claude API Integration

### 7.1 Model Selection

| Use case | Model | Reason |
|---|---|---|
| Post-attempt insight (every attempt) | `claude-haiku-4-5-20251001` | Fast (~1s), ~$0.001/call |
| Deep analysis (attempt 3+ comparison) | `claude-sonnet-4-6` | Better narrative, used sparingly |

### 7.2 API Route

```
POST /api/analytics/generate-insight
Body: { attempt_id: string }
```

Engineering implementation flow:
1. Load `attempt_answers` + `attempt_section_results` for this attempt_id
2. JOIN `attempt_answers.question_id` → `questions.concept_tag` (for bank-model questions)
   OR use `attempt_answers.concept_tag` directly (for TypeScript-config questions)
3. Load last 2 attempts for same (user_id, assessment_id) — historical context
4. Compute concept mastery delta vs. previous attempts
5. Detect anomalies: panic (§6.1), late rush (§6.2), persistent gaps (§6.5)
6. Build structured payload (see §3.4 example)
7. Call Claude with system prompt (§7.3)
8. Parse `{ what_went_well, next_steps, priority_tags, flags, recommendations }` from response
9. Upsert into `attempt_ai_insights`
10. Return the insight to client

This route runs **async** — does not block the attempt submission response.
The client polls `/api/analytics/insight-status?attempt_id=X` until `attempt_ai_insights` row exists.

### 7.3 System Prompt Template

```
You are an exam analytics engine for Indian competitive exams (NEET, JEE, CLAT) and SAT.
You receive structured performance data — never raw questions or personal information.

Your response must be a JSON object with exactly these fields:
{
  "what_went_well": "2-3 sentences on what the student did well. Reference specific sections and tags.",
  "next_steps":     "2-3 sentences on what needs work. Reference specific concept tags and numbers.",
  "priority_tags":  ["tag1", "tag2", "tag3"],
  "flags":          ["physics_gap", "panic_detected", ...],
  "recommendations": ["specific action 1", "specific action 2", "specific action 3"]
}

Rules:
- No student name or PII
- Reference specific concept tags from the payload — never invent tags not present
- Tone: warm but direct. Like a good tutor, not a motivational speaker.
- "what_went_well" must find something genuine — never fake positivity
- "next_steps" must be specific: name the tag, name the number, name the action
- recommendations must be actionable today (revise X chapter, practice Y problem type)
```

### 7.4 Environment Variable

```
ANTHROPIC_API_KEY=sk-ant-...
```

Never hardcoded. Never committed to git. Set in Vercel environment variables.
Local: `.env.local` (gitignored). Vercel: dashboard → Settings → Environment Variables.

### 7.5 Rate Limiting and Cost Control

- One Claude call per attempt submission (not per question)
- Haiku: ~$0.001 per call at current pricing
- Guard: `max_ai_calls_per_user_per_day = 10` in the API route
- Failure handling: if Claude call fails, store `flags: ["ai_unavailable"]`
  and show deterministic data only. Never block the dashboard for a Claude failure.

### 7.6 Alternative: Meta Llama 3.3 70B

| Factor | Claude API (Anthropic) | Meta Llama 3.3 70B |
|---|---|---|
| Demo setup | Instant (API key only) | Requires hosting |
| Cost at 10k users/month | ~$100–300 | ~$50–150 (self-hosted A100) |
| Cost at 100k+ users/month | $1k–3k | $200–500 (amortised GPU) |
| Response quality | Excellent for structured JSON | Good, needs prompt tuning |
| Data privacy | Data sent to Anthropic | Fully self-hosted option |
| Latency | ~1s (haiku) | ~2–4s (70B on GPU) |
| Compliance (future) | SOC 2 compliant | Self-controlled |

**Recommendation:** Claude API for launch. Evaluate Llama at 50k users if cost matters.
The API route is fully abstracted — swapping model = changing one provider call only.

---

## 8. "Focus on These Topics" CTA — Production Implementation

### 8.1 What it shows

After the AI insight panel, 3 CTA cards display for the top `priority_tags` from the insight:

```
┌─────────────────────────────────────┐
│ Electrochemistry                    │
│ Mastery: 0%    [red badge]          │
│ 0 / 4 correct across 2 attempts     │
│                                     │
│ [Practice Now →]                    │
└─────────────────────────────────────┘
```

### 8.2 Production query to find the linked assessment

```sql
SELECT id, title, assessment_type, slug
FROM assessments
WHERE exam_type = :exam_type           -- e.g. 'NEET'
  AND assessment_type IN ('subject_test', 'chapter_test')
  AND subject ILIKE :section_name      -- e.g. '%Physics%'
  AND is_active = true
ORDER BY assessment_type DESC          -- prefer chapter_test over subject_test
LIMIT 1
```

Rationale: if the weak tag is "Electrochemistry" (a Chemistry concept), query for a NEET
Chemistry subject test or chapter test. Map concept_tag → section_name via the taxonomy in §4.4.

### 8.3 Concept tag → section mapping (required for production query)

```
NEET Biology tags     → subject = 'Biology'
NEET Physics tags     → subject = 'Physics'
NEET Chemistry tags   → subject = 'Chemistry'
JEE Math tags         → subject = 'Mathematics'
CLAT Legal tags       → subject = 'Legal Reasoning'
CLAT English tags     → subject = 'English Language'
CLAT Reasoning tags   → subject = 'Logical Reasoning'
SAT Craft & Structure → subject = 'Reading & Writing'
SAT Algebra           → subject = 'Math'
```

This mapping is a lookup table — implement as a TypeScript constant in `src/lib/analytics/tagMap.ts`.

### 8.4 Fallback when no matching assessment exists

If no subject/chapter test is found for the tag:
- Button label: "Coming Soon" (disabled, `opacity-50 cursor-not-allowed`)
- Do not show an empty link

### 8.5 V1 Demo behaviour

In the V1 demo, CTA cards use the priority_tags from the seeded `attempt_ai_insights.priority_tags`
JSONB column. The "Practice Now" button queries live for a matching assessment using §8.2 query.
This works even for static seeded data — the query runs at render time.

---

## 9. Analytics Dashboard Components (End-User Facing)

Route: `/assessments/[id]?tab=analytics`
Data source: Supabase tables (real-time for production; seeded for demo).

### 9.1 Score Overview (deterministic, immediate)

- Attempt selector if multiple attempts exist
- Best score vs average score vs max possible score
- Attempts used count (X / 6)

### 9.2 Marks Lost Block (prominent, rose treatment)

```
┌─────────────────────────────────────────────────────┐
│ [rose-50 background, rose-700 text]                 │
│ You left 47 marks on the table                      │
│ Physics: 27 marks · Chemistry: 14 marks · Bio: 6   │
└─────────────────────────────────────────────────────┘
```

Computed from: `attempt_section_results.incorrect_count × abs(negative_marks_per_exam)`
Always shown prominently — this is the emotional hook that drives upgrade and re-attempt intent.

### 9.3 Section Breakdown (deterministic)

Horizontal progress bars per section:
- Label: section name
- Bar: `correct_count / total_questions × 100%` width
- Colour: green ≥70% | amber 40–69% | rose <40%
- Sub-label: `X correct of Y | +Z marks | −W marks`

### 9.4 AI Insight Panel (static in V1, async in production)

Two-card layout:

```
[What went well]                    [Next Steps]
"Biology is your strongest          "Physics is still below
 section at 72%..."                  the threshold at 40%..."
```

In production: loading skeleton shows while Claude is in-flight (~1–2s).
In V1 demo: reads directly from `attempt_ai_insights.what_went_well` + `.next_steps`.

### 9.5 Concept Mastery

**For 2+ attempts:** Grid heatmap — rows = concept_tags, columns = attempts.
Colours: green (≥70%) → yellow (40–69%) → red (<40%) → grey (not seen).
Hover: shows `correct/total` for that tag × attempt.

**For 1 attempt:** Horizontal bar chart sorted by mastery% descending.
Top 5 tags shown. "See all" expands to full list.

### 9.6 Focus Topics CTA Cards

3 cards for `priority_tags` from `attempt_ai_insights`.
Each card: tag name | mastery% badge | "Practice Now" button.
Button queries live for matching subject/chapter test (§8.2).

### 9.7 Panic / Rush Banner (deterministic)

If `flags` contains `panic_detected`:
```
amber-50 border banner:
"7 rushed responses detected in Physics — answers under 18s that were wrong.
 Slowing down in this section alone could recover ~12 marks."
```

Shown between Marks Lost and Section Breakdown for maximum visibility.

---

## 10. Implementation Phases

| Phase | Scope | Prerequisite |
|---|---|---|
| 1 — Data capture | Create 4 tables (KSS-DB-020 to KSS-DB-023). Write attempt_answers on exam submit. | KSS-DB authorisation |
| 2 — Algorithm layer | Compute section results + concept mastery after each attempt. API route for computation. | Phase 1 |
| 3 — Claude integration | POST /api/analytics/generate-insight. Async polling client. | Phase 2 + ANTHROPIC_API_KEY in Vercel |
| 4 — Dashboard UI | Analytics tab: all 5 output blocks + concept heatmap + CTA cards. | Phase 3 |
| 5 — Historical view | Attempt comparison timeline. Concept trend across all attempts. | Phase 4 |

**V1 Demo state (Apr 13 2026):** Phase 1 tables created. Attempt data seeded statically.
Dashboard UI built (Phase 4) but reading seeded data. Phases 2 and 3 are production work items.

---

## 11. Engineering Notes

### Concept tag coverage at launch

At KSS-SA-032 seeding (NEET → JEE → CLAT → SAT):
- Every seeded question will have `concept_tag` set
- TypeScript exam config questions (CLAT, NEET in `src/data/exams/`) have concept_tag
  assigned per-question in the data file (added Apr 13 2026)
- Legacy `assessments` table questions without tags: excluded from concept mastery,
  included in section score — graceful degradation

### Analytics does not break if Claude is down

All deterministic data (section scores, concept mastery, panic flags, marks lost) is computed
and stored before the Claude call. If the API call fails:
- Dashboard shows all deterministic blocks normally
- AI Insight panel shows: "Detailed insights are being prepared. Check back shortly."
- No retry storm — one retry after 30 seconds, then silent fail

### Section-level analytics with random question draw

With the question pool model (SA configures sources + chapters + N questions), different users
draw different questions from the same pool. Analytics aggregates by `concept_tag`, not by
`question_id`. This means two users who drew different questions from "Electrochemistry" both
contribute to their own Electrochemistry mastery correctly.

### Data privacy

Claude API receives:
- Aggregated numeric data (correct/total per tag, avg_time per section)
- Exam category and attempt number
- NO question text, NO answer text, NO user name, NO email, NO user ID

Strip all PII at the API route before constructing the Claude payload.
The `attempt_id` passed to Claude is an internal UUID — not linkable to a user externally.

---

## 12. Time Tracking — Deferred Spec (BQ-5 Option B, Apr 13 2026)

### 12.1 Current State (V1 Demo)

The exam engine (`src/hooks/useExamEngine.ts`) does **not** currently track time per question.
The `ExamAttemptState` records overall `timeRemainingSeconds` (decrements every tick) but has
no per-question `questionStartedAt` or `timeSpentSeconds` field.

**Demo workaround:** `attempt_answers` rows seeded directly with fabricated realistic times:
- NEET Physics: avg 68s/question with 7 questions at <18s (panic-flagged)
- NEET Biology: avg 42s/question, consistent
- NEET Chemistry: avg 63s/question, late-section acceleration in final 10 questions
- CLAT: avg 51s/question, legal reasoning slightly slower

These fabricated times drive realistic panic detection flags in the seeded demo data.

### 12.2 Production Implementation

When time tracking is built (requires "Override locked behaviour" instruction per CLAUDE.md):

**Step 1 — Add `questionStartedAt` to `QuestionState`:**
```typescript
// src/types/exam.ts
export interface QuestionState {
  questionId: string
  selectedOption: 'A' | 'B' | 'C' | 'D' | null
  selectedOptions?: string[]
  numericAnswer?: string
  isMarkedForReview: boolean
  status: QuestionStatus
  questionStartedAt?: number    // ADD: Date.now() when question becomes active
  timeSpentSeconds?: number     // ADD: accumulated across multiple visits
}
```

**Step 2 — Record start time on navigation dispatches:**
```typescript
// In examReducer, on any action that changes active question:
//   SAVE_AND_NEXT, PREVIOUS, JUMP_TO_QUESTION, SWITCH_SECTION
const now = Date.now()
const prevQ = state.questionStates[state.activeQuestionId]

if (prevQ?.questionStartedAt) {
  const elapsed = Math.round((now - prevQ.questionStartedAt) / 1000)
  questionStates[prevQId] = {
    ...prevQ,
    timeSpentSeconds: (prevQ.timeSpentSeconds ?? 0) + elapsed,
    questionStartedAt: undefined,
  }
}

// Set start time on newly active question
questionStates[newActiveQId] = {
  ...questionStates[newActiveQId],
  questionStartedAt: now,
}
```

**Step 3 — Write `attempt_answers` rows on SUBMIT_EXAM:**
```typescript
// In the submitAttempt() function (useExamEngine.ts)
// For each question in the exam config:
const answers = config.sections.flatMap(section =>
  section.questions.map(q => ({
    attempt_id:         attemptId,
    assessment_id:      assessmentDbId,
    user_id:            userId,
    question_id:        q.id,
    section_name:       section.label,
    concept_tag:        q.conceptTag ?? null,     // from exam config
    user_answer:        qs[q.id]?.selectedOption ?? null,
    is_correct:         qs[q.id]?.selectedOption === q.correctOption,
    time_spent_seconds: qs[q.id]?.timeSpentSeconds ?? null,
  }))
)
await supabase.from('attempt_answers').insert(answers)
```

**Step 4 — Compute section results after answers are written:**
Call `POST /api/analytics/compute-section-results` with `attempt_id`.
This aggregates `attempt_answers` into `attempt_section_results` rows.

**Step 5 — Update concept mastery:**
Call `POST /api/analytics/update-concept-mastery` with `attempt_id`.
Upserts into `user_concept_mastery` using the algorithm in §6.3.

**Step 6 — Call Claude:**
Call `POST /api/analytics/generate-insight` with `attempt_id`.
Runs async. Client polls `/api/analytics/insight-status?attempt_id=X`.

**Ticket to create when building production time tracking:** TIPTAP-003 or new KSS-B2C-[TBD].
Must include "Override locked behaviour" in the task description per CLAUDE.md.

---

## 13. Open Questions (Product Owner Decision Needed)

| # | Question | Status |
|---|---|---|
| OQ-1 | Show AI insight on attempt 1 (no historical context), or from attempt 2+? | **Resolved: show from attempt 1** |
| OQ-2 | Should mastery heatmap be visible to SA/CA in reporting, or B2C only? | Open |
| OQ-3 | Should concept tags be visible to the student on question review page? | Open |
| OQ-4 | Panic detection threshold — 25% of section average. Confirm or adjust? | Open |
| OQ-5 | "Focus on these topics" CTA: links to subject/chapter test if one exists? | **Resolved: yes, production query in §8.2** |

---

*Document version: 2.0 — Apr 13 2026 (schema updated: two-column attempt_ai_insights,
time tracking deferred spec added, focus topics production spec added, demo implementation
notes added)*
*Previous version: 1.0 — Apr 12 2026*
