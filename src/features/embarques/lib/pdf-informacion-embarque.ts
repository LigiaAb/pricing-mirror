import { format } from "date-fns";
import type jsPDF from "jspdf";
import { logger } from "@/shared/lib/logger";
import { asText, safeString } from "@/shared/lib/text";
import {
  drawEntityBox,
  drawField,
  drawSectionTitle,
  formatFechaRecoleccion,
  measureEntityBoxHeight,
} from "./pdf-info-helpers";
import type { AnyRecord } from "./pdf-info-types";
import { renderDocumentos } from "./pdf-informacion-embarque/documentos";
import { renderHeader } from "./pdf-informacion-embarque/header";
import { renderItemsTable } from "./pdf-informacion-embarque/items-table";
import { renderPiePagina } from "./pdf-informacion-embarque/pie-pagina";
import { renderWatermark } from "./pdf-informacion-embarque/watermark";

export const generarPdfInformacionEmbarque = async (
  formData: AnyRecord = {},
  tipoSeleccionadoInfo: AnyRecord = {},
  servicioSeleccionadoInfo: AnyRecord = {},
  incluirPiePagina = true,
): Promise<{ success: boolean; blob?: Blob; error?: string }> => {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default as (
    doc: jsPDF,
    options: Record<string, unknown>,
  ) => void;
  try {
    const doc = new jsPDF("portrait", "mm", "letter");
    // El visor de PDF nativo del navegador usa el título de los metadatos del
    // PDF —no el nombre del Blob— para la pestaña y el nombre sugerido.
    const fechaTituloPdf = format(new Date(), "yyyy-MM-dd");
    doc.setProperties({ title: `Instructivo Embarque ${fechaTituloPdf}` });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margins = { top: 15, right: 15, bottom: 15, left: 15 };
    const contentWidth = pageWidth - margins.left - margins.right;

    const primaryColor: [number, number, number] = [0, 75, 144];
    const secondaryColor: [number, number, number] = [100, 100, 100];
    const lightGray: [number, number, number] = [245, 245, 245];

    let yPos = renderHeader({ doc, formData, margins, pageWidth, primaryColor, secondaryColor });

    yPos = drawSectionTitle({
      doc,
      title: "Datos Generales",
      y: yPos,
      margins,
      contentWidth,
      pageHeight,
      primaryColor,
    });

    // Datos Generales: 4 columnas en una fila (Transporte, Servicio, País
    // Destino, Incoterm) — mismo orden que el legacy.
    const col1X = margins.left;
    const colWidth = (contentWidth - 15) / 4;
    const col2X = col1X + colWidth + 5;
    const col3X = col2X + colWidth + 5;
    const col4X = col3X + colWidth + 5;

    const y1 = drawField({
      doc,
      label: "Modo de Transporte",
      value: tipoSeleccionadoInfo.label || formData.transportMode,
      x: col1X,
      y: yPos,
      width: colWidth,
      secondaryColor,
    });
    const y2 = drawField({
      doc,
      label: "Servicio",
      value: servicioSeleccionadoInfo.label,
      x: col2X,
      y: yPos,
      width: colWidth,
      secondaryColor,
    });
    const y3 = drawField({
      doc,
      label: "País Destino",
      value: formData.paisDestino,
      x: col3X,
      y: yPos,
      width: colWidth,
      secondaryColor,
    });
    const y4 = drawField({
      doc,
      label: "Incoterm",
      value: formData.incoterm,
      x: col4X,
      y: yPos,
      width: colWidth,
      secondaryColor,
    });
    yPos = Math.max(y1, y2, y3, y4) + 4;

    const boxWidth = (contentWidth - 5) / 2;
    const shipperData: Record<string, string> = {
      nombre: asText(formData.exportador),
      nit: asText(formData.shipperNit),
      direccion: asText(formData.sitioRecoleccion),
      contacto: asText(formData.contactoExportador),
      telefono: asText(formData.telefonoExportador),
      email: asText(formData.emailExportador),
    };
    const consigneeData: Record<string, string> = {
      nombre: asText(formData.consignatario),
      nit: asText(formData.nitCliente),
      direccion: asText(formData.direccionConsignatario),
      contacto: asText(formData.contactoConsignatario),
      telefono: asText(formData.telefonosConsignatario),
      email: asText(formData.emailConsignatario),
    };

    // Ambas cajas se dibujan con la altura de la más alta para que el par se
    // mantenga visualmente uniforme aunque alguno de sus valores ocupe más líneas.
    const sharedBoxHeight = Math.max(
      measureEntityBoxHeight({ doc, data: shipperData, width: boxWidth }),
      measureEntityBoxHeight({ doc, data: consigneeData, width: boxWidth }),
    );

    const yAfterShipper = drawEntityBox({
      doc,
      title: "SHIPPER",
      data: shipperData,
      x: margins.left,
      y: yPos,
      width: boxWidth,
      margins,
      pageHeight,
      lightGray,
      primaryColor,
      secondaryColor,
      forcedHeight: sharedBoxHeight,
    });
    const yAfterConsignatario = drawEntityBox({
      doc,
      title: "CONSIGNATARIO",
      data: consigneeData,
      x: margins.left + boxWidth + 5,
      y: yPos,
      width: boxWidth,
      margins,
      pageHeight,
      lightGray,
      primaryColor,
      secondaryColor,
      forcedHeight: sharedBoxHeight,
    });
    yPos = Math.max(yAfterShipper, yAfterConsignatario);

    yPos = drawSectionTitle({
      doc,
      title: "Notificar A",
      y: yPos,
      margins,
      contentWidth,
      pageHeight,
      primaryColor,
    });

    const notifColWidth = (contentWidth - 5) / 2;
    const notifX1 = margins.left;
    const notifX2 = notifX1 + notifColWidth + 5;

    const notifY1 = drawField({
      doc,
      label: "Nombre",
      value: formData.notificacionesNombre,
      x: notifX1,
      y: yPos,
      width: notifColWidth,
      secondaryColor,
    });
    const notifY2 = drawField({
      doc,
      label: "Teléfono",
      value: formData.notificacionesTelefono,
      x: notifX2,
      y: yPos,
      width: notifColWidth,
      secondaryColor,
    });
    const notifY3 = drawField({
      doc,
      label: "Email",
      value: formData.notificacionesEmail,
      x: notifX1,
      y: Math.max(notifY1, notifY2),
      width: notifColWidth,
      secondaryColor,
    });
    const notifY4 = drawField({
      doc,
      label: "Teléfono emergencia",
      value: formData.telefonoEmergencia,
      x: notifX2,
      y: Math.max(notifY1, notifY2),
      width: notifColWidth,
      secondaryColor,
    });
    yPos = Math.max(notifY3, notifY4) + 5;

    yPos = drawSectionTitle({
      doc,
      title: "Facturación",
      y: yPos,
      margins,
      contentWidth,
      pageHeight,
      primaryColor,
    });

    const factColWidth = (contentWidth - 15) / 4;
    const factX1 = margins.left;
    const factX2 = factX1 + factColWidth + 5;
    const factX3 = factX2 + factColWidth + 5;
    const factX4 = factX3 + factColWidth + 5;

    const factY1 = drawField({
      doc,
      label: "Nombre",
      value: formData.nombreFacturacion,
      x: factX1,
      y: yPos,
      width: factColWidth,
      secondaryColor,
    });
    const factY2 = drawField({
      doc,
      label: "NIT",
      value: formData.nitFactura,
      x: factX2,
      y: yPos,
      width: factColWidth,
      secondaryColor,
    });
    const factY3 = drawField({
      doc,
      label: "Teléfono",
      value: formData.telefonoFacturacion,
      x: factX3,
      y: yPos,
      width: factColWidth,
      secondaryColor,
    });
    const factY4 = drawField({
      doc,
      label: "Dirección",
      value: formData.direccionFiscal,
      x: factX4,
      y: yPos,
      width: factColWidth,
      secondaryColor,
    });
    yPos = Math.max(factY1, factY2, factY3, factY4) + 3;

    yPos =
      drawField({
        doc,
        label: "Email para enviar factura electrónica",
        value: formData.emailFacturacion,
        x: factX1,
        y: yPos,
        width: contentWidth - 3,
        secondaryColor,
      }) + 2;

    yPos = drawSectionTitle({
      doc,
      title: "PRODUCTO",
      y: yPos,
      margins,
      contentWidth,
      pageHeight,
      primaryColor,
    });
    const prodColWidth = (contentWidth - 10) / 3;
    const prodX1 = margins.left;
    const prodX2 = prodX1 + prodColWidth + 5;
    const prodX3 = prodX2 + prodColWidth + 5;

    const prodY1 = drawField({
      doc,
      label: "Origen de Carga",
      value: formData.origenCargaProducto || formData.paisOrigen || "No especificado",
      x: prodX1,
      y: yPos,
      width: prodColWidth,
      secondaryColor,
    });
    const prodY2 = drawField({
      doc,
      label: "Partida Arancelaria",
      value: safeString(formData.partidaArancelaria) || "No especificado",
      x: prodX2,
      y: yPos,
      width: prodColWidth,
      secondaryColor,
    });
    const prodY3 = drawField({
      doc,
      label: "Régimen Aduanal",
      value: safeString(formData.regimenAduanal) || "No especificado",
      x: prodX3,
      y: yPos,
      width: prodColWidth,
      secondaryColor,
    });
    yPos = Math.max(prodY1, prodY2, prodY3) + 5;

    const instruccionesDeManejoTexto =
      formData.instruccionesManejo ||
      formData.handlingInformation ||
      formData.observaciones ||
      formData.observacion ||
      "N/A";
    const rawFechaRecoleccion = asText(
      formData.fechaRecoleccion ||
        formData.fecha_recoleccion ||
        formData.fechaPosicionamiento ||
        formData.fecha_posicionamiento ||
        "",
    );

    const prodY4 = drawField({
      doc,
      label: "Tipo de Embalaje",
      value: safeString(formData.tipoEmbalaje) || "No especificado",
      x: prodX1,
      y: yPos,
      width: prodColWidth,
      secondaryColor,
    });
    const prodY5 = drawField({
      doc,
      label: "Instrucciones de manejo",
      value: instruccionesDeManejoTexto,
      x: prodX2,
      y: yPos,
      width: prodColWidth,
      secondaryColor,
    });
    const prodY6 = drawField({
      doc,
      label: "Fecha de recolección",
      value: formatFechaRecoleccion(rawFechaRecoleccion),
      x: prodX3,
      y: yPos,
      width: prodColWidth,
      secondaryColor,
    });
    yPos = Math.max(prodY4, prodY5, prodY6) + 5;

    yPos = renderItemsTable(
      { doc, formData, margins, contentWidth, primaryColor, yPos },
      autoTable,
    );

    yPos = drawSectionTitle({
      doc,
      title: "Documentos",
      y: yPos,
      margins,
      contentWidth,
      pageHeight,
      primaryColor,
    });
    renderDocumentos({
      doc,
      formData,
      yPos,
      margins,
      contentWidth,
      pageHeight,
      secondaryColor,
    });

    if (incluirPiePagina) {
      renderPiePagina({ doc, pageWidth, pageHeight, margins, secondaryColor });
    }

    if (formData.isDraft) {
      renderWatermark({ doc, pageWidth, pageHeight });
    }

    return {
      success: true,
      blob: doc.output("blob"),
    };
  } catch (error) {
    logger.error("Error al generar PDF:", error);
    return {
      success: false,
      error: (error as Error).message || "Error desconocido al generar el PDF",
    };
  }
};
