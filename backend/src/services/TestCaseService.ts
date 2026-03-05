import TestCaseRepository from '../repositories/TestCaseRepository';
import { ValidationError, NotFoundError } from '../utils/errors';
import {
  TestCase,
  CreateTestCaseInput,
  UpdateTestCaseInput,
  PaginatedResult,
  TestCaseWithStats,
  TestCaseStatus
} from '../types';
import { DatabaseConnection } from '../types';

/**
 * Test Case Service - TypeScript Version
 * Contains all business logic for test case operations
 * Handles validation, transformation, and repository calls
 */
class TestCaseService {
  private repository: TestCaseRepository;

  constructor(db: DatabaseConnection) {
    this.repository = new TestCaseRepository(db);
  }

  /**
   * Create a new test case
   * @param userId ID of the user creating the test case
   * @param data Test case data
   * @returns Created test case with ID
   */
  async createTestCase(userId: number, data: CreateTestCaseInput): Promise<TestCase> {
    // Validation
    if (!data.title || data.title.trim().length < 3) {
      throw new ValidationError('Title must be at least 3 characters');
    }

    if (!data.projectId) {
      throw new ValidationError('Project ID is required');
    }

    if (data.priority && !['critical', 'high', 'medium', 'low'].includes(data.priority)) {
      throw new ValidationError('Invalid priority value');
    }

    // Create test case
    const testcaseId = this.generateId();
    const testcaseData: Partial<TestCase> = {
      id: testcaseId,
      project_id: data.projectId,
      title: data.title.trim(),
      description: data.description || undefined,
      priority: data.priority || 'medium',
      status: 'draft' as TestCaseStatus,
      created_by: userId,
      created_at: new Date(),
      version: 1
    };

    return this.repository.create(testcaseData);
  }

  /**
   * Get test case with all details including steps
   * @param id Test case ID
   * @returns Complete test case object
   */
  async getTestCase(id: string): Promise<TestCase & { steps: any[]; step_count: number }> {
    const testcase = await this.repository.findWithSteps(id);
    if (!testcase) {
      throw new NotFoundError(`Test case '${id}' not found`);
    }
    return testcase;
  }

  /**
   * List test cases by project with pagination
   * @param projectId Project ID
   * @param filters Additional filters
   * @param page Page number (1-based)
   * @param limit Records per page
   * @returns Paginated results
   */
  async listByProject(
    projectId: number,
    filters: Record<string, any> = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<TestCase>> {
    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    if (page < 1) {
      throw new ValidationError('Page must be >= 1');
    }

    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    return this.repository.findByProject(projectId, filters, page, limit);
  }

  /**
   * Update test case
   * @param id Test case ID
   * @param userId ID of user making the update
   * @param data Fields to update
   * @returns Updated test case
   */
  async updateTestCase(
    id: string,
    userId: number,
    data: UpdateTestCaseInput
  ): Promise<TestCase> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Test case '${id}' not found`);
    }

    // Validate if priority is being updated
    if (data.priority && !['critical', 'high', 'medium', 'low'].includes(data.priority)) {
      throw new ValidationError('Invalid priority value');
    }

    const updateData: Partial<TestCase> = {
      ...data,
      updated_by: userId,
      updated_at: new Date(),
      version: (existing.version || 1) + 1
    };

    await this.repository.update(id, updateData);
    return { ...existing, ...updateData } as TestCase;
  }

  /**
   * Clone test case with all steps
   * @param id Test case ID to clone
   * @param userId ID of user cloning
   * @returns Cloned test case
   */
  async cloneTestCase(id: string, userId: number): Promise<TestCase> {
    const original = await this.repository.findById(id);
    if (!original) {
      throw new NotFoundError(`Test case '${id}' not found`);
    }

    const cloneId = this.generateId();

    await this.repository.cloneWithSteps(id, cloneId);

    return {
      ...original,
      id: cloneId,
      status: 'draft' as TestCaseStatus,
      created_by: userId,
      created_at: new Date(),
      version: 1
    };
  }

  /**
   * Delete test case (soft delete)
   * @param id Test case ID
   * @returns Success response
   */
  async deleteTestCase(id: string): Promise<{ success: boolean; id: string; message: string }> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Test case '${id}' not found`);
    }

    await this.repository.softDelete(id);
    return { success: true, id, message: 'Test case deleted successfully' };
  }

  /**
   * Search test cases
   * @param query Search query
   * @param projectId Optional project filter
   * @returns Matching test cases
   */
  async search(query: string, projectId?: number | null): Promise<TestCase[]> {
    if (!query || query.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters');
    }

    return this.repository.search(query.trim(), projectId);
  }

  /**
   * Bulk update test cases
   * @param ids Test case IDs to update
   * @param updates Fields to update
   * @param userId ID of user making updates
   * @returns Update result
   */
  async bulkUpdate(
    ids: string[],
    updates: Record<string, any>,
    userId: number
  ): Promise<{ success: boolean; count: number; message: string }> {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new ValidationError('At least one test case ID is required');
    }

    const updateData: Partial<TestCase> = {
      ...updates,
      updated_by: userId,
      updated_at: new Date()
    };

    const count = await this.repository.bulkUpdate(ids, updateData);
    return {
      success: true,
      count,
      message: `${count} test case(s) updated successfully`
    };
  }

  /**
   * Get test cases with execution statistics
   * @param projectId Project ID
   * @returns Test cases with performance metrics
   */
  async getWithStats(projectId: number): Promise<TestCaseWithStats[]> {
    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    return this.repository.findWithExecutionStats(projectId);
  }

  /**
   * Get test cases by status
   * @param status Test case status
   * @param projectId Project ID
   * @returns Test cases with given status
   */
  async getByStatus(status: string, projectId: number): Promise<TestCase[]> {
    const validStatuses: TestCaseStatus[] = ['draft', 'ready', 'approved', 'deprecated'];
    if (!validStatuses.includes(status as TestCaseStatus)) {
      throw new ValidationError(`Invalid status. Valid values: ${validStatuses.join(', ')}`);
    }

    return this.repository.findByStatus(status, projectId);
  }

  /**
   * Get recently updated test cases
   * @param projectId Project ID
   * @param days Days to look back (default 7)
   * @returns Recent test cases
   */
  async getRecent(projectId: number, days: number = 7): Promise<TestCase[]> {
    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }

    if (days < 1) {
      throw new ValidationError('Days must be >= 1');
    }

    return this.repository.findRecent(projectId, days);
  }

  /**
   * Generate unique test case ID
   * Format: TC-YYYY-NNNNN
   * @private
   */
  private generateId(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, '0');
    return `TC-${year}-${random}`;
  }
}

export default TestCaseService;
