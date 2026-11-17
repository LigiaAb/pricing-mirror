import { z } from "zod";
import { createCatalogo } from "./create-catalogo";

const tipoCencoSchema = z.object({
  cod_cenco: z.number(),
  cod_empresa: z.number(),
  cod_estado: z.number(),
  cod_tipo: z.number(),
  cod_tipo_cenco: z.number(),
  empresa_nombre: z.string(),
  cenco_nombre: z.string().catch(""),
  estado_desc: z.string().catch(""),
  fecha_inicio: z.string().nullable().catch(null),
  fecha_fin: z.string().nullable().catch(null),
  tipo_desc: z.string().catch(""),
  tipo_tabla: z.string().catch(""),
});

export type ListaTipoCentroCosto = z.infer<typeof tipoCencoSchema>;

export const tipoCencos = createCatalogo({
  nombre: "tipo-cencos",
  schema: tipoCencoSchema,
  endpoints: {
    lista: "api/appweb/lista-tipo-cenco",
    insertar: "api/appweb/insertar-tipo-cenco",
    actualizar: "api/appweb/actualizar-tipo-cenco",
  },
});
