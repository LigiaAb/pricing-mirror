"use client";

/**
 * PDF "Información de Embarque" para la vista pública de la carta de
 * instrucciones. A diferencia de `useInformacionPdfCts` (que arma el payload
 * desde la fila privada de coordinación), aquí el payload llega ya resuelto en
 * `cartaPublicaData` (solo datos persistidos — ver use-datos-carta-publica).
 */

import { useState } from "react";
import { generarPdfInformacionEmbarque } from "@/features/embarques/lib/pdf-informacion-embarque";
import { safeString } from "@/shared/lib/text";

type AnyRecord = Record<string, unknown>;

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function buildItems(cargas: AnyRecord[]): AnyRecord[] {
  return (cargas || []).map((item) => {
    const largo = item.largo ?? item.LARGO ?? item.largo_cm ?? null;
    const ancho = item.ancho ?? item.ANCHO ?? item.ancho_cm ?? null;
    const alto = item.alto ?? item.ALTO ?? item.alto_cm ?? null;
    const dimTexto =
      num(largo) > 0 && num(ancho) > 0 && num(alto) > 0 ? `${largo} x ${ancho} x ${alto}` : "";
    const cw = num(item.cw) > 0 ? num(item.cw) : num(item.volumen ?? item.metrosCubicos);
    const piezas = item.bultos ?? item.cantidad ?? item.pieces ?? 0;
    // Unidad de medida de la carga como dato del item (§7.D.4); el peso bruto
    // NO cae a claves de volumen (fix del legacy 2026-07-16).
    const pesoUnidad =
      safeString(
        item.pesoUnidad ?? item.tipoUnidadMedida ?? item.unidadPeso ?? item.unidadMedida ?? "",
      ).trim() || "Kg";
    return {
      pieces: piezas,
      noPieces: piezas,
      volumen: num(item.volumen ?? item.metrosCubicos),
      grossWeight: num(item.peso ?? item.PESO ?? item.pesoTotal),
      chargeableWeight: cw,
      total: item.valor ?? item.total ?? 0,
      descripcion: item.descripcionCarga ?? item.descripcion_carga ?? "",
      regimenAduanal: item.regimenAduanal ?? item.regimen_aduanal ?? item.REGIMEN_ADUANAL ?? "",
      dimensiones: dimTexto,
      pesoUnidad,
    };
  });
}

export interface DescargarPdfPublicoOptions {
  /** Descarga con nombre de archivo en vez de abrir la pestaña de preview. */
  forceDownload?: boolean;
  overrideIsDraft?: boolean;
}

export function useInformacionPdfPublico({
  cartaPublicaData,
  cargas,
  isDraft,
}: {
  cartaPublicaData: AnyRecord | null;
  cargas: AnyRecord[];
  isDraft: boolean;
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async (options: DescargarPdfPublicoOptions = {}) => {
    if (!cartaPublicaData) return;
    setIsGeneratingPdf(true);
    // La pestaña se abre ANTES del primer await para que el navegador la trate
    // como acción del usuario (evita el bloqueador de popups).
    const previewTab = options.forceDownload ? null : window.open("about:blank", "_blank");
    if (previewTab) {
      previewTab.document.title = "Generando PDF...";
      previewTab.document.body.innerHTML =
        "<p style='font-family: Arial, sans-serif; padding: 16px;'>Generando PDF...</p>";
    }

    try {
      // `peligrosidad` es el multi-select de Detalles ("S"/"V"/"C"). La vista
      // pública no expone el checkbox "S": la peligrosidad que obliga la Hoja
      // de Seguridad viaja como flag `cargaPeligrosa` (clasificación 122).
      const peligrosidad = cartaPublicaData.peligrosidad;
      const cargaPeligrosa =
        cartaPublicaData.cargaPeligrosa === true ||
        peligrosidad === true ||
        peligrosidad === "S" ||
        (Array.isArray(peligrosidad) && (peligrosidad as unknown[]).includes("S"));
      const coberturaSeguro =
        Array.isArray(peligrosidad) && (peligrosidad as unknown[]).includes("C");
      // La sección PRODUCTO del PDF describe la carga: origen, partida,
      // régimen y embalaje se toman de la primera fila (ya resueltos a label
      // por resolverCargasParaPdf), igual que el legacy.
      const primeraCarga = (cargas?.[0] ?? {}) as AnyRecord;
      const formData: AnyRecord = {
        ...cartaPublicaData,
        origenCargaProducto: safeString(primeraCarga.paisOrigen),
        partidaArancelaria: safeString(primeraCarga.partidaArancelaria),
        regimenAduanal: safeString(primeraCarga.regimenAduanal),
        tipoEmbalaje: safeString(primeraCarga.tipoEmbalaje),
        cargaPeligrosa,
        peligrosidad: cargaPeligrosa,
        peligrosidadLabel: cargaPeligrosa ? "Sí" : "No",
        coberturaSeguro,
        coberturaSeguroLabel: coberturaSeguro ? "Sí" : "No",
        items: buildItems(cargas),
        isDraft: options.overrideIsDraft ?? isDraft,
      };

      const result = await generarPdfInformacionEmbarque(
        formData,
        { label: cartaPublicaData.transportMode ?? "" },
        { label: cartaPublicaData.servicio ?? "" },
        true,
      );
      if (!result.success || !result.blob) {
        throw new Error(result.error || "Error al generar PDF");
      }

      const pdfUrl = URL.createObjectURL(result.blob);
      if (options.forceDownload) {
        const enlace = document.createElement("a");
        enlace.href = pdfUrl;
        const codFile = String(
          cartaPublicaData.codFile ?? cartaPublicaData.cod_file ?? cartaPublicaData.COD_FILE ?? "",
        ).trim();
        enlace.download = `instructivo${codFile ? `_${codFile}` : ""}.pdf`;
        enlace.click();
      } else if (previewTab) {
        previewTab.location.replace(pdfUrl);
      } else {
        window.open(pdfUrl, "_blank");
      }
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 10_000);
    } catch {
      previewTab?.close();
      throw new Error("No se pudo generar el PDF del instructivo");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return { isGeneratingPdf, handleDownloadPdf };
}
