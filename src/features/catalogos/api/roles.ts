import { z } from "zod";
import { zId, zStrNullOpt } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const rolSchema = z.object({
  cod_rol: zId,
  rol_desc: z.string(),
  cod_estado: zId,
  estado_desc: z.string().catch(""),
  fecha_reg: zStrNullOpt,
  fecha_ultimo_cambio: zStrNullOpt,
  json_rol: zStrNullOpt,
});

export interface Rol {
  codRol: string | number;
  rolDesc: string;
  codEstado: string | number;
  estadoDesc: string;
  fechaReg: string | undefined | null;
  fechaUltimoCambio: string | undefined | null;
  jsonRol: string | undefined | null;
  value: string | number;
  label: string;
}

export const roles = createCatalogo({
  nombre: "lista-rol",
  schema: rolSchema,
  endpoints: {
    lista: "/api/appweb/lista-rol",
    insertar: "/api/appweb/insertar-rol",
    actualizar: "/api/appweb/actualizar-rol",
    eliminar: "/api/appweb/eliminar-rol",
  },
  map: (raw): Rol => ({
    codRol: raw.cod_rol,
    rolDesc: raw.rol_desc,
    codEstado: raw.cod_estado,
    estadoDesc: raw.estado_desc,
    fechaReg: raw.fecha_reg,
    fechaUltimoCambio: raw.fecha_ultimo_cambio,
    jsonRol: raw.json_rol,
    value: raw.cod_rol,
    label: raw.rol_desc,
  }),
});
