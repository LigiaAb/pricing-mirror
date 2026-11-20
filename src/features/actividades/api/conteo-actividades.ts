import { queryOptions, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelopeObjeto } from "@/shared/api/envelope";

const conteoActividadesSchema = z.object({
  total: z.coerce.number().default(0),
  tipos: z.record(z.string(), z.coerce.number()).default({}),
  estados: z.record(z.string(), z.coerce.number()).default({}),
});

export type ConteoActividades = z.infer<typeof conteoActividadesSchema>;
export type FiltrosConteoActividades = Record<string, string | number | undefined>;

const conteoActividadesKey = (filtros: FiltrosConteoActividades) =>
  ["actividades", "conteo", filtros] as const;

export const conteoActividadesOptions = (filtros: FiltrosConteoActividades) =>
  queryOptions({
    queryKey: conteoActividadesKey(filtros),
    queryFn: async () =>
      parseEnvelopeObjeto(
        await http.get<unknown>("/api/appweb/conteo-actividades", {
          params: filtros,
          // `tipos` y `estados` usan nombres visibles como claves. La
          // normalización recursiva del cliente no debe convertirlas a
          // minúsculas porque los catálogos conservan su casing original.
          skipNormalization: true,
        }),
        conteoActividadesSchema,
        "conteo-actividades",
      ),
    ...CACHE_DYNAMIC,
  });

export function useConteoActividades(filtros: FiltrosConteoActividades, enabled = true) {
  return useQuery({ ...conteoActividadesOptions(filtros), enabled });
}
