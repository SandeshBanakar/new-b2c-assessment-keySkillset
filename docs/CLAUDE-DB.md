# CLAUDE-DB.md — Database Rules & Schema Reference
# Imported by CLAUDE.md. Read this before any DB query, schema change, or data model work.

---

## ABSOLUTE DB RULES

- RLS OFF on ALL tables — permanently. Never add RLS. No exceptions.
- Never modify schema without `KSS-DB-XXX` authorisation confirmed in Claude.ai project chat
- Schema changes via `execute_sql` ONLY (project_id: uqweguyeaqkbxgtpkhez)
- Write the SQL query manually as the Supabase project query is turned off via mcp
- All the query and results after the query is asked to run manually in Supabase for any task that has DB or schema change, it will be updated in `/docs/SQL-RESPONSE.txt`.
- `/docs/SQL-RESPONSE.txt`is a dynamic file and should only be considered as RAM storage for SQL queries executed for this project
- Always use `IF NOT EXISTS` in CREATE statements
- After any schema change: verify → update this file → run `npm run build`

---

## CRITICAL FOOTGUNS — READ CAREFULLY

**`tenant_scope_id` vs `tenant_id` on `assessment_items`**
The column is `tenant_scope_id` — NOT `tenant_id`. These are different.
- `tenant_scope_id IS NULL` → GLOBAL content (SA-owned)
- `tenant_scope_id IS NOT NULL` → TENANT_PRIVATE (tenant-owned)
Never use `tenant_id` when querying content visibility scope.

**`plan_content_map.content_item_id` is polymorphic — no FK**
There is no foreign key. Always filter by `content_type` first:
- `content_type = 'ASSESSMENT'` → resolves to `assessment_items.id`
- `content_type = 'COURSE'` → resolves to `courses.id`

**Two assessment tables — never confuse them**
- `assessment_items` = SA management table (lifecycle: DRAFT/INACTIVE/LIVE/ARCHIVED/MAINTENANCE, visibility, plan mapping)
- `assessments` = exam engine operational table (slug, duration, questions count, sections — what the engine reads)
- They are linked via `assessment_items.assessments_id FK→assessments.id` (set at "Make Live" step)
- `questions` links to `assessments.id` — never to `assessment_items.id`

**`price_usd` is always actual dollars (e.g. 29.99)**
Never cents. Never rename to `price_usd_cents`. Applies to all tables.

**`INACTIVE` is UI-computed on `users` — never stored**
Rule: `status = 'ACTIVE' AND last_active_date > 30 days`
Never add an INACTIVE column to any table.

**`subscription_tier` on `users` = assessment plan tier ONLY**
Course plan subscriptions live in `b2c_course_subscriptions`. Never conflate.

---

## SCHEMA REFERENCE

### tenants
```
id, name, type, feature_toggle_mode, licensed_categories (ARRAY),
stripe_customer_id, is_active, created_at, contact_name, contact_email,
contact_phone, contact_phone_country_code (text, nullable — ISO 3166-1 alpha-2 e.g. "IN"; KSS-DB-005),
timezone (DEFAULT 'Asia/Kolkata'),
date_format (DEFAULT 'DD/MM/YYYY'), address_line1, address_line2,
city, state, country, zip_code, logo_url (text nullable)
```
- `feature_toggle_mode`: `FULL_CREATOR` (CC access + own DB) | `RUN_ONLY` (CA only)
- Logo bucket: `tenant-logo` (public), `{tenant_id}.jpg`, 500KB PNG/JPG max
- Tenant IDs (locked):
  - Akash Institute Delhi: `ec1bc005-e76d-4208-ab0f-abe0d316e260` (FULL_CREATOR)
  - TechCorp India: `7caa0566-e31a-41b6-962d-30fb3d6cb011` (RUN_ONLY)

### admin_users
```
id (uuid), email (UNIQUE), name, role, tenant_id (uuid), is_active (boolean),
created_at, password_hash (text nullable — demo only)
```
- Valid V1 roles: `SUPER_ADMIN` | `CLIENT_ADMIN` | `CONTENT_CREATOR`
- `TEAM_MANAGER` deferred to V2 — never add to V1
- Master Org CCs: `tenant_id IS NULL`. B2B CCs: `tenant_id = B2B tenant UUID`

### users (B2C)
```
id, email, display_name,
subscription_tier ('free'|'basic'|'professional'|'premium'),
subscription_status, subscription_start_date, subscription_end_date,
stripe_subscription_id, status ('ACTIVE'|'SUSPENDED'),
last_active_date, user_onboarded, selected_exams, goal, xp, streak, role,
free_attempt_used, organization_id, created_at, updated_at,
suspension_reason (text nullable), suspended_at (timestamptz nullable),
suspended_by (uuid nullable → admin_users.id),
unsuspend_reason (text nullable), unsuspended_at (timestamptz nullable),
unsuspended_by (uuid nullable → admin_users.id)
```
- `INACTIVE` = UI-computed only (see footguns above)
- `subscription_tier` = assessment plan tier only
- Free tier = no assessment plan subscription row (default unsubscribed state)
- `suspension_reason` required at app level (confirm disabled until typed)
- `suspended_by` / `unsuspended_by` hardcoded to demo SA UUID until auth is implemented
- Multiple suspension cycles overwrite columns — full history deferred to V3
- KSS-DB-SA-012 added 6 suspension columns — April 9, 2026 (KEYS-553)
- Demo UUIDs (locked):
  - Free: `9a3b56a5-31f6-4a58-81fa-66157c68d4f0`
  - Basic: `a0c16137-7fd5-44f5-96e6-60e4617d9230`
  - Pro: `e150d59c-13c1-4db3-b6d7-4f30c29178e9` (Priya Sharma)
  - Premium: `191c894d-b532-4fa8-b1fe-746e5cdcdcc8`
  - 16 demo users total: 6 Free, 4 Basic, 3 Pro, 3 Premium. 1 Suspended, 3 Inactive.

### attempts
```
passed (boolean nullable)
```
- `true/false` = chapter/subject-test (≥60% threshold)
- `null` = full-test / CLAT
- Accuracy: `correct / (correct + incorrect) * 100` (excludes skipped)
- Avg time: `time_spent / total_questions`

