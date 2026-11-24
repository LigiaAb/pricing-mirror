import { createDataMutationHook } from "../../Fetch/useFunctions";
import { useQueryClient } from "@tanstack/react-query";

const createGastosOnSuccess = (queryClient, queryKeyBase) => (data, variables, params) => {
  const embarqueId = variables?.embarque_id ?? params?.embarque_id;
  const embarqueVersion = variables?.embarque_version ?? params?.embarque_version;

  if (embarqueId) {
    queryClient.invalidateQueries({ queryKey: [queryKeyBase, embarqueId, embarqueVersion] });
    queryClient.invalidateQueries({ queryKey: ["listar-coordinacion-gastos-criterio", embarqueId, embarqueVersion] });
    queryClient.invalidateQueries({ queryKey: ["ultima-version-coordinacion-gastos", embarqueId] });
  } else {
    queryClient.invalidateQueries({ queryKey: [queryKeyBase] });
    queryClient.invalidateQueries({ queryKey: ["listar-coordinacion-gastos-criterio"] });
    queryClient.invalidateQueries({ queryKey: ["ultima-version-coordinacion-gastos"] });
  }
};

export const useInsertarCoordinacionGasto = (params, options = {}) => {
  const queryClient = useQueryClient();
  return createDataMutationHook(
    ["listar-coordinacion-gastos"],
    "/api/appweb/insertar-coordinacion-gasto",
    (res) => res,
  )(params, {
    ...options,
    onSuccess: (...args) => {
      createGastosOnSuccess(queryClient, "listar-coordinacion-gastos")(...args);
      if (options.onSuccess) options.onSuccess(...args);
    },
  });
};

export const useActualizarCoordinacionGasto = (params, options = {}) => {
  const queryClient = useQueryClient();
  return createDataMutationHook(
    ["listar-coordinacion-gastos"],
    "/api/appweb/actualizar-coordinacion-gasto",
    (res) => res,
  )(params, {
    ...options,
    onSuccess: (...args) => {
      createGastosOnSuccess(queryClient, "listar-coordinacion-gastos")(...args);
      if (options.onSuccess) options.onSuccess(...args);
    },
  });
};

export const useEliminarCoordinacionGasto = (params, options = {}) => {
  const queryClient = useQueryClient();
  return createDataMutationHook(
    ["listar-coordinacion-gastos"],
    "/api/appweb/eliminar-coordinacion-gasto",
    (res) => res,
  )(params, {
    ...options,
    onSuccess: (...args) => {
      createGastosOnSuccess(queryClient, "listar-coordinacion-gastos")(...args);
      if (options.onSuccess) options.onSuccess(...args);
    },
  });
};