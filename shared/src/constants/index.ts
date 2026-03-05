/**
 * Shared Constants
 * Application-wide constants used across packages
 */

// ===== Status Constants =====
export const TEST_CASE_STATUS = {
  DRAFT: 'draft',
  READY: 'ready',
  IN_PROGRESS: 'in-progress',
  PASSED: 'passed',
  FAILED: 'failed',
  BLOCKED: 'blocked',
  DEPRECATED: 'deprecated',
} as const;

export const BUG_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  REOPENED: 'reopened',
  ON_HOLD: 'on-hold',
} as const;

export const EXECUTION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  PASSED: 'passed',
  FAILED: 'failed',
  BLOCKED: 'blocked',
  SKIPPED: 'skipped',
} as const;

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  PLANNING: 'planning',
} as const;

// ===== Priority Constants =====
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// ===== Severity Constants (for Bugs) =====
export const BUG_SEVERITY = {
  MINOR: 'minor',
  MAJOR: 'major',
  CRITICAL: 'critical',
  BLOCKER: 'blocker',
} as const;

// ===== Role Constants =====
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TESTER: 'tester',
  DEVELOPER: 'developer',
} as const;

// ===== Error Codes =====
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ===== API Constants =====
export const API_LIMITS = {
  PAGINATION_DEFAULT: 20,
  PAGINATION_MAX: 100,
  SEARCH_MIN_LENGTH: 2,
  BULK_OPERATION_MAX: 100,
} as const;

export const API_TIMEOUTS = {
  REQUEST_TIMEOUT: 30000,
  LONG_OPERATION_TIMEOUT: 60000,
  UPLOAD_TIMEOUT: 300000,
} as const;

// ===== Validation Rules =====
export const VALIDATION = {
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL_PATTERN: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  MIN_PASSWORD_LENGTH: 8,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 500,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 5000,
} as const;

// ===== Entity ID Prefixes =====
export const ENTITY_PREFIXES = {
  TEST_CASE: 'TC',
  BUG: 'BG',
  EXECUTION: 'EX',
  PROJECT: 'PRJ',
} as const;

// ===== Default Values =====
export const DEFAULTS = {
  PAGE_NUMBER: 1,
  PAGE_SIZE: 20,
  SORT_ORDER: 'desc' as const,
  CACHE_TTL: 300, // 5 minutes in seconds
  SESSION_TIMEOUT: 3600000, // 1 hour in milliseconds
} as const;
