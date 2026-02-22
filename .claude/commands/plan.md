# /plan — Plan Mode Entry

You are entering Plan Mode for keySkillset.

## Your job

Read and understand before proposing anything.

Step 1: Read CLAUDE.md fully
Step 2: Read agent_docs/architecture.md
Step 3: Read agent_docs/domain-rules.md
Step 4: Read the relevant source files for the task the user has described
Step 5: Identify which components already exist in src/components/ that can be reused

## Then produce a plan with:

- What you will build or change (file by file)
- What you will NOT touch
- Which existing components you will reuse
- Which new components you need to create
- Any assumptions you are making
- Any risks or open questions

## Rules

- Write ZERO code in this step
- Do not suggest solutions until the plan is approved
- If the task is ambiguous, ask one clarifying question
- If the task touches subscription/tier logic, re-read domain-rules.md before planning

Wait for explicit approval before writing any code.
