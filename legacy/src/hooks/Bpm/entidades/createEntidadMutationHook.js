import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../utils/api";

/**
 * Variante local de createDataMutationHook (hooks/Fetch/useFunctions.jsx) que NO
 * cancela todas las queries activas de la app en cada mutación. La versión
 * compartida cancela sin filtro en su onMutate, lo que puede competir por
 * conexiones del navegador con otras mutaciones encadenadas (p. ej. guardar
 * Facturación: dirección -> contacto -> identificación) y dejar alguna
 * petición "pending" indefinidamente. Aquí solo se cancelan las queries que
 * comparten la misma key de esta mutación.
 */
export const createEntidadMutationHook =
  (key, endpoint, mapper = (e) => e) =>
  (params, options = {}) => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (newData) => {
        const response = await api.post(endpoint, newData);
        return mapper(response.data);
      },
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: [key, params] });
        return options.onMutate?.(variables) || {};
      },
      onSuccess: (newData) => {
        queryClient.setQueryData([key, params], (old) => {
          if (!old) return [newData];
          return Array.isArray(old) ? [newData, ...old] : { ...old, data: [newData, ...old.data] };
        });
        options.onSuccess?.(newData);
      },
      onError: (error, variables, context) => {
        queryClient.invalidateQueries({ queryKey: [key, params] });
        options.onError?.(error, variables, context);
      },
      onSettled: (data, error, variables, context) => {
        options.onSettled?.(data, error, variables, context);
      },
    });
  };
