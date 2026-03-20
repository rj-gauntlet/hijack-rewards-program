import { ApiResponse, ApiError } from '../types';

export function success<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function error(errorCode: string, message: string): ApiError {
  return { success: false, error: errorCode, message };
}
