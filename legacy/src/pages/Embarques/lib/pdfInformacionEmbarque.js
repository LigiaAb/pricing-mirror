import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const checkNewPage = ({ doc, currentY, requiredSpace, pageHeight, margins }) => {
  if (currentY + requiredSpace > pageHeight - margins.bottom) {
    doc.addPage();
    return margins.top;
  }
  return currentY;
};

const drawSectionTitle = ({ doc, title, y, margins, contentWidth, pageHeight, primaryColor }) => {
  y = checkNewPage({ doc, currentY: y, requiredSpace: 15, pageHeight, margins });
  doc.setFillColor(...primaryColor);
  doc.rect(margins.left, y, contentWidth, 7, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title.toUpperCase(), margins.left + 3, y + 5);

  return y + 11;
};

const drawField = ({ doc, label, value, x, y, width, secondaryColor }) => {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...secondaryColor);
  doc.text(`${label}:`, x, y);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  const textValue = String(value || 'N/A');
  const splitText = doc.splitTextToSize(textValue, width - 2);
  doc.text(splitText, x, y + 4);

  return y + 4 + (splitText.length * 3.5);
};

const measureField = ({ doc, value, width, startY }) => {
  const textValue = String(value || 'N/A');
  const splitText = doc.splitTextToSize(textValue, width - 2);
  return startY + 4 + (splitText.length * 3.5);
};

// Calcula la altura que necesitaría la caja (sin dibujar nada) para que
// Shipper y Consignatario puedan compartir la misma altura de caja aunque
// una tenga contenido extra (el campo "Teléfono emergencia" del shipper).
const measureEntityBoxHeight = ({ doc, data, width }) => {
  const innerWidth = width - 6;
  const colWidth = innerWidth / 2;
  let tempY = 12;

  tempY = measureField({ doc, value: data.nombre, width: innerWidth, startY: tempY });
  tempY = measureField({ doc, value: data.nit, width: innerWidth, startY: tempY });
  tempY = measureField({ doc, value: data.direccion, width: innerWidth, startY: tempY });

  const contactY = tempY;
  const afterContacto = measureField({ doc, value: data.contacto, width: colWidth, startY: contactY });
  const afterTelefono = measureField({ doc, value: data.telefono, width: colWidth, startY: contactY });
  tempY = Math.max(afterContacto, afterTelefono);

  tempY += 8;
  if (data.telefonoEmergencia) {
    const emailY = measureField({ doc, value: data.email, width: colWidth, startY: tempY });
    const telEmergY = measureField({ doc, value: data.telefonoEmergencia, width: colWidth, startY: tempY });
    tempY = Math.max(emailY, telEmergY);
  } else {
    tempY = measureField({ doc, value: data.email, width: innerWidth, startY: tempY });
  }

  const reduction = 3 * 3.5;
  const minHeight = 45 - reduction;
  const calculated = tempY + 5 - reduction;
  return Math.max(minHeight, calculated);
};

