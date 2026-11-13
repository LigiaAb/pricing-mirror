import {
  METODO_COBERTURA,
  type TarifaCobertura,
  type TarifaCoberturaMutationPayload,
} from "../lib/metodos/cobertura";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

// Campos, tipos y payload: definición única en lib/metodos/cobertura.ts.
export const tarifaCoberturaSchema = METODO_COBERTURA.esquema;

export type { TarifaCobertura, TarifaCoberturaMutationPayload };

export type FiltrosTarifaCobertura = FiltrosMetodo;

// Monedas: consulta única en ./monedas.ts (se conservan los nombres de este método).
export {
  type MonedaOperativa as MonedaCobertura,
  monedaOperativaSchema as monedaCoberturaSchema,
  monedasOperativasOptions as monedasCoberturaOptions,
  useMonedasOperativas as useMonedasCobertura,
} from "./monedas";

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