### assessment_items (SA management — formerly content_items, renamed KSS-DB-001 Apr 11 2026)
```
id, title, exam_category_id (FK→exam_categories), test_type, source,
status (DRAFT/INACTIVE/LIVE/ARCHIVED/MAINTENANCE),
audience_type (nullable until LIVE),
visibility_scope ('GLOBAL'|'TENANT_PRIVATE'|'PENDING_PROMOTION' DEFAULT 'GLOBAL'),
tenant_scope_id (uuid nullable — NOT tenant_id),
created_by (never changes), last_modified_by (uuid nullable),
created_at, updated_at,
description (TEXT nullable — KSS-DB-007),
display_config (JSONB DEFAULT '{}' — KSS-DB-007),
assessment_type (TEXT DEFAULT 'LINEAR' CHECK IN ('LINEAR','ADAPTIVE') — KSS-DB-007),
assessments_id (uuid nullable FK→assessments.id — set at Make Live step, KSS-DB-001),
assessment_config (JSONB DEFAULT '{}' — KSS-DB-017)
```
- `tenant_scope_id IS NULL` = GLOBAL | NOT NULL = TENANT_PRIVATE
- `display_config` shape: `{ what_youll_get: string[], topics_covered: TopicEntry[], language: string }` — `TopicEntry = { id, label, children?: TopicEntry[] }` (recursive tree; depth varies by test_type: FULL=3, SUBJECT=2, CHAPTER=1)
- `assessment_type`: `LINEAR` (default) | `ADAPTIVE` (SAT only — engine deferred)
- `assessments_id`: links to engine table when assessment is published LIVE
- KSS-DB-007 applied April 9 2026 | KSS-DB-001 rename applied April 11 2026

### assessments (exam engine operational table)
```
id, title, description, exam_type, assessment_type, subject, difficulty,
duration_minutes, total_questions, score_min (DEFAULT 0), score_max,
architecture (DEFAULT 'linear'), min_tier (DEFAULT 'basic'),
visibility (DEFAULT 'global'), org_id, is_active (DEFAULT true),
created_at, thumbnail_url, tags (ARRAY), slug, exam, type,
tier (DEFAULT 'basic'), is_puzzle_mode (DEFAULT false), rating, total_users (DEFAULT 0),
override_marks (boolean DEFAULT false — KSS-DB-013),
override_marks_correct (numeric DEFAULT 1 — KSS-DB-013),
override_marks_negative (numeric DEFAULT 0 — KSS-DB-013)
```
- Read by exam engine (useExamEngine.ts) via `slug`
- `override_marks=true` → engine uses override_marks_correct/negative for ALL questions, ignoring per-question marks
- KSS-DB-013 applied April 11 2026

### sources (Assessment Creation — KSS-DB-010, Apr 11 2026; KSS-DB-027/028 Apr 16 2026)
```
id, name, description, exam_category_id (FK→exam_categories),
difficulty ('easy'|'medium'|'hard'|'mixed' DEFAULT 'mixed'),
target_exam (text optional),
status (TEXT NOT NULL DEFAULT 'DRAFT' CHECK IN ('DRAFT','ACTIVE') — KSS-DB-027),
deleted_at (TIMESTAMPTZ NULL — KSS-DB-028, soft delete),
created_by (FK→admin_users), last_modified_by (FK→admin_users), created_at, updated_at
```
- Soft delete: set `deleted_at = NOW()`. ALL queries must filter `deleted_at IS NULL`.
- `status`: DRAFT = being populated | ACTIVE = ready for use in assessments.
- `target_exam`: free-text label only (e.g. "NEET 2025") — reference field, not FK.

### chapters (Assessment Creation — KSS-DB-011, Apr 11 2026; KSS-DB-015 Apr 11 2026; KSS-DB-028 Apr 16 2026; KSS-DB-029 Apr 16 2026)
```
id, source_id (FK→sources ON DELETE CASCADE), name,
description (text nullable — KSS-DB-015),
order_index (int DEFAULT 0 — KSS-DB-015, controls display order within source),
difficulty ('easy'|'medium'|'hard'|'mixed' DEFAULT 'medium'),
deleted_at (TIMESTAMPTZ NULL — KSS-DB-028, soft delete),
created_by (FK→admin_users), last_modified_by (FK→admin_users),
created_at, updated_at
```
- NOTE: `status` column DROPPED via KSS-DB-029 (Apr 16 2026). Chapters are always live from creation — no draft/archive concept.
- Soft delete: set `deleted_at = NOW()`. ALL queries must filter `deleted_at IS NULL`.
- When a source is soft-deleted, all child chapters are soft-deleted in the same operation.

### questions (Assessment Creation — KSS-DB-009 extended Apr 11 2026; KSS-DB-018 Apr 12 2026)
```
id, assessment_id (uuid nullable FK→assessments — legacy direct link),
source_id (uuid nullable FK→sources), chapter_id (uuid nullable FK→chapters),
question_type (text NOT NULL), question_text (JSONB NOT NULL — KSS-DB-018, Tiptap doc),
passage_text (JSONB nullable — KSS-DB-018, Tiptap doc, for PASSAGE_SINGLE inline),
options (jsonb — array of {key: string, text: TiptapDoc} objects — KSS-DB-018),
correct_answer (jsonb nullable — array e.g. ["A"] or ["A","C"]),
acceptable_answers (jsonb nullable — for NUMERIC type, array of strings),
explanation (JSONB nullable — KSS-DB-018, Tiptap doc), explanation_steps (jsonb), video_url (text),
marks (numeric DEFAULT 1), negative_marks (numeric DEFAULT 0),
categories (jsonb DEFAULT '[]' — array of exam category names),
concept_tag (text nullable — KSS-DB-016, single skill/concept label e.g. "sp3 Hybridization"),
status ('DRAFT'|'ACTIVE'|'FLAGGED' DEFAULT 'ACTIVE'),
difficulty ('easy'|'medium'|'hard'|'mixed' DEFAULT 'medium'),
section_name (text — CLAT section mapping),
randomize_options (boolean DEFAULT false — PASSAGE_MULTI only),
module_name, subject, skill_group (text — legacy SAT fields),
question_order (int DEFAULT 0 nullable),
created_by (FK→admin_users), last_modified_by (FK→admin_users),
created_at, updated_at
```
- Rich text: question_text, explanation, passage_text, options[].text are all Tiptap JSONB (KSS-DB-018, Apr 12 2026)
- Tiptap doc shape: `{ type: 'doc', content: [...] }` — use ensureDoc() when reading legacy rows
- `correct_answer` is JSONB array: `["A"]` single, `["A","C"]` multi, null for NUMERIC
- Bank model: questions are source/chapter-owned, pulled into assessments via assessment_question_map
- Status on create: always ACTIVE (no draft cycle on create)

