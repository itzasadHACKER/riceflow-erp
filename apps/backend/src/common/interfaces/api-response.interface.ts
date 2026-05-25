export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  errors?: ApiError[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  field?: string;
  message: string;
  code?: string;
}

export function createResponse<T>(
  data: T,
  meta?: PaginationMeta,
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): ApiResponse<T[]> {
  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
