import type jsPDF from "jspdf";

export function addCopyLabel(doc: jsPDF, label: string): void {
  const pageHeight = doc.internal.pageSize.getHeight
    ? doc.internal.pageSize.getHeight()
    : (doc.internal.pageSize as { height: number }).height;
  const pageWidth = doc.internal.pageSize.getWidth
    ? doc.internal.pageSize.getWidth()
    : (doc.internal.pageSize as { width: number }).width;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor("#000");
  doc.text(label, pageWidth / 2, pageHeight - 8, { align: "center" });
}

export function isOriginalLabel(label: string): boolean {
  return typeof label === "string" && label.toUpperCase().startsWith("ORIGINAL");
}
