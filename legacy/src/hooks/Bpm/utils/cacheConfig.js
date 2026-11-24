/**
 * Configuración centralizada de tiempos de cache para React Query.
 * Estandariza staleTime y cacheTime según la naturaleza de los datos.
 */

/** Datos que casi nunca cambian (empresas, estados, tipos) */
export const CACHE_STATIC = {
  staleTime: 1000 * 60 * 30, // 30 min
  cacheTime: 1000 * 60 * 45, // 45 min
};

/** Datos que cambian ocasionalmente (entidades, usuarios, centros de costo) */
export const CACHE_SEMI_STATIC = {
  staleTime: 1000 * 60 * 15, // 15 min
  cacheTime: 1000 * 60 * 25, // 25 min
};

/** Datos que cambian frecuentemente (coordinaciones, cargas, documentos) */
export const CACHE_DYNAMIC = {
  staleTime: 1000 * 60 * 5, // 5 min
  cacheTime: 1000 * 60 * 10, // 10 min
};

// ============================================================================
// FUNCIONES DE INVALIDACIÓN DE CACHE
// ============================================================================

export function invalidateCoordinaciones(queryClient, cod_empresa, cod_cc) {
  return queryClient.invalidateQueries({
    queryKey: ["coordinaciones", cod_empresa, cod_cc],
  });
}

export function invalidateCoordinacionCargas(queryClient, cod_coordinacion) {
  return queryClient.invalidateQueries({
    queryKey: ["coordinacion-cargas", cod_coordinacion],
  });
}

export function invalidateCoordinacionContactos(queryClient, cod_coordinacion) {
  return queryClient.invalidateQueries({
    queryKey: ["coordinacion-contactos", cod_coordinacion],
  });
}

export function invalidateCoordinacionDocumentos(queryClient, cod_coordinacion) {
  return queryClient.invalidateQueries({
    queryKey: ["coordinacion-documentos", cod_coordinacion],
  });
}

export function invalidateCoordinacionFechasMov(queryClient, cod_coordinacion) {
  return queryClient.invalidateQueries({
    queryKey: ["coordinacion-fechas-mov", cod_coordinacion],
  });
}

export function invalidateCorrelativoGuias(queryClient) {
  return queryClient.invalidateQueries({
    queryKey: ["correlativo-guias"],
  });
}
