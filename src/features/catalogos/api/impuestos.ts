import { z } from "zod";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const impuestoSchema = z.object({
  cod_impuesto: zId,
  nom_impuesto: z.string(),
});

export type Impuestos = z.infer<typeof impuestoSchema>;

export const impuestos = createCatalogo({
  nombre: "impuesto",
  schema: impuestoSchema,
  endpoints: {
    lista: "/api/appweb/lista-impuesto",
    insertar: "api/appweb/insertar-impuesto",
    actualizar: "api/appweb/actualizar-impuesto",
    eliminar: "api/appweb/eliminar-impuesto",
  },
});

export const impuestoPaisSchema = z.object({
  cod_pais: z.number(),
  nombre_pais: z.string().catch(""),
  cod_impuesto_pais: z.number(),
  cod_impuesto: z.number(),
  nom_impuesto: z.string().catch(""),
  estado_id: z.number(),
  estado_desc: z.string().catch(""),
  porcentaje_impuesto: z.number().catch(0),
  fecha_inicio_impuesto: z.string().catch(""),
  fecha_fin_impuesto: z.string().catch(""),
});

export type ImpuestoPais = z.infer<typeof impuestoPaisSchema>;

export const impuestosPais = createCatalogo({
  nombre: "impuesto-pais",
  schema: impuestoPaisSchema,
  endpoints: {
    lista: "/api/appweb/lista-impuesto-x-pais",
    insertar: "/api/appweb/insertar-impuesto-x-pais",
    actualizar: "/api/appweb/actualizar-impuesto-x-pais",
    eliminar: "/api/appweb/eliminar-impuesto-x-pais",
  },
});
