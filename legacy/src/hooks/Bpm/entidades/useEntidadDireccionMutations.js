import { createEntidadMutationHook } from "./createEntidadMutationHook";

/**
 * Hooks para CRUD de direcciones de entidad
 * Endpoints:
 *  - POST /api/appweb/insertar-entidad-direccion
 *  - POST /api/appweb/actualizar-entidad-direccion
 *  - POST /api/appweb/eliminar-entidad-direccion
 *
 * Atributos (según documentación):
 * Nota: todos los campos cod_* y los IDs son NUMÉRICOS; los componentes deben
 * convertir valores de formulario (strings) a números antes de enviar la payload.
 * NOMBRE                        OBLIGATORIO  TIPO      TAMAÑO  DESCRIPCIÓN
 * entidaddireccion_id           SI           Numérico  1-5     Requerido en actualizar y eliminar.
 * entidad_id                    SI           Numérico  1-5     Requerido en insertar, actualizar y eliminar.
 * cod_tipo                      SI           Numérico  1-5     Requerido en insertar, actualizar. Nota: depende del tipo de dirección que se desea registrar (no es el mismo que retorna filtro de entidad).
 * entidaddireccion_direccion    SI           Texto     75      Requerido en insertar, actualizar.
 * entidaddireccion_zona         SI           Texto     75      Requerido en insertar, actualizar.
 * entidaddireccion_km           SI           Texto     75      Requerido en insertar, actualizar. Si no aplica puede ser enviado null.
 * cod_muni                      SI           Numérico  1-5     Requerido en insertar, actualizar. Si no aplica puede ser enviado null. Debe recuperar la lista que corresponde al departamento seleccionado.
 * cod_depto                     SI           Numérico  10     Requerido en insertar y actualizar. Puede ser enviado como null. Si este es NULL cod_muni también lo debe ser.
 * cod_pais                      SI           Numérico  1-15    Requerido en insertar, actualizar. Puede ser recuperado de la lista de países.
 * cod_estado                    SI           Numérico  1-5     Requerido en insertar, actualizar. Puede ser recuperado de la lista estado.
 *
 * Los hooks usan createDataMutationHook con la clave de caché
 * "entidad-direcciones" para invalidar automáticamente la consulta cuando se ejecutan.
 */

export const useInsertarEntidadDireccion = createEntidadMutationHook(
  ["entidad-direcciones"],
  "/api/appweb/insertar-entidad-direccion",
  (res) => res,
);

export const useActualizarEntidadDireccion = createEntidadMutationHook(
  ["entidad-direcciones"],
  "/api/appweb/actualizar-entidad-direccion",
  (res) => res,
);

export const useEliminarEntidadDireccion = createEntidadMutationHook(
  ["entidad-direcciones"],
  "/api/appweb/eliminar-entidad-direccion",
  (res) => res,
);
