import { z } from "zod";
import { zIdNull } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const servicioSchema = z
  .object({
    cod_servicio: z.union([z.string(), z.number()]),
    descripcion: z.string().catch(""),
    siglas: z.string().catch(""),
    cod_estado: zIdNull,
    estado_desc: z.string().catch(""),
  })
  .catchall(z.unknown());

export interface Servicio {
  cod_servicio: number;
  descripcion: string;
  siglas: string;
  cod_estado: number;
  estado_desc: string;
  value: number;
  label: string;
  [key: string]: unknown;
}

export const servicios = createCatalogo({
  nombre: "servicios",
  schema: servicioSchema,
  endpoints: { lista: "/api/appweb/lista-servicios" },
  map: (raw): Servicio => ({
    ...raw,
    cod_servicio: Number(raw.cod_servicio),
    descripcion: raw.descripcion,
    siglas: raw.siglas,
    cod_estado: Number(raw.cod_estado),
    estado_desc: raw.estado_desc,
    value: Number(raw.cod_servicio),
    label: raw.descripcion,
  }),
});
