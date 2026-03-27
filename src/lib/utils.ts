import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const COURSE_TYPE_LABELS: Record<string, string> = {
  VIDEO:            'Video',
  DOCUMENT:         'Document',
  CLICK_BASED:      'Click Based',
  CODING_SANDBOX:   'Simulation',
  COMBINATION:      'Combination',
  KEYBOARD_TRAINER: 'Keyboard Based',
}

/** Returns a human-readable label for a course_type value, or null if unknown/missing. */
export function formatCourseType(raw: string | null | undefined): string | null {
  if (!raw) return null
  return COURSE_TYPE_LABELS[raw.toUpperCase()] ?? null
}
