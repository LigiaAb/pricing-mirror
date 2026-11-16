import type jsPDF from "jspdf";
import type { HookData } from "jspdf-autotable";
import { asText, safeString } from "@/shared/lib/text";
import type { AnyRecord, ItemsTableParams } from "../pdf-info-types";

export const renderItemsTable = (
  { doc, formData, margins, contentWidth, primaryColor, yPos }: ItemsTableParams,
  autoTable: ((doc: jsPDF, options: Record<string, unknown>) => void) | undefined,
): number => {
  const items = Array.isArray(formData.items) ? formData.items : [];

  if (items.length === 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("No hay información de cargas detallada.", margins.left, yPos);
    return yPos + 10;
  }

  const formatPeso = (value: unknown): string => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(1) : asText(value || "0");
  };

  const tableData = items.map((item: AnyRecord) => {
    let medidasTexto = "0";
    if (item.dimensiones) {
      medidasTexto = item.dimensiones as string;
    } else if (item.chargeableWeight != null) {
      medidasTexto = `${safeString(item.chargeableWeight)}`;
    }

    let pesoTexto = "0.0";
    if (item.grossWeight != null) {
      pesoTexto = formatPeso(item.grossWeight);
    } else if (item.volumen != null) {
      pesoTexto = formatPeso(item.volumen);
    }

    return [
      item.descripcion || "N/A",
      item.regimenAduanal || item.regimen_aduanal || "N/A",
      item.pieces || "0",
      pesoTexto,
      medidasTexto,
      item.total === undefined ? "0" : safeString(item.total),
    ];
  });

  const totalPieces = items.reduce(
    (sum: number, it: AnyRecord) => sum + (Number(it.pieces) || 0),
    0,
  );
  const totalGrossWeight = items.reduce(
    (sum: number, it: AnyRecord) => sum + (Number(it.grossWeight) || 0),
    0,
  );
  const totalVolume = items.reduce(
    (sum: number, it: AnyRecord) => sum + (Number(it.chargeableWeight) || 0),
    0,
  );
  const totalValue = items.reduce((sum: number, it: AnyRecord) => sum + (Number(it.total) || 0), 0);

  const totalRowStyles = {
    fontStyle: "bold" as const,
    fillColor: [240, 240, 240],
    halign: "center" as const,
  };
  // Las proporciones conservan el diseño original (165 mm), pero se escalan
  // al ancho útil de la página para que la tabla llegue al margen derecho.
  const anchoBaseColumnas = 165;
  const anchoColumna = (ancho: number) => (ancho / anchoBaseColumnas) * contentWidth;
  tableData.push([
    { content: "TOTALES", styles: totalRowStyles },
    { content: "", styles: totalRowStyles },
    { content: String(totalPieces || "0"), styles: totalRowStyles },
    {
      content: `${Number.isFinite(totalGrossWeight) ? totalGrossWeight.toFixed(1) : "0.0"} kg`,
      styles: totalRowStyles,
    },
    { content: `${totalVolume || "0"} m³`, styles: totalRowStyles },
    { content: String(totalValue || "0"), styles: totalRowStyles },
  ]);

  autoTable?.(doc, {
    startY: yPos,
    tableWidth: contentWidth,
    head: [["Descripción", "Régimen aduanal", "Cantidad", "Peso (Kg)", "Medidas", "Valor"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 50,
    },
    columnStyles: {
      0: { halign: "left", cellWidth: anchoColumna(55) },
      1: { halign: "left", cellWidth: anchoColumna(30) },
      2: { halign: "center", cellWidth: anchoColumna(18) },
      3: { halign: "right", cellWidth: anchoColumna(20) },
      4: { halign: "right", cellWidth: anchoColumna(22) },
      5: { halign: "right", cellWidth: anchoColumna(20) },
    },
    margin: { left: margins.left, right: margins.right },
    didDrawPage: (data: HookData) => {
      yPos = (data.cursor?.y ?? 0) + 5;
    },
  });

  return doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : yPos + 8;
};
