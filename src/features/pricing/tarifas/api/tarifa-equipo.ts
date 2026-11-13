import {
  METODO_EQUIPO,
  type TarifaEquipo,
  type TarifaEquipoMutationPayload,
} from "../lib/metodos/equipo";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

// Campos, tipos y payload: definición única en lib/metodos/equipo.ts.
export const tarifaEquipoSchema = METODO_EQUIPO.esquema;

export type { TarifaEquipo, TarifaEquipoMutationPayload };

export type FiltrosTarifaEquipo = FiltrosMetodo;

/* ==========================================================================
 * MONEDAS
 * ========================================================================== */

// Monedas: consulta única en ./monedas.ts (se conservan los nombres de este método).
export {
  type MonedaOperativa as MonedaEquipo,
  monedaOperativaSchema as monedaEquipoSchema,
  monedasOperativasOptions as monedasEquipoOptions,
  useMonedasOperativas as useMonedasEquipo,
} from "./monedas";

/* CONSULTA Y MUTACIONES (createCatalogo vía crearCatalogoMetodo) */

const api = crearCatalogoMetodo<typeof tarifaEquipoSchema, TarifaEquipoMutationPayload>({
  nombre: "tarifas-equipo",
  schema: tarifaEquipoSchema,
  endpoints: {
    lista: "lista-tarifa-equipo",
    insertar: "insertar-tarifa-equipo",
    actualizar: "actualizar-tarifa-equipo",
  },
  enviarEstado: true,
  habilitado: (filtros) => filtros.codMetodo != null && Number(filtros.codMetodo) !== 0,
});

export const TARIFA_EQUIPO_QUERY_KEY = api.keys.all;

export const {
  listaOptions: tarifaEquipoOptions,
  useLista: useTarifaEquipo,
  useInsertar: useInsertarTarifaEquipo,
  useActualizar: useActualizarTarifaEquipo,
} = api;
