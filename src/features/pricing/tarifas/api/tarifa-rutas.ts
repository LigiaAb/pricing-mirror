import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { crearCatalogoMetodo, type FiltrosMetodo } from "./catalogo-metodo";

export const tarifaRutaSchema = z.object({
  cod_tarifa_ruta: zId,

  cod_metodo: zId.nullable(),

  cod_pais: zId.nullable(),
  nombre_pais: z.string().nullable(),
  ref_pais: z.string().nullable(),

  cod_continente: zId.nullable(),
  nombre_continente: z.string().nullable(),

  cod_puntoenlace: zId.nullable(),
  nombre: z.string().nullable(),

  cod_tipo_puntoenlace: zId.nullable(),
  tipo_puntoenlace_desc: z.string().nullable(),

  cod_ciudad: zId.nullish(),

  cod_tipo_ruta: zId,
  tipo_desc: z.string(),

  cod_estado: zId,
});

export type TarifaRuta = z.infer<typeof tarifaRutaSchema>;

export type FiltrosTarifaRuta = FiltrosMetodo;

export type TarifaRutaMutationPayload = {
  cod_tarifa_ruta?: string | number | null;
  cod_continente?: string | number | null;
  cod_metodo: string | number;
  cod_pais?: string | number | null;

  cod_puntoenlace?: string | number | null;
  cod_tipo_puntoenlace?: string | number | null;
  cod_ciudad?: string | number | null;

  cod_tipo_ruta?: string | number | null;
  ruta_aplica?: boolean;
  cod_estado?: string | number | null;
};

/* CONSULTA Y MUTACIONES (createCatalogo vía crearCatalogoMetodo) */

const api = crearCatalogoMetodo<typeof tarifaRutaSchema, TarifaRutaMutationPayload>({
  nombre: "tarifas-rutas",
  schema: tarifaRutaSchema,
  endpoints: { lista: "lista-tarifa-ruta", insertar: "insertar-tarifa-ruta", actualizar: "actualizar-tarifa-ruta" },
  enviarEstado: true,
  habilitado: () => true,
});

export const TARIFA_RUTAS_QUERY_KEY = api.keys.all;

export const {
  listaOptions: tarifaRutasOptions,
  useLista: useTarifaRutas,
  useInsertar: useInsertarTarifaRuta,
  useActualizar: useActualizarTarifaRuta,
  useEliminar: useEliminarTarifaRuta,
} = api;
