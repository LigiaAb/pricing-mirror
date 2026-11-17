import { z } from "zod";
import { createCatalogo } from "./create-catalogo";

const puntoEnlaceIdentificacionSchema = z.object({
  cod_puntoenlace_identificacion: z.number(),
  codigo: z.string().catch(""),
  cod_puntoenlace: z.number(),
  cod_tipo: z.number(),
  tipo_descripcion: z.string().catch(""),
  cod_estado: z.number(),
  estado_desc: z.string().catch(""),
});

export interface PuntoEnlaceIdentificacion extends z.infer<typeof puntoEnlaceIdentificacionSchema> {
  id: number;
}

export const puntosEnlaceIdentificaciones = createCatalogo({
  nombre: "puntoenlace-identificaciones",
  schema: puntoEnlaceIdentificacionSchema,
  endpoints: {
    lista: "/api/appweb/lista-identificacion-punto_enlace",
    insertar: "/api/appweb/insertar-identificacion-punto_enlace",
    actualizar: "/api/appweb/actualizar-identificacion-punto_enlace",
    eliminar: "/api/appweb/eliminar-identificacion-punto_enlace",
  },
  map: (raw): PuntoEnlaceIdentificacion => ({ ...raw, id: raw.cod_puntoenlace_identificacion }),
});
