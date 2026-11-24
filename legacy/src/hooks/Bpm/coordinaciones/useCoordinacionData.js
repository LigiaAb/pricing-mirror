import { useCoordinaciones } from "./useCoordinaciones";

/**
 * Hook para obtener los datos de una sola coordinación por su embarque_id.
 * Envuelve useCoordinaciones pasando el filtro embarque_id y retorna solo
 * el primer elemento del arreglo (o null si no hay resultados).
 *
 * Varias secciones pueden llamar este hook con el mismo id; TanStack Query
 * deduplica la petición porque comparten la misma queryKey.
 *
 * @param {number|string|null} embarque_id - ID del embarque
 * @returns {{ data: object|null, isLoading: boolean, ...rest }} 
 */
export function useCoordinacionData(embarque_id, options = {}) {
  const result = useCoordinaciones({
    cod_empresa: 1,
    cod_cc: 16,
    embarque_id: embarque_id ?? undefined,
  }, options);

  const data = Array.isArray(result.data) && result.data.length > 0
    ? result.data[0]
    : null;

  return {
    ...result,
    data,
  };
}
