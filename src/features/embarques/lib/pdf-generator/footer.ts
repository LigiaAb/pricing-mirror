import type jsPDF from "jspdf";
import { logger } from "@/shared/lib/logger";
import { formatDateForPdf } from "../pdf-awb-helpers";
import type { DatosPdf, GastoPdf } from "../pdf-awb-types";
import { computeSplitTotal, formatNumber, parseToNumber } from "./number-utils";
import { renderColAgent } from "./render-col-agent";
import { renderColCarrier } from "./render-col-carrier";

export function drawFooter(doc: jsPDF, datos: DatosPdf): void {
  const esPrepaid = !!(datos.chgsPPD || datos.wtValPPD);
  const esCollect = !!(datos.chgsCOLL || datos.wtValCOLL);

  const ptn = parseToNumber;
  const fmtN = formatNumber;

  const _items = datos.items || [];
  const _afRate = datos.afRateCosto == null ? null : ptn(datos.afRateCosto);
  const _chargeableWt = _items.reduce((acc, item) => acc + ptn(item.chargeableWeight), 0);
  const _tableTotalRaw =
    _afRate !== null && Number.isFinite(_afRate)
      ? _afRate * _chargeableWt
      : _items.reduce((acc, item) => acc + ptn(item.total), 0);
  const tableTotalStr = fmtN(_tableTotalRaw);

  const gastosParaPdf = Array.isArray(datos.gastosParaPdf) ? datos.gastosParaPdf : [];
  const dueAgentItems = gastosParaPdf.filter((g) => g.isDueAgent);
  const dueCarrierItems = gastosParaPdf.filter(
    (g) => g.isDueCarrier && String(g.siglas || "").toUpperCase() !== "A/F",
  );

  const isPrepaidCollect = esPrepaid && esCollect;
  const isPrepaid = (g: GastoPdf) =>
    String(g.tipoPago || "")
      .toUpperCase()
      .includes("PREPAID");
  const isCollect = (g: GastoPdf) =>
    String(g.tipoPago || "")
      .toUpperCase()
      .includes("COLLECT");

  const dueAgentPrepaidItems = isPrepaidCollect ? dueAgentItems.filter(isPrepaid) : [];
  const dueAgentCollectItems = isPrepaidCollect ? dueAgentItems.filter(isCollect) : [];
  const dueCarrierPrepaidItems = isPrepaidCollect ? dueCarrierItems.filter(isPrepaid) : [];
  const dueCarrierCollectItems = isPrepaidCollect ? dueCarrierItems.filter(isCollect) : [];

  const dueAgentPrepaidTotal = dueAgentPrepaidItems.reduce((acc, g) => acc + ptn(g.venta), 0);
  const dueAgentCollectTotal = dueAgentCollectItems.reduce((acc, g) => acc + ptn(g.venta), 0);
  const dueCarrierPrepaidTotal = dueCarrierPrepaidItems.reduce((acc, g) => acc + ptn(g.venta), 0);
  const dueCarrierCollectTotal = dueCarrierCollectItems.reduce((acc, g) => acc + ptn(g.venta), 0);

  const dueAgentTotal = dueAgentItems.reduce((acc, g) => acc + ptn(g.venta), 0);
  const dueCarrierTotal = dueCarrierItems.reduce((acc, g) => acc + ptn(g.venta), 0);
  const dueAgentTotalStr = fmtN(dueAgentTotal);
  const dueCarrierTotalStr = fmtN(dueCarrierTotal);

  const _valuationRaw = ptn(datos.valuationCharge);
  const _taxRaw = ptn(datos.tax);
  const totalGrandRaw = _tableTotalRaw + _valuationRaw + _taxRaw + dueAgentTotal + dueCarrierTotal;
  const _totalGrandStr = fmtN(totalGrandRaw);

  const _afTipoPago = datos.afTipoPagoCodigo == null ? null : Number(datos.afTipoPagoCodigo);
  let wchForPrepaid: boolean;
  let wchForCollect: boolean;
  if (isPrepaidCollect && _afTipoPago != null) {
    wchForPrepaid = _afTipoPago === 128;
    wchForCollect = _afTipoPago === 127;
  } else {
    wchForPrepaid = esPrepaid;
    wchForCollect = esCollect;
  }
  const _valForPrepaid = esPrepaid;
  const _valForCollect = esCollect && !esPrepaid;
  const _taxTipoPago = String(datos.taxTipoPago || "").toUpperCase();
  const _taxForPrepaid =
    _taxTipoPago.includes("PREPAID") || (!_taxTipoPago.includes("COLLECT") && esPrepaid);
  const _taxForCollect =
    _taxTipoPago.includes("COLLECT") || (!_taxTipoPago.includes("PREPAID") && esCollect);

  const totalPrepaidRaw = computeSplitTotal({
    splitMode: isPrepaidCollect,
    matchMode: esPrepaid,
    wchFlag: wchForPrepaid,
    valFlag: _valForPrepaid,
    taxFlag: _taxForPrepaid,
    tableTotal: _tableTotalRaw,
    valuationRaw: _valuationRaw,
    taxRaw: _taxRaw,
    dueAgentTotal: dueAgentPrepaidTotal,
    dueCarrierTotal: dueCarrierPrepaidTotal,
    totalGrand: totalGrandRaw,
  });
  const totalCollectRaw = computeSplitTotal({
    splitMode: isPrepaidCollect,
    matchMode: esCollect,
    wchFlag: wchForCollect,
    valFlag: _valForCollect,
    taxFlag: _taxForCollect,
    tableTotal: _tableTotalRaw,
    valuationRaw: _valuationRaw,
    taxRaw: _taxRaw,
    dueAgentTotal: dueAgentCollectTotal,
    dueCarrierTotal: dueCarrierCollectTotal,
    totalGrand: totalGrandRaw,
  });
  const totalPrepaidStr = fmtN(totalPrepaidRaw);
  const totalCollectStr = fmtN(totalCollectRaw);

  doc.setDrawColor("#D3D3D3");
  doc.setFillColor("#D3D3D3");
  doc.rect(20, 707, 190, 25, "F");

  doc.setDrawColor("#D3D3D3");
  doc.setFillColor("#D3D3D3");
  doc.rect(20, 754, 190, 25, "F");

  doc.setDrawColor("#D3D3D3");
  doc.setFillColor("#D3D3D3");
  doc.rect(20, 779, 190, 25, "F");

  doc.setDrawColor("#D3D3D3");
  doc.setFillColor("#D3D3D3");
  doc.rect(210, 779, 100, 25, "F");

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(20, 584, 190, 220);

  doc.setFontSize(5);
  doc.line(35, 592, 75, 592, "F");
  doc.line(30, 584, 35, 592, "F");
  doc.line(75, 592, 80, 584, "F");
  doc.text(`Prepaid`, 45, 590);

  doc.setFontSize(7);
  doc.setTextColor("#000");
  if (tableTotalStr) {
    const afTipoPago = datos.afTipoPagoCodigo == null ? null : Number(datos.afTipoPagoCodigo);
    let wchPrepaid: boolean;
    let wchCollect: boolean;
    if (isPrepaidCollect && afTipoPago != null) {
      wchPrepaid = afTipoPago === 128;
      wchCollect = afTipoPago === 127;
    } else {
      wchPrepaid = esPrepaid;
      wchCollect = esCollect;
    }
    if (wchPrepaid) doc.text(tableTotalStr, 45, 600);
    if (wchCollect) doc.text(tableTotalStr, 150, 600);
  }

  doc.setFontSize(5);
  doc.line(85, 592, 135, 592, "F");
  doc.line(80, 584, 85, 592, "F");
  doc.line(135, 592, 140, 584, "F");
  doc.text(`Weight Charge`, 90, 590);

  doc.setFontSize(5);
  doc.line(145, 592, 195, 592, "F");
  doc.line(140, 584, 145, 592, "F");
  doc.line(195, 592, 200, 584, "F");
  doc.text(`Collect`, 160, 590);

  doc.line(120, 592, 120, 607, "F");
  doc.line(20, 607, 210, 607, "F");

  doc.setFontSize(5);
  doc.line(80, 614, 160, 614, "F");
  doc.line(75, 607, 80, 614, "F");
  doc.line(160, 614, 165, 607, "F");
  doc.text(`Valuation Charge`, 95, 613);

  doc.setFontSize(7);
  doc.setTextColor("#000");
  if (datos.valuationCharge) {
    const valuationValue = fmtN(datos.valuationCharge);
    if (valuationValue) {
      doc.text(valuationValue, 95, 623);
    }
  }

  doc.line(120, 614, 120, 632, "F");
  doc.line(20, 632, 210, 632, "F");

  doc.setFontSize(5);
  doc.line(105, 639, 130, 639, "F");
  doc.line(100, 632, 105, 639, "F");
  doc.line(130, 639, 135, 632, "F");
  doc.text(`Tax`, 112, 637.5);

  doc.setFontSize(7);
  doc.setTextColor("#000");
  if (datos.tax) {
    const taxValue = fmtN(datos.tax);
    const taxTipoPago = String(datos.taxTipoPago || "").toUpperCase();
    const taxIsPrepaid =
      taxTipoPago.includes("PREPAID") || (!taxTipoPago.includes("COLLECT") && esPrepaid);
    const taxIsCollect =
      taxTipoPago.includes("COLLECT") || (!taxTipoPago.includes("PREPAID") && esCollect);
    if (taxIsPrepaid && !taxIsCollect) {
      doc.text(taxValue, 45, 647.5);
    } else if (taxIsCollect && !taxIsPrepaid) {
      doc.text(taxValue, 150, 647.5);
    } else {
      if (esPrepaid) doc.text(taxValue, 45, 647.5);
      if (esCollect) doc.text(taxValue, 150, 647.5);
    }
  }

  doc.line(120, 639, 120, 657, "F");
  doc.line(20, 657, 210, 657, "F");

  doc.rect(210, 584, 337, 73);
  doc.setFont("Helvetica", "bold");
  doc.text(`Other Charges`, 215, 590);
  doc.setFont("Helvetica", "normal");

  const ocDivX = 378;
  doc.line(ocDivX, 591, ocDivX, 657, "F");

  try {
    doc.setFontSize(6.5);
    const ocLineH = 8;
    const ocMaxY = 654;

    if (dueAgentItems.length > 0) {
      renderColAgent(
        doc,
        dueAgentItems,
        isPrepaidCollect,
        dueAgentPrepaidItems,
        dueAgentCollectItems,
        fmtN,
      );
    }
    if (dueCarrierItems.length > 0) {
      renderColCarrier(
        doc,
        dueCarrierItems,
        isPrepaidCollect,
        dueCarrierPrepaidItems,
        dueCarrierCollectItems,
        fmtN,
      );
    }

    if (gastosParaPdf.length === 0) {
      const oc = (datos.otherCharges || "").toString();
      if (oc) {
        doc.setFontSize(7);
        const ocLines = doc.splitTextToSize(oc, 160) as string[];
        ocLines.forEach((line: string, i: number) => {
          if (598 + i * ocLineH <= ocMaxY) doc.text(line, 215, 598 + i * ocLineH);
        });
      }
    }
  } catch (err) {
    logger.error("Error renderizando bloque", err);
  }

  doc.setFontSize(5);
  doc.line(55, 664, 160, 664, "F");
  doc.line(50, 657, 55, 664, "F");
  doc.line(160, 664, 165, 657, "F");
  doc.text(`Total Other Charges Due Agent`, 65, 662);

  doc.setFontSize(7);
  doc.setTextColor("#000");
  if (isPrepaidCollect) {
    const dueAgentPrepaidStr = fmtN(dueAgentPrepaidTotal);
    const dueAgentCollectStr = fmtN(dueAgentCollectTotal);
    if (dueAgentPrepaidStr !== "") doc.text(dueAgentPrepaidStr, 45, 672);
    if (dueAgentCollectStr !== "") doc.text(dueAgentCollectStr, 150, 672);
  } else if (dueAgentTotalStr !== "") {
    if (esPrepaid) doc.text(dueAgentTotalStr, 45, 672);
    if (esCollect) doc.text(dueAgentTotalStr, 150, 672);
  }

  doc.line(120, 664, 120, 682, "F");
  doc.line(20, 682, 210, 682, "F");

  doc.setFontSize(5);
  doc.line(55, 689, 160, 689, "F");
  doc.line(50, 682, 55, 689, "F");
  doc.line(160, 689, 165, 682, "F");
  doc.text(`Total Other Charges Due Carrier`, 65, 687);

  doc.setFontSize(7);
  doc.setTextColor("#000");
  if (isPrepaidCollect) {
    const dueCarrierPrepaidStr = fmtN(dueCarrierPrepaidTotal);
    const dueCarrierCollectStr = fmtN(dueCarrierCollectTotal);
    if (dueCarrierPrepaidStr !== "") doc.text(dueCarrierPrepaidStr, 45, 697);
    if (dueCarrierCollectStr !== "") doc.text(dueCarrierCollectStr, 150, 697);
  } else if (dueCarrierTotalStr !== "") {
    if (esPrepaid) doc.text(dueCarrierTotalStr, 45, 697);
    if (esCollect) doc.text(dueCarrierTotalStr, 150, 697);
  }

  doc.line(120, 689, 120, 707, "F");
  doc.line(20, 707, 210, 707, "F");

  doc.line(120, 707, 120, 732, "F");
  doc.line(20, 732, 210, 732, "F");

  doc.rect(210, 657, 337, 75);
  doc.setFontSize(7);
  const lines3 = doc.splitTextToSize(
    `Shipper certifies that the particulars on the face hereof are correct and that insofar as any part of the consignment contains dangerous goods, such part is properly described by name and is in proper condition for carriage by air according to the applicable Dangerous Goods Regulations`,
    335,
  );
  doc.text(lines3, 212, 664, { align: "left" });

  doc.line(35, 739, 105, 739, "F");
  doc.line(30, 732, 35, 739, "F");
  doc.line(105, 739, 110, 732, "F");
  doc.setFontSize(5);
  doc.text(`Total Prepaid`, 55, 737.5);

  doc.setFontSize(7);
  doc.setTextColor("#000");
  if (totalPrepaidStr !== "") {
    doc.text(totalPrepaidStr, 55, 747);
  } else if (datos.totalPrepaid != null) {
    doc.text(fmtN(datos.totalPrepaid), 55, 747);
  }

  doc.line(135, 739, 195, 739, "F");
  doc.line(130, 732, 135, 739, "F");
  doc.line(195, 739, 200, 732, "F");
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(5);
  doc.text(`Total Collect`, 150, 737.5);

  doc.setFontSize(7);
  doc.setTextColor("#000");
  if (totalCollectStr !== "") {
    doc.text(totalCollectStr, 150, 747);
  } else if (datos.totalCollect != null) {
    doc.text(fmtN(datos.totalCollect), 150, 747);
  }

  doc.line(120, 732, 120, 754, "F");
  doc.line(20, 754, 210, 754, "F");

  doc.setFontSize(5);
  doc.line(25, 761, 115, 761, "F");
  doc.line(20, 754, 25, 761, "F");
  doc.line(115, 761, 120, 754, "F");
  doc.text(`Currency Conversion Rates`, 40, 759.5);

  doc.line(125, 761, 205, 761, "F");
  doc.line(120, 754, 125, 761, "F");
  doc.line(205, 761, 210, 754, "F");
  doc.text(`CC. Charges In Dest. Currency`, 130, 759.5);

  doc.line(120, 754, 120, 779, "F");
  doc.line(20, 779, 210, 779, "F");

  doc.text(`For Carrier's use only`, 40, 790);
  doc.text(`At Destination`, 50, 795);

  doc.line(135, 786, 195, 786, "F");
  doc.line(130, 779, 135, 786, "F");
  doc.line(195, 786, 200, 779, "F");
  doc.text(`Charges at Destination`, 140, 784.5);

  doc.line(120, 779, 120, 804, "F");

  doc.rect(210, 732, 337, 47);

  doc.setLineDashPattern([1], 1);
  doc.line(210, 767, 547, 767);
  doc.setFontSize(5);
  doc.text(`at (place)`, 345, 775);
  doc.text(`Executed on (date)`, 220, 775);
  doc.text(`Signature if Isuing Carrier or Its Agent`, 460, 775);

  doc.setFontSize(8);
  doc.setTextColor("#000");

  const executedDateText = formatDateForPdf(datos.executedOnDate ?? new Date());
  const executedPlaceText = datos.executedAtPlace
    ? String(datos.executedAtPlace).trim()
    : "GUATEMALA";
  const _shipperSignatureText = datos.signature ? String(datos.signature) : "";
  const carrierSignatureText = "CROPA S.A.";

  if (executedDateText) {
    doc.text(executedDateText, 215, 765);
  }
  if (executedPlaceText) {
    doc.text(executedPlaceText, 328, 765);
  }
  doc.text(carrierSignatureText, 460, 765);

  doc.setLineDashPattern([], 0);

  doc.rect(210, 779, 100, 25);
  doc.setFontSize(5);
  doc.line(225, 786, 295, 786, "F");
  doc.line(220, 779, 225, 786, "F");
  doc.line(295, 786, 300, 779, "F");
  doc.text(`Total Collect Charges`, 235, 784.5);

  doc.setFontSize(7);
  doc.setTextColor("#000");
  if (datos.totalCollectCharges) {
    const totalCollectChargesValue = datos.totalCollectCharges || "";
    if (totalCollectChargesValue) {
      doc.text(String(totalCollectChargesValue), 235, 796);
    }
  }
}
