import { z } from "zod";
import { CACHE_STATIC } from "@/shared/api/cache";
import { zId, zIdNull } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const paisSchema = z.object({
  cod_pais: zId,
  nombre_pais: z.string(),
  ref_pais: z.string().catch(""),
  ref_pais_2: z.string().catch(""),
  cod_continente: zIdNull.catch(null),
  nombre_continente: z.string().catch(""),
});

export interface Pais extends z.infer<typeof paisSchema> {
  value: string | number;
  label: string;
}

export const paises = createCatalogo({
  nombre: "paises",
  schema: paisSchema,
  endpoints: {
    lista: "/api/appweb/listapaises",
    // Alta/edición envían `nom_pais`; la lista devuelve `nombre_pais`. Es asimétrico
    // en el backend, no un error de mapeo.
    insertar: "/api/appweb/insertarpaises",
    actualizar: "/api/appweb/actualizarpaises",
  },
  map: (raw): Pais => ({ ...raw, value: raw.cod_pais, label: raw.nombre_pais }),
  cache: CACHE_STATIC,
});
