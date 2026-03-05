/**
 * BaseRepository Unit Tests
 * Tests for generic CRUD operations
 */

import { BaseRepository } from '../../../repositories/BaseRepository';
import { createMockTestCase } from '@testtrack-pro/shared/testing';
import { createMockDatabase } from '../mocks/database';

describe('BaseRepository', () => {
  let repository: BaseRepository<any>;
  let mockDatabase: any;

  beforeEach(() => {
    mockDatabase = createMockDatabase();
    repository = new BaseRepository(mockDatabase, 'test_cases');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll()', () => {
    it('should return all records', async () => {
      const mockData = [
        createMockTestCase({ id: 'TC-2026-00001' }),
        createMockTestCase({ id: 'TC-2026-00002' }),
      ];
      mockDatabase.setQueryResult('SELECT * FROM test_cases', mockData);

      const result = await repository.findAll();

      expect(result).toEqual(mockData);
      expect(mockDatabase.query).toHaveBeenCalled();
    });

    it('should return empty array when no records exist', async () => {
      mockDatabase.setQueryResult('SELECT * FROM test_cases', []);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById()', () => {
    it('should return a record by id', async () => {
      const mockData = createMockTestCase();
      mockDatabase.setQueryResult('SELECT * FROM test_cases WHERE id = ?', [mockData]);

      const result = await repository.findById('TC-2026-00001');

      expect(result).toEqual(mockData);
    });

    it('should return null when record not found', async () => {
      mockDatabase.setQueryResult('SELECT * FROM test_cases WHERE id = ?', []);

      const result = await repository.findById('TC-2026-99999');

      expect(result).toBeNull();
    });
  });

  describe('create()', () => {
    it('should create a record', async () => {
      const newData = createMockTestCase();
      mockDatabase.execute.mockResolvedValueOnce({
        insertId: 1,
        affectedRows: 1,
      });

      const result = await repository.create(newData);

      expect(mockDatabase.execute).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw ValidationError on duplicate entry', async () => {
      const newData = createMockTestCase();
      const duplicateError = new Error('Duplicate entry');
      (duplicateError as any).code = 'ER_DUP_ENTRY';

      mockDatabase.setQueryError('INSERT INTO test_cases', duplicateError);

      await expect(repository.create(newData)).rejects.toThrow();
    });
  });

  describe('update()', () => {
    it('should update a record', async () => {
      mockDatabase.execute.mockResolvedValueOnce({
        affectedRows: 1,
      });

      const updates = { title: 'Updated Title' };
      const result = await repository.update('TC-2026-00001', updates);

      expect(mockDatabase.execute).toHaveBeenCalled();
      expect(result.affectedRows).toBe(1);
    });

    it('should return affected rows count', async () => {
      mockDatabase.execute.mockResolvedValueOnce({
        affectedRows: 0,
      });

      const result = await repository.update('TC-2026-99999', { title: 'Test' });

      expect(result.affectedRows).toBe(0);
    });
  });

  describe('delete()', () => {
    it('should delete a record', async () => {
      mockDatabase.execute.mockResolvedValueOnce({
        affectedRows: 1,
      });

      const result = await repository.delete('TC-2026-00001');

      expect(mockDatabase.execute).toHaveBeenCalled();
      expect(result.affectedRows).toBe(1);
    });
  });

  describe('count()', () => {
    it('should return total count', async () => {
      mockDatabase.setQueryResult('SELECT COUNT(*) as count FROM test_cases', [
        { count: 42 },
      ]);

      const result = await repository.count();

      expect(result).toBe(42);
    });

    it('should handle zero count', async () => {
      mockDatabase.setQueryResult('SELECT COUNT(*) as count FROM test_cases', [
        { count: 0 },
      ]);

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });

  describe('paginate()', () => {
    it('should return paginated results with metadata', async () => {
      const mockData = [
        createMockTestCase({ id: 'TC-2026-00001' }),
        createMockTestCase({ id: 'TC-2026-00002' }),
      ];
      mockDatabase.setQueryResult('SELECT * FROM test_cases LIMIT ? OFFSET ?', mockData);
      mockDatabase.setQueryResult('SELECT COUNT(*) as count FROM test_cases', [
        { count: 2 },
      ]);

      const result = await repository.paginate(1, 20);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.data).toEqual(mockData);
      expect(result.meta.total).toBe(2);
    });

    it('should handle different page sizes', async () => {
      const mockData = [createMockTestCase()];
      mockDatabase.setQueryResult('SELECT * FROM test_cases LIMIT ? OFFSET ?', mockData);
      mockDatabase.setQueryResult('SELECT COUNT(*) as count FROM test_cases', [
        { count: 100 },
      ]);

      const result = await repository.paginate(2, 10);

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
    });
  });
});
