import { createDataMutationHook } from "../../Fetch/useFunctions";
import { useQueryClient } from "@tanstack/react-query";

const createDetalleCriterioOnSuccess = (queryKey) => (...args) => {
  const queryClient = useQueryClient();
  const params = args[2] || {};
  const variables = args[1] || {};
  const cod_cotizaciondetalle = variables?.cod_cotizaciondetalle ?? params?.cod_cotizaciondetalle;

  if (cod_cotizaciondetalle) {
    queryClient.invalidateQueries({ queryKey: [queryKey, cod_cotizaciondetalle] });
  }
  queryClient.invalidateQueries({ queryKey: [queryKey] });
};

export const useCreateCotizacionDocumento = createDataMutationHook(
  ["cotizacion-documento"],
  "/api/appweb/insertar-cotizacion-documento",
  (res) => res,
);

export const useUpdateCotizacionDocumento = createDataMutationHook(
  ["cotizacion-documento-update"],
  "/api/appweb/actualizar-cotizacion-documento",
  (res) => res,
);

export const useRegistrarSeguimientoCTS = createDataMutationHook(
  ["seguimiento-cts-cotizacion"],
  "/api/appweb/seguimiento-cts-cotizacion",
  (res) => res,
);

export const useInsertarCotizacionDetalleCriterio = (params, options = {}) => {
  return createDataMutationHook(
    ["cotizacion-detalle-criterio"],
    "/api/appweb/insertar-cotizacion-detalle-criterio",
    (res) => res,
  )(params, {
    ...options,
    onSuccess: (...args) => {
      createDetalleCriterioOnSuccess("cotizacion-detalle-criterio")(...args);
      if (options.onSuccess) options.onSuccess(...args);
    },
  });
};

export const useActualizarCotizacionDetalleCriterio = (params, options = {}) => {
  return createDataMutationHook(
    ["cotizacion-detalle-criterio"],
    "/api/appweb/actualizar-cotizacion-detalle-criterio",
    (res) => res,
  )(params, {
    ...options,
    onSuccess: (...args) => {
      createDetalleCriterioOnSuccess("cotizacion-detalle-criterio")(...args);
      if (options.onSuccess) options.onSuccess(...args);
    },
  });
};

export const useEliminarCotizacionDetalleCriterio = (params, options = {}) => {
  return createDataMutationHook(
    ["cotizacion-detalle-criterio"],
    "/api/appweb/eliminar-cotizacion-detalle-criterio",
    (res) => res,
  )(params, {
    ...options,
    onSuccess: (...args) => {
      createDetalleCriterioOnSuccess("cotizacion-detalle-criterio")(...args);
      if (options.onSuccess) options.onSuccess(...args);
    },
  });
};