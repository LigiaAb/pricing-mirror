import { z } from "zod";
import { zId, zIdNull } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const tipoSchema = z.object({
  cod_tipo: zId,
  nom_tipo: z.string().catch(""),
  tipo_tabla: z.string().catch(""),
  cod_estado: zId,
  estado_desc: z.string().catch(""),
  cod_tipo_dato: zIdNull.optional(),
  nomenclatura: z.string().catch(""),
});

export interface Tipo {
  [key: string]: unknown;
  codTipo: string | number;
  nomTipo: string;
  tipoTabla: string;
  codEstado: string | number;
  estadoDesc: string;
  codTipoDato: string | number | null;
  nomenclatura: string;
  value: string | number;
  label: string;
}

export const tipos = createCatalogo({
  nombre: "lista-tipo",
  schema: tipoSchema,
  endpoints: {
    lista: "/api/appweb/lista-tipo",
    insertar: "api/appweb/insertar-tipo",
    actualizar: "api/appweb/actualizar-tipo",
    eliminar: "api/appweb/eliminar-tipo",
  },
  map: (raw): Tipo => ({
    codTipo: raw.cod_tipo,
    nomTipo: raw.nom_tipo,
    tipoTabla: raw.tipo_tabla,
    codEstado: raw.cod_estado,
    estadoDesc: raw.estado_desc,
    codTipoDato: raw.cod_tipo_dato ?? null,
    nomenclatura: raw.nomenclatura,
    value: raw.cod_tipo,
    label: raw.nom_tipo,
  }),
});
