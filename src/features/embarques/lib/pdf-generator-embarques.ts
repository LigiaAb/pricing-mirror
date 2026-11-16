import { format } from "date-fns";
import { addLegalNoticeLastPage } from "./pdf-awb-legal-notice";
import type { DatosPdf } from "./pdf-awb-types";
import { drawBody } from "./pdf-generator/body";
import { addCopyLabel, isOriginalLabel } from "./pdf-generator/copy-label";
import { drawFooter } from "./pdf-generator/footer";
import { drawHeader } from "./pdf-generator/header";
import { addWatermark } from "./pdf-generator/watermark";

export default async function generarPdf(
  datos: DatosPdf,
  borrador?: boolean,
  outputType?: "datauristring" | "dataurlstring" | "dataurlnewwindow" | "dataurl",
): Promise<string>;
export default async function generarPdf(
  datos: DatosPdf,
  borrador: boolean,
  outputType: "blob" | "bloburl" | "bloburlnewwindow",
): Promise<Blob>;
export default async function generarPdf(
  datos: DatosPdf,
  borrador = true,
  outputType = "datauristring",
): Promise<string | Blob> {
  const jsPDF = (await import("jspdf")).default;
  const jspdfBarcode = (await import("jspdf-barcode")).default;
  const doc = new jsPDF(datos.horizontal ? "l" : "p", "pt", datos.tamano || "a4");
  // El visor de PDF nativo del navegador usa el título de los metadatos del
  // PDF —no el nombre del Blob— para la pestaña y el nombre sugerido.
  const fechaTituloPdf = format(new Date(), "yyyy-MM-dd");
  doc.setProperties({ title: `Instructivo Embarque ${fechaTituloPdf}` });

  const _pageWidth = doc.internal.pageSize.getWidth
    ? doc.internal.pageSize.getWidth()
    : (doc.internal.pageSize as { width: number }).width;
  const xOff = (_pageWidth - 527) / 2 - 20;

  const margins = {
    top: 430,
    left: 25,
    bottom: 50,
  };

  const pdfInternal = doc.internal as typeof doc.internal & { write(...args: string[]): void };
  const drawAwbPage = () => {
    addWatermark(doc, borrador);
    pdfInternal.write("q");
    pdfInternal.write(`1 0 0 1 ${xOff.toFixed(2)} 0 cm`);
    drawHeader(doc, datos, xOff, jspdfBarcode);
    drawBody(doc, datos, margins);
    drawFooter(doc, datos);
    pdfInternal.write("Q");
  };

  const copias = Array.isArray(datos.copias) && datos.copias.length > 0 ? datos.copias : null;

  if (copias) {
    copias.forEach((copyLabel, idx) => {
      if (idx > 0) doc.addPage();
      drawAwbPage();
      addCopyLabel(doc, copyLabel);
      if (isOriginalLabel(copyLabel)) {
        addLegalNoticeLastPage(doc);
      }
    });
  } else {
    drawAwbPage();
  }

  return (doc.output as (type: string) => string | Blob)(outputType);
}
