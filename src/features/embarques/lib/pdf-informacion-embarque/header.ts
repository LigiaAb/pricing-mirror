import { formatearFechaLocale } from "@/shared/lib/date";
import { logger } from "@/shared/lib/logger";
import { safeString } from "@/shared/lib/text";
import type { HeaderParams } from "../pdf-info-types";

export const renderHeader = ({
  doc,
  formData,
  margins,
  pageWidth,
  primaryColor,
  secondaryColor,
}: HeaderParams): number => {
  let yPos = margins.top;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("INFORMACIÓN DE EMBARQUE", margins.left, yPos);
  yPos += 6;

  const codFile = safeString(formData.codFile ?? formData.cod_file ?? formData.COD_FILE).trim();
  if (codFile) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`COD FILE: ${codFile}`, margins.left, yPos);
  }

  yPos += 4;

  const fechaActual = formatearFechaLocale(new Date(), {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...secondaryColor);
  doc.text(`Generado: ${fechaActual}`, pageWidth - margins.right, yPos - 1.5, { align: "right" });

  try {
    const logoWidth = 45;
    const logoHeight = 15;
    const logoY = yPos - 1.5 - logoHeight - 2;
    doc.addImage(
      "/logo_png.png",
      "PNG",
      pageWidth - margins.right - logoWidth,
      logoY,
      logoWidth,
      logoHeight,
    );
  } catch (error) {
    // Sin logo el PDF sigue siendo válido (p. ej. en entornos sin el asset).
    logger.debug("No se pudo dibujar el logo del PDF:", error);
  }

  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margins.left, yPos, pageWidth - margins.right, yPos);

  return yPos + 4;
};
