import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
} from './api-response';

describe('API Response Utilities', () => {
  describe('createSuccessResponse', () => {
    it('wraps data with success=true and timestamp', () => {
      const data = { playerId: 'abc-123', tier: 1 };
      const result = createSuccessResponse(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.error).toBeUndefined();
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });

    it('works with null data', () => {
      const result = createSuccessResponse(null);
      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('works with array data', () => {
      const result = createSuccessResponse([1, 2, 3]);
      expect(result.data).toEqual([1, 2, 3]);
    });
  });

  describe('createErrorResponse', () => {
    it('wraps error message with success=false', () => {
      const result = createErrorResponse('Player not found');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBe('Player not found');
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('createPaginatedResponse', () => {
    it('creates a paginated response with all fields', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = createPaginatedResponse(items, 50, 20, 0);

      expect(result.items).toEqual(items);
      expect(result.total).toBe(50);
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('handles empty items', () => {
      const result = createPaginatedResponse([], 0, 20, 0);
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('handles offset pagination', () => {
      const result = createPaginatedResponse([{ id: 3 }], 100, 20, 40);
      expect(result.offset).toBe(40);
      expect(result.limit).toBe(20);
    });
  });
});