### assessment_question_map (bank model — KSS-DB-012, Apr 11 2026)
```
id, assessment_id (FK→assessments ON DELETE CASCADE),
question_id (FK→questions ON DELETE CASCADE),
section_name (text — CLAT section override), order_index (int DEFAULT 0),
created_at
UNIQUE(assessment_id, question_id)
```

### passage_sub_questions (KSS-DB-014, Apr 11 2026; KSS-DB-019 Apr 12 2026)
```
id, parent_question_id (FK→questions ON DELETE CASCADE),
question_text (JSONB NOT NULL — KSS-DB-019, Tiptap doc),
options (jsonb DEFAULT '[]' — array of {key: string, text: TiptapDoc}),
correct_answer (jsonb nullable), explanation (JSONB nullable — KSS-DB-019, Tiptap doc),
video_url (text), order_index (int NOT NULL DEFAULT 0),
created_at, updated_at
```
- Used for PASSAGE_SINGLE (1 row) and PASSAGE_MULTI (N rows) under one parent question
- question_text and explanation are Tiptap JSONB (KSS-DB-019, Apr 12 2026) — use ensureDoc() on read

### courses
```
id, title, description, course_type, status (LIVE/INACTIVE/DRAFT/ARCHIVED),
source, tenant_id, created_by, created_at, updated_at,
audience_type (B2C_ONLY/B2B_ONLY/BOTH nullable), price (INR nullable),
price_usd (numeric nullable), currency (DEFAULT 'INR'),
is_individually_purchasable (boolean DEFAULT false), stripe_price_id,
last_modified_by (uuid nullable)
```
- 15 courses total: 1 B2C ARCHIVED (HIPAA — `425b71f4`, purchasable, $12.99), 7 B2B LIVE (platform-wide), 1 INACTIVE (CLAT), 6 B2B INACTIVE (Akash private — Apr 16 2026)
- Akash-private courses (`tenant_id = ec1bc005-e76d-4208-ab0f-abe0d316e260`, `status = INACTIVE`, `audience_type = B2B_ONLY`, `price = 0`):
  - NEET Preparation Course (`96a8eebd`) — COMBINATION
  - JEE Preparation Course (`4487343a`) — COMBINATION
  - Cognitive Skills Course (`7b57da77`) — CLICK_BASED
  - SAT Preparation Course (`e96e99dd`) — COMBINATION
  - Typing Course (`ee93d801`) — KEYBOARD_TRAINER
  - English Language Course (`dd4923ab`) — VIDEO
- Tenant-private courses are scoped by `tenant_id` on `courses` (NOT `tenant_scope_id` — that column is on `assessment_items` only)
- `is_individually_purchasable` managed ONLY via SINGLE_COURSE_PLAN plan lifecycle — no manual toggle
- On SINGLE_COURSE_PLAN PUBLISHED: sync `price + price_usd + stripe_price_id` to course + set `purchasable=true`
- On SINGLE_COURSE_PLAN ARCHIVED: set `is_individually_purchasable=false` (prices kept)

### plans
```
plan_type, tier (BASIC|PRO|PREMIUM|ENTERPRISE|FREE|null), plan_audience ('B2C'|'B2B'),
plan_category ('ASSESSMENT'|'COURSE_BUNDLE'|'SINGLE_COURSE_PLAN' DEFAULT 'ASSESSMENT'),
scope ('PLATFORM_WIDE'|'CATEGORY_BUNDLE'), price (INR DEFAULT 0),
price_usd (numeric), billing_cycle ('ANNUAL'|'MONTHLY'),
status (DRAFT|LIVE|DELETED),   -- KSS-DB-021: PUBLISHED→LIVE, ARCHIVED→DELETED
compare_at_price (numeric NULL),     -- KSS-DB-020: promotional display price (INR)
compare_at_price_usd (numeric NULL), -- KSS-DB-020: promotional display price (USD)
was_live (boolean DEFAULT false),    -- KSS-DB-021: true once plan has ever been LIVE
display_name, tagline, feature_bullets (jsonb DEFAULT '[]'), footnote,
is_popular (boolean DEFAULT false), cta_label, max_attempts_per_assessment,
is_free (boolean DEFAULT false)
```
- status lifecycle: DRAFT → LIVE → DRAFT (editing) | DRAFT → DELETED (soft delete)
- `was_live=true` once a plan transitions to LIVE; preserved even when moved back to DRAFT
- `compare_at_price` / `compare_at_price_usd`: SINGLE_COURSE_PLAN only; both must be set or neither; must exceed `price`/`price_usd`; display-only (Stripe pricing is separate)
- B2B plans: `price=0` always, `scope=PLATFORM_WIDE` always
- B2B plans have NO: `display_name`, `tagline`, `feature_bullets`, `is_popular`, `cta_label`
- B2C Assessment tiers: `BASIC/PRO/PREMIUM`. B2B tier: `ENTERPRISE`. Tiers are ASSESSMENT-only.
- SINGLE_COURSE_PLAN tier: `FREE` when `is_free=true`, `NULL` when paid. Never use BASIC/PRO/PREMIUM for course plans.
- `is_free=true` → `price=0`, `price_usd=0`, `stripe_price_id=NULL`, `tier='FREE'`
- `is_free=false` (paid SINGLE_COURSE_PLAN) → `tier=NULL`
- One active (DRAFT or LIVE) SINGLE_COURSE_PLAN per course enforced at UI level (KSS-SA-026)
- `max_attempts_per_assessment = 6` platform-wide (1 free + 5 paid) — never hardcode 5

### plan_content_map
```
content_item_id (polymorphic — NO FK), content_type (ASSESSMENT|COURSE), plan_id
```
- ASSESSMENT rows → `assessment_items.id` | COURSE rows → `courses.id`
- Always filter by `content_type` before resolving `content_item_id`

