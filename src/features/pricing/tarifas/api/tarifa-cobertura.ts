import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

export const tarifaCoberturaSchema = z
  .object({
    cod_tarifa_cobertura: zId,
    cod_metodo: zId.nullable(),

    porcentaje_costo: z.union([z.string(), z.number()]).nullable(),

    porcentaje_venta: z.union([z.string(), z.number()]).nullable(),

    minimo_costo: z.union([z.string(), z.number()]).nullable(),

    minimo_venta: z.union([z.string(), z.number()]).nullable(),

    cod_moneda_costo: zId.nullable(),
    cod_moneda_venta: zId.nullable(),

    cod_rubro: zId.nullable().optional(),

    cod_estado: zId,
  })
  .passthrough();

export type TarifaCobertura = z.infer<typeof tarifaCoberturaSchema>;

export type FiltrosTarifaCobertura = FiltrosMetodo;

// Monedas: consulta única en ./monedas.ts (se conservan los nombres de este método).
export {
  type MonedaOperativa as MonedaCobertura,
  monedaOperativaSchema as monedaCoberturaSchema,
  monedasOperativasOptions as monedasCoberturaOptions,
  useMonedasOperativas as useMonedasCobertura,
} from "./monedas";

export type TarifaCoberturaMutationPayload = {
  cod_tarifa_cobertura?: string | number | null;

  cod_metodo: string | number;

  porcentaje_costo: number;
  porcentaje_venta: number;

  minimo_costo: number;
  minimo_venta: number;

  cod_moneda_costo: string | number | null;
  cod_moneda_venta: string | number | null;

  cod_rubro: string | number | null;

  cod_estado: string | number;
};

/* CONSULTA Y MUTACIONES (createCatalogo vía crearCatalogoMetodo) */

const api = crearCatalogoMetodo<typeof tarifaCoberturaSchema, TarifaCoberturaMutationPayload>({
  nombre: "tarifas-cobertura",
  schema: tarifaCoberturaSchema,
  endpoints: {
    lista: "lista-tarifa-cobertura",
    insertar: "insertar-tarifa-cobertura",
    actualizar: "actualizar-tarifa-cobertura",
  },
});

export const TARIFA_COBERTURA_QUERY_KEY = api.keys.all;

export const {
  listaOptions: tarifaCoberturaOptions,
  useLista: useTarifaCobertura,
  useInsertar: useInsertarTarifaCobertura,
  useActualizar: useActualizarTarifaCobertura,
} = api;
