// useCustomQuery.js (versión modificada)
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "../../utils/queryUtils";

export default function useCustomQuery(queryKey, queryFn, options = {}) {
  const client = useQueryClient();

  const query = useQuery({
    queryKey,
    queryFn,

    // Configuración óptima para catálogos:
    staleTime: 30 * 60 * 1000, // 30 minutos frescos
    gcTime: 24 * 60 * 60 * 1000, // 24 horas en caché
    refetchInterval: 60 * 60 * 1000, // 1 hora entre actualizaciones
    refetchOnMount: false, // No revalida al montar nuevo componente
    refetchOnWindowFocus: false, // Desactiva revalidación por focus
    ...options,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });
  const refetchData = () => query.refetch(); // async () => await queryClient.refetchQueries({ queryKey });

  return {
    ...query,
    invalidate,
    refetchData,
    queryClient: client,
  };
}
