import { z } from "zod";
import { CACHE_SEMI_STATIC } from "@/shared/api/cache";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const categoriaSchema = z.object({
  cod_categoria: zId,
  nom_cat: z.string(),
  ico_cat: z.string().catch(""),
  ruta_cat: z.string().catch(""),
  cod_estado: zId,
  estado_desc: z.string().catch(""),
});

export interface Categoria extends z.infer<typeof categoriaSchema> {
  value: string | number;
  label: string;
}

export const categorias = createCatalogo({
  nombre: "categorias",
  schema: categoriaSchema,
  endpoints: {
    lista: "/api/appweb/lista-categoria",
    insertar: "/api/appweb/insertar-categoria",
    actualizar: "/api/appweb/actualizar-categoria",
    eliminar: "/api/appweb/eliminar-categoria",
  },
  map: (raw): Categoria => ({ ...raw, value: raw.cod_categoria, label: raw.nom_cat }),
  cache: CACHE_SEMI_STATIC,
});
