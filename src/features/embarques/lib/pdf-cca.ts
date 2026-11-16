import image from "@/assets/logos/logo-cropa-dsv.png";
import { safeString } from "@/shared/lib/text";

export interface PdfCcaData {
  fecha: string;
  noReferencia: string;
  destinatario: string;
  atencion: string;
  awb: string;
  origen: string;
  destino: string;
  fechaEmision: string;
  remitente: string;
  consignatario: string;
  correctosNoBultos: string;
  correctosNoBultosBold: boolean;
  incorrectosNoBultos: string;
  correctosPesoKilos: string;
  correctosPesoKilosBold: boolean;
  incorrectosPesoKilos: string;
  correctosTarifaPrepaid: string;
  correctosTarifaPrepaidBold: boolean;
  incorrectosTarifaPrepaid: string;
  correctosTarifaCollect: string;
  correctosTarifaCollectBold: boolean;
  incorrectosTarifaCollect: string;
  correctosFletePrepaid: string;
  correctosFletePrepaidBold: boolean;
  incorrectosFletePrepaid: string;
  correctosFleteCollect: string;
  correctosFleteCollectBold: boolean;
  incorrectosFleteCollect: string;
  correctosIVAPrepaid: string;
  correctosIVAPrepaidBold: boolean;
  incorrectosIVAPrepaid: string;
  correctosIVACollect: string;
  correctosIVACollectBold: boolean;
  incorrectosIVACollect: string;
  correctosDueAgentPrepaid: string;
  correctosDueAgentPrepaidBold: boolean;
  incorrectosDueAgentPrepaid: string;
  correctosDueAgentCollect: string;
  correctosDueAgentCollectBold: boolean;
  incorrectosDueAgentCollect: string;
  correctosDueCarrierPrepaid: string;
  correctosDueCarrierPrepaidBold: boolean;
  incorrectosDueCarrierPrepaid: string;
  correctosDueCarrierCollect: string;
  correctosDueCarrierCollectBold: boolean;
  incorrectosDueCarrierCollect: string;
  horizontal?: boolean;
  tamano?: string;
}

function calcularTamanoImagen(anchoDeseado?: number, altoDeseado?: number): number {
  const img = { width: 20, height: 3.7 };
  if (anchoDeseado) {
    return (img.height / img.width) * anchoDeseado;
  }
  if (altoDeseado) {
    return (img.width / img.height) * altoDeseado;
  }
  return 0;
}

