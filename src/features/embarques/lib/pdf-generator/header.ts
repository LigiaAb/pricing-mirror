import type jsPDF from "jspdf";
import { resolveBarcodeValue } from "../pdf-awb-helpers";
import type { DatosPdf } from "../pdf-awb-types";
import { cuadrosDerecha } from "./cuadros-derecha";
import { cuadrosIzquierda } from "./cuadros-izquierda";

function drawBarcodeSection(
  docInstance: jsPDF,
  datosPdf: DatosPdf,
  jspdfBarcode: (doc: jsPDF, value: string, options: Record<string, unknown>) => void,
  xOffset = 0,
): void {
  const detectedValue = resolveBarcodeValue(datosPdf);
  if (!detectedValue) {
    return;
  }

  const pageWidth = docInstance.internal.pageSize.getWidth
    ? docInstance.internal.pageSize.getWidth()
    : (docInstance.internal.pageSize as { width: number }).width;

  jspdfBarcode(docInstance, `${detectedValue}`, {
    fontSize: 40,
    lineColor: "#0000",
    height: 20,
    x: pageWidth / 2 - xOffset,
    y: 45,
    textOptions: { align: "center" },
  });
}

export function drawHeader(
  doc: jsPDF,
  datos: DatosPdf,
  xOff: number,
  jspdfBarcode: (doc: jsPDF, value: string, options: Record<string, unknown>) => void,
): void {
  doc.setTextColor("#BBB");

  drawBarcodeSection(doc, datos, jspdfBarcode, xOff);

  const numeroGuiaAsignada = String(datos.correlativoGuiaMaster || "").trim();

  doc.setFontSize(11);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor("#0B2967");
  if (numeroGuiaAsignada) {
    doc.text(`MAWB: ${numeroGuiaAsignada}`, 447, 48);
  }
  doc.setFont("Helvetica", "normal");
  doc.setTextColor("#000");
  doc.setFontSize(8);

  cuadrosIzquierda(doc, datos);
  cuadrosDerecha(doc, datos);
}
