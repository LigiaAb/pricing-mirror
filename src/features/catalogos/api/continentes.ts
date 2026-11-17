import { z } from "zod";
import { CACHE_STATIC } from "@/shared/api/cache";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

const continenteRawSchema = z.object({
  cod_continente: zId,
  continente_nombre: z.string().catch(""),
  cod_estado: zId,
});

export interface Continente {
  cod_continente: string | number;
  continente_nombre: string;
  cod_estado: string | number;
  value: string | number;
  label: string;
}

export const continentes = createCatalogo({
  nombre: "continentes",
  schema: continenteRawSchema,
  endpoints: {
    lista: "/api/appweb/listacontinente",
  },
  map: (raw): Continente => ({
    cod_continente: raw.cod_continente,
    continente_nombre: raw.continente_nombre,
    cod_estado: raw.cod_estado,
    value: raw.cod_continente,
    label: raw.continente_nombre,
  }),
  cache: CACHE_STATIC,
});
