import { z } from "zod";
import { createCatalogo } from "./create-catalogo";

const puntoEnlaceNombreSchema = z.object({
  cod_puntoenlace_nombre: z.number(),
  nombre: z.string().catch(""),
  cod_puntoenlace: z.number(),
  cod_estado: z.number(),
  estado_desc: z.string().catch(""),
});

export interface PuntoEnlaceNombre extends z.infer<typeof puntoEnlaceNombreSchema> {
  value: number;
  label: string;
}

export const puntosEnlaceNombres = createCatalogo({
  nombre: "puntoenlace-nombres",
  schema: puntoEnlaceNombreSchema,
  endpoints: {
    lista: "/api/appweb/lista-nombre-punto_enlace",
    insertar: "/api/appweb/insertar-nombre-punto_enlace",
    actualizar: "/api/appweb/actualizar-nombre-punto_enlace",
  },
  map: (raw): PuntoEnlaceNombre => ({
    ...raw,
    value: raw.cod_puntoenlace_nombre,
    label: raw.nombre,
  }),
});