### plan_subscribers
```
id, plan_id, subscriber_count (seeded static), updated_at
```
- MRR = `plan.price × subscriber_count` — computed in UI, never stored
- Active = `Math.round(count * 0.8)` — computed in UI, never stored
- B2C plans only

### tenant_plan_map
```
id, tenant_id (FK→tenants), plan_id (FK→plans), created_at
```
- RLS: OFF
- Akash Standard→Akash | TechCorp Premium→TechCorp | Enterprise Pro→both tenants

### contracts
```
seat_count, arr, start_date, end_date, stripe_subscription_id, notes,
updated_at, content_creator_seats (DEFAULT 0)
```
- `content_creator_seats` visible ONLY when `feature_toggle_mode='FULL_CREATOR'`
- ARR display: `Math.max(0, Number || 0)` — never show negative
- Label: "Learner Seats" (NOT "Seat Count")

### b2c_assessment_subscriptions
```
id, user_id, plan_id (nullable), stripe_subscription_id, stripe_customer_id,
product_name, price_usd (numeric 10,2), currency (DEFAULT 'USD'),
billing_interval (DEFAULT 'month'),
status CHECK ('active'|'canceled'|'past_due'|'trialing'|'incomplete'|'unpaid'),
cancel_at_period_end (boolean DEFAULT false),
current_period_start, current_period_end, canceled_at, ended_at, created_at
```
- RLS: OFF
- Access gate: `WHERE user_id=X AND status='active' AND current_period_end > NOW()`
- Seeded: 11 rows (10 of 16 demo users — Free users have no rows)
- Multiple rows per user allowed (tracks history)

### b2c_course_subscriptions
```
id, user_id, plan_id (nullable FK→plans.id SINGLE_COURSE_PLAN),
course_id (nullable FK→courses.id), stripe_subscription_id,
stripe_customer_id, product_name, price_usd (numeric 10,2),
currency (DEFAULT 'USD'), billing_interval (DEFAULT 'year'),
status CHECK (same as assessment_subscriptions),
cancel_at_period_end, current_period_start, current_period_end,
canceled_at, ended_at, created_at
```
- RLS: OFF
- Access gate: `WHERE user_id=X AND course_id=Y AND status='active' AND current_period_end > NOW()`
- Free course detection: no row for `user+course` = free access (show 'Free' badge)
- Free-tier users CAN have course subscriptions (independent of assessment tier)
- Seeded: 11 rows across 8 demo users

### b2c_certificates
```
id, user_id (FK→users), course_id (FK→courses),
certificate_number (text UNIQUE), user_name, course_title,
issued_at (timestamptz), created_at
```
- RLS: OFF
- Format: `KSS-{shortCode}-{YYYYMMDD}-{seq}`
- `shortCode` = first letters of course title words (e.g. HIPAA Compliance Training → HCT)
- 4 demo rows seeded for HIPAA completions

### b2c_course_progress
```
id, user_id, course_id, status (IN_PROGRESS|COMPLETED),
progress_pct (0-100), started_at, completed_at
```
- RLS: OFF

### course_modules / course_topics
```
course_modules: id, course_id (FK), title, order_index, created_at
course_topics: id, module_id (FK), title, order_index, created_at
```
- 5 modules seeded for HIPAA (3 topics/module = 15 total)

### b2c_module_progress
```
id, user_id, module_id (FK), topic_id (nullable FK),
progress_pct (int), status (COMPLETED|IN_PROGRESS|NOT_STARTED), updated_at
```
- UNIQUE `(user_id, module_id, topic_id)`
- Module-level rows: `topic_id IS NULL`
- Status icons: `CheckCircle2` / `CircleDot` / `Circle` per COMPLETED/IN_PROGRESS/NOT_STARTED

### learners
```
id, tenant_id, full_name, email, phone, phone_country_code (text nullable),
department_id, team_id, status (ACTIVE|INACTIVE), employee_roll_number,
notes, created_by, created_at, last_active_at
```
- `phone` stores subscriber digits only (e.g. `9876543210`) — no country code prefix
- `phone_country_code` stores ISO 3166-1 alpha-2 code (e.g. `IN`, `US`) — NOT dial code — added KSS-DB-004 (Apr 5 2026)
- Display: derive dial code via `getDialCode(iso)` from `PhoneInputField.tsx`, then show `dialCode + ' ' + phone`
- Both nullable — phone is optional; if phone_country_code is set, phone must also be set (enforced in UI)

### departments / teams
```
departments: id, tenant_id, name, description, team_manager_id,
             status (ACTIVE|INACTIVE), created_at
teams:       id, department_id (FK), tenant_id, name,
             status (ACTIVE|INACTIVE), created_at
```
- Dept deactivation cascade: child teams → INACTIVE, learner dept/team assignments → NULL

### learner_course_progress (B2B only)
```
id (uuid PK), learner_id (FK→learners ON DELETE CASCADE),
tenant_id (FK→tenants ON DELETE CASCADE),
course_id (FK→courses ON DELETE CASCADE),
status TEXT CHECK ('NOT_STARTED'|'IN_PROGRESS'|'COMPLETED') DEFAULT 'NOT_STARTED',
progress_pct INTEGER CHECK (0–100) DEFAULT 0,
started_at (timestamptz nullable), completed_at (timestamptz nullable),
updated_at (timestamptz DEFAULT NOW())
UNIQUE (learner_id, course_id, tenant_id)
```
- B2B course progress tracking — one row per learner+course+tenant
- Fallback derivation (if no row): `score_pct ≥ 100 → COMPLETED`, `score_pct > 0 → IN_PROGRESS`, else `NOT_STARTED`
- KSS-DB-008 applied April 9 2026

### learner_attempts (B2B only)
```
id, learner_id (FK), content_id, content_type (ASSESSMENT|COURSE),
tenant_id (FK), score_pct (numeric 5,2), passed (boolean),
attempted_at, time_taken_seconds
```
- Pass: ASSESSMENT ≥60% | COURSE = 100%

