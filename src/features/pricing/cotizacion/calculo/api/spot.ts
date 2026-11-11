import { z } from "zod";

import { http } from "@/shared/api/client";
import { zId } from "@/shared/lib/zod-scalars";

import type { Id } from "../lib/tipos";

const spotInsertadoSchema = z
  .object({
    cod_tarifa_spot: zId,
  })
  .passthrough();

export type InsertarSpotPayload = {
  venta?: unknown;
  flete?: string | number | null;
  costo?: unknown;

  url_documento: null;

  cod_usuario_tarifaspot: Id | null;

  cod_usuario_autoriza_tarifaspot: null;

  cod_estado: Id;

  venta_original: unknown;
  costo_original: unknown;

  reason_code: Id | null;

  /*
   * El backend actualmente recibe
   * este nombre escrito así.
   */
  jusificacion: string;

  cod_cotizaciondetalle: Id;
};

export async function insertarTarifaSpot(payload: InsertarSpotPayload) {
  const response = await http.post<unknown>("/api/appweb/insertar-tarifa-spot", payload);
  const source =
    response && typeof response === "object" && "data" in response ? response.data : response;

  return spotInsertadoSchema.parse(source).cod_tarifa_spot;
}

export async function cargarArchivoTarifaSpot({
  codTarifaSpot,
  archivo,
}: {
  codTarifaSpot: Id;
  archivo: File;
}) {
  const formData = new FormData();

  formData.append("cod_tarifa_spot", String(codTarifaSpot));

  formData.append("archivo", archivo);

  await http.post("/api/appweb/cargar-archivo-tarifa-spot", formData);
}
