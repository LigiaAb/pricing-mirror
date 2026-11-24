import { createDataMutationHook } from "../../Fetch/useFunctions";

/**
 * Hooks para CRUD de municipios
 * Endpoints:
 *  - POST /api/appweb/insertar-municipios
 *  - POST /api/appweb/actualizar-municipios
 *  - POST /api/appweb/eliminar-municipios
 *
 * Atributos:
 * NOMBRE       | OBLIGATORIO | TIPO     | TAMAÑO | DESCRIPCIÓN
 * cod_muni     | SI          | Numérico | 1-5    | Requerido en actualizar y eliminar.
 * cod_depto    | SI          | Numérico | 1-5    | Requerido al insertar y actualizar.
 * nombre_muni  | SI          | Texto    | 75     | Requerido al insertar y actualizar.
 * cod_estado   | SI          | Numérico | 1-5    | Requerido al insertar y actualizar.
 *
 * Los hooks usan la clave de cache "municipios" para permitir la invalidación
 * automática cuando se ejecutan.
 */

export const useInsertarMunicipio = createDataMutationHook(
  ["municipios"],
  "/api/appweb/insertar-municipios",
  (res) => res,
);

export const useActualizarMunicipio = createDataMutationHook(
  ["municipios"],
  "/api/appweb/actualizar-municipios",
  (res) => res,
);

export const useEliminarMunicipio = createDataMutationHook(
  ["municipios"],
  "/api/appweb/eliminar-municipios",
  (res) => res,
);
