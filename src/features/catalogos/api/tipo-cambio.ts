import { z } from "zod";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { zId } from "@/shared/lib/zod-scalars";
import { createCatalogo } from "./create-catalogo";

export const tipoCambioSchema = z.object({
  cod_tip_cambio: zId,
  cod_moneda_origen: zId,
  nom_moneda_origen: z.string().catch(""),
  cod_moneda_destino: zId,
  nom_moneda_destino: z.string().catch(""),
  valor_tipocambio: z.number().catch(0),
  fecha_tipocambio: z.string().catch(""),
});

export type TipoCambio = z.infer<typeof tipoCambioSchema>;

/**
 * Tipos de cambio por moneda de origen.
 *
 * OJO con el filtro: el parámetro se llama `cod_pais_origen` pero el backend filtra
 * por **moneda** de origen — verificado contra el API (`cod_pais_origen=1` devuelve
 * solo filas con `cod_moneda_origen=1`; un `cod_pais` real devuelve 0 filas, y
 * `cod_moneda_origen` se ignora). El nombre del parámetro es una errata del backend:
 * no lo "corrijas" a `cod_moneda_origen` o la pantalla dejará de filtrar.
 */
export const tipoCambio = createCatalogo({
  nombre: "tipo-cambio",
  schema: tipoCambioSchema,
  endpoints: { lista: "/api/appweb/lista-tipo-cambio" },
  habilitado: (filtros) => Boolean(filtros.cod_pais_origen),
  cache: CACHE_DYNAMIC,
});
