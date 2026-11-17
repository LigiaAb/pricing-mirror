import { z } from "zod";
import { CACHE_SEMI_STATIC } from "@/shared/api/cache";
import { parseEnvelope } from "@/shared/api/envelope";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

/** Sin `cod_estado`: `lista-menu` no lo devuelve y el legacy tampoco lo tiene. */
export const menuSchema = z.object({
  cod_menu: zId,
  nom_menu: z.string(),
  ico_menu: z.string().catch(""),
  cod_modulo: zId,
  nom_modulo: z.string().catch(""),
  fecha_reg: z.string().catch(""),
  menu_ruta: z.string().catch(""),
});

export interface Menu extends z.infer<typeof menuSchema> {
  value: string | number;
  label: string;
}

/**
 * `lista-menu` sigue devolviendo una fila por combinación menú × empresa ×
 * centro de costo, pero el menú ya no depende de esa combinación: se colapsa a
 * una fila por `cod_menu` para no duplicar filas en la tabla ni claves de React
 * en el editor de permisos.
 */
const unicosPorMenu = (data: unknown) => {
  const filas = parseEnvelope(data, menuSchema, "menus");
  return [...new Map(filas.map((fila) => [Number(fila.cod_menu), fila])).values()];
};

export const menus = createCatalogo({
  nombre: "menus",
  schema: menuSchema,
  extractor: unicosPorMenu,
  endpoints: {
    lista: "/api/appweb/lista-menu",
    insertar: "/api/appweb/insertar-menu",
    actualizar: "/api/appweb/actualizar-menu",
    eliminar: "/api/appweb/eliminar-menu",
  },
  map: (raw): Menu => ({ ...raw, value: raw.cod_menu, label: raw.nom_menu }),
  cache: CACHE_SEMI_STATIC,
});