### CA Tables
```
learner_profiles — learner_id+tenant_id FK, employee_roll_number, notes
content_assignments — tenant_id, content_id (polymorphic), content_type,
  target_type (DEPARTMENT|TEAM|INDIVIDUAL), target_id, assigned_by, removed_at
learner_content_access — learner_id, content_id, content_type, tenant_id,
  source_assignment_id, granted_at, revoked_at
certificates — learner_id, content_id, content_type='COURSE', tenant_id,
  learner_name, content_title, tenant_name,
  certificate_number (KSS-{short}-{YYYYMMDD}-{seq}), issued_at
client_audit_log — tenant_id, actor_id, actor_name,
  actor_role (CLIENT_ADMIN|CONTENT_CREATOR), action, entity_type,
  entity_id, before_state (jsonb), after_state (jsonb), ip_address, created_at
```

### concept_tags (KSS-DB-030, Apr 17 2026 — replaces KSS-DB-026 display-only version)
```
id (uuid PK), exam_category (text NOT NULL), subject (text NOT NULL),
concept_name (text NOT NULL), slug (text NOT NULL),
description (text nullable),
created_by (uuid nullable FK→admin_users ON DELETE SET NULL),
created_at (timestamptz DEFAULT now())
UNIQUE (exam_category, subject, concept_name)
```
- Indexes: exam_category, (exam_category, subject), slug
- Seeded with 144 tags: SAT=45, NEET=43, JEE=33, CLAT=23
- IMMUTABLE seed data — concept tags are registry only; SA may add via Platform Config page
- `questions.concept_tag` (free text) is the operational field; `concept_tags` is the registry
- Hard delete allowed (with warning if question_count > 0 linked via question_concept_mappings)

### question_concept_mappings (KSS-DB-031, Apr 17 2026)
```
id (uuid PK), question_id (uuid NOT NULL FK→questions ON DELETE CASCADE),
concept_tag_id (uuid NOT NULL FK→concept_tags ON DELETE CASCADE),
created_at (timestamptz DEFAULT now())
UNIQUE (question_id, concept_tag_id)
```
- Indexes: question_id, concept_tag_id
- One question → one concept (enforced at UI level in QuestionForm)
- One concept → many questions (shown in Platform Config list view)

### user_concept_mastery ENHANCED (KSS-DB-032, Apr 17 2026)
Additional columns added to existing table:
```
module_id (text nullable — e.g. 'rw_m1', 'math_m2'),
stage (text GENERATED ALWAYS AS STORED — computed from mastery_percent):
  ≥80% → 'strength' | ≥60% → 'developing' | ≥40% → 'needs_practice' | <40% → 'weak'
attempt_count (int DEFAULT 1),
last_attempt_date (timestamptz DEFAULT now()),
trend (text DEFAULT 'stable' CHECK IN ('improving','declining','stable'))
```
- `stage` is a Postgres GENERATED ALWAYS AS STORED column — never update directly
- `trend` is computed by analytics engine (compare last 2 attempt mastery_percent values)
- Production: update attempt_count and last_attempt_date on every attempt submission

---

## SAT SCORING — Official College Board Conversion Table (Practice Test #4)

Source: `public/scoring-sat-practice-test-4-digital.pdf` — © 2023 College Board (2324-BB-852)

### Structure
- Total Score: 400–1600 (sum of R&W + Math section scores)
- Section Scores: 200–800 each (R&W and Math independently)
- Modules: R&W has Module 1 (33Q) + Module 2 (33Q) = max 66 raw. Math has Module 1 (27Q) + Module 2 (27Q) = max 54 raw.
- Note: Scores are expressed as ranges (lower/upper) due to simplified paper-based scoring

### Raw Score → Section Score Conversion Table

| Raw Score | R&W Lower | R&W Upper | Math Lower | Math Upper |
|-----------|-----------|-----------|------------|------------|
| 0 | 200 | 200 | 200 | 200 |
| 7 | 200 | 210 | 200 | 220 |
| 8 | 200 | 220 | 200 | 230 |
| 9 | 210 | 230 | 220 | 250 |
| 10 | 230 | 250 | 250 | 280 |
| 11 | 240 | 260 | 280 | 310 |
| 12 | 250 | 270 | 290 | 320 |
| 13 | 260 | 280 | 300 | 330 |
| 14 | 280 | 300 | 310 | 340 |
| 15 | 290 | 310 | 320 | 350 |
| 16 | 320 | 340 | 330 | 360 |
| 17 | 340 | 360 | 330 | 360 |
| 18 | 350 | 370 | 340 | 370 |
| 19 | 360 | 380 | 350 | 380 |
| 20 | 370 | 390 | 360 | 390 |
| 21 | 370 | 390 | 370 | 400 |
| 22 | 380 | 400 | 370 | 400 |
| 23 | 390 | 410 | 380 | 410 |
| 24 | 400 | 420 | 390 | 420 |
| 25 | 410 | 430 | 400 | 430 |
| 26 | 420 | 440 | 420 | 450 |
| 27 | 420 | 440 | 430 | 460 |
| 28 | 430 | 450 | 440 | 470 |
| 29 | 440 | 460 | 460 | 490 |
| 30 | 450 | 470 | 470 | 500 |
| 31 | 460 | 480 | 480 | 510 |
| 32 | 460 | 480 | 500 | 530 |
| 33 | 470 | 490 | 510 | 540 |
| 34 | 480 | 500 | 520 | 550 |
| 35 | 490 | 510 | 530 | 560 |
| 36 | 490 | 510 | 550 | 580 |
| 37 | 500 | 520 | 560 | 590 |
| 38 | 510 | 530 | 570 | 600 |
| 39 | 520 | 540 | 580 | 610 |
| 40 | 530 | 550 | 590 | 620 |
| 41 | 540 | 560 | 600 | 630 |
| 42 | 540 | 560 | 620 | 650 |
| 43 | 550 | 570 | 630 | 660 |
| 44 | 560 | 580 | 650 | 680 |
| 45 | 570 | 590 | 670 | 700 |
| 46 | 580 | 600 | 690 | 720 |
| 47 | 590 | 610 | 710 | 740 |
| 48 | 590 | 610 | 730 | 760 |
| 49 | 600 | 620 | 740 | 770 |
| 50 | 610 | 630 | 750 | 780 |
| 51 | 620 | 640 | 760 | 790 |
| 52 | 630 | 650 | 770 | 800 |
| 53 | 630 | 650 | 780 | 800 |
| 54 | 640 | 660 | 790 | 800 |
| 55 | 650 | 670 | — | — |
| 56 | 660 | 680 | — | — |
| 57 | 670 | 690 | — | — |
| 58 | 680 | 700 | — | — |
| 59 | 690 | 710 | — | — |
| 60 | 700 | 720 | — | — |
| 61 | 710 | 730 | — | — |
| 62 | 720 | 740 | — | — |
| 63 | 730 | 750 | — | — |
| 64 | 750 | 770 | — | — |
| 65 | 770 | 790 | — | — |
| 66 | 790 | 800 | — | — |

