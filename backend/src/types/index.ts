/**
 * Type Definitions for TestTrack Pro
 * Central place for all TypeScript types and interfaces
 */

// ============================================================
// USER TYPES
// ============================================================

export interface User {
  id: number;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role: 'tester' | 'developer' | 'admin';
  email_verified: boolean;
  email_verified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AuthUser {
  id: number;
  email: string;
  role: 'tester' | 'developer' | 'admin';
}

// ============================================================
// PROJECT TYPES
// ============================================================

export interface Project {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================
// TEST CASE TYPES
// ============================================================

export type TestCaseStatus = 'draft' | 'ready' | 'approved' | 'deprecated';
export type TestCasePriority = 'critical' | 'high' | 'medium' | 'low';

export interface TestStep {
  id: number;
  testcase_id: string;
  step_number: number;
  action: string;
  test_data?: string;
  expected_result: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface TestCase {
  id: string;
  project_id: number;
  title: string;
  description?: string;
  priority: TestCasePriority;
  status: TestCaseStatus;
  test_steps?: TestStep[];
  created_by: number;
  created_at: Date;
  updated_by?: number;
  updated_at?: Date;
  deleted_at?: Date | null;
  version: number;
}

export interface TestCaseWithStats extends TestCase {
  execution_count: number;
  pass_count: number;
  fail_count: number;
  pass_rate: number;
}

export interface CreateTestCaseInput {
  title: string;
  description?: string;
  projectId: number;
  priority?: TestCasePriority;
}

export interface UpdateTestCaseInput {
  title?: string;
  description?: string;
  priority?: TestCasePriority;
  status?: TestCaseStatus;
  [key: string]: any;
}

// ============================================================
// BUG TYPES
// ============================================================

export type BugStatus = 'open' | 'progress' | 'fixed' | 'verified' | 'closed' | 'reopened' | 'duplicate';
export type BugPriority = 'P1-Urgent' | 'P2-High' | 'P3-Medium' | 'P4-Low';
export type BugSeverity = 'Blocker' | 'Critical' | 'Major' | 'Minor' | 'Trivial';

export interface Bug {
  id: number;
  bug_id: string;
  title: string;
  description: string;
  severity: BugSeverity;
  priority: BugPriority;
  status: BugStatus;
  assigned_to?: number;
  project_id: number;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface CreateBugInput {
  title: string;
  description: string;
  severity: BugSeverity;
  priority: BugPriority;
  projectId: number;
}

// ============================================================
// EXECUTION TYPES
// ============================================================

export type ExecutionStatus = 'pass' | 'fail' | 'pending' | 'blocked' | 'skipped';

export interface Execution {
  id: number;
  testcase_id: string;
  status: ExecutionStatus;
  tester_id: number;
  project_id?: number;
  duration_seconds?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateExecutionInput {
  testcase_id: string;
  status: ExecutionStatus;
  duration_seconds?: number;
  notes?: string;
}

// ============================================================
// PAGINATION TYPES
// ============================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  timestamp: string;
  pagination?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string[];
  };
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================================
// REQUEST/RESPONSE HELPER TYPES
// ============================================================

export interface SendSuccessOptions {
  message?: string;
  statusCode?: number;
  extras?: Record<string, any>;
}

export interface RequestWithUser {
  user?: AuthUser;
  [key: string]: any;
}

// ============================================================
// REPOSITORY TYPES
// ============================================================

export interface FindOptions {
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export interface FilterCriteria {
  [key: string]: any;
}

// ============================================================
// ERROR TYPES
// ============================================================

export interface CustomError extends Error {
  code: string;
  statusCode: number;
  details?: any;
}

export class AppError extends Error implements CustomError {
  code: string;
  statusCode: number;
  details?: any;

  constructor(message: string, code?: string, statusCode?: number, details?: any) {
    super(message);
    this.code = code || 'APP_ERROR';
    this.statusCode = statusCode || 500;
    this.details = details;
    this.name = 'AppError';
  }
}

// ============================================================
// UTILITY TYPES
// ============================================================

export type AsyncFunction<T = void> = () => Promise<T>;

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type Partial<T> = {
  [P in keyof T]?: T[P];
};

export type Required<T> = {
  [P in keyof T]-?: T[P];
};

// ============================================================
// DATABASE TYPES
// ============================================================

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  waitForConnections?: boolean;
  connectionLimit?: number;
  queueLimit?: number;
}

export interface DatabaseConnection {
  query: (sql: string, values?: any[], callback?: (err: any, results?: any) => void) => void;
}

// ============================================================
// SERVICE LAYER TYPES
// ============================================================

export interface SearchOptions {
  projectId?: number;
  limit?: number;
}

export interface BulkUpdateInput {
  ids: string[] | number[];
  updates: Record<string, any>;
}

export interface StatsResult {
  execution_count: number;
  pass_count: number;
  fail_count: number;
  pass_rate: number;
}

// ============================================================
// CONTROLLER CONTEXT TYPES
// ============================================================

export interface ControllerContext {
  userId: number;
  userRole: string;
  projectId?: number;
}
