import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

export const metodoCommoditySchema = z
  .object({
    cod_metodocommodity: zId,
    cod_metodo: zId,
    cod_commodity: zId,
    cod_estado: zId,
  })
  .passthrough();

export type MetodoCommodity = z.infer<typeof metodoCommoditySchema>;

export type FiltrosMetodoCommodity = FiltrosMetodo;

export type MetodoCommodityMutationPayload = {
  cod_metodocommodity?: string | number | null;
  cod_metodo: string | number;
  cod_commodity: string | number;
  cod_estado: string | number;
};

/* CONSULTA Y MUTACIONES (createCatalogo vía crearCatalogoMetodo) */

const api = crearCatalogoMetodo<typeof metodoCommoditySchema, MetodoCommodityMutationPayload>({
  nombre: "tarifas-metodo-commodities",
  schema: metodoCommoditySchema,
  endpoints: {
    lista: "lista-metodo-commodity",
    insertar: "insertar-metodo-commodity",
    actualizar: "actualizar-metodo-commodity",
    eliminar: "eliminar-metodo-commodity",
  },
});

export const METODO_COMMODITIES_QUERY_KEY = api.keys.all;

export const {
  listaOptions: metodoCommoditiesOptions,
  useLista: useMetodoCommodities,
  useInsertar: useInsertarMetodoCommodity,
  useActualizar: useActualizarMetodoCommodity,
  useEliminar: useEliminarMetodoCommodity,
} = api;
