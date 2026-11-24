import { QueryClient } from "@tanstack/react-query";

// Crear una instancia de QueryClient (debe ser la misma que usas en tu app)
export const queryClient = new QueryClient();

// Versión no-hook para ejecutar queries
export const executeQuery = async (queryKey, queryFn, options = {}) => {
  return await queryClient.fetchQuery({
    queryKey,
    queryFn,
    ...options,
    staleTime: options.staleTime || 10000,
  });
};

// Versión no-hook para invalidar queries
export const invalidateQuery = (queryKey) => {
  queryClient.invalidateQueries({ queryKey });
};

// Versión no-hook para forzar refetch
export const refetchQuery = async (queryKey) => {
  return await queryClient.refetchQueries({ queryKey });
};