const drawEntityBox = ({ doc, title, data, x, y, width, margins, pageHeight, lightGray, primaryColor, secondaryColor, forcedHeight = null }) => {
  const innerWidth = width - 6;
  const colWidth = innerWidth / 2;
  const naturalHeight = measureEntityBoxHeight({ doc, data, width });
  const boxHeight = forcedHeight != null ? Math.max(forcedHeight, naturalHeight) : naturalHeight;

  y = checkNewPage({ doc, currentY: y, requiredSpace: boxHeight + 5, pageHeight, margins });

  doc.setFillColor(...lightGray);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, width, boxHeight, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(title, x + 3, y + 5);

  doc.setDrawColor(220, 220, 220);
  doc.line(x + 2, y + 7, x + width - 2, y + 7);

  let currentY = y + 12;
  const innerX = x + 3;

  currentY = drawField({ doc, label: 'Nombre', value: data.nombre, x: innerX, y: currentY, width: innerWidth, secondaryColor });
  currentY = drawField({ doc, label: 'NIT:', value: data.nit, x: innerX, y: currentY, width: innerWidth, secondaryColor });
  currentY = drawField({ doc, label: 'Dirección', value: data.direccion, x: innerX, y: currentY, width: innerWidth, secondaryColor });

  const drawContactY = currentY;
  const yContacto = drawField({ doc, label: 'Contacto', value: data.contacto, x: innerX, y: drawContactY, width: colWidth, secondaryColor });
  const yTelefono = drawField({ doc, label: 'Teléfono', value: data.telefono, x: innerX + colWidth, y: drawContactY, width: colWidth, secondaryColor });

  // El retorno de drawField ya incluye 3.5mm de holgura bajo la última línea:
  // el siguiente rótulo se coloca justo debajo de esa fila (mismo espaciado de
  // una línea que tenía antes, sin montarse cuando Contacto/Teléfono ocupan 2).
  currentY = Math.max(yContacto, yTelefono) + 0.5;
  
  // Teléfono de emergencia: se muestra únicamente para el shipper, a la derecha del Email.
  if (data.telefonoEmergencia) {
    drawField({ doc, label: 'Email', value: data.email, x: innerX, y: currentY, width: colWidth, secondaryColor });
    currentY = drawField({ doc, label: 'Teléfono emergencia', value: data.telefonoEmergencia, x: innerX + colWidth, y: currentY, width: colWidth, secondaryColor });
  } else {
    currentY = drawField({ doc, label: 'Email', value: data.email, x: innerX, y: currentY, width: innerWidth, secondaryColor });
  }

  return y + boxHeight + 5;
};

const renderHeader = ({ doc, formData, margins, pageWidth, primaryColor, secondaryColor }) => {
  let yPos = margins.top;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('INFORMACIÓN DE EMBARQUE', margins.left, yPos);
  yPos += 6;

  if (formData.codFile) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`FILE: ${formData.codFile}`, margins.left, yPos);
  }

  yPos += 4;

  const fechaActual = new Date().toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...secondaryColor);
  doc.text(`Generado: ${fechaActual}`, pageWidth - margins.right, yPos - 1.5, { align: 'right' });

  try {
    const logoWidth = 45;
    const logoHeight = 15;
    const logoY = yPos - 1.5 - logoHeight - 2;
    doc.addImage('/logo_png.png', 'PNG', pageWidth - margins.right - logoWidth, logoY, logoWidth, logoHeight);
  } catch (e) {
    console.warn('No se pudo cargar el logo:', e);
  }

  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(margins.left, yPos, pageWidth - margins.right, yPos);

  return yPos + 4;
};

const CROPA_DOC_LABELS = {
  deprex: 'DEPREX',
  duca_complementaria: 'DUCA Complementaria',
  duca_definitiva: 'DUCA Definitiva',
  duca_simplificada: 'DUCA Simplificada',
  otros: 'Otros',
};

const buildDocumentGroups = (formData) => {
  const documentosCropa = formData.documentosCropa || {};
  const cropaItems = Object.entries(documentosCropa)
    .filter(([, value]) => value === true || String(value).toLowerCase() === 'true')
    .map(([key]) => CROPA_DOC_LABELS[key] || key.replaceAll('_', ' '));

  const peligrosidad =
    formData.peligrosidad === true || String(formData.peligrosidadLabel).toLowerCase() === 'sí';
  const coberturaSeguro =
    formData.coberturaSeguro === true || String(formData.coberturaSeguroLabel).toLowerCase() === 'sí';

  const clienteItems = [];
  if (peligrosidad) clienteItems.push('Hoja de Seguridad');
  if (coberturaSeguro) clienteItems.push('Factura Cobertura Seguro');

  const groups = [];
  if (cropaItems.length) groups.push({ title: 'CROPA', items: cropaItems });
  if (clienteItems.length) groups.push({ title: 'Cliente', items: clienteItems });

  return groups;
};

