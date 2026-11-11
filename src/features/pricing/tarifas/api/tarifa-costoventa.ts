import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

export const tarifaCostoVentaSchema = z
  .object({
    cod_tarifa_costoventa: zId,
    cod_metodo: zId.nullable(),
    costo: z.union([z.string(), z.number()]).nullable(),
    venta: z.union([z.string(), z.number()]).nullable(),
    cod_moneda_costo: zId.nullable(),
    cod_moneda_venta: zId.nullable(),
    cod_estado: zId,
  })
  .passthrough();

export type TarifaCostoVenta = z.infer<typeof tarifaCostoVentaSchema>;

export type FiltrosTarifaCostoVenta = FiltrosMetodo;

// Monedas: consulta única en ./monedas.ts (se conservan los nombres de este método).
export {
  type MonedaOperativa as MonedaCostoVenta,
  monedaOperativaSchema as monedaCostoVentaSchema,
  monedasOperativasOptions as monedasCostoVentaOptions,
  useMonedasOperativas as useMonedasCostoVenta,
} from "./monedas";

export type TarifaCostoVentaMutationPayload = {
  cod_tarifa_costoventa?: string | number | null;
  cod_metodo: string | number;
  cod_servicio?: string | number | null;

  costo: number;
  venta: number;

  cod_moneda_costo: string | number | null;
  cod_moneda_venta: string | number | null;

  cod_estado: string | number;
};

/* CONSULTA Y MUTACIONES (createCatalogo vía crearCatalogoMetodo) */

const api = crearCatalogoMetodo<typeof tarifaCostoVentaSchema, TarifaCostoVentaMutationPayload>({
  nombre: "tarifas-costoventa",
  schema: tarifaCostoVentaSchema,
  endpoints: {
    lista: "lista-tarifa-costoventa",
    insertar: "insertar-tarifa-costoventa",
    actualizar: "actualizar-tarifa-costoventa",
  },
});

export const TARIFA_COSTOVENTA_QUERY_KEY = api.keys.all;

export const {
  listaOptions: tarifaCostoVentaOptions,
  useLista: useTarifaCostoVenta,
  useInsertar: useInsertarTarifaCostoVenta,
  useActualizar: useActualizarTarifaCostoVenta,
} = api;
