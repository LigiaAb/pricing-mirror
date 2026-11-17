import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const opcionAccionSchema = z.object({
  cod_accion: zId,
  cod_categoria: zId,
  cod_opcion: zId,
  nom_cat: z.string().catch(""),
  nom_accion: z.string().catch(""),
  nom_opcion: z.string().catch(""),
  cod_estado: zId,
  estado_desc: z.string().catch(""),
});

export type OpcionAccion = z.infer<typeof opcionAccionSchema>;

/**
 * Relación opción ↔ acción. Sin `actualizar`: la asignación solo se
 * inserta o se elimina, nunca se edita.
 */
export const opcionesAcciones = createCatalogo({
  nombre: "opciones-acciones",
  schema: opcionAccionSchema,
  endpoints: {
    lista: "/api/appweb/lista-opcion-accion",
    insertar: "/api/appweb/insertar-opcion-accion",
    eliminar: "/api/appweb/eliminar-opcion-accion",
  },
});
