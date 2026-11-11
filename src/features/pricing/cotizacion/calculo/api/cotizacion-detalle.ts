import { z } from "zod";

import { http } from "@/shared/api/client";
import { zId } from "@/shared/lib/zod-scalars";

import type { Id } from "../lib/tipos";

const detalleInsertadoSchema = z
  .object({
    cod_cotizaciondetalle: zId,
  })
  .passthrough();

const pdfGeneradoSchema = z
  .object({
    url_documento: z.string().nullable().optional(),
    url_documento_prepaid: z.string().nullable().optional(),
    url_documento_collect: z.string().nullable().optional(),
  })
  .passthrough();

export type IdiomaPdfCotizacion = "es" | "en";

export type TipoDocumentoPdfCotizacion = "prepaid" | "collect" | null;

export type GenerarPdfCotizacionOptions = {
  forzar?: boolean;
  idioma?: IdiomaPdfCotizacion | null;
  tipoDocumento?: TipoDocumentoPdfCotizacion;
};

export async function insertarCotizacionDetalle(payload: Record<string, unknown>) {
  const response = await http.post<unknown>("/api/appweb/insertar-cotizacion-detalle", payload);
  const source =
    response && typeof response === "object" && "data" in response ? response.data : response;
  const parsed = detalleInsertadoSchema.parse(source);

  return parsed.cod_cotizaciondetalle;
}

export async function insertarRubroCotizacion(payload: Record<string, unknown>) {
  await http.post("/api/appweb/insertar-cotizacion-detalle-rubro", payload);
}

export async function insertarLegCotizacion(payload: Record<string, unknown>) {
  await http.post("/api/appweb/insertar-cotizacion-detalle-legs", payload);
}

export async function insertarDimensionCotizacion(payload: Record<string, unknown>) {
  await http.post("/api/appweb/insertar-cotizacion-detalle-dimension", payload);
}

export async function insertarCriterioCotizacion(payload: Record<string, unknown>) {
  await http.post("/api/appweb/insertar-cotizacion-detalle-criterio", payload);
}

export async function generarPdfCotizacionDetalle(
  codCotizacionDetalle: Id,
  options: GenerarPdfCotizacionOptions = {},
) {
  const response = await http.post<unknown>("/api/appweb/generar-pdf-cotizacion-detalle", {
    cod_cotizaciondetalle: codCotizacionDetalle,

    ...(options.forzar
      ? {
          forzar: true,
          idioma: options.idioma ?? null,
          tipo_documento: options.tipoDocumento ?? null,
        }
      : {}),
  });

  const source =
    response && typeof response === "object" && "data" in response ? response.data : response;

  const parsed = pdfGeneradoSchema.safeParse(source);

  /*
   * Durante el guardado el legacy no utiliza la respuesta del endpoint.
   * Algunas respuestas válidas únicamente confirman la generación y no
   * incluyen todavía las URLs. La vista previa validará explícitamente que
   * exista la URL antes de intentar recuperar el archivo.
   */
  return parsed.success ? parsed.data : {};
}

export async function recuperarArchivoPdf(rutaArchivo: string) {
  const response = await fetch("/api/proxy/api/appweb/recuperar-archivo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ruta_archivo: rutaArchivo,
    }),
  });

  if (!response.ok) {
    throw new Error(`No fue posible recuperar el PDF (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/pdf")) {
    throw new Error("La respuesta recuperada no es un archivo PDF.");
  }

  return response.blob();
}

export async function activarCotizacionDetalle({
  codCotizacionCabecera,
  codCotizacionDetalle,
}: {
  codCotizacionCabecera: Id;
  codCotizacionDetalle: Id;
}) {
  await http.post("/api/appweb/activar-cotizacion-detalle", {
    cod_cotizacion_cabecera: codCotizacionCabecera,

    cod_cotizaciondetalle: codCotizacionDetalle,
  });
}
