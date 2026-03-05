/**
 * Shared Type Definitions for TestTrack Pro
 * Used by both backend and frontend
 */

// ===== User Types =====
export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'manager' | 'tester' | 'developer';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'tester' | 'developer';
}

// ===== Project Types =====
export interface Project {
  id: number;
  name: string;
  description?: string;
  key: string;
  lead_id: number;
  status: 'active' | 'archived' | 'planning';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// ===== Test Case Types =====
export type TestCaseStatus = 'draft' | 'ready' | 'in-progress' | 'passed' | 'failed' | 'blocked' | 'deprecated';
export type TestCasePriority = 'low' | 'medium' | 'high' | 'critical';

export interface TestCase {
  id: string;
  project_id: number;
  title: string;
  description?: string;
  priority: TestCasePriority;
  status: TestCaseStatus;
  assignee_id?: number;
  created_by: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateTestCaseInput {
  projectId: number;
  title: string;
  description?: string;
  priority?: TestCasePriority;
  status?: TestCaseStatus;
  assigneeId?: number;
}

export interface UpdateTestCaseInput {
  title?: string;
  description?: string;
  priority?: TestCasePriority;
  status?: TestCaseStatus;
  assigneeId?: number;
}

export interface TestCaseWithStats extends TestCase {
  stepCount: number;
  executionCount: number;
  releatedBugsCount: number;
  passRate: number;
}

// ===== Test Step Types =====
export interface TestStep {
  id: number;
  testcase_id: string;
  step_number: number;
  action: string;
  expected_result: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTestStepInput {
  action: string;
  expectedResult: string;
}

// ===== Bug Types =====
export type BugStatus = 'open' | 'in-progress' | 'resolved' | 'closed' | 'reopened' | 'on-hold';
export type BugPriority = 'low' | 'medium' | 'high' | 'critical';
export type BugSeverity = 'minor' | 'major' | 'critical' | 'blocker';

export interface Bug {
  id: string;
  project_id: number;
  title: string;
  description?: string;
  priority: BugPriority;
  severity: BugSeverity;
  status: BugStatus;
  assignee_id?: number;
  created_by: number;
  testcase_id?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateBugInput {
  projectId: number;
  title: string;
  description?: string;
  priority?: BugPriority;
  severity?: BugSeverity;
  testcaseId?: string;
  assigneeId?: number;
}

export interface UpdateBugInput {
  title?: string;
  description?: string;
  priority?: BugPriority;
  severity?: BugSeverity;
  status?: BugStatus;
  assigneeId?: number;
}

// ===== Execution Types =====
export type ExecutionStatus = 'pending' | 'in-progress' | 'passed' | 'failed' | 'blocked' | 'skipped';

export interface Execution {
  id: number;
  testcase_id: string;
  executed_by: number;
  status: ExecutionStatus;
  result?: string;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExecutionInput {
  testcaseId: string;
  status?: ExecutionStatus;
  result?: string;
  duration?: number;
}

// ===== Pagination Types =====
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

// ===== API Response Types =====
export interface ApiSuccess<T> {
  status: 'success';
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  status: 'error';
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// ===== Error Types =====
export interface CustomError {
  name: string;
  message: string;
  statusCode: number;
  code: string;
}

export class AppError extends Error implements CustomError {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ===== Service Types =====
export interface SearchOptions {
  query: string;
  fields: string[];
  limit?: number;
  offset?: number;
}

export interface BulkUpdateInput {
  ids: number[];
  updates: Record<string, any>;
}

export interface StatsResult {
  totalCount: number;
  activeCount: number;
  archivedCount: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
}

// ===== Database Types =====
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
}

export interface DatabaseConnection {
  query(sql: string, values?: any[]): Promise<any>;
  execute(sql: string, values?: any[]): Promise<any>;
  release(): void;
}

// ===== Feature Flags =====
export interface FeatureFlags {
  enableTypeScript: boolean;
  enableMonorepo: boolean;
  enableNotifications: boolean;
  enableAdvancedReporting: boolean;
}
