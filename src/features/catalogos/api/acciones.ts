import { z } from "zod";
import { CACHE_SEMI_STATIC } from "@/shared/api/cache";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

/** Sin estado ni categoría: `lista-accion` solo trae estos tres campos. */
export const accionSchema = z.object({
  cod_accion: zId,
  nom_accion: z.string(),
  ico_accion: z.string().catch(""),
});

export interface Accion extends z.infer<typeof accionSchema> {
  value: string | number;
  label: string;
}

export const acciones = createCatalogo({
  nombre: "acciones",
  schema: accionSchema,
  endpoints: {
    lista: "/api/appweb/lista-accion",
    insertar: "/api/appweb/insertar-accion",
    actualizar: "/api/appweb/actualizar-accion",
    eliminar: "/api/appweb/eliminar-accion",
  },
  map: (raw): Accion => ({ ...raw, value: raw.cod_accion, label: raw.nom_accion }),
  cache: CACHE_SEMI_STATIC,
});
