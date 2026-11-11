import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

export const tarifaScallingSchema = z
  .object({
    cod_tarifa_scalling: zId,
    cod_metodo: zId.nullable(),
    cod_puntoenlace: zId.nullable(),
    costo: z.union([z.string(), z.number()]).nullable(),
    cod_moneda: zId.nullable(),
    cod_estado: zId,
  })
  .passthrough();

export type TarifaScalling = z.infer<typeof tarifaScallingSchema>;

export type FiltrosTarifaScalling = FiltrosMetodo;

/* MONEDAS */

// Monedas: consulta única en ./monedas.ts (se conservan los nombres de este método).
export {
  monedaOperativaSchema as monedaScallingSchema,
  monedasOperativasOptions as monedasScallingOptions,
  type MonedaOperativa as MonedaScalling,
  useMonedasOperativas as useMonedasScalling,
} from "./monedas";

/* MUTATIONS */

export type TarifaScallingMutationPayload = {
  cod_tarifa_scalling?: string | number | null;
  cod_metodo: string | number;
  cod_puntoenlace: string | number | null;
  costo: string | number | null;
  cod_moneda: string | number;
  cod_estado: string | number;
};

/* CONSULTA Y MUTACIONES (createCatalogo vía crearCatalogoMetodo) */

const api = crearCatalogoMetodo<typeof tarifaScallingSchema, TarifaScallingMutationPayload>({
  nombre: "tarifas-scalling",
  schema: tarifaScallingSchema,
  endpoints: { lista: "lista-tarifa-scalling", insertar: "insertar-tarifa-scalling", actualizar: "actualizar-tarifa-scalling" },
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
