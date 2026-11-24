import { createEntidadMutationHook } from "./createEntidadMutationHook";

/**
 * Hooks para CRUD de identificaciones de entidad
 * Endpoints:
 *  - POST /api/appweb/insertar-entidad-identificacion
 *  - POST /api/appweb/actualizar-entidad-identificacion
 *  - POST /api/appweb/eliminar-entidad-identificacion
 *
 * Atributos:
 * NOMBRE                          OBLIGATORIO  TIPO      TAMAÑO  DESCRIPCIÓN
 * entidadidentificacion_id        SI           Numérico  1-5     Requerido en actualizar y eliminar.
 * entidad_id                      SI           Numérico  1-5     Requerido en insertar, actualizar y eliminar.
 * cod_identificacion              SI           Numérico  1-5     Requerido en insertar, actualizar. *
 * entidadidentificacio_numero     SI           Texto     30      Requerido en insertar, actualizar.
 * cod_estado                      SI           Numérico  1-5     Requerido en insertar, actualizar. Puede ser recuperado de la lista estado.
 * entidadidentificacion_fecha_inicio SI       Fecha     -       Obligatorio, enviar null si no existe.
 * entidadidentificacion_fecha_fin   SI       Fecha     -       Obligatorio, enviar null si no existe.
 * entidadidentificacion_fecha_inicio SI       Fecha     -       Obligatorio, enviar null si no existe.
 * entidadidentificacion_fecha_fin   SI       Fecha     -       Obligatorio, enviar null si no existe.
 * entidadidentificacion_ruta      SI           Texto            **Obligatorio**; enviar NULL si no existe documento. Aunque en el API se documentó originalmente como opcional, el backend da error cuando falta, por lo que debemos incluirlo incluso cuando no hay archivo.
 *
 * Los hooks simplemente usan createDataMutationHook con la misma clave de cache
 * ("entidad-identificaciones") para que, al ejecutarlos, se invalide la consulta
 * de identificaciones si fuese necesario.
 */

export const useInsertarEntidadIdentificacion = createEntidadMutationHook(
  ["entidad-identificaciones"],
  "/api/appweb/insertar-entidad-identificacion",
  (res) => res,
);

export const useActualizarEntidadIdentificacion = createEntidadMutationHook(
  ["entidad-identificaciones"],
  "/api/appweb/actualizar-entidad-identificacion",
  (res) => res,
);

export const useEliminarEntidadIdentificacion = createEntidadMutationHook(
  ["entidad-identificaciones"],
  "/api/appweb/eliminar-entidad-identificacion",
  (res) => res,
);
