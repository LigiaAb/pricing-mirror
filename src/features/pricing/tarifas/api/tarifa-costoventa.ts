import {
  METODO_COSTO_VENTA,
  type TarifaCostoVenta,
  type TarifaCostoVentaMutationPayload,
} from "../lib/metodos/costo-venta";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

// Campos, tipos y payload: definición única en lib/metodos/costo-venta.ts.
export const tarifaCostoVentaSchema = METODO_COSTO_VENTA.esquema;

export type { TarifaCostoVenta, TarifaCostoVentaMutationPayload };

export type FiltrosTarifaCostoVenta = FiltrosMetodo;

// Monedas: consulta única en ./monedas.ts (se conservan los nombres de este método).
export {
  type MonedaOperativa as MonedaCostoVenta,
  monedaOperativaSchema as monedaCostoVentaSchema,
  monedasOperativasOptions as monedasCostoVentaOptions,
  useMonedasOperativas as useMonedasCostoVenta,
} from "./monedas";

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
