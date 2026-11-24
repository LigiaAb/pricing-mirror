import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import image from "../../../assets/logo-cropa-dsv-1024x205.png";
import { fetchUsuarios } from "../../../hooks/Bpm";

/**
 * @typedef {Object} EncabezadoManifiesto
 * @property {string} [paisOrigen] - País de origen (ej: "Guatemala")
 * @property {string} [paisDestino] - País de destino (ej: "México")
 * @property {string} [shipper] - Nombre del Shipper / REMITENTE
 * @property {string} [shipperDireccion] - Dirección del Shipper (ciudad, país o dirección completa)
 * @property {string} [consignatario] - Nombre del Consignee / CONSIGNATARIO
 * @property {string} [consignatarioDireccion] - Dirección del Consignee (ciudad, país o dirección completa)
 * @property {string} [observaciones] - Observaciones del manifiesto
 * @property {string} [nomTipo] - Nombre del tipo de pago (ej: "PREPAID", "COLLECT")
 * @property {boolean} [horizontal=false] - Orientación del PDF (true=horizontal, false=vertical)
 * @property {string} [tamano="letter"] - Tamaño de página ("letter", "a4", etc.)
 * @property {string} [paisOrigenCodigo] - Código de país origen (opcional)
 * @property {string} [paisDestinoCodigo] - Código de país destino (opcional)
 */

/**
 * @typedef {Object} RegistroManifiesto
 * @property {string} [cartaPorte] - Identificador de la carta porte / correlativo_guia
 * @property {(number|string)} [bultos] - Cantidad de bultos (suma total de cargas)
 * @property {(number|string)} [peso] - Peso bruto en KG (suma repeso de cargas)
 * @property {string} [tipoPago] - Abreviación del tipo de pago: PP, CC, o PP/CC
 * @property {string} [shipper] - Nombre del shipper de esta coordinación
 * @property {string} [shipperDireccion] - Dirección del shipper
 * @property {string} [consignee] - Nombre del consignatario de esta coordinación
 * @property {string} [consigneeDireccion] - Dirección del consignatario
 */

/**
 * Genera un PDF de manifiesto de consolidado.
 *
 * Nota: este comentario completo se mantiene aquí por documentación, pero hay
 * un JSDoc reducido inmediatamente antes de la función exportada para que el
 * servidor de TypeScript lo asocie correctamente y VS Code muestre el hover.
 *
 * (Ver ejemplo de uso más abajo en el archivo)
 */

const calcularSumaColumna = (rows, columnIndex) => {
  if (!rows || rows.length === 0) return 0;

  return rows.reduce((acc, row) => {
    const val = row[columnIndex];
    const raw = val == null ? "" : String(val).replaceAll(",", "");
    const num = Number.parseFloat(raw);
    return Number.isNaN(num) ? acc : acc + num;
  }, 0);
};

/**
 * Prepara las filas de datos para la tabla de registros
 * @param {RegistroManifiesto[]} registros - Array de registros
 * @param {EncabezadoManifiesto} encabezado - Datos del encabezado
 * @returns {Array} Array de filas formateadas
 */
const prepararFilasRegistros = (registros = [], encabezado = {}) => {
  if (!Array.isArray(registros) || registros.length === 0) return [];

  const formatInteger = (v) => {
    if (v === null || v === undefined || v === "") return "";
    const n = Number(String(v).replaceAll(",", ""));
    return Number.isFinite(n)
      ? n.toLocaleString("en-US", { maximumFractionDigits: 0 })
      : String(v);
  };

  const formatFloat = (v) => {
    if (v === null || v === undefined || v === "") return "";
    const n = Number(String(v).replaceAll(",", ""));
    return Number.isFinite(n)
      ? n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      : String(v);
  };

  return registros.map((r) => {
    const carta = r.cartaPorte ?? "";
    const bultos = r.bultos ?? "";
    const descripcion = r.descripcion ?? "";
    const peso = r.peso ?? "";
    const tipoPagoText = r.tipoPago ?? "";

    const shipperParts = [r.shipper, r.shipperDireccion].filter(Boolean);
    const shipperText = shipperParts.length > 0 ? `Shipper:\n${shipperParts.join("\n")}` : "";
    const consigneeParts = [r.consignee, r.consigneeDireccion].filter(Boolean);
    const consigneeText = consigneeParts.length > 0 ? `Consignee:\n${consigneeParts.join("\n")}` : "";
    const shipperConsigneeText = [shipperText, consigneeText].filter(Boolean).join("\n\n");

    return [carta, formatInteger(bultos), descripcion, formatFloat(peso), tipoPagoText, shipperConsigneeText];
  });
};