### Calculation Algorithm
```
rw_raw = rw_m1_correct + rw_m2_correct  (0–66)
math_raw = math_m1_correct + math_m2_correct  (0–54)
rw_score = lookup(rw_raw) → { lower, upper }
math_score = lookup(math_raw) → { lower, upper }
total_lower = rw_score.lower + math_score.lower
total_upper = rw_score.upper + math_score.upper
```

### Practice Test #4 Answer Key
R&W Module 1 (33Q): B,A,A,C,A,B,D,B,B,D,C,D,A,B,C,A,A,A,A,D,D,D,B,C,B,A,C,D,A,A,D,D,C
R&W Module 2 (33Q): D,D,B,B,B,B,A,C,C,A,A,B,D,C,C,A,B,D,C,A,B,D,D,A,B,B,A,A,C,C,A,A,B
Math Module 1 (27Q): B,A,B,D,A,9,10,A,B,D,A,C,1/5,80,D,B,B,A,C,100,361/8,B,D,C,C,D,5
Math Module 2 (27Q): B,B,C,A,A,15/-5,50,B,D,A,A,B,.3,2,A,C,B,D,A,15/17,51,A,C,C,D,B,600

---

## COMPLETED SCHEMA CHANGES (April 11 2026)

- **KSS-DB-001 (DB-TODO-001 — DONE)**: Renamed `content_items` → `assessment_items`. All code updated.
- **KSS-DB-017**: Added `assessment_config JSONB DEFAULT '{}'` to `assessment_items`. Shape: `{ duration_minutes, navigation_policy, total_questions, total_marks, sections?: [{ id, name, questionCount, durationMinutes?, marks? }] }`.
- **KSS-DB-009**: Altered `questions` table — added marks, negative_marks, categories, source_id, chapter_id, status, correct_answer→jsonb, created_by, last_modified_by, updated_at, section_name, randomize_options, acceptable_answers.
- **KSS-DB-010**: Created `sources` table.
- **KSS-DB-011**: Created `chapters` table.
- **KSS-DB-012**: Created `assessment_question_map` table (bank model).
- **KSS-DB-013**: Added override_marks fields to `assessments` table.
- **KSS-DB-014**: Created `passage_sub_questions` table.
- **KSS-DB-015**: Added `description` (text nullable) and `order_index` (int DEFAULT 0) to `chapters` table.
- **KSS-DB-016**: Added `concept_tag` (text nullable) to `questions` table.
- **KSS-DB-018 (Apr 12 2026)**: Migrated `questions` rich-text columns from TEXT → JSONB: `question_text`, `explanation`, `passage_text`. Migrated `options[].text` from plain string to Tiptap doc inside JSONB array. Existing text rows wrapped in minimal `{ type:'doc', content:[{type:'paragraph',content:[{type:'text',text:'...'}]}] }` shape.
- **KSS-DB-019 (Apr 12 2026)**: Migrated `passage_sub_questions` rich-text columns from TEXT → JSONB: `question_text`, `explanation`. Same Tiptap doc shape as KSS-DB-018.
- **KSS-DB-020 (Apr 13 2026)**: Added `compare_at_price` (numeric NULL) and `compare_at_price_usd` (numeric NULL) to `plans`. Used for promotional strikethrough display on SINGLE_COURSE_PLAN only. Both currencies must be set together or neither.
- **KSS-DB-021 (Apr 13 2026)**: Plan lifecycle overhaul. (1) Added `was_live` (boolean DEFAULT false) to `plans`. (2) Dropped `plans_status_check` constraint `(DRAFT|PUBLISHED|ARCHIVED)`. (3) Migrated PUBLISHED→LIVE, ARCHIVED→DELETED (backfilling `was_live=true` for both). (4) Added new `plans_status_check` constraint `(DRAFT|LIVE|DELETED)`. The `was_live` flag distinguishes a brand-new DRAFT (false) from a plan that has previously been live (true).
- **KSS-DB-022 (Apr 13 2026)**: Created `attempt_answers` table. Stores per-question answer data for a completed attempt. Columns: `id (uuid PK)`, `attempt_id (FK→attempts)`, `question_id (uuid)`, `user_answer (text)`, `is_correct (bool)`, `time_spent_seconds (int)`, `created_at`, plus four columns added same day via ALTER: `section_id (text)`, `concept_tag (text)`, `is_skipped (bool DEFAULT false)`, `marks_awarded (numeric 6,2 DEFAULT 0)`. Indexes on `attempt_id` and `concept_tag`.
- **KSS-DB-023 (Apr 13 2026)**: Created `attempt_section_results` table. Stores per-section aggregate results for a completed attempt. Columns: `id (uuid PK)`, `attempt_id (FK→attempts)`, `section_id (text)`, `section_label (text)`, `correct_count`, `incorrect_count`, `skipped_count`, `marks_scored (numeric 8,2)`, `marks_possible (numeric 8,2)`, `time_spent_seconds (int)`, `accuracy_percent (numeric 5,2)`, `created_at`. UNIQUE `(attempt_id, section_id)`.
- **KSS-DB-024 (Apr 13 2026)**: Created `user_concept_mastery` table. Stores concept-tag mastery aggregated per user per assessment per attempt. Columns: `id (uuid PK)`, `user_id (uuid)`, `assessment_id (text)`, `concept_tag (text)`, `attempt_number (int)`, `correct_count (int)`, `total_count (int)`, `mastery_percent (numeric 5,2)`, `updated_at`. UNIQUE `(user_id, assessment_id, concept_tag, attempt_number)`. Index on `(user_id, assessment_id)`.
- **KSS-DB-025 (Apr 13 2026)**: Created `attempt_ai_insights` table. Stores static demo AI insight text per completed attempt. Columns: `id (uuid PK)`, `attempt_id (FK→attempts UNIQUE)`, `what_went_well (text NOT NULL)`, `next_steps (text NOT NULL)`, `model_used (text DEFAULT 'static_demo')`, `generated_at (timestamptz)`. UNIQUE `(attempt_id)`.
- **KSS-DB-027 (Apr 16 2026)**: Added `status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE'))` to `sources` table. Enables SA to mark a source as Draft (being populated) or Active (ready for use in assessments).
- **KSS-DB-028 (Apr 16 2026)**: Added `deleted_at TIMESTAMPTZ NULL` to both `sources` and `chapters` tables for soft delete. All queries on both tables must filter `WHERE deleted_at IS NULL`. Deleting a source soft-deletes all child chapters in the same operation.
- **KSS-DB-029 (Apr 16 2026)**: Dropped `status` column from `chapters` table
- **KSS-DB-030 (Apr 17 2026)**: Recreated `concept_tags` table (full hierarchy). Replaced KSS-DB-026 display-only version. New columns: `exam_category`, `subject`, `concept_name`, `slug`, `description`. UNIQUE on `(exam_category, subject, concept_name)`. Seeded 144 tags: SAT=45, NEET=43, JEE=33, CLAT=23.
- **KSS-DB-031 (Apr 17 2026)**: Created `question_concept_mappings` table. Links `questions.id → concept_tags.id`. UNIQUE `(question_id, concept_tag_id)`. Soft link — no cascade changes to `questions.concept_tag` text field.
- **KSS-DB-032 (Apr 17 2026)**: Enhanced `user_concept_mastery` with 5 new columns: `module_id (text)`, `stage (text GENERATED STORED)`, `attempt_count (int DEFAULT 1)`, `last_attempt_date (timestamptz)`, `trend (text CHECK IN ('improving','declining','stable'))`. Stage computed from mastery_percent: ≥80=strength, ≥60=developing, ≥40=needs_practice, <40=weak. (`ALTER TABLE chapters DROP COLUMN IF EXISTS status;`). Chapters have no draft/archive concept — they are always live from creation. UI and all queries updated to remove any reference to chapter status.
- **KSS-DB-026 (Apr 14 2026)**: Created `concept_tags` table. SA-controlled concept tag registry for analytics. Columns: `id (uuid PK)`, `name (text NOT NULL)`, `exam_category (text NOT NULL)`, `subject (text nullable)`, `created_by (uuid FK→admin_users nullable)`, `created_at (timestamptz)`. UNIQUE index on `(name, exam_category, COALESCE(subject,''))`. RLS OFF. Soft link to `questions.concept_tag` (no FK constraint — `questions.concept_tag` stays free-text; registry is display-only for SA Marketing Config view).