const renderDocumentosCropa = ({ doc, formData, yPos, margins, contentWidth, pageHeight, secondaryColor }) => {
  const groups = buildDocumentGroups(formData);

  if (!groups.length) {
    return drawField({ doc, label: 'Documentos', value: 'Ninguno', x: margins.left, y: yPos, width: contentWidth, secondaryColor }) + 5;
  }

  groups.forEach((group) => {
    yPos = checkNewPage({ doc, currentY: yPos, requiredSpace: 8, pageHeight, margins });

    const titleText = `${group.title}:`;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(titleText, margins.left, yPos);
    const titleWidth = doc.getTextWidth(titleText) + 2;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const itemsText = group.items.join(', ');
    const splitText = doc.splitTextToSize(itemsText, contentWidth - titleWidth);
    doc.text(splitText, margins.left + titleWidth, yPos);

    yPos += Math.max(splitText.length * 4, 6) + 2;
  });

  return yPos + 3;
};

const renderItemsTable = ({ doc, formData, margins, contentWidth, primaryColor, yPos }) => {
  const items = Array.isArray(formData.items) ? formData.items : [];

  if (items.length === 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('No hay información de cargas detallada.', margins.left, yPos);
    return yPos + 10;
  }

  const formatPeso = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(1) : String(value || '0');
  };

  const tableData = items.map(item => {
    let medidasTexto = '0';
    if (item.dimensiones) {
      medidasTexto = item.dimensiones;
    } else if (item.chargeableWeight != null) {
      medidasTexto = `${item.chargeableWeight}`;
    }

    let pesoTexto = '0.0';
    if (item.grossWeight != null) {
      pesoTexto = formatPeso(item.grossWeight);
    } else if (item.volumen != null) {
      pesoTexto = formatPeso(item.volumen);
    }

    return [
      item.descripcion || 'N/A',
      item.pieces || '0',
      pesoTexto,
      medidasTexto,
      item.unidadMedidaLabel || ''
    ];
  });

  const totalPieces = formData.items.reduce((sum, it) => sum + (Number(it.pieces) || 0), 0);
  const totalGrossWeight = formData.items.reduce((sum, it) => sum + (Number(it.grossWeight) || 0), 0);
  const totalVolume = formData.items.reduce((sum, it) => sum + (Number(it.chargeableWeight) || 0), 0);

  const totalRowStyles = { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'center' };
  tableData.push([
    { content: 'TOTALES', styles: totalRowStyles },
    { content: String(totalPieces || '0'), styles: totalRowStyles },
    { content: `${Number.isFinite(totalGrossWeight) ? totalGrossWeight.toFixed(1) : '0.0'} kg`, styles: totalRowStyles },
    { content: `${Number.isFinite(totalVolume) ? totalVolume.toFixed(1) : '0.0'} kg vol`, styles: totalRowStyles },
    { content: '', styles: totalRowStyles }
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Descripción', 'Cantidad', 'Peso (Kg)', 'Medidas', 'Unidad de Medida']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 50
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 25 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'center', cellWidth: 25 }
    },
    margin: { left: margins.left, right: margins.right },
    didDrawPage: (data) => {
      yPos = data.cursor.y + 5;
    }
  });

  return doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : yPos + 8;
};

const renderPiePagina = ({ doc, pageWidth, pageHeight, margins, secondaryColor }) => {
  const pageCount = doc.internal.getNumberOfPages();

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
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('Firma y sello de Empresa', pageWidth / 2, firmarY + 4, { align: 'center' });

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margins.left, pageHeight - 12, pageWidth - margins.right, pageHeight - 12);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const disclaimerText =
      'Tomar en consideración que, por errores en emisión de facturas de exportación, ' +
      'referente a descripción, moneda, mala aplicación de Incoterms y otros que generen ' +
      'reparos aduanales, por los cuales se incurran en gastos adicionales en origen o destino, ' +
      'dichos gastos corren por cuenta del exportador.';
    const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - margins.left - margins.right);
    const disclaimerY = pageHeight - 9;
    doc.text(disclaimerLines, margins.left, disclaimerY);
    const disclaimerHeight = disclaimerLines.length * 3.5;
    const paginationY = disclaimerY + disclaimerHeight + 1;
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margins.right, paginationY, { align: 'right' });
  }
};

