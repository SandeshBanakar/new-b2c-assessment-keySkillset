# PRD — AI Insights Upgrade Prompt for Basic/Free Users
# Status: UPDATED — Apr 15 2026 (originally IMPLEMENTED Apr 14 2026)
# Owner: keySkillset Product
# Ticket: KSS-SA-034 (AI Insights Upgrade UX)
# Confluence: https://keyskillset-product-management.atlassian.net/wiki/x/CgBEBw
# Release: Release 33 — Phase 1

---

## 1. Purpose

Previously, basic and free users were completely blocked from seeing the AI Insights section in analytics. This created a poor user experience where users might not even know about the premium feature.

This PRD specifies a new approach: show the AI Insights section to all users, but display an upgrade prompt for basic/free users instead of actual AI insights. This creates awareness of the premium feature while maintaining a consistent UI experience.

## 2. Problem Statement

**Before:** Basic/free users saw no AI Insights section at all, creating:
- Poor discoverability of premium features
- Inconsistent UI experience across user tiers
- Missed opportunity for conversion

**After:** All users see the AI Insights section, but:
- Premium/Pro users get actual AI insights
- Basic/Free users get an upgrade prompt with clear value proposition and CTA

## 3. Solution Overview

### 3.1 User Experience

**For Premium/Pro Users:**
- See actual AI insights as before
- "Powered by Claude" branding visible
- Attempt number shown in header

**For Basic/Free Users:**
- See the same AI Insights section structure
- "What went well" box shows encouraging message
- "Next Steps" box shows upgrade prompt with CTA button
- No "Powered by Claude" branding

### 3.2 Technical Implementation

- Always render the AI Insights section container
- Conditionally render content based on `isAiEligible` flag
- `isAiEligible = user?.subscriptionTier === 'professional' || user?.subscriptionTier === 'premium'`
- CTA button navigates to `/plans` page

## 4. Design Specifications

### 4.1 Visual Design

**Container:**
- Same as existing AI Insights section
- White background with shadow
- Lightbulb icon + "AI Insight" header

**For Eligible Users:**
- Header shows "Powered by Claude" badge
- Two content boxes: emerald (What went well) and blue (Next Steps)

**For Non-Eligible Users:**
- No "Powered by Claude" badge
- "What went well" box: emerald styling with encouraging message
- "Next Steps" box: blue styling with upgrade prompt + CTA button

### 4.2 Content

**What went well (Non-eligible users):**
```
We are thrilled to say that you are doing well but to get AI insights, you may need to upgrade your plan.
```

**Next Steps (Non-eligible users):**
```
Unlock personalized AI insights to accelerate your learning journey.
[Upgrade Now Button]
```

**CTA Button:**
- Blue background (`bg-blue-600`)
- White text
- Hover state (`hover:bg-blue-700`)
- Navigates to `/plans`

## 5. Implementation Details

### 5.1 Files Modified

- `src/components/assessment-detail/AnalyticsTab.tsx`
- `src/components/assessment-detail/SATAnalyticsTab.tsx`

### 5.2 Code Changes

**Added eligibility check:**
```typescript
const isAiEligible =
  user?.subscriptionTier === 'professional' ||
  user?.subscriptionTier === 'premium';
```

**Updated AI Insights section:**
- Always render container
- Conditionally render content based on `isAiEligible`
- Show upgrade prompt for non-eligible users

### 5.3 Testing

- Verify premium/pro users see actual AI insights
- Verify basic/free users see upgrade prompt
- Verify CTA button navigates to `/plans`
- Verify styling matches existing design system

## 6. Business Impact

### 6.1 Conversion Opportunity

- Increases awareness of AI insights feature
- Provides clear upgrade path for interested users
- Maintains consistent user experience across tiers

### 6.2 User Experience

- No more "missing" sections for basic/free users
- Clear value proposition for premium features
- Encouraging messaging maintains positive user sentiment

## 7. Success Metrics

- Click-through rate on "Upgrade Now" button
- Conversion rate from basic/free to paid plans
- User feedback on upgrade prompt clarity
- No increase in support tickets about "missing" features

## 8. Rollback Plan

If issues arise:
- Revert to previous behavior (hide section for non-eligible users)
- Monitor user feedback and analytics
- Consider alternative upgrade prompt designs

---

## 9. Implementation Status

✅ **COMPLETED — Apr 14 2026**
- AnalyticsTab.tsx updated
- SATAnalyticsTab.tsx updated
- Build validated
- Ready for deployment

---

## 10. Demo Data Alignment — Apr 15 2026 Update

### 10.1 isAiEligible Gate Behaviour Per Persona

The `isAiEligible` flag (`subscriptionTier === 'professional' || 'premium'`) is the sole mechanism controlling AI Insights visibility. This section records the confirmed demo data decisions for each persona.

| Persona | Tier | isAiEligible | AI Insights Shown |
|---------|------|-------------|-------------------|
| Free User | free | false | Upgrade prompt always |
| Basic User | basic | false | Upgrade prompt always |
| Priya Sharma | professional | true | Real AI insights (where seeded) |
| Premium User | premium | true | Real AI insights (where seeded) |

### 10.2 Basic User — No ai_insights Seeded (By Design)

Basic User has no rows in `attempt_ai_insights`. This is intentional — Basic User always hits the `isAiEligible = false` gate and sees the upgrade prompt. Seeding ai_insights for Basic User would be unreachable data and was deliberately omitted.

### 10.3 Free User — SAT Full Test 1 Hits the Gate

Free User has 1 completed attempt on SAT Full Test 1 (`attempt_number=1, is_free_attempt=true, status=COMPLETED`). When the Free User views the analysis for this attempt, `isAiEligible = false` — they will see the upgrade prompt, not AI insights. No ai_insights rows are seeded for Free User.

### 10.4 No Schema Changes

This update documents demo data seeding decisions only. No changes were made to the `isAiEligible` logic, `AnalyticsTab.tsx`, or `SATAnalyticsTab.tsx`.