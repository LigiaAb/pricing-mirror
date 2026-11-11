import { queryOptions, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zId } from "@/shared/lib/zod-scalars";

export const incotermSchema = z.object({
  incoterm_id: zId,
  codigo: z.string().catch(""),
  nombre: z.string().catch(""),
  nombre_eng: z.string().catch(""),
  descripcion: z.string().catch(""),
});

export type Incoterm = z.infer<typeof incotermSchema>;

export const incotermsOptions = () =>
  queryOptions({
    queryKey: ["tarifas", "incoterms"],
    queryFn: async () =>
      parseEnvelope(
        await http.get<unknown>("/api/appweb/lista-incoterm"),
        incotermSchema,
        "lista-incoterm",
      ),
    ...CACHE_DYNAMIC,
  });

export function useIncoterms() {
  return useQuery(incotermsOptions());
}
