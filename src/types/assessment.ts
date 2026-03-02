import type { Tier } from '@/types';

export interface SupabaseAssessment {
  id: string;
  title: string;
  description: string;
  exam_type: string;
  assessment_type: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  duration_minutes: number;
  total_questions: number;
  score_min: number;
  score_max: number;
  min_tier: 'basic' | 'professional' | 'premium';
  is_active: boolean;
  thumbnail_url: string | null;
  tags: string[];
  created_at: string;
}

export type ExamType = 'SAT' | 'IIT-JEE' | 'NEET' | 'CLAT' | 'PMP';
export type SupabaseAssessmentType = 'full_test' | 'subject_test' | 'chapter_test';
export type SupabaseDifficulty = 'Easy' | 'Medium' | 'Hard';

export const TIER_ORDER: Record<Tier, number> = {
  free: 0,
  basic: 1,
  professional: 2,
  premium: 3,
};

export function tierAllows(userTier: Tier, minTier: string): boolean {
  return TIER_ORDER[userTier] >= TIER_ORDER[minTier as Tier];
}

export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}
