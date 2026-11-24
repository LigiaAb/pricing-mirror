import { createEntidadMutationHook } from "./createEntidadMutationHook";

/**
 * Hooks para CRUD de relaciones entre entidades
 * Endpoints:
 *  - POST /api/appweb/insertar-entidad-relacion
 *  - POST /api/appweb/actualizar-entidad-relacion
 *  - POST /api/appweb/eliminar-entidad-relacion
 *
 * Atributos (según documentación actualizada):
 * NOMBRE                OBLIGATORIO  TIPO      TAMAÑO  DESCRIPCIÓN
 * cod_entidadrelacion   SI           Numérico  1-5     Id único de la relación. Requerido al actualizar y eliminar.
 * entidad_id_1          SI           Numérico  1-5     Id de la primera entidad en la relación (principal). Ejemplo: cliente.
 * entidad_id_2          SI           Numérico  1-5     Id de la segunda entidad en la relación (secundaria). Ejemplo: Shipper / Consignatario.
 * cod_tipo              SI           Numérico  1-5     Categoría o tipo de vínculo. Requerido al insertar y actualizar.
 * cod_estado            SI           Numérico  1-5     Estado del registro (activo: 1, inactivo: 2). Requerido al insertar y actualizar.
 * fecha_inicial         NO           Fecha     15      Fecha de inicio de la relación.
 *
 * Los hooks usan createEntidadMutationHook (no createDataMutationHook) porque
 * este último cancela TODAS las queries activas de la app en cada mutación,
 * lo que compite por conexiones del navegador con el resto de POSTs
 * encadenados en "Crear Coordinación" (insertar-entidad-relacion se dispara
 * justo antes de insertar-entidad-direccion/contacto/identificacion al crear
 * una entidad nueva) y puede dejar alguna de esas peticiones "pending"
 * indefinidamente. Ver createEntidadMutationHook.js.
 */

export const useInsertarEntidadRelacion = createEntidadMutationHook(
  ["entidad-relaciones"],
  "/api/appweb/insertar-entidad-relacion",
  (res) => res,
);

export const useActualizarEntidadRelacion = createEntidadMutationHook(
  ["entidad-relaciones"],
  "/api/appweb/actualizar-entidad-relacion",
  (res) => res,
);

export const useEliminarEntidadRelacion = createEntidadMutationHook(
  ["entidad-relaciones"],
  "/api/appweb/eliminar-entidad-relacion",
  (res) => res,
);
