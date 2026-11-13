import {
  METODO_PORCENTAJE,
  type TarifaPorcentaje,
  type TarifaPorcentajeMutationPayload,
} from "../lib/metodos/porcentaje";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

// Campos, tipos y payload: definición única en lib/metodos/porcentaje.ts.
export const tarifaPorcentajeSchema = METODO_PORCENTAJE.esquema;

export type { TarifaPorcentaje, TarifaPorcentajeMutationPayload };

export type FiltrosTarifaPorcentaje = FiltrosMetodo;

// Monedas: consulta única en ./monedas.ts (se conservan los nombres de este método).
export {
  type MonedaOperativa as MonedaPorcentaje,
  monedaOperativaSchema as monedaPorcentajeSchema,
  monedasOperativasOptions as monedasPorcentajeOptions,
  useMonedasOperativas as useMonedasPorcentaje,
} from "./monedas";

/* CONSULTA Y MUTACIONES (createCatalogo vía crearCatalogoMetodo) */

const api = crearCatalogoMetodo<typeof tarifaPorcentajeSchema, TarifaPorcentajeMutationPayload>({
  nombre: "tarifas-porcentaje",
  schema: tarifaPorcentajeSchema,
  endpoints: {
    lista: "lista-tarifa-porcentaje-rubro",
    insertar: "insertar-tarifa-porcentaje-rubro",
    actualizar: "actualizar-tarifa-porcentaje-rubro",
  },
});

export const TARIFA_PORCENTAJE_QUERY_KEY = api.keys.all;

export const {
  listaOptions: tarifaPorcentajeOptions,
  useLista: useTarifaPorcentaje,
  useInsertar: useInsertarTarifaPorcentaje,
  useActualizar: useActualizarTarifaPorcentaje,
} = api;
