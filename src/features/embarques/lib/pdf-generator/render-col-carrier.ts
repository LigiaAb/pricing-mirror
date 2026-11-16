import type jsPDF from "jspdf";
import type { GastoPdf } from "../pdf-awb-types";

export function renderColCarrier(
  doc: jsPDF,
  items: GastoPdf[],
  isPrepaidCollect: boolean,
  prepaidItems: GastoPdf[],
  collectItems: GastoPdf[],
  fmtN: (v: unknown) => string,
): void {
  let ocY = 598;
  const ocLineH = 8;
  const ocMaxY = 654;
  const ocRCenterX = 462;
  const ocRItemX = 383;

  doc.setFont("Helvetica", "bold");
  doc.text("Due Carrier", ocRCenterX, ocY, { align: "center" });
  doc.setFont("Helvetica", "normal");
  ocY += ocLineH;

  const renderItems = (itemsToRender: GastoPdf[]) => {
    for (const g of itemsToRender) {
      if (ocY > ocMaxY) break;
      const lineTxt = [g.siglas, g.venta ? fmtN(g.venta) : ""].filter(Boolean).join(" ");
      if (lineTxt) {
        doc.text(lineTxt, ocRItemX, ocY);
        ocY += ocLineH;
      }
    }
  };

  if (isPrepaidCollect) {
    if (prepaidItems.length > 0) {
      if (ocY <= ocMaxY) {
        doc.setFont("Helvetica", "italic");
        doc.text("Prepaid", ocRItemX + 4, ocY);
        doc.setFont("Helvetica", "normal");
        ocY += ocLineH;
        renderItems(prepaidItems);
      }
    }
    if (collectItems.length > 0) {
      if (ocY <= ocMaxY) {
        doc.setFont("Helvetica", "italic");
        doc.text("Collect", ocRItemX + 4, ocY);
        doc.setFont("Helvetica", "normal");
        ocY += ocLineH;
        renderItems(collectItems);
      }
    }
  } else {
    renderItems(items);
  }
}
