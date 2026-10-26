// Configuration for Academic Verification on CollabX

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical & Electronic Engineering',
  'Business Administration',
  'English',
  'Law',
  'Civil Engineering',
  'Pharmacy',
  'Other'
] as const;

export type Department = typeof DEPARTMENTS[number];

/**
 * Accepted student ID patterns:
 * Format must be allowed ONLY capital letters with numbers without spacing (e.g. CSE02807185)
 */
export const STUDENT_ID_PATTERNS: RegExp[] = [
  /^[A-Z0-9]{3,25}$/
];

export const DEFAULT_DEPARTMENT = 'Computer Science & Engineering';

export const INSTITUTION_NAME = 'Port City International University';

/**
 * Normalizes an institutional ID before checking or saving:
 * trims, converts to uppercase, and removes all whitespace.
 */
export function normalizeInstitutionalId(id: string): string {
  return id.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Validates a student ID:
 * Format is strictly allowed only capital letters with numbers without spacing (e.g. CSE02807185).
 * - No spaces allowed.
 * - Only capital letters (A-Z) and numbers (0-9).
 * - Must contain numbers and be at least 3 characters.
 */
export function isValidStudentId(id: string): boolean {
  if (!id) return false;
  const trimmed = id.trim();
  if (/\s/.test(trimmed)) return false;
  return /^[A-Z0-9]{3,25}$/.test(trimmed) && /\d/.test(trimmed);
}

/**
 * Validates a staff/researcher or faculty/supervisor ID:
 * Only capital letters with numbers without spacing (minimum 3 characters)
 */
export function isValidStaffOrFacultyId(id: string): boolean {
  if (!id) return false;
  const trimmed = id.trim();
  if (/\s/.test(trimmed)) return false;
  return /^[A-Z0-9]{3,25}$/.test(trimmed);
}
