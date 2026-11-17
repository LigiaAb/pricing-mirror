import { z } from "zod";
import { CACHE_SEMI_STATIC } from "@/shared/api/cache";
import { zIdNull } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const identificacionSchema = z.object({
  cod_identificacion: zIdNull,
  cod_pais: zIdNull,
  cod_tipo: zIdNull,
  estado_id: zIdNull,
  identificacion_documentacion: zIdNull,
  identificacion_obligatorio: z.union([z.boolean(), z.string(), z.number()]).nullish().catch(null),
  identificacion_valor: zIdNull,
  nombre_pais: z.string().nullable(),
  nom_identificacion: z.string(),
  nom_tipo: z.string(),
  operativo: z.boolean(),
  tipo_publico: z.string(),
});

export type Identificacion = z.infer<typeof identificacionSchema>;

export const identificacion = createCatalogo({
  nombre: "identificacion",
  schema: identificacionSchema,
  endpoints: {
    lista: "/api/appweb/lista-identificacion",
    insertar: "api/appweb/insertar-identificacion",
    actualizar: "api/appweb/actualizar-identificacion",
  },
  // La vista de identificaciones exige datos frescos al volver a la pestaña.
  cache: { staleTime: 0, gcTime: CACHE_SEMI_STATIC.gcTime, refetchOnWindowFocus: true },
});
