import type jsPDF from "jspdf";
import { formatNumber, parseToNumber } from "../pdf-awb-helpers";
import type { DatosPdf } from "../pdf-awb-types";

export function drawBody(
  doc: jsPDF,
  datos: DatosPdf,
  margins: { top: number; left: number; bottom: number },
): void {
  doc.setDrawColor("#D3D3D3");
  doc.setFillColor("#D3D3D3");
  doc.rect(105.5, 390.5, 4.5, 193.5, "F");

  doc.setDrawColor("#D3D3D3");
  doc.setFillColor("#D3D3D3");
  doc.rect(160.5, 390.5, 4.5, 193.5, "F");

  doc.setDrawColor("#D3D3D3");
  doc.setFillColor("#D3D3D3");
  doc.rect(215.5, 390.5, 4.5, 193.5, "F");

  doc.setDrawColor("#D3D3D3");
  doc.setFillColor("#D3D3D3");
  doc.rect(283.5, 390.5, 4.5, 193.5, "F");

  doc.setDrawColor("#D3D3D3");
  doc.setFillColor("#D3D3D3");
  doc.rect(377.5, 390.5, 4.5, 193.5, "F");

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.line(20, 420, 547, 420, "F");

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(20, 390, 85, 194);
  doc.text(`No. Of`, 25, 401);
  doc.text(`Pieces`, 25, 407);
  doc.text(`RCP`, 27, 413);
  doc.line(50, 390, 50, 584, "F");
  doc.text(`Gross`, 62, 400);
  doc.text(`Weight`, 61, 407);
  doc.line(95, 390, 95, 584, "F");
  doc.text(`kg`, 97, 400);
  doc.text(`lb`, 98, 407);

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(110, 390, 50, 194);
  doc.text(`Rate Class`, 112, 397);

  doc.rect(120, 400, 40, 20);
  doc.line(120, 420, 120, 584, "F");
  doc.text(`Commodity`, 125, 410);
  doc.text(`Item No.`, 130, 415);

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(165, 390, 50, 194);
  doc.text(`Chargeable`, 175, 400);
  doc.text(`Weight`, 180, 407);

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(220, 390, 63, 194);
  doc.line(220, 420, 283, 390, "F");
  doc.text(`Rate`, 225, 400);
  doc.text(`Charge`, 255, 415);

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(288, 390, 89, 194);
  doc.text(`Total`, 325, 405);

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(382, 390, 165, 194);
  doc.text(`Nature and Quantity of Goods`, 425, 400);
  doc.text(`(Incl. Dimensions or Volume)`, 425, 407);

  doc.line(20, 565, 95, 565, "F");
  doc.line(288, 565, 377, 565, "F");

  const itemsToRender = datos.items || [];

  const summaryPieces = itemsToRender.reduce(
    (acc, item) => acc + parseToNumber(item.noPieces ?? item.pieces),
    0,
  );
  const summaryGrossWeight = itemsToRender.reduce(
    (acc, item) => acc + parseToNumber(item.volumen ?? item.grossWeight ?? 0),
    0,
  );
  const summaryChargeableWeight = itemsToRender.reduce(
    (acc, item) => acc + parseToNumber(item.chargeableWeight),
    0,
  );

  const afRateCosto = datos.afRateCosto == null ? null : parseToNumber(datos.afRateCosto);
  const summaryTotalAmount =
    afRateCosto !== null && Number.isFinite(afRateCosto)
      ? afRateCosto * summaryChargeableWeight
      : itemsToRender.reduce((acc, item) => acc + parseToNumber(item.total), 0);

  const addItemsToDoc = () => {
    let yPosition = margins.top;

    doc.setTextColor("#000");
    doc.setFontSize(7);

    const maxWidthDescripcionRight = 150;

    const totalPieces = formatNumber(summaryPieces);
    const totalGross = formatNumber(summaryGrossWeight);
    const totalChargeable = formatNumber(summaryChargeableWeight);
    const totalAmount = formatNumber(summaryTotalAmount);

    doc.setFont("courier", "normal");

    if (totalPieces) {
      doc.text(totalPieces, 25, yPosition);
    }
    if (totalGross) {
      doc.text(totalGross, 55, yPosition);
    }
    doc.text("kg", 96, yPosition);
    if (totalChargeable !== "") {
      doc.text(totalChargeable, 175, yPosition);
    }
    if (afRateCosto !== null && Number.isFinite(afRateCosto)) {
      doc.text(formatNumber(afRateCosto), 225, yPosition);
    }
    if (totalAmount !== "") {
      doc.text(totalAmount, 295, yPosition);
    }

    itemsToRender.forEach((item) => {
      const description = String(item.descripcion || item.natureOfGoods || "");

      if (description) {
        const descLines = doc.splitTextToSize(description, maxWidthDescripcionRight);
        doc.text(descLines, 385, yPosition, { align: "left" });
        yPosition = Math.max(yPosition, yPosition + descLines.length * 7);
      }

      const dimsMedidas = item.dimensiones || "";
      if (dimsMedidas) {
        const dimsBultos = formatNumber(item.noPieces ?? item.pieces);
        const dimsLine = `DIMS ${dimsBultos} ${dimsMedidas} cm`;
        doc.text(dimsLine, 385, yPosition, { align: "left" });
        yPosition += 7;
      }

      yPosition += 10;

      if (yPosition > doc.internal.pageSize.getHeight() - 60) {
        doc.addPage();
        yPosition = margins.top;
        doc.setFont("courier", "normal");
      }
    });

    doc.setFont("Helvetica", "normal");
  };

  if (itemsToRender.length > 0) {
    addItemsToDoc();
  }

  doc.setFont("Helvetica", "bold");
  doc.text(`${formatNumber(summaryPieces)}`, 25, 575);
  doc.text(`${formatNumber(summaryGrossWeight)}`, 60, 575);
  doc.text(`${formatNumber(summaryChargeableWeight)}`, 175, 575);
  if (afRateCosto !== null && Number.isFinite(afRateCosto)) {
    doc.text(`${formatNumber(afRateCosto)}`, 225, 575);
  }
  const totalLabel = `${formatNumber(summaryTotalAmount)}`;
  doc.text(totalLabel, 295, 575);
  doc.setFont("Helvetica", "normal");
}
