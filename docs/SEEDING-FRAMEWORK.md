# SEEDING FRAMEWORK — keySkillset Platform
# Created Apr 17 2026. Reference this before any seed operation.
# Always run seeds in order: CONCEPT TAGS → SOURCES → CHAPTERS → QUESTIONS → ASSESSMENTS → ATTEMPTS

---

## RULES

1. All seed SQL must be run in Supabase SQL editor. Results logged to `docs/SQL-RESPONSE.txt`.
2. Always use `ON CONFLICT ... DO NOTHING` for idempotent seeds.
3. Never hardcode UUIDs for new seeds — use `gen_random_uuid()` or reference by name lookup.
4. Seeded data for demo users must use the locked persona UUIDs from CLAUDE-DB.md.
5. After seeding, verify with a `SELECT COUNT(*)` query and log result.
6. Concept tags are immutable seed data — do not re-seed unless replacing all.

---

## TIER 1: CONCEPT TAGS (prerequisite for all questions)

Status: **DONE Apr 17 2026** — 144 tags in `concept_tags` table

| Exam | Subject Count | Tag Count | Status |
|------|---------------|-----------|--------|
| SAT | 8 (4 R&W + 4 Math) | 45 | DONE |
| NEET | 3 (Physics, Chemistry, Biology) | 43 | DONE |
| JEE | 3 (Math, Physics, Chemistry) | 33 | DONE |
| CLAT | 5 (English, Legal, Logical, Quant, GK) | 23 | DONE |
| **Total** | | **144** | |

Verification query:
```sql
SELECT exam_category, subject, COUNT(*) as tag_count
FROM concept_tags
GROUP BY exam_category, subject
ORDER BY exam_category, subject;
```

---

## TIER 2: SOURCES (prerequisite for chapters and questions)

Status: **PARTIAL** — SAT done (QS-002); NEET/JEE/CLAT pending

| Exam | Sources | Status |
|------|---------|--------|
| SAT | 8 sources (4 R&W domains + 4 Math domains) | **DONE Apr 17 2026** — UUIDs `a1000001-0000-0000-0000-000000000001` through `...000000000008` |
| NEET | 3 sources (Physics, Chemistry, Biology) | PENDING |
| JEE | 3 sources (Math, Physics, Chemistry) | PENDING |
| CLAT | 5 sources (English, Legal, Logical, Quant, GK) | PENDING |

### SAT Sources
```sql
INSERT INTO sources (id, name, description, exam_category_id, difficulty, target_exam, status, created_by) VALUES
-- SAT R&W
(gen_random_uuid(), 'SAT R&W — Craft and Structure', 'Official SAT R&W Module questions on Craft and Structure', <sat_exam_category_id>, 'medium', 'SAT 2024', 'ACTIVE', '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'),
(gen_random_uuid(), 'SAT R&W — Information and Ideas', '...', <sat_exam_category_id>, 'medium', 'SAT 2024', 'ACTIVE', '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'),
(gen_random_uuid(), 'SAT R&W — Standard English Conventions', '...', <sat_exam_category_id>, 'medium', 'SAT 2024', 'ACTIVE', '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'),
(gen_random_uuid(), 'SAT R&W — Expression of Ideas', '...', <sat_exam_category_id>, 'medium', 'SAT 2024', 'ACTIVE', '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'),
-- SAT Math
(gen_random_uuid(), 'SAT Math — Algebra', '...', <sat_exam_category_id>, 'medium', 'SAT 2024', 'ACTIVE', '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'),
(gen_random_uuid(), 'SAT Math — Advanced Math', '...', <sat_exam_category_id>, 'medium', 'SAT 2024', 'ACTIVE', '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'),
(gen_random_uuid(), 'SAT Math — Problem Solving and Data Analysis', '...', <sat_exam_category_id>, 'medium', 'SAT 2024', 'ACTIVE', '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a'),
(gen_random_uuid(), 'SAT Math — Geometry and Trigonometry', '...', <sat_exam_category_id>, 'medium', 'SAT 2024', 'ACTIVE', '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a');
```

### NEET Sources
- NEET Physics (3 chapters: Mechanics, Thermodynamics, Modern Physics)
- NEET Chemistry (3 chapters: Organic, Inorganic, Physical)
- NEET Biology (3 chapters: Botany, Zoology, Genetics)

### JEE Sources
- JEE Mathematics (3 chapters: Calculus, Algebra, Coordinate Geometry)
- JEE Physics (3 chapters: Mechanics, Electromagnetism, Optics)
- JEE Chemistry (3 chapters: Organic, Inorganic, Physical)

