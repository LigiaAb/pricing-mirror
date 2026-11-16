import type jsPDF from "jspdf";
import type { DatosPdf } from "../pdf-awb-types";

export function cuadrosIzquierda(doc: jsPDF, datos: DatosPdf): void {
  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(20, 50, 245, 75);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(5);
  doc.text(`Shipper's Name and Address`, 25, 56);

  doc.setFontSize(8);
  doc.setTextColor("#000");
  let shipperY = 78;
  if (datos.shipperName) {
    doc.text(datos.shipperName, 25, shipperY);
    shipperY += 10;
  }
  if (datos.shipperAddress) {
    const addressLines = doc.splitTextToSize(datos.shipperAddress, 200);
    doc.text(addressLines, 25, shipperY);
    shipperY += addressLines.length * 10;
  }
  if (datos.shipperPhone) {
    const telefono = String(datos.shipperPhone || "").trim();
    const telefonoConPrefijo = /^\s*TEL\s*:?/i.exec(telefono) ? telefono : `TEL: ${telefono}`;
    doc.text(telefonoConPrefijo, 25, shipperY);
    shipperY += 10;
  }
  if (datos.shipperEmail) {
    const email = String(datos.shipperEmail || "").trim();
    const emailConPrefijo = /^\s*EMAIL\s*:?/i.exec(email) ? email : `EMAIL: ${email}`;
    doc.text(emailConPrefijo, 25, shipperY);
  }

  doc.setFontSize(5);
  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(140, 50, 125, 25);
  doc.text(`Shipper's Account Number`, 170, 56);

  doc.setFontSize(8);
  doc.setTextColor("#000");
  doc.text(`NIT: 327955-3`, 170, 70);

  doc.setFontSize(5);
  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(20, 125, 245, 75);
  doc.text(`Consignee's Name and Address`, 25, 130);

  doc.setFontSize(5);
  doc.setTextColor("#000");
  doc.setFontSize(8);
  let consigneeY = 162;
  if (datos.consigneeName) {
    doc.text(datos.consigneeName, 25, consigneeY);
    consigneeY += 10;
  }

  if (datos.consigneeAddress) {
    const addressLines = doc.splitTextToSize(datos.consigneeAddress, 200);
    doc.text(addressLines, 25, consigneeY);
    consigneeY += addressLines.length * 10;
  }
  if (datos.consigneePhone) {
    const telefono = String(datos.consigneePhone || "").trim();
    const telefonoConPrefijo = /^\s*TEL\s*:?/i.exec(telefono) ? telefono : `TEL: ${telefono}`;
    doc.text(telefonoConPrefijo, 25, consigneeY);
  }

  doc.setFontSize(5);
  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(140, 125, 125, 25);
  doc.text(`Consignee's Account Number`, 170, 130);

  doc.setFontSize(8);
  doc.setTextColor("#000");
  if (datos.consigneeAccount) {
    doc.text(datos.consigneeAccount, 170, 145);
  }

  doc.setFontSize(5);
  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(20, 200, 245, 45);
  doc.text(`Issuing Carrier's Agent Name and City`, 25, 205);

  doc.setFontSize(8);
  doc.setTextColor("#000");
  if (
    datos.agentNameCity &&
    datos.agentNameCity !== "undefined" &&
    datos.agentNameCity.trim() !== ""
  ) {
    doc.text(datos.agentNameCity, 25, 220);
  } else {
    doc.text("CROPA S.A.", 25, 220);
    doc.text("Guatemala", 25, 230);
  }

  doc.setFontSize(5);
  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(20, 245, 122, 25);
  doc.text(`Agent's IATA Code`, 25, 251);

  doc.setFontSize(8);
  doc.setTextColor("#000");
  const iataCode =
    datos.agentIATACode && datos.agentIATACode !== "undefined" && datos.agentIATACode.trim() !== ""
      ? datos.agentIATACode.trim()
      : "8212148";
  doc.text(iataCode, 25, 265);
  doc.setFontSize(5);
  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(142, 245, 123, 25);
  doc.text(`Account No.`, 147, 250);

  doc.setFontSize(8);
  doc.setTextColor("#000");
  doc.text(`CRO`, 147, 265);

  if (datos.agentAccount) {
    doc.text(datos.agentAccount, 147, 275);
  }

  doc.setFontSize(5);
  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.line(20, 270, 265, 270, "F");
  doc.line(20, 270, 20, 310, "F");
  doc.line(265, 270, 265, 310, "F");
  doc.text(`Airport of Departure ( Addr. of First) nad Requested Routing`, 25, 275);

  doc.setFontSize(8);
  doc.setTextColor("#000");
  const routingLineParts: string[] = [];
  const primerOrigenNombre =
    Array.isArray(datos.rutas) && datos.rutas[0]?.origenNombre
      ? datos.rutas[0].origenNombre
      : datos.enlaceOrigen || "";
  if (primerOrigenNombre) routingLineParts.push(String(primerOrigenNombre));

  const airportDepartureRouting =
    datos.airportDepartureRouting ||
    datos.requestedRouting ||
    datos.routing ||
    datos.ruta ||
    datos.rutaSolicitada ||
    datos.ruta_solicitada ||
    "";

  const normalizedRouting = String(airportDepartureRouting).trim();
  const normalizedSite = String(datos.sitioRecoleccion || "").trim();
  if (
    normalizedRouting &&
    normalizedRouting !== String(primerOrigenNombre) &&
    normalizedRouting !== normalizedSite
  ) {
    routingLineParts.push(normalizedRouting);
  }

  if (datos.currency) routingLineParts.push(String(datos.currency).toUpperCase());

  const routingLine = routingLineParts.join(" ");

  if (routingLine) {
    const maxRoutingWidth = 235;
    const routingLines = doc.splitTextToSize(routingLine, maxRoutingWidth);
    if (routingLines.length > 1) {
      doc.text(routingLines[0], 25, 286);
      doc.text(routingLines[1], 25, 293);
    } else {
      doc.text(routingLines[0], 25, 290);
    }
  }

  doc.setFontSize(5);
  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.line(20, 295, 265, 295, "F");
  doc.line(20, 295, 20, 320, "F");
  doc.line(265, 295, 265, 320, "F");
  doc.line(20, 320, 265, 320, "F");
  doc.text(`To.`, 25, 301);

  doc.setFontSize(5);
  doc.line(50, 295, 50, 320, "F");
  doc.text(`By first Carrier`, 57, 301);
  doc.line(162, 295, 162, 320, "F");
  doc.text(`To`, 163, 301);
  doc.line(193, 295, 192, 320, "F");
  doc.text(`By`, 194, 301);
  doc.line(215, 295, 215, 320, "F");
  doc.text(`To`, 216, 301);
  doc.line(241, 295, 241, 320, "F");
  doc.text(`By`, 242, 301);

  doc.line(105, 302, 154, 302, "F");
  doc.line(97, 295, 105, 302, "F");
  doc.line(154, 302, 162, 295, "F");
  doc.setFontSize(4.5);
  doc.text(`Routing and Destination`, 105, 300);

  {
    const rutas = Array.isArray(datos.rutas) ? datos.rutas : [];
    const dataY = 313;
    const routeCount = rutas.length;
    doc.setFontSize(7);
    doc.setTextColor("#000");
    const ultimaRuta = rutas[routeCount - 1];
    if (ultimaRuta?.destinoCodigo) {
      doc.text(String(ultimaRuta.destinoCodigo), 25, dataY);
    }
    if (rutas[0]?.entidadNombreProv) {
      const maxByW = 100;
      const byLines = doc.splitTextToSize(String(rutas[0].entidadNombreProv), maxByW);
      if (byLines.length > 1) {
        doc.text(byLines[0], 57, 309);
        doc.text(byLines[1], 57, 316);
      } else {
        doc.text(byLines[0], 57, dataY);
      }
    }
    if (routeCount > 1 && rutas[0]?.destinoCodigo) {
      doc.text(String(rutas[0].destinoCodigo), 163, dataY);
    }
    if (routeCount === 3 && rutas[1]?.destinoCodigo) {
      doc.text(String(rutas[1].destinoCodigo), 216, dataY);
    }
  }

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.setLineWidth(1.5);
  doc.line(20, 320, 20, 345, "F");
  doc.line(142, 320, 142, 345, "F");
  doc.line(265, 320, 265, 345, "F");
  doc.line(20, 345, 142, 345, "F");
  doc.line(142, 345, 265, 345, "F");
  doc.setLineWidth(0);
  doc.setFontSize(5);
  doc.text(`Airport of Destination`, 60, 326);

  doc.setFontSize(6);
  doc.setTextColor("#000");
  const ultimoDestinoRuta =
    Array.isArray(datos.rutas) && datos.rutas.length ? datos.rutas.at(-1)?.destinoNombre : "";
  const destinoTexto =
    ultimoDestinoRuta || datos.enlaceDestino || datos.ciudadDestino || datos.airportDestination;
  if (destinoTexto) {
    const lineY = 330;
    const maxWidth = 110;
    const destinoLines = doc.splitTextToSize(String(destinoTexto), maxWidth).slice(0, 2);
    doc.text(destinoLines, 25, lineY, { baseline: "top" });
  }

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.setFontSize(5);
  doc.line(205, 327, 205, 345);
  doc.line(175, 327, 233, 327, "F");
  doc.line(169, 320, 175, 327, "F");
  doc.line(233, 327, 239, 320, "F");
  doc.text(`Flight/Date`, 155, 325, { align: "center" });
  doc.text(`For Carrier Use Only`, 180, 325);
  doc.text(`Flight/Date`, 262, 325, { align: "right" });

  doc.setTextColor("#000");
  {
    const rutas = Array.isArray(datos.rutas) ? datos.rutas : [];
    const firstFlight = rutas[0]?.flightNumber || "";
    const lastFlight = rutas.length > 1 ? rutas.at(-1)?.flightNumber || "" : "";
    doc.setFontSize(7);

    if (firstFlight) {
      const firstFlightLines = doc.splitTextToSize(String(firstFlight), 58);
      doc.text(firstFlightLines, 173, 340, { align: "center" });
    }

    if (lastFlight) {
      const lastFlightLines = doc.splitTextToSize(String(lastFlight), 58);
      doc.text(lastFlightLines, 235, 340, { align: "center" });
    }
  }

  doc.setDrawColor("#00205b");
  doc.setFillColor("#00205b");
  doc.rect(20, 345, 527, 45);
  doc.setFontSize(7);
  doc.text(`Handling Information.`, 27, 352);

  doc.setTextColor("#000");
  const handlingTextRaw =
    datos.handlingInformation || "" || datos.observaciones || "" || datos.observacion || "";
  const handlingText = String(handlingTextRaw)
    .replace(/House:\s*/g, "")
    .trim();

  if (handlingText) {
    doc.setFontSize(7);
    const handlingLines = doc.splitTextToSize(handlingText, 500);
    doc.text(handlingLines, 27, 363);
  }
}
