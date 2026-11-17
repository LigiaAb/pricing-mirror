import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const rolOpcionAccionSchema = z.object({
  cod_menu: zId,
  nom_menu: z.string().catch(""),
  cod_accion: zId,
  nom_accion: z.string().catch(""),
  cod_categoria: zId,
  nom_cat: z.string().catch(""),
  cod_opcion: zId,
  nom_opcion: z.string().catch(""),
  cod_rol: zId,
  rol_desc: z.string().catch(""),
});

export type RolOpcionAccion = z.infer<typeof rolOpcionAccionSchema>;

/**
 * Lista los permisos (menú/categoría/opción/acción) concedidos a un rol.
 * En `accesos` se usa solo de lectura, como guarda de desasignación (§5 fase
 * 4 del plan de accesos). En `personal` (matriz de permisos de rol) también
 * se usa para insertar/eliminar filas de `rol-menu-cat-opc-acc`.
 */
export const rolOpcionAccion = createCatalogo({
  nombre: "rol-opcion-accion",
  schema: rolOpcionAccionSchema,
  endpoints: {
    lista: "/api/appweb/lista-rol-menu-cat-opc-acc",
    insertar: "/api/appweb/insertar-rol-menu-cat-opc-acc",
    eliminar: "/api/appweb/eliminar-rol-menu-cat-opc-acc",
  },
});
