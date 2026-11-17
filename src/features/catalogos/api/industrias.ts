import { z } from "zod";
import { CACHE_STATIC } from "@/shared/api/cache";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const industriaSchema = z.object({
  cod_industria: zId,
  nom_industria_es: z.string(),
  nom_industria_en: z.string().optional(),
  tipo_entidad: z.string().optional(),
});

export interface Industria {
  cod_industria: string | number;
  nom_industria_es: string;
  nom_industria_en: string;
  tipo_entidad: string;
}

export const industrias = createCatalogo({
  nombre: "industrias",
  schema: industriaSchema,
  endpoints: {
    lista: "/api/appweb/lista-industria",
    insertar: "api/appweb/insertar-industria",
    actualizar: "api/appweb/actualizar-industria",
    eliminar: "api/appweb/eliminar-industria",
  },
  map: (raw): Industria => ({
    cod_industria: raw.cod_industria,
    nom_industria_es: raw.nom_industria_es,
    nom_industria_en: raw.nom_industria_en ?? "",
    tipo_entidad: raw.tipo_entidad ?? "",
  }),
  cache: CACHE_STATIC,
});
