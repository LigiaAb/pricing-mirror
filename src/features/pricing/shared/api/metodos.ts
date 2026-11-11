import { z } from "zod";
import { createCatalogo } from "@/features/catalogos";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { zId } from "@/shared/lib/zod-scalars";

export const metodoSchema = z.object({
  cod_metodo: zId,
  cod_servicio: zId.nullable().optional(),
  cod_tipo: zId.nullable().optional(),
  cod_tipo_tarifa: zId.optional(),
  todos_los_paises: z.boolean().nullable().optional(),
  todos_los_clientes: z.boolean().nullable().optional(),
  todos_los_commodities: z.boolean().nullable().optional(),
  fecha_inicial: z.coerce.date().optional(),
  fecha_final: z.coerce.date().nullable().optional(),
  cod_estado: zId.optional(),
  minimo: z.coerce.number().nullable().optional(),
});

export type Metodo = z.infer<typeof metodoSchema>;

export const metodos = createCatalogo({
  nombre: "metodos",
  schema: metodoSchema,
  endpoints: {
    lista: "/api/appweb/lista-metodos",
    insertar: "/api/appweb/insertar-metodos",
    actualizar: "/api/appweb/actualizar-metodos",
  },
  cache: CACHE_DYNAMIC,
});

/*
 * Compatibilidad con los consumidores actuales de Pricing.
 *
 * El catálogo recibe los filtros con los nombres reales de la API.
 * Estas funciones conservan la interfaz anterior para no obligar a modificar
 * useCatalogosTarifas, creacion-tarifa y sus consumidores en el mismo cambio.
 */
export interface FiltrosMetodos {
  codEstado?: string | number;
  codServicio?: string | number;
  codMetodo?: string | number | null;
}

function convertirFiltros(filtros: FiltrosMetodos = {}) {
  return {
    cod_estado: filtros.codEstado,
    cod_servicio: filtros.codServicio,
    cod_metodo: filtros.codMetodo,
  };
}

export const METODOS_QUERY_KEY = metodos.keys.all;

export const metodosOptions = (filtros: FiltrosMetodos = {}) =>
  metodos.listaOptions(convertirFiltros(filtros));

export function useMetodos(filtros: FiltrosMetodos = {}) {
  return metodos.useLista(convertirFiltros(filtros));
}

export type MetodoMutationPayload = Record<string, unknown>;

export const useInsertarMetodo = metodos.useInsertar;
export const useActualizarMetodo = metodos.useActualizar;
