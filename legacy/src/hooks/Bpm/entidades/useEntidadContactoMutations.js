import { createEntidadMutationHook } from "./createEntidadMutationHook";

/**
 * Hooks para CRUD de contactos de entidad
 * Endpoints:
 *  - POST /api/appweb/insertar-entidad-contacto
 *  - POST /api/appweb/actualizar-entidad-contacto
 *  - POST /api/appweb/eliminar-entidad-contacto
 *
 * Atributos (según documentación recibida):
 * NOMBRE                    OBLIGATORIO  TIPO      TAMAÑO  DESCRIPCIÓN
 * entidadcontacto_id        SI           Numérico  1-5     Requerido en actualizar y eliminar.
 * entidad_id                SI           Numérico  1-5     Requerido en insertar, actualizar y eliminar.
 * cod_tipo                  SI           Numérico  1-5     Requerido en insertar y actualizar. Nota: depende del tipo de contacto.
 * entidadcontacto_nombre    SI           Texto     75      Requerido en insertar y actualizar.
 * entidadcontacto_email     SI           Texto     75      Requerido en insertar y actualizar.
 * cod_emp                   SI           Numérico  1-5     Requerido en insertar y actualizar. Si no aplica puede ser enviado null.
 * cod_cc                    SI           Numérico  1-5     Requerido en insertar y actualizar. Si no aplica puede ser enviado null.
 * cod_estado                SI           Texto     10      Requerido al insertar y actualizar.
 * entidadcontacto_telefono  SI           Texto     1-15    Requerido en insertar y actualizar.
 * lista_cod_tipo            SI           Array     []      Requerido al insertar y actualizar. Representa lista de tipos de contacto (ej. [1,4]).
 *
 * Los hooks utilizan la misma clave de caché ("entidad-contacto") para que las
 * consultas con useFetchEntidadContacto puedan invalidarse automáticamente
 * cuando se ejecuta cualquiera de las mutaciones.
 */

export const useInsertarEntidadContacto = createEntidadMutationHook(
  ["entidad-contacto"],
  "/api/appweb/insertar-entidad-contacto",
  (res) => res,
);

export const useActualizarEntidadContacto = createEntidadMutationHook(
  ["entidad-contacto"],
  "/api/appweb/actualizar-entidad-contacto",
  (res) => res,
);

export const useEliminarEntidadContacto = createEntidadMutationHook(
  ["entidad-contacto"],
  "/api/appweb/eliminar-entidad-contacto",
  (res) => res,
);
