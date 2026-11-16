import { buildDocumentGroups, checkNewPage, drawField } from "../pdf-info-helpers";
import type { DocumentosCropaParams } from "../pdf-info-types";

export const renderDocumentos = ({
  doc,
  formData,
  yPos,
  margins,
  contentWidth,
  pageHeight,
  secondaryColor,
}: DocumentosCropaParams): number => {
  const groups = buildDocumentGroups(formData);

  if (!groups.length) {
    return (
      drawField({
        doc,
        label: "Documentos",
        value: "Ninguno",
        x: margins.left,
        y: yPos,
        width: contentWidth,
        secondaryColor,
      }) + 5
    );
  }

  for (const group of groups) {
    yPos = checkNewPage({ doc, currentY: yPos, requiredSpace: 8, pageHeight, margins });

    const titleText = `${group.title}:`;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(titleText, margins.left, yPos);
    const titleWidth = doc.getTextWidth(titleText) + 2;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const itemsText = group.items.join(", ");
    const splitText = doc.splitTextToSize(itemsText, contentWidth - titleWidth);
    doc.text(splitText, margins.left + titleWidth, yPos);

    yPos += Math.max(splitText.length * 4, 6) + 2;
  }

  return yPos + 3;
};
