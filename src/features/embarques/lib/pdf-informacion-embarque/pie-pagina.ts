import type { PiePaginaParams } from "../pdf-info-types";

export const renderPiePagina = ({
  doc,
  pageWidth,
  pageHeight,
  margins,
  secondaryColor,
}: PiePaginaParams): void => {
  const pageCount = (
    doc.internal as unknown as { getNumberOfPages: () => number }
  ).getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    const firmarY = pageHeight - 18;
    const firmaLineWidth = 130;
    const firmaLineXStart = (pageWidth - firmaLineWidth) / 2;
    const firmaLineXEnd = firmaLineXStart + firmaLineWidth;

    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(firmaLineXStart, firmarY, firmaLineXEnd, firmarY);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...secondaryColor);
    doc.text("Firma y sello de Empresa", pageWidth / 2, firmarY + 4, { align: "center" });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margins.left, pageHeight - 12, pageWidth - margins.right, pageHeight - 12);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);

    const disclaimerText =
      "Tomar en consideración que, por errores en emisión de facturas de exportación, " +
      "referente a descripción, moneda, mala aplicación de Incoterms y otros que generen " +
      "reparos aduanales, por los cuales se incurran en gastos adicionales en origen o destino, " +
      "dichos gastos corren por cuenta del exportador.";
    const disclaimerLines = doc.splitTextToSize(
      disclaimerText,
      pageWidth - margins.left - margins.right,
    );
    const disclaimerY = pageHeight - 9;
    doc.text(disclaimerLines, margins.left, disclaimerY);
    const disclaimerHeight = disclaimerLines.length * 3.5;
    const paginationY = disclaimerY + disclaimerHeight + 1;
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margins.right, paginationY, {
      align: "right",
    });
  }
};
