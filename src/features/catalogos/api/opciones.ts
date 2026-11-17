import { z } from "zod";
import { CACHE_SEMI_STATIC } from "@/shared/api/cache";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const opcionSchema = z.object({
  cod_opcion: zId,
  nom_opcion: z.string(),
  ruta_opcion: z.string().catch(""),
  ico_opcion: z.string().catch(""),
  cod_estado: zId,
  estado_desc: z.string().catch(""),
  cod_categoria: zId,
  nom_cat: z.string().catch(""),
  fecha_reg: z.string().catch(""),
  nivel_opcion: z.string().catch(""),
});

export interface Opcion extends z.infer<typeof opcionSchema> {
  value: string | number;
  label: string;
}

export const opciones = createCatalogo({
  nombre: "opciones",
  schema: opcionSchema,
  endpoints: {
    lista: "/api/appweb/lista-opcion",
    insertar: "/api/appweb/insertar-opcion",
    actualizar: "/api/appweb/actualizar-opcion",
    eliminar: "/api/appweb/eliminar-opcion",
  },
  map: (raw): Opcion => ({ ...raw, value: raw.cod_opcion, label: raw.nom_opcion }),
  cache: CACHE_SEMI_STATIC,
});
