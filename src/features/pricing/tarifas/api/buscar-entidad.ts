import { z } from "zod";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { eliminarDuplicadosById } from "../lib/tarifa-helpers";

export type EntidadTarifaOption = {
  entidad_id: string | number;
  entidad_nombre: string;
};

export async function buscarClientesTarifa(search: string): Promise<EntidadTarifaOption[]> {
  if (search.trim().length < 2) return [];

  const response = await http.get<unknown>("/api/appweb/busqueda-entidad-x-criterio", {
    params: {
      ref_busqueda: search.trim(),
      list_descripcion_tipo: ["CLIENTE", "PRE-CLIENTE"],
      tipo_busqueda: "NOMBRE",
    },
  });

  const registros = parseEnvelope(
    response,
    z
      .object({
        entidad_id: z.union([z.string(), z.number()]),
        entidad_nombre: z.string().nullable().catch(""),
      })
      .passthrough(),
    "buscarClientesTarifa",
  );

  return eliminarDuplicadosById<EntidadTarifaOption>(
    registros.map((item) => ({
      entidad_id: item.entidad_id,
      entidad_nombre: item.entidad_nombre ?? "",
    })),
    "entidad_id",
  );
}
