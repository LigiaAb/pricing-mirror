import { createDataMutationHook } from "../../Fetch/useFunctions";

/**
 * Hooks de CRUD para identificaciones de punto de enlace
 * API endpoints:
 *  - POST /api/appweb/insertar-identificacion-punto_enlace
 *  - POST /api/appweb/actualizar-identificacion-punto_enlace
 *  - POST /api/appweb/eliminar-identificacion-punto_enlace
 *
 * Atributos:
 *  cod_puntoenlace_identificacion : SI Numerico 1-5 (requerido para actualizar/eliminar)
 *  codigo                       : SI Numerico 1-5 (insertar/actualizar)
 *  cod_puntoenlace              : SI Numerico 1-5 (insertar/actualizar)
 *  cod_tipo                     : SI Numerico 1-5 (insertar/actualizar)
 *  cod_estado                   : SI Numerico 1-3 (insertar/actualizar)
 */

export const useInsertarIdentificacionPuntoEnlace = createDataMutationHook(
  ["puntoenlace-identificaciones"],
  "/api/appweb/insertar-identificacion-punto_enlace",
  (res) => res,
);

export const useActualizarIdentificacionPuntoEnlace = createDataMutationHook(
  ["puntoenlace-identificaciones"],
  "/api/appweb/actualizar-identificacion-punto_enlace",
  (res) => res,
);

export const useEliminarIdentificacionPuntoEnlace = createDataMutationHook(
  ["puntoenlace-identificaciones"],
  "/api/appweb/eliminar-identificacion-punto_enlace",
  (res) => res,
);
