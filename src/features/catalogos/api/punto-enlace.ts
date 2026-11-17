import { z } from "zod";
import { createCatalogo } from "./create-catalogo";

export const puntoEnlaceSchema = z.object({
  cod_puntoenlace: z.number(),
  codigo: z.string().catch(""),
  nombre: z.string().catch(""),
  cod_pais: z.number(),
  nombre_pais: z.string().catch(""),
  cod_tipo: z.number(),
  tipo_descripcion: z.string().catch(""),
  cod_estado: z.number(),
  estado_desc: z.string().catch(""),
});

export interface PuntoEnlace extends z.infer<typeof puntoEnlaceSchema> {
  value: number;
  label: string;
}

export const puntosEnlace = createCatalogo({
  nombre: "puntos-enlace",
  schema: puntoEnlaceSchema,
  endpoints: {
    lista: "/api/appweb/lista-punto_enlace",
    insertar: "/api/appweb/insertar-punto_enlace",
    actualizar: "/api/appweb/actualizar-punto_enlace",
    eliminar: "/api/appweb/eliminar-punto_enlace",
  },
  map: (raw): PuntoEnlace => ({
    ...raw,
    value: raw.cod_puntoenlace,
    label: `${raw.codigo} - ${raw.nombre}`,
  }),
});
