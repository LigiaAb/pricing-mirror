import { z } from "zod";
import { CACHE_STATIC } from "@/shared/api/cache";
import { createCatalogo } from "./create-catalogo";

const paisConEmpresaSchema = z.object({
  pais_id: z.coerce.number(),
  pais_nombre: z.string(),
  pais_codigo: z.string(),
});

export type PaisConEmpresa = z.infer<typeof paisConEmpresaSchema>;

/** Países que tienen al menos una empresa configurada. */
export const paisesConEmpresa = createCatalogo({
  nombre: "paises-con-empresa",
  schema: paisConEmpresaSchema,
  endpoints: { lista: "/api/appweb/getPaisesConEmpresa" },
  cache: CACHE_STATIC,
});
