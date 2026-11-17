import { z } from "zod";
import { zId, zIdNullOpt, zStrNullOpt } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const tipoPuestoSchema = z.object({
  tipo_id: zId,
  tipo_tabla: z.string().catch(""),
  tipo_descripcion: z.string().catch(""),
  estado_id: zId,
  tipo_modificable: zIdNullOpt,
  tipodato_id: zIdNullOpt,
  tipo_operativo: zIdNullOpt,
  nomenclatura: zStrNullOpt,
});

export interface TipoPuesto {
  tipoId: string | number;
  tipoTabla: string;
  tipoDescripcion: string;
  estadoId: string | number;
  tipoModificable: string | number | undefined | null;
  tipoDatoId: string | number | undefined | null;
  tipoOperativo: string | number | undefined | null;
  nomenclatura: string | undefined | null;
  value: string | number;
  label: string;
}

export const tiposPuesto = createCatalogo({
  nombre: "getTipoPuesto",
  schema: tipoPuestoSchema,
  endpoints: { lista: "/api/appweb/getTipoPuesto" },
  map: (raw): TipoPuesto => ({
    tipoId: raw.tipo_id,
    tipoTabla: raw.tipo_tabla,
    tipoDescripcion: raw.tipo_descripcion,
    estadoId: raw.estado_id,
    tipoModificable: raw.tipo_modificable,
    tipoDatoId: raw.tipodato_id,
    tipoOperativo: raw.tipo_operativo,
    nomenclatura: raw.nomenclatura,
    value: raw.tipo_id,
    label: raw.tipo_descripcion,
  }),
});
