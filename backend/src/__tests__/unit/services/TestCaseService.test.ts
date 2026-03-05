/**
 * TestCaseService Unit Tests
 * Tests for test case business logic
 */

import { TestCaseService } from '../../../services/TestCaseService';
import { TestCaseRepository } from '../../../repositories/TestCaseRepository';
import { createMockTestCase } from '@testtrack-pro/shared/testing';
import { ValidationError, NotFoundError } from '../../../utils/errors';

describe('TestCaseService', () => {
  let service: TestCaseService;
  let mockRepository: jest.Mocked<TestCaseRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByProject: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      bulkUpdate: jest.fn(),
      findWithSteps: jest.fn(),
      findWithExecutionStats: jest.fn(),
      cloneWithSteps: jest.fn(),
      findByStatus: jest.fn(),
      findRecent: jest.fn(),
    } as any;

    service = new TestCaseService(mockRepository);
  });

  describe('createTestCase()', () => {
    it('should create a valid test case', async () => {
      const input = {
        projectId: 1,
        title: 'New Test Case',
        description: 'Test description',
        priority: 'high' as const,
        status: 'draft' as const,
      };

      const mockCreated = createMockTestCase({
        ...input,
        project_id: input.projectId,
      });

      mockRepository.create.mockResolvedValueOnce(mockCreated);

      const result = await service.createTestCase(1, input);

      expect(result).toEqual(mockCreated);
      expect(mockRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        title: input.title,
        project_id: input.projectId,
      }));
    });

    it('should reject title shorter than 3 characters', async () => {
      const input = {
        projectId: 1,
        title: 'XY',
      };

      await expect(service.createTestCase(1, input)).rejects.toThrow(ValidationError);
    });

    it('should reject empty title', async () => {
      const input = {
        projectId: 1,
        title: '',
      };

      await expect(service.createTestCase(1, input)).rejects.toThrow(ValidationError);
    });

    it('should assign default priority', async () => {
      const input = {
        projectId: 1,
        title: 'Test Case',
      };

      const mockCreated = createMockTestCase({
        ...input,
        priority: 'medium',
        project_id: input.projectId,
      });

      mockRepository.create.mockResolvedValueOnce(mockCreated);

      const result = await service.createTestCase(1, input);

      expect(result.priority).toBe('medium');
    });
  });

  describe('getTestCase()', () => {
    it('should return a test case by id', async () => {
      const mockTestCase = createMockTestCase();
      mockRepository.findById.mockResolvedValueOnce(mockTestCase);

      const result = await service.getTestCase('TC-2026-00001');

      expect(result).toEqual(mockTestCase);
      expect(mockRepository.findById).toHaveBeenCalledWith('TC-2026-00001');
    });

    it('should throw NotFoundError when test case does not exist', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.getTestCase('TC-2026-99999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('listByProject()', () => {
    it('should return test cases for a project', async () => {
      const mockTestCases = [
        createMockTestCase({ project_id: 1 }),
        createMockTestCase({ project_id: 1 }),
      ];

      mockRepository.findByProject.mockResolvedValueOnce({
        data: mockTestCases,
        meta: expect.any(Object),
      });

      const result = await service.listByProject(1, 1, 20);

      expect(result.data).toEqual(mockTestCases);
      expect(mockRepository.findByProject).toHaveBeenCalledWith(1, 1, 20);
    });
  });

  describe('updateTestCase()', () => {
    it('should update a test case', async () => {
      const updates = {
        title: 'Updated Title',
        status: 'ready' as const,
      };

      const mockUpdated = createMockTestCase({
        ...updates,
        version: 2,
      });

      mockRepository.findById.mockResolvedValueOnce(createMockTestCase());
      mockRepository.update.mockResolvedValueOnce({ affectedRows: 1 });

      const result = await service.updateTestCase('TC-2026-00001', updates);

      expect(mockRepository.update).toHaveBeenCalledWith('TC-2026-00001', expect.any(Object));
    });

    it('should throw NotFoundError if test case not found', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.updateTestCase('TC-2026-99999', { title: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteTestCase()', () => {
    it('should soft delete a test case', async () => {
      mockRepository.findById.mockResolvedValueOnce(createMockTestCase());
      mockRepository.update.mockResolvedValueOnce({ affectedRows: 1 });

      await service.deleteTestCase('TC-2026-00001');

      expect(mockRepository.update).toHaveBeenCalledWith(
        'TC-2026-00001',
        expect.objectContaining({
          deletedAt: expect.any(Date),
        })
      );
    });
  });

  describe('search()', () => {
    it('should search test cases', async () => {
      const mockResults = {
        data: [createMockTestCase()],
        meta: expect.any(Object),
      };

      mockRepository.search.mockResolvedValueOnce(mockResults);

      const result = await service.search('test', 1, 20);

      expect(result).toEqual(mockResults);
      expect(mockRepository.search).toHaveBeenCalledWith('test', 1, 20);
    });
  });

  describe('bulkUpdate()', () => {
    it('should update multiple test cases', async () => {
      const ids = [1, 2, 3];
      const updates = { status: 'ready' as const };

      mockRepository.bulkUpdate.mockResolvedValueOnce({ affectedRows: 3 });

      const result = await service.bulkUpdate(ids, updates);

      expect(result.affectedRows).toBe(3);
      expect(mockRepository.bulkUpdate).toHaveBeenCalledWith(ids, updates);
    });
  });
});
