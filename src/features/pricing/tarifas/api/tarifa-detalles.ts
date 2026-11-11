import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

export const tarifaDetalleSchema = z
  .object({
    cod_tarifa_detalle: zId,
    descripcion: z.string().nullable(),
    valor: z.union([z.string(), z.number()]).nullable(),
    cod_metodo: zId.nullable(),
    cod_tipo: zId.nullable(),
    cod_estado: zId,
  })
  .passthrough();

export type TarifaDetalle = z.infer<typeof tarifaDetalleSchema>;

export type FiltrosTarifaDetalle = FiltrosMetodo;

export type TarifaDetalleMutationPayload = {
  cod_tarifa_detalle?: string | number | null;
  descripcion?: string | null;
  valor?: string | number | null;
  cod_metodo: string | number;
  cod_tipo?: string | number | null;
  cod_estado?: string | number | null;
};

/* CONSULTA Y MUTACIONES (createCatalogo vía crearCatalogoMetodo) */

const api = crearCatalogoMetodo<typeof tarifaDetalleSchema, TarifaDetalleMutationPayload>({
  nombre: "tarifas-detalles",
  schema: tarifaDetalleSchema,
  endpoints: { lista: "lista-tarifa-detalle", insertar: "insertar-tarifa-detalle", actualizar: "actualizar-tarifa-detalle" },
  enviarEstado: true,
});

export const TARIFA_DETALLES_QUERY_KEY = api.keys.all;

export const {
  listaOptions: tarifaDetallesOptions,
  useLista: useTarifaDetalles,
  useInsertar: useInsertarTarifaDetalle,
  useActualizar: useActualizarTarifaDetalle,
  useEliminar: useEliminarTarifaDetalle,
} = api;