const renderWatermark = ({ doc, pageWidth, pageHeight }) => {
  const pageCount = doc.internal.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(200, 200, 200);

    if (typeof doc.setGState === 'function' && doc.GState) {
      try {
        const gState = new doc.GState({ opacity: 0.4 });
        doc.setGState(gState);
      } catch (e) {
        console.error(e);
      }
    }

    doc.setFont('helvetica', 'bold');
    const offsetY = pageHeight * 0.3;
    const draftMarks = [
      { x: pageWidth * 0.35, y: pageHeight * 0.25 + offsetY, size: 216 },
      { x: pageWidth * 0.65, y: pageHeight * 0.5 + offsetY, size: 216 },
      { x: pageWidth * 0.95, y: pageHeight * 0.75 + offsetY, size: 216 }
    ];

    draftMarks.forEach(({ x, y, size }) => {
      doc.setFontSize(size);
      doc.text('DRAFT', x, y, {
        align: 'center',
        angle: 45,
        baseline: 'middle',
      });
    });

    if (typeof doc.setGState === 'function' && doc.GState) {
      try {
        const gStateReset = new doc.GState({ opacity: 1 });
        doc.setGState(gStateReset);
      } catch (e) {
        console.error(e)
      }
    }
  }
};

/**
 * Genera un PDF profesional con la información detallada del embarque.
 * 
 * @param {Object} formData - Objeto con la información del embarque
 * @param {Object} tipoSeleccionadoInfo - Información del tipo de transporte
 * @param {Object} servicioSeleccionadoInfo - Información del servicio
 * @param {Boolean} incluirPiePagina - Incluir pie de página
 * @param {String} referencia - Referencia adicional del embarque
 * @param {Object} catalogos - Catálogos opcionales. Actualmente soporta:
 *    - incoterms: array de incoterminos
 *    - tiposCarga: array de tipos de carga (value/label) usado para mostrar
 *      la etiqueta correcta en lugar del identificador
 *    - contactosShipper / contactosConsignatario: arrays de contactos
 *
 * NOTE: the `formData` object may also include notification fields used by
 * the 'Notificar A' section added below:
 *   - notificacionesNombre
 *   - notificacionesTelefono
 *   - notificacionesContacto
 *   - notificacionesEmail
 *
 * Also reads `formData.telefonoEmergencia` para el campo "Teléfono emergencia"
 * de la caja SHIPPER (debajo del Email).
 *
 * @returns {Object} - { success: boolean, blob?: Blob, error?: string }
 */
