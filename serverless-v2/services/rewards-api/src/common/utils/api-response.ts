import type { ApiResponse, PaginatedResponse } from '../types/api-response.types';

export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(error: string): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error,
    timestamp: new Date().toISOString(),
  };
}

export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  limit: number,
  offset: number,
): PaginatedResponse<T> {
  return { items, total, limit, offset };
}
