import type jsPDF from "jspdf";

export function addWatermark(doc: jsPDF, borrador: boolean): void {
  if (borrador) {
    doc.setTextColor("#BBB");
    doc.setFont("Helvetica", "bold");
    const watermarkText = "DRAFT";
    const fontSize = 190;
    const angle = 45;

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setTextColor(230);
    doc.setFontSize(fontSize);
    doc.text(watermarkText, pageWidth / 2.3, pageHeight / 2.5, {
      angle: angle,
      align: "center",
      baseline: "middle",
    });
    doc.text(watermarkText, pageWidth / 1.3, pageHeight / 1.4, {
      angle: angle,
      align: "center",
      baseline: "middle",
    });
    doc.text(watermarkText, pageWidth / 0.9, pageHeight / 1, {
      angle: angle,
      align: "center",
      baseline: "middle",
    });
  }
}
