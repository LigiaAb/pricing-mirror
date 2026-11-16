import type jsPDF from "jspdf";
import { logger } from "@/shared/lib/logger";
import type { DatosPdf } from "../pdf-awb-types";

export function cuadrosDerecha(doc: jsPDF, datos: DatosPdf): void {
  doc.setDrawColor("#D3D3D3");
  doc.setFillColor("#D3D3D3");
  doc.rect(296, 295, 17, 25, "F");

  doc.setDrawColor("#00205b");
  doc.rect(265, 50, 282, 65);

  doc.setFontSize(6);
  doc.text(`not negotiable`, 267, 58);

  doc.setFontSize(10);
  doc.text(`AIR`, 267, 69);
  doc.text(`WAYBILL`, 267, 78);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Issued by:`, 267, 108);

  const issuedByCarrier =
    Array.isArray(datos.rutas) && datos.rutas[0]?.entidadNombreProv
      ? String(datos.rutas[0].entidadNombreProv).trim()
      : "";
  if (issuedByCarrier) {
    doc.setFontSize(7.5);
    const issuedByLines = doc.splitTextToSize(issuedByCarrier, 220);
    doc.text(issuedByLines, 335, 108, { align: "left" });
  }

  if (!datos.hideAirwayBillGuias) {
    const hawbValue = String(
      datos.correlativoGuia || datos.hawbNumber || datos.guiaHouse || "",
    ).trim();
    const mawbValue = String(
      datos.correlativoGuiaMaster || datos.mawbNumber || datos.guiaMaster || "",
    ).trim();
    const fixedX = 380;
    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor("#000");
    if (hawbValue) {
      doc.text(`HAWB: ${hawbValue}`, fixedX, 69);
    }
    if (mawbValue) {
      doc.text(`MAWB: ${mawbValue}`, fixedX - 3, hawbValue ? 79 : 69);
    }
  }

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(265, 115, 282, 15);
  doc.setFontSize(6);
  doc.text(
    `Copies 1, 2 and 3 of this Air Waybill are originals and have the same validity`,
    267,
    124,
  );

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(265, 130, 282, 70);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(5.5);
  const lines = doc.splitTextToSize(
    `It is agreed that the goods described herein are accepted in apparent goood order and condition (eccept as noted) for carriage SUBJECT TO THE CONDITIONS OF CONTRACT ON THE REVERSE HEREOF. ALL GOODS MAY BE CARRIED BU ANY OTHER MEANS INCLUDING ROAD OR ANY OTHER CARRIER UNLESS SPECIFIC CONTRARY INSTRUCTIONS ARE GIBEN HERON BY THE SHIPPER, AND SHIPPER AGREES THAT THE SHIPMENT MAY BE CARRIED VIA INTERMEDIATE STOPPING PLACES WHICH THE CARRIER DEEMS APPROPRIATE. THE SHIPPER'S ATTENTION IS DRAWN TO  THE NOTICE CONCERNING CARRIER'S LIMITATION OF LIABILITY. shipper may increase such limitation of liability by declaring a higher value for carriage and paying a supplemental charge if required.`,
    275,
  );
  doc.text(lines, 266, 136, { align: "left" });

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(265, 200, 282, 70);
  doc.text(`Accounting Information`, 267, 207);

  doc.setFontSize(5);
  doc.setTextColor("#000");
  if (datos.accountingInformation) {
    const accountingLines = doc.splitTextToSize(datos.accountingInformation, 270);
    doc.text(accountingLines, 267, 220);
  }

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(265, 270, 282, 25);
  doc.setFontSize(5.5);
  doc.text(`Reference Number`, 267, 276);

  doc.setFontSize(5);
  doc.setTextColor("#000");
  if (datos.referenceNumber) {
    doc.text(datos.referenceNumber, 267, 290);
  }

  doc.line(352, 277, 547, 277, "F");
  doc.text(`Option Shipping Information`, 377, 275);
  doc.line(370, 277, 370, 295, "F");
  doc.line(455, 277, 455, 295, "F");
  doc.line(348, 270, 352, 277, "F");
  doc.line(467, 270, 463, 277, "F");

  doc.setFontSize(6);
  doc.setTextColor("#000");
  if (datos.optionalShippingInfo) {
    const optionalInfoText = String(datos.optionalShippingInfo);
    doc.text(optionalInfoText, 355, 290);
  }
  {
    const rawIncoterm =
      typeof datos.incoterm === "string"
        ? datos.incoterm
        : (datos.incoterm && (datos.incoterm.label || datos.incoterm.value)) || "";
    if (rawIncoterm) {
      let incotermCode = "";
      const match = /^[A-Za-z]{3,4}/.exec(String(rawIncoterm).trim());
      if (match?.[0]) {
        incotermCode = match[0].toUpperCase();
      } else {
        const strVal = String(rawIncoterm);
        incotermCode = (strVal.split(" - ")[0] || strVal.split(" ")[0] || strVal).toUpperCase();
      }
      if (incotermCode) {
        doc.text(`Incoterm: ${incotermCode}`, 375, 290);
      }
    }
  }

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(265, 295, 282, 25);
  doc.setFontSize(5);
  doc.text(`Currency`, 267, 301);

  doc.line(370, 295, 370, 320, "F");
  doc.text(`Declared Value for Carriage`, 380, 301);
  doc.line(455, 295, 455, 320, "F");
  doc.text(`Declared Value for Costums`, 470, 301);

  doc.line(296, 295, 296, 320, "F");
  doc.setFontSize(4.5);

  doc.text(`CHGS`, 298, 301);

  doc.line(313, 295, 313, 320, "F");
  doc.text(`WT/VAL`, 318, 300);
  doc.setFontSize(4);
  doc.text(`PP`, 315, 307);
  doc.text(`CC`, 328, 307);

  doc.line(327, 302, 327, 320, "F");
  doc.setFontSize(4.5);
  doc.text(`Other`, 350, 300);
  doc.setFontSize(4);
  doc.text(`PP`, 343, 307);
  doc.text(`CC`, 357, 307);
  doc.line(313, 302, 340, 302, "F");

  try {
    const marcarX = (x: number, y: number) => {
      const prevSize = doc.getFontSize();
      const prevFont = doc.getFont();
      const prevColor = doc.getTextColor();
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(5);
      doc.setTextColor("#000");
      doc.text("X", x, y);
      doc.setFont(prevFont.fontName, prevFont.fontStyle || "normal");
      doc.setFontSize(prevSize);
      doc.setTextColor(prevColor);
    };
    const esPrepaid = !!(datos.chgsPPD || datos.wtValPPD);
    const esCollect = !!(datos.chgsCOLL || datos.wtValCOLL);

    const _isPrepaidCollect = esPrepaid && esCollect;

    if (esPrepaid && esCollect) {
      const prevSize = doc.getFontSize();
      doc.setFontSize(5);

      const chgsColStart = 296;
      const chgsColEnd = 313;
      const chgsColWidth = chgsColEnd - chgsColStart;

      const firstLine = "PP";
      const secondLine = "CC";
      const maxTextWidth = Math.max(doc.getTextWidth(firstLine), doc.getTextWidth(secondLine));
      const x = Math.max(chgsColStart + 1, chgsColStart + (chgsColWidth - maxTextWidth) / 2);

      doc.text(firstLine, x, 311);
      doc.text(secondLine, x, 316);

      doc.setFontSize(prevSize);
    } else if (esPrepaid || esCollect) {
      const label = esPrepaid ? "PP" : "CC";
      const prevSize = doc.getFontSize();
      doc.setFontSize(7);

      const chgsColStart = 296;
      const chgsColEnd = 313;
      const chgsColWidth = chgsColEnd - chgsColStart;
      const textWidth = doc.getTextWidth(label);
      const x = Math.max(chgsColStart + 1, chgsColStart + (chgsColWidth - textWidth) / 2);

      doc.text(label, x, 313);
      doc.setFontSize(prevSize);
    }

    const esPrepaid2 = !!(datos.chgsPPD || datos.wtValPPD);
    const esCollect2 = !!(datos.chgsCOLL || datos.wtValCOLL);

    if (esPrepaid2) {
      marcarX(318, 315);
    }
    if (esCollect2) {
      marcarX(332, 315);
    }
  } catch (err) {
    logger.error("Error renderizando bloque", err);
  }

  try {
    doc.setFontSize(7);
    doc.setTextColor("#000");
    const currencyValue = String(datos.currency || "USD").toUpperCase();
    doc.text(currencyValue, 275, 313);
    if (datos.declaredValueCarriage) {
      doc.text(String(datos.declaredValueCarriage), 380, 313);
    }
    if (datos.declaredValueCustoms) {
      doc.text(String(datos.declaredValueCustoms), 470, 313);
    }
  } catch (err) {
    logger.error("Error renderizando bloque", err);
  }

  doc.line(340, 295, 340, 320, "F");
  doc.line(355, 302, 355, 320, "F");
  doc.line(340, 302, 370, 302, "F");

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(265, 320, 282, 25);
  doc.setFontSize(5);
  doc.text(`Amount of insurance`, 267, 325);
  doc.line(347, 320, 347, 345, "F");
  doc.setFontSize(6);
  const lines1 = doc.splitTextToSize(
    `INSURANCE - if Carrier offers Insurance, and such insurance is requested in accordance with tha conditions thereof, indicate amount to be insured in figures in box marked "amount of insurance".`,
    190,
  );
  doc.text(lines1, 350, 327, { align: "left" });

  doc.text(`PMT:`, 465, 352);

  doc.rect(462, 365, 85, 25);
  doc.text(`SCI`, 500, 371);
}
