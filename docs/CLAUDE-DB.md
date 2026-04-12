# CLAUDE-DB.md — Database Rules & Schema Reference
# Imported by CLAUDE.md. Read this before any DB query, schema change, or data model work.

---

## ABSOLUTE DB RULES

- RLS OFF on ALL tables — permanently. Never add RLS. No exceptions.
- Never modify schema without `KSS-DB-XXX` authorisation confirmed in Claude.ai project chat
- Schema changes via `execute_sql` ONLY (project_id: uqweguyeaqkbxgtpkhez)
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

### sources (Assessment Creation — KSS-DB-010, Apr 11 2026)
```
id, name, description, exam_category_id (FK→exam_categories),
difficulty ('easy'|'medium'|'hard'|'mixed' DEFAULT 'mixed'),
target_exam (text optional), created_by (FK→admin_users),
last_modified_by (FK→admin_users), created_at, updated_at
```

### chapters (Assessment Creation — KSS-DB-011, Apr 11 2026; KSS-DB-015 Apr 11 2026)
```
id, source_id (FK→sources ON DELETE CASCADE), name,
description (text nullable — KSS-DB-015),
order_index (int DEFAULT 0 — KSS-DB-015, controls display order within source),
difficulty ('easy'|'medium'|'hard'|'mixed' DEFAULT 'medium'),
status ('DRAFT'|'ACTIVE' DEFAULT 'DRAFT'),
created_by (FK→admin_users), last_modified_by (FK→admin_users),
created_at, updated_at
```

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
- 9 courses: 1 B2C ARCHIVED (HIPAA — `425b71f4`, purchasable, $12.99), 7 B2B LIVE, 1 INACTIVE (CLAT)
- `is_individually_purchasable` managed ONLY via SINGLE_COURSE_PLAN plan lifecycle — no manual toggle
- On SINGLE_COURSE_PLAN PUBLISHED: sync `price + price_usd + stripe_price_id` to course + set `purchasable=true`
- On SINGLE_COURSE_PLAN ARCHIVED: set `is_individually_purchasable=false` (prices kept)

### plans
```
plan_type, tier (BASIC|PRO|PREMIUM|ENTERPRISE|FREE|null), plan_audience ('B2C'|'B2B'),
plan_category ('ASSESSMENT'|'COURSE_BUNDLE'|'SINGLE_COURSE_PLAN' DEFAULT 'ASSESSMENT'),
scope ('PLATFORM_WIDE'|'CATEGORY_BUNDLE'), price (INR DEFAULT 0),
price_usd (numeric), status (DRAFT|PUBLISHED|ARCHIVED),
display_name, tagline, feature_bullets (jsonb DEFAULT '[]'), footnote,
is_popular (boolean DEFAULT false), cta_label, max_attempts_per_assessment,
is_free (boolean DEFAULT false)
```
- B2B plans: `price=0` always, `scope=PLATFORM_WIDE` always
- B2B plans have NO: `display_name`, `tagline`, `feature_bullets`, `is_popular`, `cta_label`
- B2C Assessment tiers: `BASIC/PRO/PREMIUM`. B2B tier: `ENTERPRISE`. Tiers are ASSESSMENT-only.
- SINGLE_COURSE_PLAN tier: `FREE` when `is_free=true`, `NULL` when paid. Never use BASIC/PRO/PREMIUM for course plans.
- `is_free=true` → `price=0`, `price_usd=0`, `stripe_price_id=NULL`, `tier='FREE'`
- `is_free=false` (paid SINGLE_COURSE_PLAN) → `tier=NULL`
- One active (DRAFT or PUBLISHED) SINGLE_COURSE_PLAN per course enforced at UI level (KSS-SA-026)
- `max_attempts_per_assessment = 6` platform-wide (1 free + 5 paid) — never hardcode 5
- 9 plans: 6 B2C + 3 B2B (all `PLATFORM_WIDE/PUBLISHED`)

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

## DEFERRED SCHEMA CHANGES (do not attempt without KSS-DB-XXX authorisation)

- **DB-TODO-002**: `MAINTENANCE` status as first-class state in `assessment_items` + `courses`.
  Badge: `orange-50/orange-700`. Learners cannot access MAINTENANCE content.

---

## licensed_categories — METADATA ONLY
Informational on `tenants` + `contracts`. Never use to gate content. Access control via Plans only.