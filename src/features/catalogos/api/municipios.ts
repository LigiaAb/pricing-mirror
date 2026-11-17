import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const municipioSchema = z.object({
  cod_muni: zId,
  nombre_muni: z.string(),
  cod_depto: zId,
  nombre_depto: z.string().catch(""),
  cod_estado: zId.catch(1),
  estado_desc: z.string().catch(""),
});

export type Municipio = z.infer<typeof municipioSchema>;

export const municipios = createCatalogo({
  nombre: "municipios",
  schema: municipioSchema,
  endpoints: {
    lista: "/api/appweb/lista-municipios",
    insertar: "/api/appweb/insertar-municipios",
    actualizar: "/api/appweb/actualizar-municipios",
    eliminar: "/api/appweb/eliminar-municipios",
  },
  habilitado: (filtros) => Boolean(filtros.cod_depto),
});
