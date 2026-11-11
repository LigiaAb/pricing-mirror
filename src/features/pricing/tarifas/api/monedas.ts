import { z } from "zod";
import { createCatalogo } from "@/features/catalogos";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { zId } from "@/shared/lib/zod-scalars";

/* ==========================================================================
 * MONEDAS OPERATIVAS
 *
 * Única consulta de monedas de Tarifas (antes había una copia por método).
 * Los nombres viejos (useMonedasPorcentaje, useMonedasEquipo, ...) se
 * conservan como alias en cada archivo tarifa-*.ts.
 * ========================================================================== */

/** Texto que puede venir como número o null; siempre se entrega como string. */
const texto = z
  .union([z.string(), z.number()])
  .nullable()
  .optional()
  .transform((valor) => (valor == null ? "" : String(valor)));

export const monedaOperativaSchema = z
  .object({
    cod_moneda: zId,
    simbolo_moneda: texto,
    nom_moneda: texto,
  })
  .passthrough();

export type MonedaOperativa = z.infer<typeof monedaOperativaSchema>;

export const monedasOperativas = createCatalogo({
  nombre: "tarifas-monedas-operativas",
  schema: monedaOperativaSchema,
  endpoints: { lista: "/api/appweb/lista-moneda" },
  cache: CACHE_DYNAMIC,
});

const FILTROS_OPERATIVAS = { es_operativa: true };

export const MONEDAS_OPERATIVAS_QUERY_KEY = monedasOperativas.keys.all;

export const monedasOperativasOptions = () => monedasOperativas.listaOptions(FILTROS_OPERATIVAS);

export function useMonedasOperativas() {
  return monedasOperativas.useLista(FILTROS_OPERATIVAS);
}
