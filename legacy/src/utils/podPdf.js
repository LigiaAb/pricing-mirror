
import jsPDF from 'jspdf';
import image from "../assets/logo-cropa-dsv-1024x205.png";
import jspdfBarcode from "jspdf-barcode";

const calcularTamanoImagen = (anchoDeseado, altoDeseado) => {
  const image = { width: 20, height: 3.7 };
  if (anchoDeseado) {
    const alto = (image.height / image.width) * anchoDeseado;
    return alto;
  }
  if (altoDeseado) {
    const ancho = (image.width / image.height) * altoDeseado;
    return ancho;
  }
};

const reciboPdf = (pdfData, pdfItems = []) => {
  const doc = new jsPDF(pdfData.horizontal ? "l" : "p", "pt", pdfData.tamano || "letter");

  const POD_HEIGHT = 250; // Altura aproximada del diseño del POD
  const MARGIN_TOP = 20;  // Margen superior
  const PODS_PER_PAGE = 3;

  const header = (offsetY) => {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");

    doc.text("Nombre Recibe: ", 35, offsetY + 43);
    doc.line(35, offsetY + 45, 470, offsetY + 45);
    doc.text("D.P.I:", 290, offsetY + 43);
    doc.text("Fecha:", 160, offsetY + 60);
    doc.text("Hora: ", 290, offsetY + 60);
    doc.text("Firma/Sello: ", 420, offsetY + 60);

    doc.text("REMITENTE", 35, offsetY + 90);
    doc.text("ENTREGAR A:", 290, offsetY + 90);

    doc.rect(35, offsetY + 95, 540, 130);
    doc.line(35, offsetY + 130, 575, offsetY + 130);
    doc.line(290, offsetY + 95, 290, offsetY + 130);
    doc.line(35, offsetY + 155, 575, offsetY + 155);
    doc.text("N.Piezas:", 37, offsetY + 137);
    doc.line(135, offsetY + 130, 135, offsetY + 180);
    doc.text("Peso:", 139, offsetY + 137);
    doc.line(245, offsetY + 130, 245, offsetY + 225);
    doc.text("Descripcion de Envio:", 250, offsetY + 137);
    doc.line(455, offsetY + 130, 455, offsetY + 180);
    doc.text("Tarifa:", 457, offsetY + 137);

    doc.line(35, offsetY + 180, 575, offsetY + 180);
    doc.text("Dimension:", 37, offsetY + 170);
    doc.text("Factura:", 139, offsetY + 170);
    doc.text("Valor Declarado:", 250, offsetY + 163);
    doc.line(330, offsetY + 155, 330, offsetY + 180);
    doc.text("Seguro:", 332, offsetY + 163);
    doc.line(380, offsetY + 155, 380, offsetY + 180);
    doc.text("Cargos Por Servicio:", 382, offsetY + 163);
    doc.text("Total Cargos:", 457, offsetY + 163);

    doc.line(245, offsetY + 202, 575, offsetY + 202);
    doc.text("Referencia 1:", 250, offsetY + 187);
    doc.line(417, offsetY + 180, 417, offsetY + 225);
    doc.text("Piloto:", 420, offsetY + 187);
    doc.text("Referencia 2:", 250, offsetY + 217);
    doc.text("Recepcion", 420, offsetY + 217);

    doc.setLineDash([2], 1);
    doc.line(35, offsetY + 250, 575, offsetY + 250);
    doc.setLineDash([], 0);

  };

  const pods = () => {
    pdfItems.forEach((item, index) => {
      const positionIndex = index % PODS_PER_PAGE;
      const offsetY = MARGIN_TOP + positionIndex * POD_HEIGHT;

      if (positionIndex === 0 && index !== 0) {
        doc.addPage();
      }

      // Logo
      doc.addImage(image, 'PNG',35, offsetY + 55, 100, calcularTamanoImagen(100));

      // Header
      header(offsetY);

      // Datos dinámicos
      jspdfBarcode(doc, `${item.serieLetra} ${item.serieNumero}`, {
        fontSize: 34,
        lineColor: "#000",
        height: 30,
        x: 40,
        y: offsetY + 220,
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text(`${item.remitenteNombre}`, 37, offsetY + 110);
      doc.text(`${item.destinatarioNombre}`, 292, offsetY + 104);

      doc.setFontSize(16);
      doc.text(`${item.paisOrigen}`, 280, offsetY + 118, { align: "right" });
      doc.text(`${item.paisDestino}`, 490, offsetY + 118, { align: "right" });
      doc.text(`${item.serieLetra} ${item.serieNumero}`, 570, offsetY + 43, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.addImage(item.firmaSello,'PNG',475, offsetY + 55,60,30)
      doc.text(`${item.nombreRecibe}`, 100, offsetY + 43);
      doc.text(`${item.dpiRecibe}`, 320, offsetY + 43);
      doc.text(`${item.fecha}`, 185, offsetY + 60);
      doc.text(`${item.hora}`, 320, offsetY + 60);
      doc.text(`${item.remitenteDireccion}`, 37, offsetY + 120);
      doc.text(`${item.destinatarioDireccion}`, 292, offsetY + 114);
      doc.text(`NIT: ${item.nitDestinatario} Tel: ${item.telefonoDestinatario}`, 292, offsetY + 124);

      doc.text(`${item.numeroPiezas}`, 80, offsetY + 147);
      doc.text(`${item.peso}`, 180, offsetY + 147);
      doc.text(`${item.descripcionEnvio}`, 250, offsetY + 147);
      doc.text(`Q ${item.tarifa.toFixed(2)}`, 460, offsetY + 147);
      doc.text(`${item.dimension}`, 80, offsetY + 170);
      doc.text(`${item.factura}`, 175, offsetY + 170);
      doc.text(`Q ${item.valorDeclarado.toFixed(2)}`, 270, offsetY + 175);
      doc.text(`${item.seguro}`, 340, offsetY + 173);
      doc.text(`Q ${item.cargosPorServicio.toFixed(2)}`,382, offsetY + 175)
      doc.text(`Q ${item.totalCargos.toFixed(2)}`, 480, offsetY + 175);
      doc.text(`${item.referencia1}`, 250, offsetY + 195);
      doc.text(`${item.piloto}`, 420, offsetY + 195);
      doc.text(`${item.referencia2}`, 295, offsetY + 217);
      doc.text(`${item.recepcion}`, 460, offsetY + 217);
    });
  };

  pods();

  return doc.output("datauristring");
};

export default reciboPdf;
