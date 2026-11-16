import { logger } from "@/shared/lib/logger";
import type { WatermarkParams } from "../pdf-info-types";

export const renderWatermark = ({ doc, pageWidth, pageHeight }: WatermarkParams): void => {
  const pageCount = (
    doc.internal as unknown as { getNumberOfPages: () => number }
  ).getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(200, 200, 200);

    if (typeof doc.setGState === "function" && doc.GState) {
      try {
        const GState = doc.GState as unknown as new (args: Record<string, number>) => unknown;
        const gState = new GState({ opacity: 0.4 });
        doc.setGState(gState);
      } catch (error) {
        logger.debug("No se pudo aplicar opacidad de marca de agua:", error);
      }
    }

    doc.setFont("helvetica", "bold");
    const offsetY = pageHeight * 0.3;
    const draftMarks = [
      { x: pageWidth * 0.35, y: pageHeight * 0.25 + offsetY, size: 216 },
      { x: pageWidth * 0.65, y: pageHeight * 0.5 + offsetY, size: 216 },
      { x: pageWidth * 0.95, y: pageHeight * 0.75 + offsetY, size: 216 },
    ];

    draftMarks.forEach(({ x, y, size }) => {
      doc.setFontSize(size);
      doc.text("DRAFT", x, y, {
        align: "center",
        angle: 45,
        baseline: "middle",
      });
    });

    if (typeof doc.setGState === "function" && doc.GState) {
      try {
        const GStateReset = doc.GState as unknown as new (args: Record<string, number>) => unknown;
        const gStateReset = new GStateReset({ opacity: 1 });
        doc.setGState(gStateReset);
      } catch (error) {
        logger.debug("No se pudo restaurar opacidad tras la marca de agua:", error);
      }
    }
  }
};