export const generarPDFInformacionEmbarque = (
  formData = {},
  tipoSeleccionadoInfo = {},
  servicioSeleccionadoInfo = {},
  incluirPiePagina = true,
  referencia = '',
  catalogos = {}
) => {
  try {
    const doc = new jsPDF('portrait', 'mm', 'letter');
    // El visor de PDF nativo del navegador (Chrome/Edge) usa el título de los
    // metadatos del PDF -no el nombre del Blob/File que lo envuelve- tanto para
    // el título de la pestaña como para el nombre sugerido al descargar.
    const fechaTituloPdf = new Date().toLocaleDateString('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).replace(/\//g, '-');
    doc.setProperties({ title: `Instructivo Embarque ${fechaTituloPdf}` });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margins = { top: 15, right: 15, bottom: 15, left: 15 };
    const contentWidth = pageWidth - margins.left - margins.right;

    const primaryColor = [0, 75, 144];
    const secondaryColor = [100, 100, 100];
    const lightGray = [245, 245, 245];

    let yPos = renderHeader({ doc, formData, margins, pageWidth, primaryColor, secondaryColor });

    yPos = drawSectionTitle({ doc, title: 'Datos Generales', y: yPos, margins, contentWidth, pageHeight, primaryColor });

    const col1X = margins.left;
    const colWidth = (contentWidth - 15) / 4;
    const col2X = col1X + colWidth + 5;
    const col3X = col2X + colWidth + 5;
    const col4X = col3X + colWidth + 5;

    const y1 = drawField({ doc, label: 'Modo de Transporte', value: tipoSeleccionadoInfo.label || formData.transportMode, x: col1X, y: yPos, width: colWidth, secondaryColor });
    const y2 = drawField({ doc, label: 'Servicio', value: servicioSeleccionadoInfo.label, x: col2X, y: yPos, width: colWidth, secondaryColor });
    const y3 = drawField({ doc, label: 'País Destino', value: formData.paisDestino, x: col3X, y: yPos, width: colWidth, secondaryColor });
    const y4 = drawField({ doc, label: 'Incoterm', value: formData.incoterm, x: col4X, y: yPos, width: colWidth, secondaryColor });
    yPos = Math.max(y1, y2, y3, y4) + 4;

    const boxWidth = (contentWidth - 5) / 2;
    const shipperData = {
      nombre: formData.exportador,
      nit: formData.shipperNit,
      direccion: formData.sitioRecoleccion,
      contacto: formData.contactoExportador,
      telefono: formData.telefonoExportador,
      email: formData.emailExportador,
      telefonoEmergencia: formData.telefonoEmergencia
    };
    const consigneeData = {
      nombre: formData.consignatario,
      nit: formData.nitCliente,
      direccion: formData.direccionConsignatario,
      contacto: formData.contactoConsignatario,
      telefono: formData.telefonosConsignatario,
      email: formData.emailConsignatario
    };

    // Shipper y Consignatario deben verse como un par de cajas parejas aunque
    // una tenga contenido extra (el campo "Teléfono emergencia" del shipper):
    // se mide la altura natural de cada una y ambas se dibujan con la mayor.
    const sharedBoxHeight = Math.max(
      measureEntityBoxHeight({ doc, data: shipperData, width: boxWidth }),
      measureEntityBoxHeight({ doc, data: consigneeData, width: boxWidth }),
    );

    const yAfterShipper = drawEntityBox({
      doc,
      title: 'SHIPPER',
      data: shipperData,
      x: margins.left,
      y: yPos,
      width: boxWidth,
      margins,
      pageHeight,
      lightGray,
      primaryColor,
      secondaryColor,
      forcedHeight: sharedBoxHeight
    });
    const yAfterConsignatario = drawEntityBox({
      doc,
      title: 'CONSIGNATARIO',
      data: consigneeData,
      x: margins.left + boxWidth + 5,
      y: yPos,
      width: boxWidth,
      margins,
      pageHeight,
      lightGray,
      primaryColor,
      secondaryColor,
      forcedHeight: sharedBoxHeight
    });
    yPos = Math.max(yAfterShipper, yAfterConsignatario);

    yPos = drawSectionTitle({ doc, title: 'Notificar A', y: yPos, margins, contentWidth, pageHeight, primaryColor });

    const notifColWidth = (contentWidth - 10) / 3;
    const notifX1 = margins.left;
    const notifX2 = notifX1 + notifColWidth + 5;
    const notifX3 = notifX2 + notifColWidth + 5;

    const notifY1 = drawField({ doc, label: 'Nombre', value: formData.notificacionesNombre, x: notifX1, y: yPos, width: notifColWidth, secondaryColor });
    const notifY2 = drawField({ doc, label: 'Teléfono', value: formData.notificacionesTelefono, x: notifX2, y: yPos, width: notifColWidth, secondaryColor });
    const notifY3 = drawField({ doc, label: 'Email', value: formData.notificacionesEmail, x: notifX3, y: yPos, width: notifColWidth, secondaryColor });
    yPos = Math.max(notifY1, notifY2, notifY3) + 5;

    yPos = drawSectionTitle({ doc, title: 'Facturación', y: yPos, margins, contentWidth, pageHeight, primaryColor });

    const factColWidth = (contentWidth - 15) / 4;
    const factX1 = margins.left;
    const factX2 = factX1 + factColWidth + 5;
    const factX3 = factX2 + factColWidth + 5;
    const factX4 = factX3 + factColWidth + 5;

    const factY1 = drawField({ doc, label: 'Nombre', value: formData.nombreFacturacion, x: factX1, y: yPos, width: factColWidth, secondaryColor });
    const factY2 = drawField({ doc, label: 'NIT', value: formData.nitFactura, x: factX2, y: yPos, width: factColWidth, secondaryColor });
    const factY3 = drawField({ doc, label: 'Teléfono', value: formData.telefonoFacturacion, x: factX3, y: yPos, width: factColWidth, secondaryColor });
    const factY4 = drawField({ doc, label: 'Dirección', value: formData.direccionFiscal, x: factX4, y: yPos, width: factColWidth, secondaryColor });
    yPos = Math.max(factY1, factY2, factY3, factY4) + 3;

    const factY5 = drawField({ doc, label: 'Email para enviar factura electrónica', value: formData.emailFacturacion, x: factX1, y: yPos, width: contentWidth - 3, secondaryColor });
    yPos = factY5 + 2;

    yPos = drawSectionTitle({ doc, title: 'PRODUCTO', y: yPos, margins, contentWidth, pageHeight, primaryColor });

    const prodColWidth = (contentWidth - 10) / 3;
    const prodX1 = margins.left;
    const prodX2 = prodX1 + prodColWidth + 5;
    const prodX3 = prodX2 + prodColWidth + 5;

    const origenCargaTexto = formData.origenCargaProducto || formData.paisOrigen || 'No especificado';
    const partidaArancelariaTexto = formData.partidaArancelaria || 'No especificado';
    const regimenAduanalTexto = formData.regimenAduanal || 'No especificado';
    const tipoEmbalajeTexto = formData.tipoEmbalaje || 'No especificado';

    const prodY1 = drawField({ doc, label: 'Origen de Carga', value: origenCargaTexto, x: prodX1, y: yPos, width: prodColWidth, secondaryColor });
    const prodY2 = drawField({ doc, label: 'Partida Arancelaria', value: partidaArancelariaTexto, x: prodX2, y: yPos, width: prodColWidth, secondaryColor });
    const prodY3 = drawField({ doc, label: 'Régimen Aduanal', value: regimenAduanalTexto, x: prodX3, y: yPos, width: prodColWidth, secondaryColor });
    yPos = Math.max(prodY1, prodY2, prodY3) + 5;

    const instruccionesDeManejoTexto =
      formData.instruccionesManejo ||
      formData.handlingInformation ||
      formData.observaciones ||
      formData.observacion ||
      'N/A';

    const rawFecha =
      formData.fechaRecoleccion ||
      formData.fecha_recoleccion ||
      formData.fechaPosicionamiento ||
      formData.fecha_posicionamiento ||
      '';
    const fechaRecoleccionTexto = (() => {
      if (!rawFecha || rawFecha === 'N/A') return 'N/A';
      const parts = rawFecha.includes('T') ? rawFecha.split('T')[0].split('-') : rawFecha.split('-');
      if (parts.length === 3) {
        const [yyyy, mm, dd] = parts;
        return `${dd} ${mm} ${yyyy}`;
      }
      return rawFecha;
    })();

    const prodY4 = drawField({ doc, label: 'Tipo de Embalaje', value: tipoEmbalajeTexto, x: prodX1, y: yPos, width: prodColWidth, secondaryColor });
    const prodY5 = drawField({ doc, label: 'Instrucciones de manejo', value: instruccionesDeManejoTexto, x: prodX2, y: yPos, width: prodColWidth, secondaryColor });
    const prodY6 = drawField({ doc, label: 'Fecha de recolección', value: fechaRecoleccionTexto, x: prodX3, y: yPos, width: prodColWidth, secondaryColor });
    yPos = Math.max(prodY4, prodY5, prodY6) + 5;

    yPos = renderItemsTable({ doc, formData, margins, contentWidth, primaryColor, yPos });

    yPos = drawSectionTitle({ doc, title: 'Documentos', y: yPos, margins, contentWidth, pageHeight, primaryColor });
    yPos = renderDocumentosCropa({ doc, formData, yPos, margins, contentWidth, pageHeight, secondaryColor });

    if (incluirPiePagina) {
      renderPiePagina({ doc, pageWidth, pageHeight, margins, secondaryColor });
    }

    if (formData.isDraft) {
      renderWatermark({ doc, pageWidth, pageHeight });
    }

    return {
      success: true,
      blob: doc.output('blob')
    };

  } catch (error) {
    console.error('Error al generar PDF:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al generar el PDF'
    };
  }
};