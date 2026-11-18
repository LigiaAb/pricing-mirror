"use client";

import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { http } from "@/shared/api/client";

interface ListaResponse<TRaw> {
  data: TRaw[];
}

export function createDataHook<
  TRaw extends Record<string, unknown> = Record<string, unknown>,
  TMapped = TRaw,
>(
  key: string | string[],
  endpoint: string,
  mapper: (item: TRaw) => TMapped = (item) => item as unknown as TMapped,
) {
  const queryKey = Array.isArray(key) ? key : [key];

  return (
    params: Record<string, unknown> = {},
    options: Partial<UseQueryOptions<TMapped[]>> = {},
  ) =>
    useQuery({
      queryKey: [...queryKey, params],
      queryFn: async () => {
        const res = await http.get<ListaResponse<TRaw>>(endpoint, { params });
        return res.data.map(mapper);
      },
      staleTime: 30 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchInterval: 60 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      ...options,
    });
}
