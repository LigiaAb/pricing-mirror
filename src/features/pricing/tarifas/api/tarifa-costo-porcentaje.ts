import {
  METODO_COSTO_PORCENTAJE,
  type TarifaCostoPorcentaje,
  type TarifaCostoPorcentajeMutationPayload,
} from "../lib/metodos/costo-porcentaje";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

// Campos, tipos y payload: definición única en lib/metodos/costo-porcentaje.ts.
// (Se conservan los nombres existentes, con "Porcentajeje".)
export const tarifaCostoPorcentajejeSchema = METODO_COSTO_PORCENTAJE.esquema;

export type TarifaCostoPorcentajeje = TarifaCostoPorcentaje;

export type TarifaCostoPorcentajejeMutationPayload = TarifaCostoPorcentajeMutationPayload;

export type FiltrosTarifaCostoPorcentaje = FiltrosMetodo;

// Monedas: consulta única en ./monedas.ts (se conservan los nombres de este método).
export {
  type MonedaOperativa as MonedaPorcentaje,
  monedaOperativaSchema as monedaPorcentajeSchema,
  monedasOperativasOptions as monedasPorcentajeOptions,
  useMonedasOperativas as useMonedasPorcentaje,
} from "./monedas";

/* CONSULTA Y MUTACIONES (createCatalogo vía crearCatalogoMetodo) */

const api = crearCatalogoMetodo<
  typeof tarifaCostoPorcentajejeSchema,
  TarifaCostoPorcentajejeMutationPayload
>({
  nombre: "tarifas-costo-porcentaje",
  schema: tarifaCostoPorcentajejeSchema,
  endpoints: {
    lista: "lista-tarifa-porcentaje-cotizacion",
    insertar: "insertar-tarifa-porcentaje-cotizacion",
    actualizar: "actualizar-tarifa-porcentaje-cotizacion",
  },
});

export const TARIFA_PORCENTAJE_QUERY_KEY = api.keys.all;

export const {
  listaOptions: tarifaCostoPorcentajejeOptions,
  useLista: useTarifaCostoPorcentajeje,
  useInsertar: useInsertarTarifaCostoPorcentajeje,
  useActualizar: useActualizarTarifaCostoPorcentajeje,
} = api;
