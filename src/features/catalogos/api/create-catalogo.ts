import {
  type MutationMeta,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { z } from "zod";
import { CACHE_SEMI_STATIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { exigirExitoDeMutacion } from "@/shared/api/respuesta-mutacion";

export type Filtros = Record<string, unknown>;

/** Overrides permitidos por call site. */
interface ListaOverrides<TItem> {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean | "always";
  select?: (data: TItem[]) => TItem[];
}

interface CatalogoConfig<TSchema extends z.ZodType, TItem> {
  /** Nombre del catálogo; raíz de sus query keys. */
  nombre: string;
  /** Schema zod del item crudo del API (única definición del tipo). */
  schema: TSchema;
  endpoints: {
    lista: string;
    insertar?: string;
    actualizar?: string;
    eliminar?: string;
  };
  /** Adaptador HTTP; `http` (proxy con sesión) si se omite. `httpPublic` para catálogos de /clientes/api. */
  client?: Pick<typeof http, "get">;
  /** Mapeo crudo → modelo de UI; identidad si se omite. */
  map?: (raw: z.output<TSchema>) => TItem;
  /** Extractor opcional cuando la respuesta no viene como un arreglo directo. */
  extractor?: (data: unknown) => z.output<TSchema>[];
  /** Política de caché; CACHE_SEMI_STATIC si se omite. */
  cache?: {
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
  };
  /** Condición para ejecutar la query en función de los filtros (p. ej. municipios requiere cod_depto). */
  habilitado?: (filtros: Filtros) => boolean;
}

interface MutationOpciones {
  meta?: MutationMeta;
}

/**
 * Mutación que invalida un prefijo de query keys al asentarse.
 * El toast de error/éxito lo emite el MutationCache global vía `meta`
 * (sección 5.3 del plan) — cero toasts en call sites.
 */
export function createCatalogoMutation(invalidar: readonly unknown[], endpoint: string) {
  return function useCatalogoMutation(opciones: MutationOpciones = {}) {
    const queryClient = useQueryClient();
    return useMutation<Record<string, unknown>, Error, Record<string, unknown>>({
      mutationFn: (payload: Record<string, unknown>) =>
        http.post<Record<string, unknown>>(endpoint, payload).then((respuesta) => {
          exigirExitoDeMutacion(respuesta, "La operación no se completó");
          return respuesta;
        }),
      ...(opciones.meta ? { meta: opciones.meta } : {}),
      onSettled: () => queryClient.invalidateQueries({ queryKey: invalidar }),
    });
  };
}

function crearMutacionFaltante(nombre: string, accion: string) {
  return function useMutacionNoConfigurada(_opciones: MutationOpciones = {}): never {
    throw new Error(`Catálogo '${nombre}': endpoint '${accion}' no configurado`);
  };
}

/**
 * Factory de catálogos: queryOptions + hooks de lista y mutaciones CRUD
 * sobre el sobre estándar del API, con validación zod por item.
 * Cada catálogo se define de forma declarativa en ~20 líneas (ver monedas.ts).
 */
export function createCatalogo<TSchema extends z.ZodType, TItem = z.output<TSchema>>(
  config: CatalogoConfig<TSchema, TItem>,
) {
  const keys = {
    all: [config.nombre] as const,
    lista: (filtros: Filtros = {}) => [config.nombre, "lista", filtros] as const,
  };

  async function fetchLista(filtros: Filtros = {}): Promise<TItem[]> {
    const cliente = config.client ?? http;
    const res = await cliente.get<unknown>(config.endpoints.lista, { params: filtros });
    const items = config.extractor
      ? config.extractor(res)
      : parseEnvelope(res, config.schema, config.nombre);
    return (config.map ? items.map(config.map) : items) as TItem[];
  }

  const listaOptions = (filtros: Filtros = {}) =>
    queryOptions({
      queryKey: keys.lista(filtros),
      queryFn: () => fetchLista(filtros),
      enabled: config.habilitado ? config.habilitado(filtros) : true,
      ...(config.cache ?? CACHE_SEMI_STATIC),
    });

  const useLista = (filtros: Filtros = {}, overrides?: ListaOverrides<TItem>) =>
    useQuery({ ...listaOptions(filtros), ...overrides });

  const crearMutacion = (endpoint: string | undefined, accion: string) =>
    endpoint
      ? createCatalogoMutation(keys.all, endpoint)
      : crearMutacionFaltante(config.nombre, accion);

  return {
    keys,
    fetchLista,
    listaOptions,
    useLista,
    useInsertar: crearMutacion(config.endpoints.insertar, "insertar"),
    useActualizar: crearMutacion(config.endpoints.actualizar, "actualizar"),
    useEliminar: crearMutacion(config.endpoints.eliminar, "eliminar"),
  };
}
