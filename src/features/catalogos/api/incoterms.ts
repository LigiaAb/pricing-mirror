import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const incotermSchema = z.object({
  incoterm_id: zId,
  nombre: z.string(),
  descripcion: z.string(),
  codigo: zId.optional(),
  cod_incoterm: zId.optional(),
  nombre_eng: z.string().optional(),
});

export interface Incoterm {
  codigo: string | number;
  incoterm_id: string | number;
  nombre_eng: string;
  nombre: string;
  descripcion: string;
}

export const incoterms = createCatalogo({
  nombre: "incoterms",
  schema: incotermSchema,
  endpoints: {
    lista: "/api/appweb/lista-incoterm",
    insertar: "/api/appweb/insertar-incoterm",
    actualizar: "/api/appweb/actualizar-incoterm",
    eliminar: "/api/appweb/eliminar-incoterm",
  },
  map: (raw): Incoterm => ({
    codigo: raw.codigo ?? raw.cod_incoterm ?? "",
    incoterm_id: raw.incoterm_id,
    nombre: raw.nombre,
    nombre_eng: raw.nombre_eng ?? "",
    descripcion: raw.descripcion,
  }),
});
