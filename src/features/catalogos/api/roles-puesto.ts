import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const rolPuestoSchema = z.object({
  cod_puesto: zId,
  nom_puesto: z.string().catch(""),
  cod_rol: zId,
  rol_desc: z.string().catch(""),
  cod_estado: zId,
  estado_desc: z.string().catch(""),
  fecha_reg: z.string().catch(""),
});

export interface RolPuesto {
  codPuesto: string | number;
  nomPuesto: string;
  codRol: string | number;
  rolDesc: string;
  codEstado: string | number;
  estadoDesc: string;
  fechaReg: string;
}

export const rolesPuesto = createCatalogo({
  nombre: "lista-rolxpuesto",
  schema: rolPuestoSchema,
  endpoints: {
    lista: "/api/appweb/lista-rolxpuesto",
    insertar: "/api/appweb/insertar-rolxpuesto",
    eliminar: "/api/appweb/eliminar-rolxpuesto",
  },
  map: (raw): RolPuesto => ({
    codPuesto: raw.cod_puesto,
    nomPuesto: raw.nom_puesto,
    codRol: raw.cod_rol,
    rolDesc: raw.rol_desc,
    codEstado: raw.cod_estado,
    estadoDesc: raw.estado_desc,
    fechaReg: raw.fecha_reg,
  }),
});
