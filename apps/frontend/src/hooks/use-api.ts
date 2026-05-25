"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

export function useApiGet<T>(key: string[], endpoint: string, enabled = true) {
  const token = useAuthStore((s) => s.token);
  return useQuery<T>({
    queryKey: key,
    queryFn: async () => {
      const res = await api.get<ApiResponse<T>>(endpoint, {
        token: token ?? undefined,
      });
      return res.data;
    },
    enabled: enabled && !!token,
  });
}

export function useApiList<T>(
  key: string[],
  endpoint: string,
  enabled = true
) {
  const token = useAuthStore((s) => s.token);
  return useQuery<T[]>({
    queryKey: key,
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<T> | ApiResponse<T[]>>(
        endpoint,
        { token: token ?? undefined }
      );
      if (Array.isArray(res.data)) return res.data;
      return res.data as unknown as T[];
    },
    enabled: enabled && !!token,
  });
}

export function useApiMutation<TData, TVariables>(
  endpoint: string,
  method: "post" | "patch" | "delete" = "post",
  optionsOrKeys?: string[][] | { invalidateKeys?: string[][]; onSuccess?: () => void }
) {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  const invalidateKeys = Array.isArray(optionsOrKeys)
    ? optionsOrKeys
    : optionsOrKeys?.invalidateKeys;
  const onSuccessCb = Array.isArray(optionsOrKeys) ? undefined : optionsOrKeys?.onSuccess;

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const opts = { token: token ?? undefined };
      let res: ApiResponse<TData>;
      if (method === "post") {
        res = await api.post<ApiResponse<TData>>(endpoint, variables, opts);
      } else if (method === "patch") {
        res = await api.patch<ApiResponse<TData>>(endpoint, variables, opts);
      } else {
        res = await api.delete<ApiResponse<TData>>(endpoint, opts);
      }
      return res.data;
    },
    onSuccess: () => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) =>
          queryClient.invalidateQueries({ queryKey: key })
        );
      }
      onSuccessCb?.();
    },
  });
}

export function useApiAction<TData>(
  invalidateKeys?: string[][]
) {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();

  return useMutation<TData, Error, { endpoint: string; method?: "post" | "patch" | "delete"; data?: unknown }>({
    mutationFn: async ({ endpoint, method = "post", data }) => {
      const opts = { token: token ?? undefined };
      let res: ApiResponse<TData>;
      if (method === "post") {
        res = await api.post<ApiResponse<TData>>(endpoint, data, opts);
      } else if (method === "patch") {
        res = await api.patch<ApiResponse<TData>>(endpoint, data, opts);
      } else {
        res = await api.delete<ApiResponse<TData>>(endpoint, opts);
      }
      return res.data;
    },
    onSuccess: () => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) =>
          queryClient.invalidateQueries({ queryKey: key })
        );
      }
    },
  });
}
