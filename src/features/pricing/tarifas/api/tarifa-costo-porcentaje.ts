import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

export const tarifaCostoPorcentajejeSchema = z
  .object({
    cod_tarifa_porcentaje: zId,
    cod_metodo: zId.nullable(),

    porcentaje_costo: z.union([z.string(), z.number()]).nullable(),
    porcentaje_venta: z.union([z.string(), z.number()]).nullable(),

    minimo_costo: z.union([z.string(), z.number()]).nullable(),
    minimo_venta: z.union([z.string(), z.number()]).nullable(),

    cod_moneda_costo: zId.nullable(),
    cod_moneda_venta: zId.nullable(),

    es_porcentaje: z.boolean(),

    cod_estado: zId,
  })
  .passthrough();

export type TarifaCostoPorcentajeje = z.infer<typeof tarifaCostoPorcentajejeSchema>;

export type FiltrosTarifaCostoPorcentaje = FiltrosMetodo;

// Monedas: consulta única en ./monedas.ts (se conservan los nombres de este método).
export {
  monedaOperativaSchema as monedaPorcentajeSchema,
  monedasOperativasOptions as monedasPorcentajeOptions,
  type MonedaOperativa as MonedaPorcentaje,
  useMonedasOperativas as useMonedasPorcentaje,
} from "./monedas";

export type TarifaCostoPorcentajejeMutationPayload = {
  cod_tarifa_porcentaje?: string | number | null;

  cod_metodo: string | number;

  porcentaje_costo: number;
  porcentaje_venta: number;

  minimo_costo: number;
  minimo_venta: number;

  cod_rubro: string | number | null;

  es_porcentaje: boolean | null;

  cod_moneda_costo: string | number | null;
  cod_moneda_venta: string | number | null;

  cod_estado: string | number;
};

/* CONSULTA Y MUTACIONES (createCatalogo vía crearCatalogoMetodo) */

const api = crearCatalogoMetodo<typeof tarifaCostoPorcentajejeSchema, TarifaCostoPorcentajejeMutationPayload>({
  nombre: "tarifas-costo-porcentaje",
  schema: tarifaCostoPorcentajejeSchema,
  endpoints: { lista: "lista-tarifa-porcentaje-cotizacion", insertar: "insertar-tarifa-porcentaje-cotizacion", actualizar: "actualizar-tarifa-porcentaje-cotizacion" },
});

export const TARIFA_PORCENTAJE_QUERY_KEY = api.keys.all;

export const {
  listaOptions: tarifaCostoPorcentajejeOptions,
  useLista: useTarifaCostoPorcentajeje,
  useInsertar: useInsertarTarifaCostoPorcentajeje,
  useActualizar: useActualizarTarifaCostoPorcentajeje,
} = api;