### CLAT Sources
- CLAT English Language
- CLAT Legal Reasoning
- CLAT Logical Reasoning
- CLAT Quantitative Techniques
- CLAT Current Affairs and GK

---

## TIER 3: CHAPTERS (prerequisite for questions)

Status: **PARTIAL** — SAT done; NEET/JEE/CLAT pending

| Exam | Chapters | Status |
|------|---------|--------|
| SAT | 16 chapters (2 per source — Module 1 + Module 2) | **DONE Apr 17 2026** — UUIDs `b1000001-0000-0000-0000-000000000001` through `...000000000016` |
| NEET | ~9 chapters | PENDING |
| JEE | ~9 chapters | PENDING |
| CLAT | ~15 chapters | PENDING |

Each source maps to 3–5 chapters. Chapter structure follows subject syllabi.

```sql
-- Template
INSERT INTO chapters (id, source_id, name, difficulty, order_index, created_by)
VALUES (gen_random_uuid(), '<source_id>', 'Chapter Name', 'medium', 1, '3bd6101b-1fb9-4c96-a9a5-c958a3deb54a');
```

---

## TIER 4: QUESTIONS (prerequisite for assessments)

Status: **PENDING** (QS-001)

### Question Seeding Rules
- All questions must have: `question_text` (Tiptap JSONB), `concept_tag` (text from concept_tags.concept_name), `marks`, `explanation`
- MCQ_SINGLE: `correct_answer = ["A"]` — always JSONB array
- NUMERIC: `acceptable_answers = ["9", "9.0"]` — allow rounding variants
- question_text must be a Tiptap doc: `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Question text here"}]}]}`
- status: ALWAYS 'ACTIVE' on create
- DEMO_SA_ID for created_by: `3bd6101b-1fb9-4c96-a9a5-c958a3deb54a`

### SAT Question Plan (Practice Test #4 — 120 Questions)

Status: **DONE Apr 17 2026** — 120 questions seeded across 4 modules

Question UUID scheme:
- R&W M1: `0a001001-0001-0001-0001-{seq 12 hex, 000000000001–000000000033}`
- R&W M2: `0a001002-0001-0001-0001-{seq}`
- Math M1: `0a001003-0001-0001-0001-{seq, 000000000001–000000000027}`
- Math M2: `0a001004-0001-0001-0001-{seq}`
- R&W Module 1: 33 questions → subjects: Craft and Structure, Information and Ideas, Standard English Conventions, Expression of Ideas
- R&W Module 2: 33 questions → same subjects
- Math Module 1: 27 questions → subjects: Algebra, Advanced Math, Problem Solving, Geometry
- Math Module 2: 27 questions → same subjects

Correct answers (from scoring PDF):
- R&W M1: B,A,A,C,A,B,D,B,B,D,C,D,A,B,C,A,A,A,A,D,D,D,B,C,B,A,C,D,A,A,D,D,C
- R&W M2: D,D,B,B,B,B,A,C,C,A,A,B,D,C,C,A,B,D,C,A,B,D,D,A,B,B,A,A,C,C,A,A,B
- Math M1: B,A,B,D,A,[9],[10],A,B,D,A,C,[1/5],80,D,B,B,A,C,100,[361/8],B,D,C,C,D,5
- Math M2: B,B,C,A,A,[15/-5],[50],B,D,A,A,B,[.3],[2],A,C,B,D,A,[15/17],[51],A,C,C,D,B,[600]
- Note: [...] = NUMERIC type questions

### NEET Question Plan (180 Questions)
- Physics: 45 questions (15 sections, 3 each)
- Chemistry: 45 questions
- Biology: 90 questions (Botany 45, Zoology 45)

### CLAT Question Plan (~140 Questions)
- English Language: 28 questions (passage-based)
- Current Affairs & GK: 28 questions
- Legal Reasoning: 28 questions
- Logical Reasoning: 28 questions
- Quantitative Techniques: 28 questions

### JEE Question Plan (90 Questions)
- Physics: 30 questions
- Chemistry: 30 questions
- Mathematics: 30 questions

---

## TIER 5: ASSESSMENT QUESTION MAPPINGS (prerequisite for attempts)

Status: **PARTIAL** — SAT done; NEET/JEE/CLAT/SAT FT2 pending

