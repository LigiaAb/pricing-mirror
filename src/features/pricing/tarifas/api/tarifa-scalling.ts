import {
  METODO_SCALLING,
  type TarifaScalling,
  type TarifaScallingMutationPayload,
} from "../lib/metodos/scalling";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

// Campos, tipos y payload: definición única en lib/metodos/scalling.ts.
export const tarifaScallingSchema = METODO_SCALLING.esquema;

export type { TarifaScalling, TarifaScallingMutationPayload };

export type FiltrosTarifaScalling = FiltrosMetodo;

/* MONEDAS */

// Monedas: consulta única en ./monedas.ts (se conservan los nombres de este método).
export {
  type MonedaOperativa as MonedaScalling,
  monedaOperativaSchema as monedaScallingSchema,
  monedasOperativasOptions as monedasScallingOptions,
  useMonedasOperativas as useMonedasScalling,
} from "./monedas";

/* CONSULTA Y MUTACIONES (createCatalogo vía crearCatalogoMetodo) */

const api = crearCatalogoMetodo<typeof tarifaScallingSchema, TarifaScallingMutationPayload>({
  nombre: "tarifas-scalling",
  schema: tarifaScallingSchema,
  endpoints: {
    lista: "lista-tarifa-scalling",
    insertar: "insertar-tarifa-scalling",
    actualizar: "actualizar-tarifa-scalling",
  },
  enviarEstado: true,
});

export const TARIFA_SCALLING_QUERY_KEY = api.keys.all;

export const {
  listaOptions: tarifaScallingOptions,
  useLista: useTarifaScalling,
  useInsertar: useInsertarTarifaScalling,
  useActualizar: useActualizarTarifaScalling,
  useEliminar: useEliminarTarifaScalling,
} = api;
