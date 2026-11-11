import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

export const tarifaPorcentajeSchema = z
  .object({
    cod_tarifa_porcentaje: zId,
    cod_metodo: zId.nullable(),

    porcentaje_costo: z.union([z.string(), z.number()]).nullable(),

    porcentaje_venta: z.union([z.string(), z.number()]).nullable(),

    minimo_costo: z.union([z.string(), z.number()]).nullable(),
    minimo_venta: z.union([z.string(), z.number()]).nullable(),

    cod_moneda_costo: zId.nullable(),
    cod_moneda_venta: zId.nullable(),

    cod_rubro: zId.nullable(),

    cod_estado: zId,
  })
  .passthrough();

export type TarifaPorcentaje = z.infer<typeof tarifaPorcentajeSchema>;

export type FiltrosTarifaPorcentaje = FiltrosMetodo;

// Monedas: consulta única en ./monedas.ts (se conservan los nombres de este método).
export {
  monedaOperativaSchema as monedaPorcentajeSchema,
  monedasOperativasOptions as monedasPorcentajeOptions,
  type MonedaOperativa as MonedaPorcentaje,
  useMonedasOperativas as useMonedasPorcentaje,
} from "./monedas";

export type TarifaPorcentajeMutationPayload = {
  cod_tarifa_porcentaje?: string | number | null;

  cod_metodo: string | number;

  porcentaje_costo: number;
  porcentaje_venta: number;

  minimo_costo: number;
  minimo_venta: number;

  cod_rubro: string | number | null;

  cod_moneda_costo: string | number | null;
  cod_moneda_venta: string | number | null;

  cod_estado: string | number;
};

/* CONSULTA Y MUTACIONES (createCatalogo vía crearCatalogoMetodo) */

const api = crearCatalogoMetodo<typeof tarifaPorcentajeSchema, TarifaPorcentajeMutationPayload>({
  nombre: "tarifas-porcentaje",
  schema: tarifaPorcentajeSchema,
  endpoints: { lista: "lista-tarifa-porcentaje-rubro", insertar: "insertar-tarifa-porcentaje-rubro", actualizar: "actualizar-tarifa-porcentaje-rubro" },
});

export const TARIFA_PORCENTAJE_QUERY_KEY = api.keys.all;

export const {
  listaOptions: tarifaPorcentajeOptions,
  useLista: useTarifaPorcentaje,
  useInsertar: useInsertarTarifaPorcentaje,
  useActualizar: useActualizarTarifaPorcentaje,
} = api;