### attempt_answers (KSS-DB-022, Apr 13 2026)
```
id (uuid PK), attempt_id (FK→attempts ON DELETE CASCADE),
question_id (uuid), section_id (text), user_answer (text),
concept_tag (text), is_correct (bool DEFAULT false),
is_skipped (bool DEFAULT false), marks_awarded (numeric 6,2 DEFAULT 0),
time_spent_seconds (int DEFAULT 0), created_at (timestamptz)
```
- Indexes: attempt_id, concept_tag

### attempt_section_results (KSS-DB-023, Apr 13 2026)
```
id (uuid PK), attempt_id (FK→attempts ON DELETE CASCADE),
section_id (text), section_label (text),
correct_count (int), incorrect_count (int), skipped_count (int),
marks_scored (numeric 8,2), marks_possible (numeric 8,2),
time_spent_seconds (int), accuracy_percent (numeric 5,2), created_at (timestamptz)
UNIQUE (attempt_id, section_id)
```

### user_concept_mastery (KSS-DB-024, Apr 13 2026)
```
id (uuid PK), user_id (uuid NOT NULL), assessment_id (text NOT NULL),
concept_tag (text NOT NULL), attempt_number (int NOT NULL),
correct_count (int DEFAULT 0), total_count (int DEFAULT 0),
mastery_percent (numeric 5,2), updated_at (timestamptz)
UNIQUE (user_id, assessment_id, concept_tag, attempt_number)
```
- Index: (user_id, assessment_id)
- assessment_id stores the UUID as text (matches attempts.assessment_id cast)

### attempt_ai_insights (KSS-DB-025, Apr 13 2026)
```
id (uuid PK), attempt_id (FK→attempts ON DELETE CASCADE UNIQUE),
what_went_well (text NOT NULL), next_steps (text NOT NULL),
model_used (text DEFAULT 'static_demo'), generated_at (timestamptz)
```
- UNIQUE (attempt_id) — one insight row per attempt
- model_used = 'static_demo' for all seeded demo rows; production will use 'claude-sonnet-4-6'

---

## DEMO SEED DATA — ANALYTICS (Apr 13 2026)

All seeding is data-only. No schema changes.

### NEET/JEE/CLAT Analytics (seeded KSS-SA-031)
- `attempts`: 5 demo attempts for premium user `191c894d-b532-4fa8-b1fe-746e5cdcdcc8`
- `attempt_section_results`: section rows for those 5 attempts
- `user_concept_mastery`: concept tag mastery rows for those 5 attempts
- `attempt_ai_insights`: 5 static AI insight rows (model_used='static_demo')

### SAT Analytics (seeded KSS-SA-031 extension, Apr 13 2026)
Premium user: `191c894d-b532-4fa8-b1fe-746e5cdcdcc8`

**Assessments seeded (3 SAT assessments — 2 attempts each = 6 attempt rows):**
- SAT Full Test (full-test, score_max=1600): 2 attempts. Scores: 1150 → 1240. score_rw + score_math columns used.
- SAT Math Subject Test (subject-test, score_max=800): 2 attempts. Scores: 560 → 620.
- SAT R&W Subject Test (subject-test, score_max=800): 2 attempts. Scores: 580 → 630.

**attempt_section_results:** 4 module rows per full-test attempt (rw_module_1, rw_module_2, math_module_1, math_module_2), 4 domain rows per subject-test attempt. Total: 24 rows.

**user_concept_mastery:**
- Math Subject Test: 25 sub-skills × 2 attempts = 50 rows
- R&W Subject Test: 20 sub-skills × 2 attempts = 40 rows
- Full Test: 45 sub-skills × 2 attempts = 90 rows
- Total: 180 rows

