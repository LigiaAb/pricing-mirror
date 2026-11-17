import { z } from "zod";
import { CACHE_STATIC } from "@/shared/api/cache";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const monedaSchema = z.object({
  cod_moneda: zId,
  nom_moneda: z.string(),
  cod_pais: zId,
  simbolo_moneda: z.string(),
  cod_serv_banco: z.string(),
  moneda_abreviatura: z.string(),
  es_operativa: z.boolean(),
  cod_estado: zId,
});

export type Moneda = z.infer<typeof monedaSchema>;

export const monedas = createCatalogo({
  nombre: "monedas",
  schema: monedaSchema,
  endpoints: {
    lista: "/api/appweb/lista-moneda",
    insertar: "api/appweb/insertar-moneda",
    actualizar: "api/appweb/actualizar-moneda",
    eliminar: "api/appweb/eliminar-moneda",
  },
  cache: CACHE_STATIC,
});
