import { z } from "zod";
import { zBool, zId, zStrNull } from "@/shared/lib/zod-scalars";
import { createCatalogo, createCatalogoMutation } from "./create-catalogo";

const rubroSchema = z.object({
  cod_rubro: zId,
  codRubro: zId.optional(),
  nombre: z.string(),
  cod_estado: zId,
  fecha_inicio: z.string(),
  fecha_final: zStrNull,
  es_flete: zBool.catch(false),
});

export type Rubro = z.infer<typeof rubroSchema>;

export interface RubroNombre {
  cod_rubro_nombre: string | number;
  nombre: string;
  cod_rubro: string | number;
  cod_estado: string | number;
  estado_desc?: string;
}

export interface RubroIdentificacion {
  cod_rubro_identificacion: string | number;
  codigo: string;
  cod_rubro: string | number;
  cod_tipo: string | number;
  cod_estado: string | number;
  estado_desc?: string;
}

export interface RubroCenco {
  cod_rubro_cenco: string | number;
  cod_rubro: string | number;
  cod_empresa: string | number;
  cod_cc: string | number;
  cod_estado: string | number;
  estado_desc?: string;
}

const base = createCatalogo({
  nombre: "rubros",
  schema: rubroSchema,
  endpoints: {
    lista: "/api/appweb/lista-rubros",
    insertar: "api/appweb/insertar-rubros",
    actualizar: "api/appweb/actualizar-rubros",
  },
});

/** Sub-recursos del rubro (nombres, identificaciones, cencos) — invalidan el mismo catálogo. */
export const rubros = {
  ...base,
  useInsertarNombre: createCatalogoMutation(base.keys.all, "api/appweb/insertar-nombres-rubros"),
  useActualizarNombre: createCatalogoMutation(
    base.keys.all,
    "api/appweb/actualizar-nombres-rubros",
  ),
  useEliminarNombre: createCatalogoMutation(base.keys.all, "api/appweb/eliminar-nombres-rubros"),
  useInsertarIdentificacion: createCatalogoMutation(
    base.keys.all,
    "api/appweb/insertar-identificacion-rubros",
  ),
  useActualizarIdentificacion: createCatalogoMutation(
    base.keys.all,
    "api/appweb/actualizar-identificacion-rubros",
  ),
  useEliminarIdentificacion: createCatalogoMutation(
    base.keys.all,
    "api/appweb/eliminar-identificacion-rubros",
  ),
  useInsertarCenco: createCatalogoMutation(base.keys.all, "api/appweb/insertar-rubros-cenco"),
  useActualizarCenco: createCatalogoMutation(base.keys.all, "api/appweb/actualizar-rubros-cenco"),
  useEliminarCenco: createCatalogoMutation(base.keys.all, "api/appweb/eliminar-rubros-cenco"),
};
