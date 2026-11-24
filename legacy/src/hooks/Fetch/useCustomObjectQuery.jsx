import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function useCustomObjectQuery(queryKey, queryFn, options = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey,
    queryFn,
    staleTime: Infinity,
    gcTime: Infinity,
    ...options,
  });

  // actualizar objeto completo
  const setData = (data) => {
    queryClient.setQueryData(queryKey, data);
  };

  // merge parcial tipo setState
  const mergeData = (partial) => {
    queryClient.setQueryData(queryKey, (old = {}) => ({
      ...old,
      ...partial,
    }));
  };

  return {
    ...query,
    setData,
    mergeData,
  };
}
