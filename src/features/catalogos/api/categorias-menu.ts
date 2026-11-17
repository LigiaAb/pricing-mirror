import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const categoriaMenuSchema = z.object({
  cod_categoria: zId,
  nom_cat: z.string().catch(""),
  cod_menu: zId,
  nom_menu: z.string().catch(""),
});

export type CategoriaMenu = z.infer<typeof categoriaMenuSchema>;

/**
 * Relación menú ↔ categoría. Sin `actualizar`: la asignación solo se
 * inserta o se elimina, nunca se edita (mismo caso que `centrosCostoModulos`).
 */
export const categoriasMenu = createCatalogo({
  nombre: "categorias-menu",
  schema: categoriaMenuSchema,
  endpoints: {
    lista: "/api/appweb/lista-categoria-menu",
    insertar: "/api/appweb/insertar-categoria-menu",
    eliminar: "/api/appweb/eliminar-categoria-menu",
  },
});