**attempt_ai_insights:** 6 rows (one per attempt, model_used='static_demo')

**SATAnalyticsTab component:** `src/components/assessment-detail/SATAnalyticsTab.tsx`
- Client-side domain grouping via `SAT_MATH_DOMAIN_MAP` (25 sub-skills, 4 domains) and `SAT_RW_DOMAIN_MAP` (20 sub-skills, 4 domains)
- Blocks: Score Progression (static), Section Breakdown (filtered), Concept Mastery heatmap (all attempts), Where You Lost Points (mastery < 60%, filtered), AI Insight (filtered)
- Full test: dual heatmap panels (R&W + Math side by side)
- Wired into `/assessments/[id]/page.tsx` — used when `assessment.exam === 'SAT'` and `type === 'full-test' || 'subject-test'`

---

## DEMO SEED DATA — B2C PERSONA USERS (Apr 15 2026)

All data-only. No schema changes. Decisions locked after multi-round Q&A.

### Persona UUIDs
- Free User: `9a3b56a5-31f6-4a58-81fa-66157c68d4f0`
- Basic User: `a0c16137-7fd5-44f5-96e6-60e4617d9230`
- Priya Sharma (Pro): `e150d59c-13c1-4db3-b6d7-4f30c29178e9`
- Premium User: `191c894d-b532-4fa8-b1fe-746e5cdcdcc8`

### Attempt rules (platform-wide)
- `max_attempts_per_assessment = 6` (1 free + 5 paid)
- `attempt_number=1, is_free_attempt=true` = free attempt
- `attempt_number=2–6, is_free_attempt=false` = paid attempts

### Free User
- SAT Full Test 1: 1 attempt (is_free_attempt=true, COMPLETED) → **State 2** (free attempt used, upgrade CTA)
- All other assessments: **State 1** (no attempt row)

### Basic User (selected_exams: ['SAT','JEE'])
- Full tests only — no subject tests, no chapter tests shown as active
- SAT Full Test 1: 3 attempts (1 free + 2 paid)
- SAT Full Test 2: 3 attempts (1 free + 2 paid)
- JEE Full Test 1: 2 attempts (1 free + 1 paid)
- Analytics on attempt_number=1 only: section_results + concept_mastery copied from Premium User
  - SAT Full Test 2 analytics copied from SAT Full Test 1 data (Premium had no FT2 analytics)
  - JEE Full Test 1: bare attempt rows (Premium had no JEE FT1 analytics)
- NO ai_insights on any Basic User attempt → "Upgrade Now" CTA shows in analytics tab
- `isAiEligible = false` for basic tier → confirmed by AnalyticsTab

### Priya Sharma (Pro, selected_exams: ['SAT','NEET'])
- 6 clean attempts (1 free + 5 paid) per: SAT Full Test 1, SAT Full Test 2, SAT Math, SAT R&W, NEET Full Test 1, NEET Physics, NEET Biology, NEET Chemistry
- No chapter tests (min_tier='premium', Priya is professional)
- No analytics on any Priya attempt (bare rows)

### Premium User (selected_exams: ['SAT','JEE','NEET','CLAT'])
- Full tests + subject tests: remain as-is (untouched except is_free_attempt fix)
- is_free_attempt=true set on ALL attempt_number=1 rows (was false — fixed Apr 15 2026)
- Chapter tests: 2 attempts each (attempt_number 1 free + 2 paid) for all 9 chapter tests
  - 7 non-SAT chapters: attempt_answers + section_results + concept_mastery repurposed from Priya
  - SAT Craft & Structure: section_results + concept_mastery from Priya (no attempt_answers)
  - SAT Information & Ideas: bare analytics (Priya had none)
- ai_insights seeded for all 18 chapter test attempts (model_used='static_demo')

### Premium User chapter test attempt IDs (seeded Apr 15 2026)
| Assessment | #1 attempt_id (free) | #2 attempt_id (paid) |
|---|---|---|
| CLAT — Legal Reasoning | `94f280d1-da48-4092-8e83-5a90922aa837` | `b12511e0-832c-4cd7-9009-7c40c82de7e6` |
| CLAT — Logical Reasoning | `3da307a9-1926-4135-b6eb-3f1071f109e5` | `0b28bdf9-98c0-4b2c-a16b-897154bf6a6f` |
| Craft & Structure (SAT) | `bb44ceda-8c67-4e5c-8177-3fbb82c115c7` | `8381bd1d-f8cd-4828-8c1e-d043d8714686` |
| Information & Ideas (SAT) | `f6d9bc14-1668-4042-a50b-3a0d42ca78ed` | `493c2605-93ca-4350-a9dc-16caf69f3318` |
| JEE — Calculus | `ea2a2da1-ee20-4c0f-83e2-190230d4d48a` | `8f5d173e-00e1-413a-892c-8c069afdca5f` |
| NEET — Electrochemistry | `125a4567-b7e3-4d8f-abba-3f9a9173155c` | `b7d99fa8-5920-4ba8-8b86-ca2a9e272b2c` |
| NEET — Genetics | `ef8f3d82-b4b2-4182-961c-13cdf65c5a2c` | `5a116bb5-d04d-43ff-b5fc-85d427c73447` |
| NEET — Mechanics | `242f4274-365c-40b5-8608-179aded27787` | `936aa0a1-95a5-40ee-b0d3-c870305adad8` |
| NEET — Thermodynamics | `0ca71190-87c3-4486-9415-56fff80449d8` | `6182d6ed-17b2-4d43-b731-9cc2d8aa069e` |

### Chapter tests — min_tier
- All 9 chapter tests: `min_tier = 'premium'`
- 2 SAT chapter tests (Craft & Structure, Information & Ideas) already were 'premium'
- 7 others updated Apr 15 2026: NEET Mechanics, Thermodynamics, Electrochemistry, Genetics; JEE Calculus; CLAT Legal Reasoning, Logical Reasoning

---

## DEFERRED SCHEMA CHANGES (do not attempt without KSS-DB-XXX authorisation)

- **DB-TODO-002**: `MAINTENANCE` status as first-class state in `assessment_items` + `courses`.
  Badge: `orange-50/orange-700`. Learners cannot access MAINTENANCE content.

---

## licensed_categories — METADATA ONLY
Informational on `tenants` + `contracts`. Never use to gate content. Access control via Plans only.