export default async function pdfCca(pdfData: PdfCcaData): Promise<Blob> {
  const jsPDF = (await import("jspdf")).default;
  await import("jspdf-autotable");
  const doc = new jsPDF(pdfData.horizontal ? "l" : "p", "pt", pdfData.tamano || "letter");

  const parseNumber = (value: unknown): number => {
    const cleaned = safeString(value).replaceAll(",", "").trim();
    const num = Number.parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
  };

  const totalFields = ["Tarifa", "Flete", "IVA", "DueAgent", "DueCarrier"];

  const data = pdfData as unknown as Record<string, unknown>;

  const totalCorrectosPrepaid = totalFields
    .map((field) => `correctos${field}Prepaid`)
    .reduce((sum, key) => sum + parseNumber(data[key]), 0);

  const totalCorrectosCollect = totalFields
    .map((field) => `correctos${field}Collect`)
    .reduce((sum, key) => sum + parseNumber(data[key]), 0);

  const totalIncorrectosPrepaid = totalFields
    .map((field) => `incorrectos${field}Prepaid`)
    .reduce((sum, key) => sum + parseNumber(data[key]), 0);

  const totalIncorrectosCollect = totalFields
    .map((field) => `incorrectos${field}Collect`)
    .reduce((sum, key) => sum + parseNumber(data[key]), 0);

  const formatTotal = (value: number): string =>
    Number.isFinite(value) && value !== 0
      ? value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : "";

  doc.addImage(image.src, 15, 25, 230, calcularTamanoImagen(230));

  doc.setFontSize(15);
  doc.setTextColor("#00205b");
  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.text("CORRECCION DE CARGOS", 385, 40);

  doc.setFontSize(9);
  doc.rect(10, 90, 590, 0.7);
  doc.setTextColor("#666666");
  doc.setDrawColor("#666666");

  doc.text("Importaciones - Exportaciones - Aduanas", 25, 75);

  doc.text("Fecha ", 445, 58, { align: "right" });
  doc.text("No. Ref. ", 445, 75, { align: "right" });

  doc.text("A (Destinatario)", 25, 115);
  doc.line(25, 137, 200, 137);

  doc.text("Atencion", 220, 115);
  doc.line(220, 137, 400, 137);

  doc.setTextColor("#00205b");
  doc.text("AWB", 430, 115);

  doc.setDrawColor("#5A91C7");
  doc.setFillColor("#5A91C7");
  doc.roundedRect(420, 100, 160, 50, 5, 5, "F");
  doc.line(430, 137, 500, 137);

  doc.setTextColor("#666666");
  doc.setDrawColor("#000f2b");
  doc.setFillColor("#000f2b");
  doc.text("DE", 25, 170);
  doc.setDrawColor("#666666");

  doc.line(25, 192, 200, 192);

  doc.text("A (Destino)", 220, 170);
  doc.line(220, 192, 400, 192);

  doc.text("FECHA DE EMISION", 420, 170);
  doc.line(420, 192, 580, 192);

  doc.line(25, 205, 580, 205);

  doc.text("REMITENTE", 25, 225);
  doc.line(25, 242, 280, 242);

  doc.text("CONSIGNATARIO", 300, 225);
  doc.line(300, 242, 580, 242);

  doc.setDrawColor("#666666");
  doc.setFillColor("#666666");
  doc.roundedRect(25, 250, 555, 20, 5, 5, "F");
  doc.setTextColor("#000000");
  doc.text(
    "Por este medio solicitamos corregir los cargos que detallamos a continuacion:",
    35,
    264,
  );
  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(25, 250, 3, 20, "F");

  doc.setFontSize(9);

  doc.setDrawColor("#2a5ea3");
  doc.setFillColor("#2a5ea3");
  doc.roundedRect(25, 275, 555, 60, 5, 5, "F");

  doc.setDrawColor("#164077");
  doc.setFillColor("#164077");
  doc.roundedRect(140, 300, 440, 35, 5, 5, "F");

  doc.setTextColor("#ffffff");
  doc.setFontSize(10);
  doc.text("CONCEPTO", 35, 310);

  doc.text("CARGOS CORRECTOS", 175, 290);
  doc.text("PREPAID", 150, 320);
  doc.text("COLLECT", 275, 320);

  doc.text("CARGOS INCORRECTOS", 390, 290);
  doc.text("PREPAID", 360, 320);
  doc.text("COLLECT", 500, 320);

  doc.setFontSize(9);

  doc.setTextColor("#666666");
  doc.setDrawColor("#666666");
  doc.line(340, 335, 340, 575);
  doc.text("No. de bultos", 35, 352);
  doc.line(25, 365, 580, 365);
  doc.text("Peso en kilos", 35, 382);
  doc.line(25, 395, 580, 395);
  doc.text("Tarifa", 35, 412);
  doc.line(25, 425, 580, 425);
  doc.text("Flete", 35, 442);
  doc.line(25, 455, 580, 455);
  doc.text("IVA", 35, 472);
  doc.line(25, 485, 580, 485);
  doc.text("Due agent", 35, 502);
  doc.line(25, 515, 580, 515);
  doc.text("Due carrier", 35, 532);
  doc.line(25, 545, 580, 545);

  doc.setDrawColor("#666666");
  doc.setFillColor("#666666");
  doc.roundedRect(25, 545, 555, 30, 5, 5, "F");
  doc.roundedRect(25, 585, 555, 30, 5, 5, "F");
  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(25, 585, 3, 30, "F");
  doc.setTextColor("#000f2b");
  doc.text("Total", 35, 562);
  doc.text(`${formatTotal(totalCorrectosPrepaid)}`, 170, 562, {
    align: "center",
  });
  doc.text(`${formatTotal(totalCorrectosCollect)}`, 295, 562, {
    align: "center",
  });
  doc.text(`${formatTotal(totalIncorrectosPrepaid)}`, 380, 562, {
    align: "center",
  });
  doc.text(`${formatTotal(totalIncorrectosCollect)}`, 520, 562, {
    align: "center",
  });
  doc.line(140, 575, 580, 575);
  doc.text(
    "Agradecemos tomar nota de esta correccion para evitar cualquier dificultad con la exportacion",
    35,
    603,
  );
  doc.setDrawColor("#000f2b");
  doc.setFillColor("#000f2b");
  doc.setTextColor("#666666");

  doc.line(25, 665, 280, 665);
  doc.text("GERENTE DE EXPORTACIONES", 25, 675);

  doc.line(300, 665, 580, 665);
  doc.text("EXPORTACION / AEREO", 300, 675);

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.roundedRect(3, 700, 605, 90, 5, 5, "F");
  doc.setTextColor("#ffffff");

  doc.text("Cropa Sociedad Anonima", 25, 730);
  doc.text("3a. calle 6-70 Zona 13 Pamplona, Guatemala", 25, 745);
  doc.text("Telefono: (502) 2366-0000", 25, 760);
  doc.text("informacion@cropa.com.gt", 25, 775);

  doc.setTextColor("#000f2b");
  doc.setFontSize(9);

  const drawCell = (
    text: string,
    x: number,
    y: number,
    opts: { align: string },
    bold?: boolean,
  ) => {
    if (bold) doc.setFont("helvetica", "bold");
    doc.text(`${text}`, x, y, opts as Record<string, unknown>);
    if (bold) doc.setFont("helvetica", "normal");
  };

  doc.text(`${pdfData.fecha}`, 465, 58);
  doc.text(`${pdfData.noReferencia}`, 465, 75);
  doc.text(`${pdfData.destinatario}`, 25, 135);
  doc.text(`${pdfData.atencion}`, 220, 135);
  doc.text(`${pdfData.awb}`, 430, 135);
  doc.text(`${pdfData.origen}`, 25, 190);
  doc.text(`${pdfData.destino}`, 220, 190);
  doc.text(`${pdfData.fechaEmision}`, 420, 190);
  doc.text(`${pdfData.remitente}`, 25, 240);
  doc.text(`${pdfData.consignatario}`, 300, 240);

  drawCell(pdfData.correctosNoBultos, 233, 355, { align: "center" }, pdfData.correctosNoBultosBold);
  doc.text(`${pdfData.incorrectosNoBultos}`, 450, 355, { align: "center" });

  drawCell(
    pdfData.correctosPesoKilos,
    233,
    382,
    { align: "center" },
    pdfData.correctosPesoKilosBold,
  );
  doc.text(`${pdfData.incorrectosPesoKilos}`, 450, 382, { align: "center" });

  drawCell(
    pdfData.correctosTarifaPrepaid,
    170,
    412,
    { align: "center" },
    pdfData.correctosTarifaPrepaidBold,
  );
  drawCell(
    pdfData.correctosTarifaCollect,
    295,
    412,
    { align: "center" },
    pdfData.correctosTarifaCollectBold,
  );
  doc.text(`${pdfData.incorrectosTarifaPrepaid}`, 380, 412, { align: "center" });
  doc.text(`${pdfData.incorrectosTarifaCollect}`, 520, 412, { align: "center" });

  drawCell(
    pdfData.correctosFletePrepaid,
    170,
    442,
    { align: "center" },
    pdfData.correctosFletePrepaidBold,
  );
  drawCell(
    pdfData.correctosFleteCollect,
    295,
    442,
    { align: "center" },
    pdfData.correctosFleteCollectBold,
  );
  doc.text(`${pdfData.incorrectosFletePrepaid}`, 380, 442, { align: "center" });
  doc.text(`${pdfData.incorrectosFleteCollect}`, 520, 442, { align: "center" });

  drawCell(
    pdfData.correctosIVAPrepaid,
    170,
    472,
    { align: "center" },
    pdfData.correctosIVAPrepaidBold,
  );
  drawCell(
    pdfData.correctosIVACollect,
    295,
    472,
    { align: "center" },
    pdfData.correctosIVACollectBold,
  );
  doc.text(`${pdfData.incorrectosIVAPrepaid}`, 380, 472, { align: "center" });
  doc.text(`${pdfData.incorrectosIVACollect}`, 520, 472, { align: "center" });

  drawCell(
    pdfData.correctosDueAgentPrepaid,
    170,
    502,
    { align: "center" },
    pdfData.correctosDueAgentPrepaidBold,
  );
  drawCell(
    pdfData.correctosDueAgentCollect,
    295,
    502,
    { align: "center" },
    pdfData.correctosDueAgentCollectBold,
  );
  doc.text(`${pdfData.incorrectosDueAgentPrepaid}`, 380, 502, { align: "center" });
  doc.text(`${pdfData.incorrectosDueAgentCollect}`, 520, 502, { align: "center" });

  drawCell(
    pdfData.correctosDueCarrierPrepaid,
    170,
    532,
    { align: "center" },
    pdfData.correctosDueCarrierPrepaidBold,
  );
  drawCell(
    pdfData.correctosDueCarrierCollect,
    295,
    532,
    { align: "center" },
    pdfData.correctosDueCarrierCollectBold,
  );
  doc.text(`${pdfData.incorrectosDueCarrierPrepaid}`, 380, 532, { align: "center" });
  doc.text(`${pdfData.incorrectosDueCarrierCollect}`, 520, 532, { align: "center" });

  return doc.output("blob");
}
