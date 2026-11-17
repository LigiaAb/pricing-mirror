import { z } from "zod";
import { CACHE_SEMI_STATIC } from "@/shared/api/cache";
import { createCatalogo } from "./create-catalogo";

const moduloSchema = z.object({
  cod_modulo: z.number(),
  nom_modulo: z.string(),
  ico_modulo: z.string(),
  cod_estado: z.number(),
  estado_desc: z.string(),
  modulo_ruta: z.string(),
});

export interface Modulo extends z.infer<typeof moduloSchema> {
  value: number;
  label: string;
}

export const modulos = createCatalogo({
  nombre: "modulos",
  schema: moduloSchema,
  endpoints: {
    lista: "/api/appweb/listamodulo",
    insertar: "/api/appweb/insertarmodulo",
    actualizar: "/api/appweb/actualizarmodulo",
    eliminar: "/api/appweb/eliminarmodulo",
  },
  map: (raw): Modulo => ({ ...raw, value: raw.cod_modulo, label: raw.nom_modulo }),
  cache: CACHE_SEMI_STATIC,
});
