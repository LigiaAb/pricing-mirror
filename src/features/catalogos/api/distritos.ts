import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const distritoSchema = z.object({
  cod_distrito: zId,
  nombre_distrito: z.string(),
  cod_depto: zId,
});

export type Distrito = z.infer<typeof distritoSchema>;

/** Solo existe para El Salvador (CAT-008 de Hacienda). */
export const distritos = createCatalogo({
  nombre: "distritos",
  schema: distritoSchema,
  endpoints: { lista: "/api/appweb/lista-distritos" },
  habilitado: (filtros) => Boolean(filtros.cod_depto),
});
