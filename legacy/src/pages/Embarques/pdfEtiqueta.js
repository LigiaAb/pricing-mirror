import { jsPDF } from "jspdf";
import "jspdf-barcode";
import jspdfBarcode from "jspdf-barcode";
import image from "/src/assets/logo-cropa-dsv-1024x205.png";
import generarQRConLogoBase64 from "../../utils/generadorQR";

const calcularTamanoImagen = (anchoDeseado, altoDeseado) => {
  const image = {
    width: 20,
    height: 3.7,
  };

  if (anchoDeseado) {
    const alto = (image.height / image.width) * anchoDeseado;
    return alto;
  }
  if (altoDeseado) {
    const ancho = (image.width / image.height) * altoDeseado;
    return ancho;
  }
};

// Función para ajustar el tamaño de fuente según el ancho disponible
const ajustarTamañoFuente = (doc, texto, anchoMaximo, tamañoInicial = 28, tamañoMinimo = 10) => {
  if (!texto || texto.trim() === '') return tamañoInicial;
  
  let tamañoActual = tamañoInicial;
  doc.setFontSize(tamañoActual);
  let anchoTexto = doc.getTextWidth(texto);
  
  // Reducir el tamaño de fuente hasta que quepa en el ancho disponible
  while (anchoTexto > anchoMaximo && tamañoActual > tamañoMinimo) {
    tamañoActual -= 0.5;
    doc.setFontSize(tamañoActual);
    anchoTexto = doc.getTextWidth(texto);
  }
  
  return tamañoActual;
};