| Assessment | Questions | Status |
|---|---|---|
| SAT Full Test 1 (`76b43c99-88c0-4165-a042-40396c8ff129`) | 120Q (all 4 modules) | **DONE Apr 17 2026** |
| SAT R&W Subject Test (`f8976222-386b-4f42-ae6b-e132ec3231c9`) | 66Q (rw_module_1 + rw_module_2) | **DONE Apr 17 2026** |
| SAT Math Subject Test (`6f936fc2-21e1-49b3-8727-09404a7919c4`) | 54Q (math_module_1 + math_module_2) | **DONE Apr 17 2026** |
| SAT Full Test 2 (`476083b3-0b9a-4e9e-b550-b02367e6b49b`) | — | PENDING (no unique questions seeded) |
| NEET Full Test | — | PENDING (QS-001b) |
| CLAT Full Test | — | PENDING (QS-001c) |
| JEE Full Test | — | PENDING (QS-001d) |

After questions are seeded, link them to assessments:

```sql
-- Template: Link question to assessment
INSERT INTO assessment_question_map (assessment_id, question_id, section_name, order_index)
VALUES (
  '<assessment_uuid>',  -- from assessments table
  '<question_uuid>',
  'Reading and Writing',  -- must match section in assessment_config.sections[]
  1
);
```

### Assessment → Section Mapping

| Assessment | Sections | Questions |
|---|---|---|
| SAT Full Test | rw_module_1, rw_module_2, math_module_1, math_module_2 | 33+33+27+27 = 120 |
| SAT R&W Subject Test | rw_module_1, rw_module_2 | 33+33 = 66 |
| SAT Math Subject Test | math_module_1, math_module_2 | 27+27 = 54 |
| NEET Full Test | physics, chemistry, biology | 45+45+90 = 180 |
| CLAT Full Test | english, current-affairs, legal, logical, quant | 28×5 = 140 |
| JEE Full Test | physics, chemistry, mathematics | 30+30+30 = 90 |

---

## TIER 6: ATTEMPTS + ANALYTICS (demo data)

Status: **PARTIAL** (ANA-001 to ANA-009 — demo data seeded Apr 13–15 2026)

### Demo Users (locked UUIDs from CLAUDE-DB.md)
- Free User: `9a3b56a5-31f6-4a58-81fa-66157c68d4f0`
- Basic User: `a0c16137-7fd5-44f5-96e6-60e4617d9230`
- Pro (Priya): `e150d59c-13c1-4db3-b6d7-4f30c29178e9`
- Premium: `191c894d-b532-4fa8-b1fe-746e5cdcdcc8`

### Attempt Seeding Rules
- `max_attempts_per_assessment = 6` (1 free + 5 paid)
- `attempt_number=1, is_free_attempt=true`
- `attempt_number=2–6, is_free_attempt=false`
- `passed = true/false` for chapter/subject tests (≥60% threshold), `null` for full tests

### attempt_answers Seeding Rules (per question)
```sql
INSERT INTO attempt_answers (attempt_id, question_id, section_id, user_answer, concept_tag, is_correct, is_skipped, marks_awarded, time_spent_seconds)
VALUES (...)
```
- concept_tag must match `questions.concept_tag` value
- marks_awarded: correct → question.marks, incorrect → question.negative_marks (negative), skipped → 0

### user_concept_mastery Seeding Rules (per concept per attempt)
```sql
INSERT INTO user_concept_mastery (user_id, assessment_id, concept_tag, attempt_number, correct_count, total_count, mastery_percent, module_id, attempt_count, last_attempt_date, trend)
VALUES (...)
```
- mastery_percent = (correct_count / total_count) * 100
- stage is auto-computed (GENERATED STORED column — do not insert it)
- trend = 'improving' if mastery_percent > previous attempt, 'declining' if lower, 'stable' otherwise

---

## CONCEPT TAG → QUESTION MAPPING RULES

After questions are seeded with `concept_tag` text, sync to `question_concept_mappings`:

```sql
INSERT INTO question_concept_mappings (question_id, concept_tag_id)
SELECT q.id, ct.id
FROM questions q
JOIN concept_tags ct ON ct.concept_name = q.concept_tag AND ct.exam_category = <exam>
WHERE q.concept_tag IS NOT NULL
ON CONFLICT (question_id, concept_tag_id) DO NOTHING;
```

---

## SAT SCORING REFERENCE (for exam engine — todo ANA-008)

Calculation:
1. Count correct answers per module (no negative marking on SAT)
2. rw_raw = rw_m1_correct + rw_m2_correct (max 66)
3. math_raw = math_m1_correct + math_m2_correct (max 54)
4. Lookup rw_raw and math_raw in conversion table → { lower, upper } per section
5. total_score_range = { lower: rw_lower + math_lower, upper: rw_upper + math_upper }

Full conversion table in CLAUDE-DB.md (§ SAT SCORING).