/**
 * Obtiene el usuario actual formateado para el PDF
 * @returns {Promise<string|null>} Nombre del usuario o null
 */
const obtenerUsuarioActual = async () => {
  try {
    const cod = localStorage.getItem("cod_usuario");
    if (!cod) return null;

    const parsed = Number(cod);
    const filter = Number.isNaN(parsed)
      ? { cod_usuario: cod }
      : { cod_usuario: parsed };

    const results = await fetchUsuarios(filter);
    const usuario =
      Array.isArray(results) && results.length > 0 ? results[0] : null;

    if (usuario) {
      return (
        usuario.codCropa ?? usuario.usuario ?? usuario.label ?? String(cod)
      );
    } else {
      console.debug("generarPDF: no se encontro cod_usuario", cod);
      return String(cod);
    }
  } catch (e) {
    console.error("Error fetching user for PDF:", e);
    return null;
  }
};

/**
 * Genera un PDF de manifiesto de consolidado.
 *
 * @param {EncabezadoManifiesto} encabezado - Datos del encabezado del manifiesto
 * @param {RegistroManifiesto[]} registros - Array de registros/cargas a incluir en el manifiesto
 * @returns {Promise<Blob>} Blob del PDF generado
 * @async
 * @example
 * // Ejemplo mínimo:
 * // const encabezado = { shipper: 'ABC', shipperDireccion: 'Ciudad, País', consignatario: 'XYZ' };
 * // const registros = [{ cartaPorte: 'CP-001', bultos: 5, descripcion: 'Cajas', peso: 75.25 }];
 */