const PdfEtiqueta = async (pdfData, pdfItems = [], generarQR = () => "") => {
  let listaQR = [];
  // Tamaño de etiqueta 4x6 pulgadas = 288 x 432 puntos (72 pt por pulgada)
  const pageWidth = 288;  // 4 pulgadas
  const pageHeight = 432; // 6 pulgadas
  const qrWidth = 120;    // Tamaño del QR ajustado para 4x6

  // Generar todos los QR antes de crear el PDF
  for (let i = 0; i < pdfItems.length; i++) {
    const item = pdfItems[i];

    for (let num = 0; num < item.numeroPiezas; num++) {
      try {
        const qrImage = await generarQRConLogoBase64(
          pdfData.qrUrl || "",
          qrWidth * 3
        );
        listaQR.push(qrImage);
      } catch (error) {
        console.error(`Error al generar QR ${i}-${num}:`, error);
        listaQR.push("");
      }
    }
  }

  // Crear PDF con tamaño personalizado 4x6 pulgadas
  const doc = new jsPDF({
    orientation: pdfData.horizontal ? "l" : "p",
    unit: "pt",
    format: [pageWidth, pageHeight]
  });

  const transportes = [
    { id: 1, transporte: "AEREA" },
    { id: 2, transporte: "MARITIMA" },
    { id: 3, transporte: "TERRESTRE" },
  ];

  const tipoTransporteSeleccionado = transportes.find((t) => t.id === pdfData.tipoTrasnporte) || transportes[0];

  console.log("Tipo de transporte seleccionado:", tipoTransporteSeleccionado?.transporte || "AEREA");

  // Posiciones y tamaños ajustados para etiqueta 4x6 pulgadas (288x432 pt)
  const centerX = pageWidth / 2; // 144
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2); // 268

  let header = (item) => {
    doc.setFontSize(10);
    doc.setDrawColor("#00205b");
    doc.setFillColor("#00205b");
    doc.setTextColor("#00205b");

    // Verificar que el QR existe antes de agregarlo
    if (listaQR[item - 1]) {
      try {
        doc.addImage(listaQR[item - 1], "PNG", centerX - qrWidth / 2, 300, qrWidth, qrWidth);
      } catch (error) {
        console.error(`Error al agregar QR ${item - 1}:`, error);
      }
    }

    // Código de barras (centrado)
    const barcodeWidth = 120;
    const barcodeX = centerX - barcodeWidth / 2;
    jspdfBarcode(doc, `${pdfData.codGuia}_${item}`, {
      fontSize: 24,
      lineColor: "#0000",
      height: 25,
      x: barcodeX,
      y: 35,
      width: barcodeWidth,
    });

    // Logo centrado
    const logoWidth = 140;
    const logoHeight = calcularTamanoImagen(logoWidth);
    const logoX = centerX - logoWidth / 2;
    doc.addImage(image, "PNG", logoX, 48, logoWidth, logoHeight);

    // Borde principal
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    // Línea después del logo
    doc.rect(margin, 42, contentWidth, 0.5, "F");

    // Tipo de transporte
    doc.setFontSize(16);
    const labelTransporte = tipoTransporteSeleccionado.transporte === "AEREA"
      ? "EXPORTACIÓN AEREA"
      : `CARGA ${tipoTransporteSeleccionado.transporte}`;
    doc.text(labelTransporte, centerX, 105, { align: "center" });

    // Líneas separadoras
    doc.rect(margin, 80, contentWidth, 0.5, "F");
    doc.rect(margin, 118, contentWidth, 0.5, "F");

    // Código de guía: Master y House en una sola línea
    doc.setFontSize(14); // Aumenta tamaño de letra para mejor visibilidad
    doc.text(`Master: ${pdfData.codGuiaMaster || ""}    House: ${pdfData.codGuia || ""}`, centerX, 140, { align: "center" });
    doc.rect(margin, 155, contentWidth, 0.5, "F");

    // Labels de países
    doc.setFontSize(8);
    doc.text(`PAIS ORIGEN`, margin + 5, 165);
    doc.text(`PAIS DESTINO`, margin + 5, 210);

    // Líneas separadoras
    doc.rect(margin, 200, contentWidth, 0.5, "F");
    doc.rect(margin, 245, contentWidth, 0.5, "F");
    doc.rect(margin, 290, contentWidth, 0.5, "F");

    // Calcular ancho disponible para el texto (centrado)
    const anchoDisponible = contentWidth - 20;

    // Texto de origen - con soporte para múltiples líneas si es muy largo
    const nombreOrigen = pdfData.origen || pdfData.codOrigen || "";
    const textoOrigen = pdfData.refPaisOrigen ? `${pdfData.refPaisOrigen} - ${nombreOrigen}` : nombreOrigen;
    doc.setFontSize(14);
    const lineasOrigen = doc.splitTextToSize(textoOrigen, anchoDisponible);
    const alturaLineaOrigen = lineasOrigen.length > 1 ? 180 : 185;
    doc.text(lineasOrigen, centerX, alturaLineaOrigen, { align: "center" });

    // Texto de destino - con soporte para múltiples líneas si es muy largo
    const nombreDestino = pdfData.destino || pdfData.codDestino || "";
    const textoDestino = pdfData.refPaisDestino ? `${pdfData.refPaisDestino} - ${nombreDestino}` : nombreDestino;
    doc.setFontSize(14);
    const lineasDestino = doc.splitTextToSize(textoDestino, anchoDisponible);
    const alturaLineaDestino = lineasDestino.length > 1 ? 225 : 230;
    doc.text(lineasDestino, centerX, alturaLineaDestino, { align: "center" });
  };

  const embarques = () => {
    const addItemsToDoc = () => {
      const totalPaginas = pdfItems.reduce((total, item) => total + item.numeroPiezas, 0);
      let contador = 0;
      console.log(totalPaginas);

      pdfItems.forEach((item, ind) => {
        for (let num = 0; num < item.numeroPiezas; num++) {
          contador++;

          header(contador);

          // Contador de piezas
          doc.setFontSize(20);
          doc.setTextColor("#778aab");
          doc.text(`${contador || ""} de ${totalPaginas || ""}`, centerX, 270, { align: "center" });

          if (contador < totalPaginas) doc.addPage();
        }
      });
    };

    addItemsToDoc();
  };

  // header();
  embarques();
  // doc.barcode()
  return doc.output("datauristring");
};

export default PdfEtiqueta;
