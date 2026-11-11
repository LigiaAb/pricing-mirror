import { z } from "zod";

import { zId } from "@/shared/lib/zod-scalars";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

export const tarifaEquipoSchema = z
  .object({
    cod_tarifa_equipo: zId,
    cod_metodo: zId.nullable(),
    cod_equipo: zId.nullable(),

    costo: z.union([z.string(), z.number()]).nullable(),

    venta: z.union([z.string(), z.number()]).nullable(),

    cod_moneda_costo: zId.nullable(),
    cod_moneda_venta: zId.nullable(),

    cod_estado: zId.nullable(),
  })
  .passthrough();

export type TarifaEquipo = z.infer<typeof tarifaEquipoSchema>;

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

/* ==========================================================================
 * MUTATIONS
 * ========================================================================== */

export type TarifaEquipoMutationPayload = {
  cod_tarifa_equipo?: string | number | null;

  cod_metodo: string | number;

  cod_equipo: string | number | null;

  costo: number;
  venta: number;

  cod_moneda_costo: string | number | null;

  cod_moneda_venta: string | number | null;

  cod_estado: string | number;
};

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
