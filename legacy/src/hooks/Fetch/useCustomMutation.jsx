// useCustomMutation.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "../../utils/queryUtils";

export default function useCustomMutation(options = {}) {
  const client = useQueryClient();

  const mutation = useMutation({
    ...options,

    // Configuración óptima para mutaciones
    onMutate: async (variables) => {
      await client.cancelQueries();
      return options.onMutate?.(variables) || {};
    },
    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      options.onSettled?.(data, error, variables, context);
    },
  });

  return {
    ...mutation,
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    queryClient: client,
  };
}
