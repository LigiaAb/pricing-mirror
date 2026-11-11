import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { z } from "zod";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";

/* ==========================================================================
 * FÁBRICA DE API PARA LOS MÉTODOS DE TARIFA
 *
 * Todos los métodos (cobertura, porcentaje, equipo, scalling, ...) tienen la
 * misma forma: listar por cod_metodo, insertar, actualizar y "eliminar"
 * (actualizar con cod_estado = INACTIVO). Antes cada archivo repetía ese
 * código; ahora cada archivo solo declara lo que le es propio:
 *
 *   const api = crearApiMetodo<typeof miSchema, MiPayload>({
 *     queryKey: ["tarifas", "mi-metodo"],
 *     esquema: miSchema,
 *     endpoints: { lista: "lista-x", insertar: "insertar-x", actualizar: "actualizar-x" },
 *   });
 *
 * y re-exporta los hooks con sus nombres de siempre.
 * ========================================================================== */

type Id = string | number;

/** cod_estado con el que el sistema marca un registro como eliminado (inactivo). */
export const COD_ESTADO_ELIMINADO = 4;

/** Filtros comunes de las consultas de métodos. */
export interface FiltrosMetodo {
  codMetodo?: Id | null | undefined;
  codEstado?: Id | null | undefined;
}

type ConfigApiMetodo<Esquema extends z.ZodTypeAny> = {
  /** Llave de caché; las mutaciones invalidan todo lo que empiece con ella. */
  queryKey: readonly string[];

  /** Validación de cada registro de la lista. */
  esquema: Esquema;

  /** Endpoints sin el prefijo "/api/appweb/". */
  endpoints: {
    lista: string;
    insertar?: string;
    actualizar?: string;
    /** Por defecto "eliminar" usa el endpoint de actualizar con cod_estado = 4. */
    eliminar?: string;
  };

  /** Si la consulta también manda cod_estado (algunos métodos lo usan). */
  enviarEstado?: boolean;

  /** Cuándo se ejecuta la consulta. Por defecto: cuando hay codMetodo. */
  habilitado?: (filtros: FiltrosMetodo) => boolean;
};

const URL_BASE = "/api/appweb/";

function endpointRequerido(endpoint: string | undefined, accion: string, lista: string) {
  if (!endpoint) {
    throw new Error(`El método "${lista}" no tiene endpoint para ${accion}.`);
  }

  return `${URL_BASE}${endpoint}`;
}

export function crearApiMetodo<Esquema extends z.ZodTypeAny, Payload>(
  config: ConfigApiMetodo<Esquema>,
) {
  const { queryKey, esquema, endpoints, enviarEstado = false } = config;
  const habilitado = config.habilitado ?? ((filtros: FiltrosMetodo) => filtros.codMetodo != null);

  /* ----------------------------- CONSULTA ----------------------------- */

  const listaOptions = (filtros: FiltrosMetodo = {}) =>
    queryOptions({
      ...CACHE_DYNAMIC,

      queryKey: [...queryKey, filtros],

      queryFn: async () =>
        parseEnvelope(
          await http.get<unknown>(`${URL_BASE}${endpoints.lista}`, {
            params: enviarEstado
              ? { cod_estado: filtros.codEstado, cod_metodo: filtros.codMetodo }
              : { cod_metodo: filtros.codMetodo },
          }),
          esquema,
          endpoints.lista,
        ),

      enabled: habilitado(filtros),
    });

  function useLista(filtros: FiltrosMetodo = {}) {
    return useQuery(listaOptions(filtros));
  }

  /* ---------------------------- MUTACIONES ---------------------------- */

  const insertarOptions = () =>
    mutationOptions({
      mutationFn: (payload: Payload) =>
        http.post<unknown>(
          endpointRequerido(endpoints.insertar, "insertar", endpoints.lista),
          payload,
        ),
    });

  const actualizarOptions = () =>
    mutationOptions({
      mutationFn: (payload: Payload) =>
        http.post<unknown>(
          endpointRequerido(endpoints.actualizar, "actualizar", endpoints.lista),
          payload,
        ),
    });

  const eliminarOptions = () =>
    mutationOptions({
      mutationFn: (payload: Payload) =>
        http.post<unknown>(
          endpointRequerido(
            endpoints.eliminar ?? endpoints.actualizar,
            "eliminar",
            endpoints.lista,
          ),
          { ...payload, cod_estado: COD_ESTADO_ELIMINADO },
        ),
    });

  /** Envuelve una mutación para que, al terminar bien, refresque la lista. */
  function useMutacionQueRefresca<TOptions extends ReturnType<typeof insertarOptions>>(
    options: TOptions,
  ) {
    const queryClient = useQueryClient();

    return useMutation({
      ...options,

      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey });
      },
    });
  }

  const useInsertar = () => useMutacionQueRefresca(insertarOptions());
  const useActualizar = () => useMutacionQueRefresca(actualizarOptions());
  const useEliminar = () => useMutacionQueRefresca(eliminarOptions());

  return {
    queryKey,
    listaOptions,
    useLista,
    insertarOptions,
    actualizarOptions,
    eliminarOptions,
    useInsertar,
    useActualizar,
    useEliminar,
  };
}
