# /review — Review Changes Before Committing

## Your job

Review all uncommitted changes in this session 
before a git commit is made.

## Checklist

### Correctness
- [ ] Does the code do what the plan said it would?
- [ ] Are there any edge cases unhandled?
- [ ] Does subscription tier access logic work correctly? (Free / Basic / Professional / Premium)

### Code quality
- [ ] No inline styles except dynamic values
- [ ] No icons from libraries other than lucide-react
- [ ] No shadcn/ui component files directly modified
- [ ] 'use client' present where needed
- [ ] No hardcoded user data in production components
- [ ] TypeScript types defined, no implicit 'any'

### Build check
- [ ] npm run build passes
- [ ] npm run lint passes

## Output format

List: what looks good
List: what needs fixing before commit
Recommendation: commit / fix first
