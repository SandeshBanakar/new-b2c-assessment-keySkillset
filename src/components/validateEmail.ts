/**
 * Validates an email address format (E1 — basic structural check).
 * Returns an error string if invalid, null if valid or empty.
 * Empty values return null — required-field checks are the caller's responsibility.
 */
export function validateEmail(email: string): string | null {
  if (!email.trim()) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? null
    : 'Enter a valid email address.'
}
