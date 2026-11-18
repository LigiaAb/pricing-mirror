export const CACHE_STATIC = { staleTime: 1000 * 60 * 30, gcTime: 1000 * 60 * 45 };
export const CACHE_SEMI_STATIC = { staleTime: 1000 * 60 * 15, gcTime: 1000 * 60 * 25 };
export const CACHE_DYNAMIC = { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 10 };

/**
 * Datos transaccionales que otros usuarios (o el legacy) cambian en paralelo:
 * bandejas de aprobación, saldos. Nunca se sirven sin revalidar, pero se
 * conservan en memoria para pintar al instante mientras llega el dato fresco.
 */
export const CACHE_LIVE = {
  staleTime: 0,
  gcTime: 1000 * 60 * 10,
  refetchOnWindowFocus: true,
} as const;
