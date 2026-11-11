import type { UseMutationResult } from "@tanstack/react-query";
import type { z } from "zod";
import { createCatalogo } from "@/features/catalogos";
import { CACHE_DYNAMIC } from "@/shared/api/cache";

/* ==========================================================================
 * MÉTODOS DE TARIFA SOBRE createCatalogo (fábrica estándar del proyecto)
 *
 * Toda la lógica de consulta y mutación la hace `createCatalogo`
 * (@/features/catalogos): caché, validación zod, exigirExitoDeMutacion,
 * invalidación y toasts vía `meta`.
 *
 * Este adaptador solo agrega lo propio de los métodos de tarifa:
 *   - Filtros con los nombres que usan los componentes ({ codMetodo, codEstado })
 *     traducidos a los del API ({ cod_metodo, cod_estado }).
 *   - "Eliminar" = enviar cod_estado = 4 (inactivo).
 *   - El tipo del payload de cada método en las mutaciones.
 * ========================================================================== */

type Id = string | number;

/** cod_estado con el que el sistema marca un registro como eliminado (inactivo). */
export const COD_ESTADO_ELIMINADO = 4;

/** Filtros de las consultas de métodos, como los usan los componentes. */
export interface FiltrosMetodo {
  codMetodo?: Id | null | undefined;
  codEstado?: Id | null | undefined;
}

type ConfigCatalogoMetodo<TSchema extends z.ZodType> = {
  /** Nombre del catálogo (raíz de sus query keys). Debe ser único. */
  nombre: string;
  schema: TSchema;
  /** Endpoints sin el prefijo "/api/appweb/". */
  endpoints: {
    lista: string;
    insertar?: string;
    actualizar?: string;
    /** Si se omite, "eliminar" usa el endpoint de actualizar. */
    eliminar?: string;
  };
  /** Si la consulta también manda cod_estado. */
  enviarEstado?: boolean;
  /** Cuándo se ejecuta la consulta. Por defecto: cuando hay codMetodo. */
  habilitado?: (filtros: FiltrosMetodo) => boolean;
};

const URL_BASE = "/api/appweb/";

/** Mutación con el payload tipado del método. */
type MutacionMetodo<Payload> = UseMutationResult<Record<string, unknown>, Error, Payload>;

export function crearCatalogoMetodo<TSchema extends z.ZodType, Payload>(
  config: ConfigCatalogoMetodo<TSchema>,
) {
  const { endpoints, enviarEstado = false } = config;
  const habilitado = config.habilitado ?? ((filtros: FiltrosMetodo) => filtros.codMetodo != null);
  const conBase = (endpoint?: string) => (endpoint ? `${URL_BASE}${endpoint}` : undefined);

  const aFiltrosApi = (filtros: FiltrosMetodo = {}) =>
    enviarEstado
      ? { cod_estado: filtros.codEstado, cod_metodo: filtros.codMetodo }
      : { cod_metodo: filtros.codMetodo };

  const catalogo = createCatalogo({
    nombre: config.nombre,
    schema: config.schema,
    endpoints: {
      lista: `${URL_BASE}${endpoints.lista}`,
      ...(endpoints.insertar ? { insertar: `${URL_BASE}${endpoints.insertar}` } : {}),
      ...(endpoints.actualizar ? { actualizar: `${URL_BASE}${endpoints.actualizar}` } : {}),
      ...(conBase(endpoints.eliminar ?? endpoints.actualizar)
        ? { eliminar: conBase(endpoints.eliminar ?? endpoints.actualizar) as string }
        : {}),
    },
    cache: CACHE_DYNAMIC,
    habilitado: (filtros) =>
      habilitado({
        codMetodo: filtros.cod_metodo as Id | null | undefined,
        codEstado: filtros.cod_estado as Id | null | undefined,
      }),
  });

  const listaOptions = (filtros: FiltrosMetodo = {}) => catalogo.listaOptions(aFiltrosApi(filtros));

  const useLista = (
    filtros: FiltrosMetodo = {},
    overrides?: Parameters<typeof catalogo.useLista>[1],
  ) => catalogo.useLista(aFiltrosApi(filtros), overrides);

  const useInsertar = (...args: Parameters<typeof catalogo.useInsertar>) =>
    catalogo.useInsertar(...args) as unknown as MutacionMetodo<Payload>;

  const useActualizar = (...args: Parameters<typeof catalogo.useActualizar>) =>
    catalogo.useActualizar(...args) as unknown as MutacionMetodo<Payload>;

  /** Eliminar = enviar el registro con cod_estado = 4. */
  const useEliminar = (
    ...args: Parameters<typeof catalogo.useEliminar>
  ): MutacionMetodo<Payload> => {
    const mutacion = catalogo.useEliminar(...args);

    const conEstado = (payload: Payload | undefined) => ({
      ...(payload as Record<string, unknown>),
      cod_estado: COD_ESTADO_ELIMINADO,
    });

    return {
      ...mutacion,
      mutate: (payload, opciones) => mutacion.mutate(conEstado(payload), opciones as never),
      mutateAsync: (payload, opciones) =>
        mutacion.mutateAsync(conEstado(payload), opciones as never),
    } as MutacionMetodo<Payload>;
  };

  return {
    catalogo,
    keys: catalogo.keys,
    listaOptions,
    useLista,
    useInsertar,
    useActualizar,
    useEliminar,
  };
}
