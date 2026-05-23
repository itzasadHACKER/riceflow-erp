const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

interface FetchOptions extends RequestInit {
  token?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Array<{ field?: string; message: string }>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.message || "An error occurred",
      errorData.errors
    );
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    fetchApi<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "DELETE" }),
};