export default async function generarPDF(encabezado, registros = []) {
  const filasRegistros = prepararFilasRegistros(registros, encabezado);
  const sumaColumna2 = calcularSumaColumna(filasRegistros, 1);
  const sumaColumna4 = calcularSumaColumna(filasRegistros, 3);

  const doc = new jsPDF(
    encabezado.horizontal ? "l" : "p",
    "pt",
    encabezado.tamano || "letter"
  );

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const FONTS = {
    title: 12,
    subtitle: 10,
    body: 8,
    small: 7,
    footer: 9,
  };
  const SPACING = {
    section: 8,
    table: 6,
    cell: 5,
  };
  const COLORS = {
    primary: [100, 100, 100], // header gray tone
    text: [40, 40, 40],
    border: [60, 60, 60],
  };

  // === Encabezado: 2 Líneas horizontales, logo y texto GUATEMALA ===
  const lineY1 = 40;
  const logoWidth = 75;
  const logoHeight = 18.75;
  const logoX = 40;
  const logoY = lineY1 + 8;
  const lineY2 = logoY + logoHeight + 8;
  const textY = lineY1 + (lineY2 - lineY1) / 2 + 3;

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(1.5);
  doc.line(40, lineY1, pageWidth - 40, lineY1);
  doc.addImage(image, "PNG", logoX, logoY, logoWidth, logoHeight);
  doc.setFontSize(FONTS.title);
  doc.setFont("helvetica", "bold");
  doc.text("GUATEMALA", pageWidth - 40, textY, { align: "right" });

  const headerTableY = lineY2 + SPACING.section;
  const totalWidth = pageWidth - 40 * 2;

  // Helpers
  const getCellText = (cell) => {
    if (!cell) return "";
    if (Array.isArray(cell.text) && cell.text.length > 0)
      return cell.text.join("\n");
    if (typeof cell.raw === "string") return cell.raw;
    if (cell?.raw?.content !== undefined) return String(cell?.raw?.content);
    return "";
  };

  const handleHeaderCell = (data) => {
    try {
      const { cell, doc } = data;
      if (cell.section !== "body") return;
      const cellText = getCellText(cell);

      // Ciudad / City and State cell (row 0) — FECHA DE EMISIÓN + today's date
      if (
        data.row.index === 0 &&
        String(cellText).includes("CIUDAD / CITY AND STATE")
      ) {
        const centerX = cell.x + cell.width / 2;
        const baseY = cell.y + cell.height / 2;
        const today = new Date();
        const fechaHoy = today.toLocaleDateString("es-GT", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(FONTS.body);
        doc.setTextColor(...COLORS.text);
        doc.text("FECHA DE EMISIÓN:", centerX, baseY - 8, { align: "center" });
        doc.text("DATE OF ISSUE:", centerX, baseY, { align: "center" });
        doc.setFont("helvetica", "normal");
        doc.setFontSize(FONTS.subtitle);
        doc.text(fechaHoy, centerX, baseY + 14, { align: "center" });
      }

      // Fecha cell (row 1) — fecha_salida del primer leg
      if (
        data.row.index === 1 &&
        (String(cellText).includes("FECHA:") ||
          String(cellText).includes("DATE:"))
      ) {
        const fechaStr = encabezado.fechaSalida ?? "";
        let fechaFormateada = fechaStr;
        if (fechaStr) {
          try {
            const d = new Date(fechaStr);
            if (!Number.isNaN(d.getTime())) {
              fechaFormateada = d.toLocaleDateString("es-GT", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              });
            }
          } catch (e) {
            console.debug("generarManifiesto: fecha_salida parse error", e);
          }
        }
        doc.setFont("helvetica", "normal");
        doc.setFontSize(FONTS.subtitle);
        doc.setTextColor(...COLORS.text);
        const centerX = cell.x + cell.width / 2;
        const centerY = cell.y + cell.height / 2 + 5;
        doc.text(fechaFormateada, centerX, centerY, { align: "center" });
        doc.setFontSize(FONTS.body);
        doc.setFont("helvetica", "bold");
      }

      // Origin / Destination countries (row 2)
      if (data.row.index === 2) {
        const isOrigin =
          String(cellText).includes("DE:") ||
          String(cellText).includes("FROM:");
        const isDest =
          String(cellText).includes("A:") || String(cellText).includes("TO:");
        let country = "";
        if (isOrigin) country = encabezado.paisOrigen ?? "";
        else if (isDest) country = encabezado.paisDestino ?? "";

        if (country) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(FONTS.subtitle);
          doc.setTextColor(...COLORS.text);
          const centerX = cell.x + cell.width / 2;
          const centerY = cell.y + cell.height / 2 + FONTS.subtitle / 2;
          doc.text(String(country), centerX, centerY, { align: "center" });
          doc.setFontSize(FONTS.body);
          doc.setFont("helvetica", "bold");
        }
      }

      const rawCellContent = String(cell.raw?.content ?? getCellText(cell));
      const isViajeCell = rawCellContent.includes("VIAJE No. / ROAD TRIP No.");
      const isManifiestoCell = rawCellContent.includes("MANIFIESTO No. / MANIFEST No.");

      if (isViajeCell || isManifiestoCell) {
        const value = isViajeCell
          ? encabezado.viajeNo ?? ""
          : encabezado.manifiestoNo ?? "";

        if (value) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(FONTS.subtitle);
          doc.setTextColor(...COLORS.text);
          const centerX = cell.x + cell.width / 2;
          const textY = cell.y + cell.height / 2 + 12;
          doc.text(String(value), centerX, textY, { align: "center" });
          doc.setFontSize(FONTS.body);
          doc.setFont("helvetica", "bold");
        }
      }
    } catch (e) {
      console.error("Error dibujando país/fecha en header:", e);
    }
  };

  const drawBorders = (cell, doc) => {
    const { x, y, width, height } = cell;
    doc.setLineWidth(1.2);
    doc.setDrawColor(...COLORS.border);
    doc.line(x, y, x, y + height);
    doc.line(x + width, y, x + width, y + height);
  };

  const drawDashedLine = (doc, x, y, width, dashLength = 3, gapLength = 2) => {
    let curX = x;
    while (curX < x + width) {
      const endX = Math.min(curX + dashLength, x + width);
      doc.line(curX, y, endX, y);
      curX += dashLength + gapLength;
    }
  };

  const handleRegistroCell = (data) => {
    try {
      const { cell, doc } = data;
      const { x, y, width, height } = cell;

      if (cell.section !== "body") return;

      drawBorders(cell, doc);

      if (data.row.index === 0) {
        doc.setLineWidth(1.2);
        doc.line(x, y, x + width, y);
      }

      if (data.row.index === segundaTablaBody.length - 1) {
        doc.setLineWidth(1.2);
        doc.setDrawColor(...COLORS.border);
        doc.line(x, y + height, x + width, y + height);
      }

      if (
        data.column.index < 5 &&
        data.row.index !== segundaTablaBody.length - 1
      ) {
        const yLine = y + height;
        drawDashedLine(doc, x, yLine, width, 1, 2);
      }
    } catch (e) {
      console.error("Error dibujando Shipper/Consignee en tabla:", e);
    }
  };

  // Tabla 1: Encabezado principal
  autoTable(doc, {
    startY: headerTableY,
    margin: { left: 40, right: 40 },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: FONTS.body,
      halign: "center",
      valign: "middle",
      cellPadding: { top: 8, right: 8, bottom: 8, left: 8 },
      lineColor: COLORS.border,
      lineWidth: 1.2,
      fontStyle: "bold",
      textColor: COLORS.text,
    },
    columnStyles: {
      0: { cellWidth: totalWidth * 0.18, halign: "left" },
      1: { cellWidth: totalWidth * 0.1, halign: "left" },
      2: { cellWidth: totalWidth * 0.26, halign: "center" },
      3: { cellWidth: totalWidth * 0.14, halign: "left" },
      4: { cellWidth: totalWidth * 0.1, halign: "left" },
      5: { cellWidth: totalWidth * 0.22, halign: "left" },
    },
    body: [
      [
        {
          content: "ON 6 CONTINENTS\nREPRESENTANTES PARA GUATEMALA",
          colSpan: 2,
          styles: { fontStyle: "bold", halign: "center", valign: "middle" },
        },
        {
          content: "MANIFIESTO\nDE CONSOLIDADO\n\nCONSOLIDATION\nMANIFEST",
          colSpan: 2,
          styles: { fontStyle: "bold" },
        },
        {
          content: "CIUDAD / CITY AND STATE",
          colSpan: 2,
          styles: {
            fontStyle: "bold",
            halign: "right",
            valign: "top",
            cellPadding: { top: 2, right: 8, bottom: 6, left: 8 },
          },
        },
      ],
      [
        {
          content: `TRANSPORTISTA: CARRIER:\n${encabezado.transportista || ""}`,
          colSpan: 2,
          styles: { fontStyle: "bold" },
        },
        {
          content: "VIAJE No. / ROAD TRIP No.",
          colSpan: 2,
          styles: { fontStyle: "bold", halign: "left", valign: "top" },
        },
        { content: "FECHA:\nDATE:", colSpan: 2, styles: { fontStyle: "bold" } },
      ],
      [
        {
          content: "MANIFIESTO No. / MANIFEST No.",
          colSpan: 2,
          styles: { fontStyle: "bold", valign: "top" },
        },
        {
          content: `DE:\nFROM:`,
          colSpan: 2,
          styles: { fontStyle: "bold", halign: "left" },
        },
        {
          content: `A:\nTO:`,
          colSpan: 2,
          styles: { fontStyle: "bold" },
        },
      ],
    ],
    didParseCell: function (data) {
      if (data.cell.section !== "body") return;
      const rawText = String(data.cell.raw?.content ?? getCellText(data.cell));
      if (
        rawText.includes("VIAJE No. / ROAD TRIP No.:") ||
        rawText.includes("MANIFIESTO No. / MANIFEST No.")
      ) {
        const [label] = rawText.split("\n");
        data.cell.text = [label];
      }
    },
    didDrawCell: handleHeaderCell,
  });

  const eqColW = (totalWidth * 0.46) / 3;
  const mainColStyles = {
    0: { cellWidth: totalWidth * 0.14 },
    1: { cellWidth: totalWidth * 0.08 },
    2: { cellWidth: totalWidth * 0.32 },
    3: { cellWidth: eqColW },
    4: { cellWidth: eqColW },
    5: { cellWidth: totalWidth * 0.46 - eqColW * 2 },
  };

  // Tabla 2: Encabezado de columnas
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + SPACING.section,
    margin: { left: 40, right: 40 },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: FONTS.body,
      halign: "center",
      valign: "middle",
      cellPadding: { top: 7, right: 6, bottom: 7, left: 6 },
      lineColor: COLORS.border,
      lineWidth: 1.2,
      fontStyle: "bold",
      textColor: COLORS.text,
      fillColor: [245, 245, 245],
    },
    columnStyles: mainColStyles,
    body: [
      [
        {
          content: "Consolidación de\nlas siguientes CARTA PORTE",
          styles: { fontStyle: "bold" },
        },
        { content: "No. de bultos", styles: { fontStyle: "bold" } },
        { content: "Descripción de la mercadería", styles: { fontStyle: "bold" } },
        { content: "Peso bruto\nKg.", styles: { fontStyle: "bold" } },
        { content: "TIPO DE\nPAGO", styles: { fontStyle: "bold" } },
        { content: "Remitente / Consignatario", styles: { fontStyle: "bold" } },
      ],
      [
        {
          content: "Consolidation of the following\nCARTAGE LETTER",
          styles: { fontStyle: "bold" },
        },
        { content: "Quantity of\nPieces", styles: { fontStyle: "bold" } },
        { content: "Description of goods", styles: { fontStyle: "bold" } },
        { content: "Gross\nWeight Kg.", styles: { fontStyle: "bold" } },
        { content: "PREPAID /\nCOLLECT", styles: { fontStyle: "bold" } },
        { content: "Shipper / Consignee", styles: { fontStyle: "bold" } },
      ],
    ],
  });

  let segundaTablaBody = [];
  let numFilas = Array.isArray(filasRegistros) ? filasRegistros.length : 0;
  if (numFilas > 0) {
    segundaTablaBody = filasRegistros.map((row) =>
      row.map((val) => {
        if (
          val &&
          typeof val === "object" &&
          (val.content !== undefined || val.rowSpan !== undefined)
        ) {
          return val;
        }
        return { content: val, styles: {} };
      })
    );
  } else {
    segundaTablaBody = [
      [
        { content: "", styles: {} },
        { content: "", styles: {} },
        { content: "", styles: {} },
        { content: "", styles: {} },
        { content: "", styles: {} },
        { content: "", styles: {} },
      ],
    ];
    numFilas = 1;
  }

  const espacioInferiorRequerido = 140;
  const rowHeight =
    numFilas > 0 &&
      pageHeight - espacioInferiorRequerido - doc.lastAutoTable.finalY > 0
      ? (pageHeight - espacioInferiorRequerido - doc.lastAutoTable.finalY) /
      numFilas
      : 40;

  // Tabla 3: Registros dinámicos
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY,
    margin: { left: 40, right: 40 },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: FONTS.body,
      halign: "left",
      valign: "top",
      cellPadding: { top: 6, right: 6, bottom: 6, left: 6 },
      lineWidth: 0,
      textColor: COLORS.text,
    },
    columnStyles: {
      0: { cellWidth: mainColStyles[0].cellWidth },
      1: { cellWidth: mainColStyles[1].cellWidth, halign: "center" },
      2: { cellWidth: mainColStyles[2].cellWidth },
      3: { cellWidth: mainColStyles[3].cellWidth, halign: "center" },
      4: { cellWidth: mainColStyles[4].cellWidth, halign: "center" },
      5: { cellWidth: mainColStyles[5].cellWidth },
    },
    body: segundaTablaBody,
    didParseCell: function (data) {
      data.row.height = rowHeight;
    },
    didDrawCell: handleRegistroCell,
  });

  const minTotalesAltura = 22;
  const pieText = [
    "3ra. Calle 6-70 Zona 13 Pamplona, Guatemala, C.A.",
    "(502) 2259-0600",
    "informacion@cropa.com.gt",
  ];
  const pieLineHeight = 12;
  const pieTotalHeight = pieText.length * pieLineHeight;
  const pieAltura = pieTotalHeight + 18;

  // Calcular posiciones desde abajo hacia arriba
  const pieStartY = pageHeight - pieAltura;
  const marginSuperiorPie = 12;
  const observacionesBottomY = pieStartY - marginSuperiorPie;

  // Calcular altura necesaria para Observaciones
  const observacionesText = `Observaciones: ${encabezado.observaciones ?? ""}`;
  const cellPadding = { top: 10, right: 10, bottom: 10, left: 10 };
  const availableTextWidth =
    totalWidth * 0.83 - cellPadding.left - cellPadding.right;

  doc.setFontSize(FONTS.subtitle);
  const textDimensions = doc.getTextDimensions(observacionesText, {
    maxWidth: availableTextWidth,
  });

  const lineHeight = FONTS.subtitle * 1.2;
  const minHeightFor3Lines =
    lineHeight * 3 + cellPadding.top + cellPadding.bottom;
  const calculatedHeight =
    textDimensions.h + cellPadding.top + cellPadding.bottom + 20;
  const observacionesAltura = Math.max(calculatedHeight, minHeightFor3Lines);
  const adjustedObservacionesY = observacionesBottomY - observacionesAltura;

  // Calcular posición y altura de Totales
  const registrosEndY = doc.lastAutoTable.finalY;
  const marginEntreTablas = 0;
  const totalesBottomY = adjustedObservacionesY - marginEntreTablas;
  const espacioDisponible = totalesBottomY - registrosEndY;
  const totalesAltura = Math.max(
    minTotalesAltura,
    Math.min(espacioDisponible, minTotalesAltura + 5)
  );
  const adjustedTotalesY = totalesBottomY - totalesAltura;

  // Tabla 4: Totales
  const suma2 = Number(sumaColumna2) || 0;
  const suma4 = Number(sumaColumna4) || 0;

  autoTable(doc, {
    startY: adjustedTotalesY, // Usar Y ajustado para que termine antes de Observaciones
    margin: { left: 40, right: 40 },
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: FONTS.subtitle,
      halign: "left",
      valign: "middle",
      cellPadding: { top: 8, right: 8, bottom: 8, left: 8 },
      lineColor: COLORS.border,
      lineWidth: 1.2,
      fontStyle: "bold",
      textColor: COLORS.primary,
      fillColor: [240, 240, 240],
    },
    columnStyles: {
      0: { cellWidth: mainColStyles[0].cellWidth, fontStyle: "bold" },
      1: { cellWidth: mainColStyles[1].cellWidth, halign: "center", fontStyle: "bold" },
      2: { cellWidth: mainColStyles[2].cellWidth },
      3: { cellWidth: mainColStyles[3].cellWidth, halign: "center", fontStyle: "bold" },
      4: { cellWidth: mainColStyles[4].cellWidth },
      5: { cellWidth: mainColStyles[5].cellWidth },
    },
    body: [
      [
        { content: "TOTALES", styles: { fontStyle: "bold" } },
        {
          content: suma2.toLocaleString(),
          styles: { fontStyle: "bold", halign: "center" },
        },
        { content: "", styles: {} },
        {
          content:
            suma4.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }) + " KG",
          styles: { fontStyle: "bold", halign: "center" },
        },
        { content: "", styles: {} },
        { content: "", styles: {} },
      ],
    ],
    didParseCell: function (data) {
      data.row.height = totalesAltura;
    },
  });

  // Tabla 5: Observaciones
  if (observacionesAltura > 0) {
    const usuarioDisplay = await obtenerUsuarioActual();

    autoTable(doc, {
      startY: adjustedObservacionesY,
      margin: { left: 40, right: 40 },
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: FONTS.subtitle,
        halign: "left",
        valign: "top",
        cellPadding: cellPadding,
        lineColor: COLORS.border,
        lineWidth: 1.2,
        fontStyle: "normal",
        textColor: COLORS.text,
      },
      columnStyles: {
        0: { cellWidth: mainColStyles[0].cellWidth },
        1: { cellWidth: mainColStyles[1].cellWidth },
        2: { cellWidth: mainColStyles[2].cellWidth },
        3: { cellWidth: mainColStyles[3].cellWidth },
        4: { cellWidth: mainColStyles[4].cellWidth },
        5: { cellWidth: mainColStyles[5].cellWidth },
      },
      body: [
        [
          {
            content: observacionesText,
            colSpan: 5,
            styles: { fontStyle: "normal" },
          },
          {
            content: "",
            colSpan: 1,
            styles: { fontStyle: "normal", halign: "center", valign: "middle" },
          },
        ],
      ],
      didParseCell: function (data) {
        data.row.height = observacionesAltura;
      },
      didDrawCell: function (data) {
        try {
          const { cell, doc } = data;
          if (
            data.section === "body" &&
            data.row.index === 0 &&
            data.column.index === 5
          ) {
            const centerX = cell.x + cell.width / 2;
            const centerY = cell.y + cell.height / 2;

            // Title
            doc.setFont("helvetica", "bold");
            doc.setFontSize(FONTS.small);
            doc.setTextColor(...COLORS.primary);
            doc.text("PREPARED BY:", centerX, centerY - 6, { align: "center" });

            // Username / email
            const usuario = usuarioDisplay || "";
            if (usuario) {
              doc.setFont("helvetica", "normal");
              doc.setFontSize(FONTS.small - 1);
              doc.setTextColor(...COLORS.text);
              doc.text(usuario, centerX, centerY + 6, { align: "center" });
            }
          }
        } catch (e) {
          console.error("Error drawing Prepared By cell:", e);
        }
      },
    });
  }

  // Pie de página
  doc.setFontSize(FONTS.footer);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.text);
  pieText.forEach((line, i) => {
    doc.text(line, pageWidth / 2, pieStartY + i * pieLineHeight, {
      align: "center",
    });
  });

  return doc.output("blob");
}
