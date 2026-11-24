import jsPDF from 'jspdf';
import jspdfBarcode from 'jspdf-barcode';

const MAX_BARCODE_LENGTH = 18;

const sanitizeBarcodeValue = (rawValue) => {
    if (rawValue === undefined || rawValue === null) {
        return '';
    }
    const stringified = String(rawValue).toUpperCase();
    const filtered = stringified.replaceAll(/[^0-9A-Z\-\.\$\+% /]/g, '').trim();
    if (!filtered) {
        return '';
    }
    return filtered.slice(0, MAX_BARCODE_LENGTH);
};

const formatDateForPdf = (value) => {
    if (!value) {
        return '';
    }

    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const day = date.getDate();
    const month = months[date.getMonth()] || '';
    const year = date.getFullYear();

    return `${month} ${day} ${year}`;
};

const resolveBarcodeValue = (datos = {}) => {
    const candidates = [
        datos.mawbNumber,
        datos.guiaMaster,
        datos.correlativoGuiaMaster,
    ];

    for (const candidate of candidates) {
        const sanitized = sanitizeBarcodeValue(candidate);
        if (sanitized) {
            return sanitized;
        }
    }
    return '';
};

const drawBarcodeSection = (doc, datos, xOff = 0) => {
    const detectedValue = resolveBarcodeValue(datos);
    if (!detectedValue) {
        return;
    }

    const pageWidth = doc.internal.pageSize.getWidth ? doc.internal.pageSize.getWidth() : doc.internal.pageSize.width;

    jspdfBarcode(doc, `${detectedValue}`, {
        fontSize: 40,
        lineColor: "#0000",
        height: 20,
        x: pageWidth / 2 - xOff,
        y: 45,
        textOptions: { align: "center" },
    });
};

export default function generarPdf(datos, borrador = true, outputType = "datauristring") {

    const doc = new jsPDF(datos.horizontal ? "l" : "p", "pt", datos.tamano || "a4");
    // El visor de PDF nativo del navegador (Chrome/Edge) usa el título de los
    // metadatos del PDF -no el nombre del Blob/File que lo envuelve- tanto para
    // el título de la pestaña como para el nombre sugerido al descargar.
    const fechaTituloPdf = new Date().toLocaleDateString('es-GT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).replace(/\//g, '-');
    doc.setProperties({ title: `Instructivo Embarque ${fechaTituloPdf}` });

    const _pageWidth = doc.internal.pageSize.getWidth ? doc.internal.pageSize.getWidth() : doc.internal.pageSize.width;
    // Content block spans x=20 to x=547 (width=527). Shift to center it on the page.
    const xOff = (_pageWidth - 527) / 2 - 20;

    let margins = {
        top: 430,
        left: 25,
        bottom: 50,
    }

    let header = () => {

        // Logo eliminado según nueva especificación
        doc.setTextColor("#BBB");

        drawBarcodeSection(doc, datos, xOff);

        // Número de guía asignada (si existe), mostrar siempre como MAWB con el valor de correlativo_guia_master
        const numeroGuiaAsignada = String(datos.correlativoGuiaMaster || '').trim();

        doc.setFontSize(11);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor("#0B2967");
        if (numeroGuiaAsignada) {
            doc.text(`MAWB: ${numeroGuiaAsignada}`, 447, 48);
        }
        doc.setFont("Helvetica", "normal");
        doc.setTextColor("#000");
        doc.setFontSize(8);

        let cuadrosIzquierda = () => {
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.rect(20, 50, 245, 75);
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(5);
            doc.text(`Shipper's Name and Address`, 25, 56)

            // Datos del remitente
            doc.setFontSize(8);
            doc.setTextColor("#000");
            // leave two blank lines after the section title
            let shipperY = 78;
            if (datos.shipperName) {
                doc.text(datos.shipperName, 25, shipperY);
                shipperY += 10;
            }
            if (datos.shipperAddress) {
                const addressLines = doc.splitTextToSize(datos.shipperAddress, 200);
                doc.text(addressLines, 25, shipperY);
                shipperY += (addressLines.length * 10);
            }
            if (datos.shipperPhone) {
                const telefono = String(datos.shipperPhone || '').trim();
                const telefonoConPrefijo = telefono.match(/^\s*TEL\s*[:]?/i)
                    ? telefono
                    : `TEL: ${telefono}`;
                doc.text(telefonoConPrefijo, 25, shipperY);
                shipperY += 10;
            }
            if (datos.shipperEmail || datos.shipperEmergencyPhone) {
                if (datos.shipperEmail) {
                    const email = String(datos.shipperEmail || '').trim();
                    const emailConPrefijo = email.match(/^\s*EMAIL\s*[:]?/i)
                        ? email
                        : `EMAIL: ${email}`;
                    doc.text(emailConPrefijo, 25, shipperY);
                }
                if (datos.shipperEmergencyPhone) {
                    const telefonoEmergencia = String(datos.shipperEmergencyPhone || '').trim();
                    const telefonoConPrefijo = telefonoEmergencia.match(/^\s*TEL\s*[:]?/i)
                        ? telefonoEmergencia
                        : `TEL EMERGENCIA: ${telefonoEmergencia}`;
                    doc.text(telefonoConPrefijo, 145, shipperY);
                }
                shipperY += 10;
            }

            doc.setFontSize(5);
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.rect(140, 50, 125, 25);
            doc.text(`Shipper's Account Number`, 170, 56)

            // Número de cuenta del remitente (NIT fijo)
            doc.setFontSize(8);
            doc.setTextColor("#000");
            doc.text(`NIT: 327955-3`, 170, 70);

            //Cuadro arriba esquina izquierda uno abajo = 1
            doc.setFontSize(5);
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.rect(20, 125, 245, 75);
            doc.text(`Consignee's Name and Address`, 25, 130)

            // Datos del consignatario
            doc.setFontSize(5);
            doc.setTextColor("#000");
            doc.setFontSize(8);
            // leave three blank lines after the section title
            let consigneeY = 162;
            if (datos.consigneeName) {
                doc.text(datos.consigneeName, 25, consigneeY);
                consigneeY += 10;
            }

            if (datos.consigneeAddress) {
                const addressLines = doc.splitTextToSize(datos.consigneeAddress, 200);
                doc.text(addressLines, 25, consigneeY);
                consigneeY += (addressLines.length * 10);
            }
            if (datos.consigneePhone) {
                const telefono = String(datos.consigneePhone || '').trim();
                const telefonoConPrefijo = telefono.match(/^\s*TEL\s*[:]?/i)
                    ? telefono
                    : `TEL: ${telefono}`;
                doc.text(telefonoConPrefijo, 25, consigneeY);
                consigneeY += 10;
            }

            doc.setFontSize(5);
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.rect(140, 125, 125, 25);
            doc.text(`Consignee's Account Number`, 170, 130)

            // Número de cuenta del consignatario (NIT)
            doc.setFontSize(8);
            doc.setTextColor("#000");
            if (datos.consigneeAccount) {
                doc.text(datos.consigneeAccount, 170, 145);
            }

            //Cuadro arriba esquina izquierda dos abajo = 2
            doc.setFontSize(5);
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.rect(20, 200, 245, 45);
            doc.text(`Issuing Carrier's Agent Name and City`, 25, 205)

            // Datos del agente
            doc.setFontSize(8);
            doc.setTextColor("#000");
            if (datos.agentNameCity && datos.agentNameCity !== 'undefined' && datos.agentNameCity.trim() !== '') {
                doc.text(datos.agentNameCity, 25, 220);
            } else {
                doc.text('CROPA S.A.', 25, 220);
                doc.text('Guatemala', 25, 230);
            }


            //2 pequeños pegados = 3
            doc.setFontSize(5);
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.rect(20, 245, 122, 25);
            doc.text(`Agent's IATA Code`, 25, 251)

            // Código IATA del agente (usar valor por defecto si no hay ninguno)
            doc.setFontSize(8);
            doc.setTextColor("#000");
            const iataCode =
                datos.agentIATACode && datos.agentIATACode !== 'undefined' && datos.agentIATACode.trim() !== ''
                    ? datos.agentIATACode.trim()
                    : '8212148';
            doc.text(iataCode, 25, 265);
            doc.setFontSize(5);
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.rect(142, 245, 123, 25);
            doc.text(`Account No.`, 147, 250)

            // Texto fijo en el mismo renglón que Agent's IATA Code (8212148)
            doc.setFontSize(8);
            doc.setTextColor("#000");
            doc.text(`CRO`, 147, 265);

            // Número de cuenta del agente debajo de CRO
            if (datos.agentAccount) {
                doc.text(datos.agentAccount, 147, 275);
            }


            //cuadro abajo de 2 pequeños pegados = 4 (sin borde inferior)
            doc.setFontSize(5);
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.line(20, 270, 265, 270, "F") // borde superior
            doc.line(20, 270, 20, 310, "F")  // borde izquierdo
            doc.line(265, 270, 265, 310, "F") // borde derecho
            doc.text(`Airport of Departure ( Addr. of First) nad Requested Routing`, 25, 275)

            // Aeropuerto de salida, punto enlace origen y routing (concatenar con currency si existe para evitar superposición)
            doc.setFontSize(8);
            doc.setTextColor("#000");
            const routingLineParts = [];
            const primerOrigenNombre = Array.isArray(datos.rutas) && datos.rutas[0]?.origenNombre
                ? datos.rutas[0].origenNombre
                : (datos.enlaceOrigen || '');
            if (primerOrigenNombre) routingLineParts.push(String(primerOrigenNombre));

            const airportDepartureRouting =
                datos.airportDepartureRouting ||
                datos.requestedRouting ||
                datos.routing ||
                datos.ruta ||
                datos.rutaSolicitada ||
                datos.ruta_solicitada ||
                '';

            const normalizedRouting = String(airportDepartureRouting).trim();
            const normalizedSite = String(datos.sitioRecoleccion || '').trim();
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

            //Cuadro arriba izquierda 4 abajo = 5
            doc.setFontSize(5);
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            // Cuadro 'To.'
            doc.line(20, 295, 265, 295, "F")  // borde superior
            doc.line(20, 295, 20, 320, "F")   // borde izquierdo
            doc.line(265, 295, 265, 320, "F") // borde derecho
            doc.line(20, 320, 265, 320, "F")  // borde inferior
            doc.text(`To.`, 25, 301)

            doc.setFontSize(5);
            doc.line(50, 295, 50, 320, "F") // lineas verticales
            doc.text(`By first Carrier`, 57, 301)
            doc.line(162, 295, 162, 320, "F") // lineas verticales
            doc.text(`To`, 163, 301)
            doc.line(193, 295, 192, 320, "F") // lineas verticales
            doc.text(`By`, 194, 301)
            doc.line(215, 295, 215, 320, "F") // lineas verticales
            doc.text(`To`, 216, 301)
            doc.line(241, 295, 241, 320, "F") // lineas verticales
            doc.text(`By`, 242, 301)

            doc.line(105, 302, 154, 302, "F") // linea horizontal del cuadro
            doc.line(97, 295, 105, 302, "F")  // linea diagonal izquierda
            doc.line(154, 302, 162, 295, "F") // linea diagonal derecha
            doc.setFontSize(4.5);
            doc.text(`Routing and Destination`, 105, 300)

            // Populate TO/BY routing cells from rutas array (up to 3 route segments)
            {
                const rutas = Array.isArray(datos.rutas) ? datos.rutas : [];
                const dataY = 313;
                const routeCount = rutas.length;
                doc.setFontSize(7);
                doc.setTextColor('#000');
                // TO izquierdo (a la izquierda de "By first Carrier"):
                // siempre el último leg → puertoenlace_id_destino (código)
                const ultimaRuta = rutas[routeCount - 1];
                if (ultimaRuta && ultimaRuta.destinoCodigo) {
                    doc.text(String(ultimaRuta.destinoCodigo), 25, dataY);
                }
                if (rutas[0] && rutas[0].entidadNombreProv) {
                    const maxByW = 100;
                    const byLines = doc.splitTextToSize(String(rutas[0].entidadNombreProv), maxByW);
                    if (byLines.length > 1) {
                        doc.text(byLines[0], 57, 309);
                        doc.text(byLines[1], 57, 316);
                    } else {
                        doc.text(byLines[0], 57, dataY);
                    }
                }
                // Primer TO (a la derecha de Routing and Destination):
                // código del punto enlace destino de la fila 1, solo si hay más de 1 leg
                if (routeCount > 1 && rutas[0] && rutas[0].destinoCodigo) {
                    doc.text(String(rutas[0].destinoCodigo), 163, dataY);
                }
                // Primer BY (derecha): vacío
                // Segundo TO (a la derecha de Routing and Destination):
                // código del punto enlace destino de la fila 2, solo si hay exactamente 3 legs
                if (routeCount === 3 && rutas[1] && rutas[1].destinoCodigo) {
                    doc.text(String(rutas[1].destinoCodigo), 216, dataY);
                }
                // Segundo BY (derecha): vacío
            }

            //Cuadro arriba izquierda 5 abajo = 6 (sin borde superior)
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.setLineWidth(1.5);
            doc.line(20, 320, 20, 345, "F")   // borde izquierdo Airport of Destination
            doc.line(142, 320, 142, 345, "F") // borde compartido centro
            doc.line(265, 320, 265, 345, "F") // borde derecho Requested Flight
            doc.line(20, 345, 142, 345, "F")  // borde inferior Airport of Destination
            doc.line(142, 345, 265, 345, "F") // borde inferior Requested Flight
            doc.setLineWidth(0);
            doc.setFontSize(5);
            doc.text(`Airport of Destination`, 60, 326)

            // Aeropuerto de destino: usar el último destino de ruta cuando exista.
            doc.setFontSize(6);
            doc.setTextColor("#000");
            const ultimoDestinoRuta = Array.isArray(datos.rutas) && datos.rutas.length
                ? datos.rutas[datos.rutas.length - 1]?.destinoNombre
                : '';
            const destinoTexto =
                ultimoDestinoRuta ||
                datos.enlaceDestino ||
                datos.ciudadDestino ||
                datos.airportDestination;
            if (destinoTexto) {
                const lineY = 330;
                const maxWidth = 110;
                const destinoLines = doc.splitTextToSize(String(destinoTexto), maxWidth).slice(0, 2);
                doc.text(destinoLines, 25, lineY, { baseline: 'top' });
            }

            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.setFontSize(5);
            doc.line(205, 327, 205, 345)
            doc.line(175, 327, 233, 327, "F") // linea horizontal del cuadro
            doc.line(169, 320, 175, 327, "F") // lineas diagonales
            doc.line(233, 327, 239, 320, "F") // lineas diagonales
            doc.text(`Flight/Date`, 155, 325, { align: 'center' })
            doc.text(`For Carrier Use Only`, 180, 325)
            doc.text(`Flight/Date`, 262, 325, { align: 'right' })

            // Número de vuelo: primer vuelo en casilla izquierda, último vuelo en casilla derecha
            doc.setTextColor("#000");
            {
                const rutas = Array.isArray(datos.rutas) ? datos.rutas : [];
                const firstFlight = rutas[0]?.flightNumber || '';
                const lastFlight = rutas.length > 1 ? (rutas[rutas.length - 1]?.flightNumber || '') : '';
                doc.setFontSize(7);

                // Ajuste para evitar desbordes fuera de la casilla
                if (firstFlight) {
                    const firstFlightLines = doc.splitTextToSize(String(firstFlight), 58);
                    doc.text(firstFlightLines, 173, 340, { align: 'center' });
                }

                if (lastFlight) {
                    const lastFlightLines = doc.splitTextToSize(String(lastFlight), 58);
                    doc.text(lastFlightLines, 235, 340, { align: 'center' });
                }
            }

            //cuadro grande que tiene un cuadrado pequeño abajo en la derecha 
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.rect(20, 345, 527, 45);
            doc.setFontSize(7);
            doc.text(`Handling Information.`, 27, 352)

            // Información de manejo
            doc.setTextColor("#000");
            const handlingTextRaw =
                (datos.handlingInformation || "")
                || (datos.observaciones || "")
                || (datos.observacion || "");
            const handlingText = String(handlingTextRaw).replace(/House:\s*/g, "").trim();

            if (handlingText) {
                doc.setFontSize(7);
                const handlingLines = doc.splitTextToSize(handlingText, 500);
                doc.text(handlingLines, 27, 363);
            }
        }

        let cuadrosDerecha = () => {

            // // cuadros grises 2
            doc.setDrawColor("#D3D3D3");
            doc.setFillColor("#D3D3D3");
            doc.rect(296, 295, 17, 25, "F")

            //Cuadro arriba esquina derecha = 0
            doc.setDrawColor("#00205b");
            doc.rect(265, 50, 282, 65);

            // Nuevo formato según requerimiento
            doc.setFontSize(6);
            doc.text(`not negotiable`, 267, 58);

            doc.setFontSize(10);
            doc.text(`AIR`, 267, 69);
            doc.text(`WAYBILL`, 267, 78);

            // Texto adicional dentro del recuadro AIR WAYBILL, justo arriba de la linea de abajo
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(8);
            doc.text(`Issued by:`, 267, 108);

            const issuedByCarrier = Array.isArray(datos.rutas) && datos.rutas[0]?.entidadNombreProv
                ? String(datos.rutas[0].entidadNombreProv).trim()
                : '';
            if (issuedByCarrier) {
                doc.setFontSize(7.5);
                const issuedByLines = doc.splitTextToSize(issuedByCarrier, 220);
                doc.text(issuedByLines, 335, 108, { align: 'left' });
            }

            if (!datos.hideAirwayBillGuias) {
                const hawbValue = String(datos.correlativoGuia || datos.hawbNumber || datos.guiaHouse || '').trim();
                const mawbValue = String(datos.correlativoGuiaMaster || datos.mawbNumber || datos.guiaMaster || '').trim();
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
            doc.text(`Copies 1, 2 and 3 of this Air Waybill are originals and have the same validity`, 267, 124)

            //Cuadro arriba esquina derecha 2 abajo = 2
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.rect(265, 130, 282, 70);
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(5.5);
            const lines = doc.splitTextToSize(`It is agreed that the goods described herein are accepted in apparent goood order and condition (eccept as noted) for carriage SUBJECT TO THE CONDITIONS OF CONTRACT ON THE REVERSE HEREOF. ALL GOODS MAY BE CARRIED BU ANY OTHER MEANS INCLUDING ROAD OR ANY OTHER CARRIER UNLESS SPECIFIC CONTRARY INSTRUCTIONS ARE GIBEN HERON BY THE SHIPPER, AND SHIPPER AGREES THAT THE SHIPMENT MAY BE CARRIED VIA INTERMEDIATE STOPPING PLACES WHICH THE CARRIER DEEMS APPROPRIATE. THE SHIPPER'S ATTENTION IS DRAWN TO  THE NOTICE CONCERNING CARRIER'S LIMITATION OF LIABILITY. shipper may increase such limitation of liability by declaring a higher value for carriage and paying a supplemental charge if required.`, 275);
            doc.text(lines, 266, 136, { align: "left" });

            //Cuadro arriba derecha = 3
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.rect(265, 200, 282, 70);
            doc.text(`Accounting Information`, 267, 207)

            // Información contable
            doc.setFontSize(5);
            doc.setTextColor("#000");
            if (datos.accountingInformation) {
                const accountingLines = doc.splitTextToSize(datos.accountingInformation, 270);
                doc.text(accountingLines, 267, 220);
            }

            //Cuadro arriba derecha 3 abajo = 4
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.rect(265, 270, 282, 25);
            doc.setFontSize(5.5);
            doc.text(`Reference Number`, 267, 276)

            // Número de referencia
            doc.setFontSize(5);
            doc.setTextColor("#000");
            if (datos.referenceNumber) {
                doc.text(datos.referenceNumber, 267, 290);
            }

            doc.line(352, 277, 547, 277, "F") // linea horizontal del cuadro
            doc.text(`Option Shipping Information`, 377, 275)
            doc.line(370, 277, 370, 295, "F") // lineas verticales
            doc.line(455, 277, 455, 295, "F") // lineas verticales
            doc.line(348, 270, 352, 277, "F") // lineas diagonales
            doc.line(467, 270, 463, 277, "F") // lineas diagonales

            // Información opcional de envío (Incoterm)
            doc.setFontSize(6);
            doc.setTextColor("#000");
            if (datos.optionalShippingInfo) {
                const optionalInfoText = String(datos.optionalShippingInfo);
                doc.text(optionalInfoText, 355, 290);
            }
            {
                // Normalizar y extraer el código del Incoterm de forma segura
                const rawIncoterm = (typeof datos.incoterm === 'string')
                    ? datos.incoterm
                    : (datos.incoterm && (datos.incoterm.label || datos.incoterm.value)) || '';
                if (rawIncoterm) {
                    let incotermCode = '';
                    // Intentar por regex al inicio (3-4 letras), si no, fallback a splits comunes
                    const match = String(rawIncoterm).trim().match(/^[A-Za-z]{3,4}/);
                    if (match && match[0]) {
                        incotermCode = match[0].toUpperCase();
                    } else {
                        const strVal = String(rawIncoterm);
                        incotermCode = (strVal.split(' - ')[0] || strVal.split(' ')[0] || strVal).toUpperCase();
                    }
                    if (incotermCode) {
                        doc.text(`Incoterm: ${incotermCode}`, 375, 290);
                    }
                }
            }

            //Cuadro arriba derecha 4 abajo = 5
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.rect(265, 295, 282, 25);
            doc.setFontSize(5);
            doc.text(`Currency`, 267, 301)

            doc.line(370, 295, 370, 320, "F") // lineas verticales
            doc.text(`Declared Value for Carriage`, 380, 301)
            doc.line(455, 295, 455, 320, "F") // lineas verticales
            doc.text(`Declared Value for Costums`, 470, 301)

            doc.line(296, 295, 296, 320, "F") // lineas verticales
            doc.setFontSize(4.5);

            doc.text(`CHGS`, 298, 301)

            doc.line(313, 295, 313, 320, "F") // lineas verticales
            doc.text(`WT/VAL`, 318, 300)
            doc.setFontSize(4);
            doc.text(`PP`, 315, 307)
            doc.text(`CC`, 328, 307)

            doc.line(327, 302, 327, 320, "F") // lineas verticales
            doc.setFontSize(4.5);
            doc.text(`Other`, 350, 300)
            doc.setFontSize(4);
            doc.text(`PP`, 343, 307)
            doc.text(`CC`, 357, 307)
            doc.line(313, 302, 340, 302, "F") // linea horizontal

            // Marcar con X según tipo de pago (PREPAID / COLLECT)
            try {
                const marcarX = (x, y) => {
                    const prevSize = doc.getFontSize();
                    const prevFont = doc.getFont();
                    const prevColor = doc.getTextColor();
                    doc.setFont('Helvetica', 'bold');
                    doc.setFontSize(5);
                    doc.setTextColor('#000');
                    doc.text('X', x, y);
                    doc.setFont(prevFont.fontName, prevFont.fontStyle || 'normal');
                    doc.setFontSize(prevSize);
                    doc.setTextColor(prevColor);
                };
                const esPrepaid = !!(datos.chgsPPD || datos.wtValPPD);
                const esCollect = !!(datos.chgsCOLL || datos.wtValCOLL);

                // Columna CHGS: en PREPAID / COLLECT mostrar PP en primera fila y CC en segunda
                if (esPrepaid && esCollect) {
                    const prevSize = doc.getFontSize();
                    doc.setFontSize(5);

                    const chgsColStart = 296;
                    const chgsColEnd = 313;
                    const chgsColWidth = chgsColEnd - chgsColStart;

                    const firstLine = 'PP';
                    const secondLine = 'CC';
                    const maxTextWidth = Math.max(doc.getTextWidth(firstLine), doc.getTextWidth(secondLine));
                    const x = Math.max(chgsColStart + 1, chgsColStart + (chgsColWidth - maxTextWidth) / 2);

                    doc.text(firstLine, x, 311);
                    doc.text(secondLine, x, 316);

                    doc.setFontSize(prevSize);
                } else if (esPrepaid || esCollect) {
                    const label = esPrepaid ? 'PP' : 'CC';
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

                if (esPrepaid) {
                    // PP bajo WT/VAL
                    marcarX(318, 315);
                }
                if (esCollect) {
                    // CC bajo WT/VAL
                    marcarX(332, 315);
                }
            } catch (_) { }

            // Escribir valores de Currency, Declared Value for Carriage y Customs
            try {
                doc.setFontSize(7);
                doc.setTextColor('#000');
                const currencyValue = String(datos.currency || 'USD').toUpperCase();
                doc.text(currencyValue, 275, 313);
                if (datos.declaredValueCarriage) {
                    doc.text(formatNumber(datos.declaredValueCarriage), 380, 313);
                }
                if (datos.declaredValueCustoms) {
                    doc.text(formatNumber(datos.declaredValueCustoms), 470, 313);
                }
            } catch (_) { }

            doc.line(340, 295, 340, 320, "F") // lineas verticales
            doc.line(355, 302, 355, 320, "F") // lineas verticales
            doc.line(340, 302, 370, 302, "F") // linea horizontal


            //Cuadro arriba derecha 4 abajo = 6
            doc.setDrawColor("#00205b");
            doc.setFillColor("#00205b");
            doc.rect(265, 320, 282, 25);
            doc.setFontSize(5);
            doc.text(`Amount of insurance`, 267, 325)
            doc.line(347, 320, 347, 345, "F") // lineas verticales
            doc.setFontSize(6);
            const lines1 = doc.splitTextToSize(`INSURANCE - if Carrier offers Insurance, and such insurance is requested in accordance with tha conditions thereof, indicate amount to be insured in figures in box marked "amount of insurance".`, 190);
            doc.text(lines1, 350, 327, { align: "left" });

            doc.text(`PMT:`, 465, 352)

            //Cuadrito en una esquina inferior derecha que esta dentro de un cuadro grande
            doc.rect(462, 365, 85, 25);
            doc.text(`SCI`, 500, 371)
        }

        cuadrosIzquierda();
        cuadrosDerecha();

    };

    let cotizacion = () => {

        // lineas verticales con relleno 1
        doc.setDrawColor("#D3D3D3");
        doc.setFillColor("#D3D3D3");
        doc.rect(105.5, 390.5, 4.5, 193.5, "F")

        // lineas verticales con relleno 2
        doc.setDrawColor("#D3D3D3");
        doc.setFillColor("#D3D3D3");
        doc.rect(160.5, 390.5, 4.5, 193.5, "F")

        // lineas verticales con relleno 3
        doc.setDrawColor("#D3D3D3");
        doc.setFillColor("#D3D3D3");
        doc.rect(215.5, 390.5, 4.5, 193.5, "F")

        // lineas verticales con relleno 4
        doc.setDrawColor("#D3D3D3");
        doc.setFillColor("#D3D3D3");
        doc.rect(283.5, 390.5, 4.5, 193.5, "F")

        // lineas verticales con relleno
        doc.setDrawColor("#D3D3D3");
        doc.setFillColor("#D3D3D3");
        doc.rect(377.5, 390.5, 4.5, 193.5, "F")

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.line(20, 420, 547, 420, "F") // linea horizontal bajo títulos de columnas



        // Columna 1 con 3 segmentos dentro, pieces, gross and kb
        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(20, 390, 85, 194);
        doc.text(`No. Of`, 25, 401)
        doc.text(`Pieces`, 25, 407)
        doc.text(`RCP`, 27, 413)
        doc.line(50, 390, 50, 584, "F") // lineas verticales
        doc.text(`Gross`, 62, 400)
        doc.text(`Weight`, 61, 407)
        doc.line(95, 390, 95, 584, "F") // lineas verticales
        doc.text(`kg`, 97, 400)
        doc.text(`lb`, 98, 407)



        //Columna 2 con un cuadro dentro
        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(110, 390, 50, 194);
        doc.text(`Rate Class`, 112, 397)

        //cuadrado adentro 
        doc.rect(120, 400, 40, 20);
        doc.line(120, 420, 120, 584, "F") // lineas verticales 
        doc.text(`Commodity`, 125, 410)
        doc.text(`Item No.`, 130, 415)



        //Columna 3 
        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(165, 390, 50, 194);
        doc.text(`Chargeable`, 175, 400)
        doc.text(`Weight`, 180, 407)




        //Columna 4 
        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(220, 390, 63, 194);
        doc.line(220, 420, 283, 390, "F") // linea diagonal Rate/Charge
        doc.text(`Rate`, 225, 400)
        doc.text(`Charge`, 255, 415)


        //columan 5 
        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(288, 390, 89, 194);
        doc.text(`Total`, 325, 405)

        //columan 6 
        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(382, 390, 165, 194);
        doc.text(`Nature and Quantity of Goods`, 425, 400)
        doc.text(`(Incl. Dimensions or Volume)`, 425, 407)

        //Linea de los totales
        doc.line(20, 565, 95, 565, "F")
        doc.line(288, 565, 377, 565, "F")

        // Usar únicamente items provenientes de 'datos'
        const itemsToRender = datos.items || [];

        const parseToNumber = (value) => {
            if (value === undefined || value === null || value === '') return 0;
            if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
            const normalized = String(value).replace(/,/g, '').trim();
            const num = Number(normalized);
            return Number.isFinite(num) ? num : 0;
        };

        const formatNumber = (value) => {
            const num = parseToNumber(value);
            if (!Number.isFinite(num)) return '';
            return Number.isInteger(num) ? String(num) : num.toFixed(2);
        };

        const summaryPieces = itemsToRender.reduce((acc, item) => acc + parseToNumber(item.noPieces ?? item.pieces), 0);
        const summaryGrossWeight = itemsToRender.reduce((acc, item) => acc + parseToNumber(item.volumen ?? item.grossWeight ?? 0), 0);
        const summaryChargeableWeight = itemsToRender.reduce((acc, item) => acc + parseToNumber(item.chargeableWeight), 0);

        const afRateCosto = datos.afRateCosto != null ? parseToNumber(datos.afRateCosto) : null;
        const summaryTotalAmount = (afRateCosto !== null && Number.isFinite(afRateCosto))
            ? afRateCosto * summaryChargeableWeight
            : itemsToRender.reduce((acc, item) => acc + parseToNumber(item.total), 0);

        // Función para agregar las cargas consolidadas
        const addItemsToDoc = () => {
            let yPosition = margins.top;

            doc.setTextColor("#000");
            doc.setFontSize(7);

            const maxWidthDescripcionRight = 150; // limita el texto y fuerza salto de línea

            // Imprimir valores numéricos consolidados (suma de todas las cargas) una sola vez
            const totalPieces = formatNumber(summaryPieces);
            const totalGross = formatNumber(summaryGrossWeight);
            const totalChargeable = formatNumber(summaryChargeableWeight);
            const totalAmount = formatNumber(summaryTotalAmount);

            doc.setFont('consolas', 'normal');

            if (totalPieces) {
                doc.text(totalPieces, 25, yPosition);
            }
            if (totalGross) {
                doc.text(totalGross, 55, yPosition);
            }
            doc.text('kg', 96, yPosition);
            if (totalChargeable !== '') {
                doc.text(totalChargeable, 175, yPosition);
            }
            if (afRateCosto !== null && Number.isFinite(afRateCosto)) {
                doc.text(formatNumber(afRateCosto), 225, yPosition);
            }
            if (totalAmount !== '') {
                doc.text(totalAmount, 295, yPosition);
            }

            // Renderizar descripción y dimensiones de cada carga por separado
            itemsToRender.forEach((item) => {
                const description = String(item.descripcion || item.natureOfGoods || '');

                if (description) {
                    const descLines = doc.splitTextToSize(description, maxWidthDescripcionRight);
                    doc.text(descLines, 385, yPosition, { align: "left" });
                    yPosition = Math.max(yPosition, yPosition + descLines.length * 7);
                }

                // Segunda línea: DIMS [cantidad(bulto)] [largo x ancho x alto] cm
                const dimsMedidas = item.dimensiones || '';
                if (dimsMedidas) {
                    const dimsBultos = formatNumber(item.noPieces ?? item.pieces);
                    const dimsLine = `DIMS ${dimsBultos} ${dimsMedidas} cm`;
                    doc.text(dimsLine, 385, yPosition, { align: "left" });
                    yPosition += 7;
                }

                // espacio hacia la siguiente carga
                yPosition += 10;

                // si llegamos al final de la página, agregar nueva
                if (yPosition > doc.internal.pageSize.getHeight() - 60) {
                    doc.addPage();
                    yPosition = margins.top;
                    doc.setFont('consolas', 'normal');
                }
            });

            // regresar a Helvetica para continuaciones posteriores
            doc.setFont('Helvetica', 'normal');
        };

        if (itemsToRender.length > 0) {
            addItemsToDoc();
        }

        // Imprimir totales alineados con columnas
        doc.setFont('Helvetica', 'bold');
        doc.text(`${formatNumber(summaryPieces)}`, 25, 575);
        doc.text(`${formatNumber(summaryGrossWeight)}`, 60, 575);
        // Imprimir Chargeable Weight total
        doc.text(`${formatNumber(summaryChargeableWeight)}`, 175, 575);
        if (afRateCosto !== null && Number.isFinite(afRateCosto)) {
            doc.text(`${formatNumber(afRateCosto)}`, 225, 575);
        }
        // const monedaFooter = datos.currency || '';
        // const totalLabel = `${monedaFooter ? monedaFooter + ' ' : ''}${totalTotal.toFixed(2)}`;
        const totalLabel = `${formatNumber(summaryTotalAmount)}`;
        doc.text(totalLabel, 295, 575);
        doc.setFont('Helvetica', 'normal');

    }
    const addWatermark = (doc) => {
        if (borrador) {
            doc.setTextColor("#BBB");
            doc.setFont("Helvetica", "bold");
            const watermarkText = "DRAFT";
            const fontSize = 190;
            const angle = 45; // Ángulo de rotación

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            doc.setTextColor(230);
            doc.setFontSize(fontSize);
            doc.text(watermarkText, pageWidth / 2.3, pageHeight / 2.5, {
                angle: angle,
                align: 'center',
                baseline: "middle"
            });
            doc.text(watermarkText, pageWidth / 1.3, pageHeight / 1.4, {
                angle: angle,
                align: 'center',
                baseline: "middle"
            });
            doc.text(watermarkText, pageWidth / 0.9, pageHeight / 1, {
                angle: angle,
                align: 'center',
                baseline: "middle"
            });
        }
    };

    let footer = () => {
        // Determinar tipo de pago
        const esPrepaid = !!(datos.chgsPPD || datos.wtValPPD);
        const esCollect = !!(datos.chgsCOLL || datos.wtValCOLL);

        // Helper numérico
        const ptn = (v) => {
            if (v === undefined || v === null || v === '') return 0;
            if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
            const n = Number(String(v).replace(/,/g, '').trim());
            return Number.isFinite(n) ? n : 0;
        };
        const fmtN = (v) => { const n = ptn(v); return (n === 0) ? '' : (Number.isInteger(n) ? String(n) : n.toFixed(2)); };

        // Total de la tabla (Weight Charge)
        const _items = datos.items || [];
        const _afRate = datos.afRateCosto != null ? ptn(datos.afRateCosto) : null;
        const _chargeableWt = _items.reduce((acc, item) => acc + ptn(item.chargeableWeight), 0);
        const _tableTotalRaw = (_afRate !== null && Number.isFinite(_afRate))
            ? _afRate * _chargeableWt
            : _items.reduce((acc, item) => acc + ptn(item.total), 0);
        const tableTotalStr = fmtN(_tableTotalRaw);

        // Gastos Due Agent / Due Carrier
        const gastosParaPdf = Array.isArray(datos.gastosParaPdf) ? datos.gastosParaPdf : [];
        const dueAgentItems = gastosParaPdf.filter((g) => g.isDueAgent);
        const dueCarrierItems = gastosParaPdf.filter((g) => g.isDueCarrier && String(g.siglas || '').toUpperCase() !== 'A/F');

        // When PREPAID/COLLECT, split each group by individual tipoPago
        const isPrepaidCollect = esPrepaid && esCollect;
        const isPrepaid = (g) => String(g.tipoPago || '').toUpperCase().includes('PREPAID');
        const isCollect = (g) => String(g.tipoPago || '').toUpperCase().includes('COLLECT');

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

        // Total general (Weight + Valuation + Tax + Due Agent + Due Carrier)
        const _valuationRaw = ptn(datos.valuationCharge);
        const _taxRaw = ptn(datos.tax);
        const totalGrandRaw = _tableTotalRaw + _valuationRaw + _taxRaw + dueAgentTotal + dueCarrierTotal;
        const totalGrandStr = fmtN(totalGrandRaw);

        // Side determination for each component (mirrors display logic)
        const _afTipoPago = datos.afTipoPagoCodigo != null ? Number(datos.afTipoPagoCodigo) : null;
        let wchForPrepaid, wchForCollect;
        if (isPrepaidCollect && _afTipoPago != null) {
            wchForPrepaid = _afTipoPago === 128;
            wchForCollect = _afTipoPago === 127;
        } else {
            wchForPrepaid = esPrepaid;
            wchForCollect = esCollect;
        }
        // Valuation Charge: displayed at x=95 (left/prepaid column, divider at x=120)
        // No tipoPago field → prepaid when esPrepaid, collect only when pure collect
        const _valForPrepaid = esPrepaid;
        const _valForCollect = esCollect && !esPrepaid;
        // Tax side: same logic as display
        const _taxTipoPago = String(datos.taxTipoPago || '').toUpperCase();
        const _taxForPrepaid = _taxTipoPago.includes('PREPAID') || (!_taxTipoPago.includes('COLLECT') && esPrepaid);
        const _taxForCollect = _taxTipoPago.includes('COLLECT') || (!_taxTipoPago.includes('PREPAID') && esCollect);

        const totalPrepaidRaw = isPrepaidCollect
            ? (wchForPrepaid ? _tableTotalRaw : 0)
            + (_valForPrepaid ? _valuationRaw : 0)
            + (_taxForPrepaid ? _taxRaw : 0)
            + dueAgentPrepaidTotal + dueCarrierPrepaidTotal
            : esPrepaid ? totalGrandRaw : 0;
        const totalCollectRaw = isPrepaidCollect
            ? (wchForCollect ? _tableTotalRaw : 0)
            + (_valForCollect ? _valuationRaw : 0)
            + (_taxForCollect ? _taxRaw : 0)
            + dueAgentCollectTotal + dueCarrierCollectTotal
            : esCollect ? totalGrandRaw : 0;
        const totalPrepaidStr = fmtN(totalPrepaidRaw);
        const totalCollectStr = fmtN(totalCollectRaw);

        // Pintar

        // cuadros grises 1
        doc.setDrawColor("#D3D3D3");
        doc.setFillColor("#D3D3D3");
        doc.rect(20, 707, 190, 25, "F")

        // // cuadros grises 2
        doc.setDrawColor("#D3D3D3");
        doc.setFillColor("#D3D3D3");
        doc.rect(20, 754, 190, 25, "F")
        // // cuadros grises 2
        doc.setDrawColor("#D3D3D3");
        doc.setFillColor("#D3D3D3");
        doc.rect(20, 779, 190, 25, "F")

        // // cuadros grises 2
        doc.setDrawColor("#D3D3D3");
        doc.setFillColor("#D3D3D3");
        doc.rect(210, 779, 100, 25, "F")


        // cuadro general izquierda footer
        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b");
        doc.rect(20, 584, 190, 220);

        //primeros 2 cuadros con 3 titulos
        // primer titulo prepaid
        doc.setFontSize(5);
        doc.line(35, 592, 75, 592, "F") // horizontal
        doc.line(30, 584, 35, 592, "F") // lineas diagonales
        doc.line(75, 592, 80, 584, "F") // lineas diagonales
        doc.text(`Prepaid`, 45, 590)

        // Imprimir valor de Weight Charge (Prepaid o Collect según cod_tipo_pago del A/F)
        doc.setFontSize(7);
        doc.setTextColor("#000");
        if (tableTotalStr) {
            const afTipoPago = datos.afTipoPagoCodigo != null ? Number(datos.afTipoPagoCodigo) : null;
            let wchPrepaid, wchCollect;
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

        // segundo titulo charge
        doc.setFontSize(5);
        doc.line(85, 592, 135, 592, "F") // horizontal
        doc.line(80, 584, 85, 592, "F") // lineas diagonales
        doc.line(135, 592, 140, 584, "F") // lineas diagonales
        doc.text(`Weight Charge`, 90, 590)

        // tercer titulo collect
        doc.setFontSize(5);
        doc.line(145, 592, 195, 592, "F") // horizontal
        doc.line(140, 584, 145, 592, "F") // lineas diagonales
        doc.line(195, 592, 200, 584, "F") // lineas diagonales
        doc.text(`Collect`, 160, 590)

        // Weight Charge Collect handled above via tableTotalStr

        // linea vertical 
        doc.line(120, 592, 120, 607, "F") // vertical
        //linea final del cuadro
        doc.line(20, 607, 210, 607, "F") // horizontal

        //Segundos 2 cuadros con un titulo
        // primer titulo valuation charge
        doc.setFontSize(5);
        doc.line(80, 614, 160, 614, "F") // horizontal
        doc.line(75, 607, 80, 614, "F") // lineas diagonales
        doc.line(160, 614, 165, 607, "F") // lineas diagonales
        doc.text(`Valuation Charge`, 95, 613)

        // Imprimir valor de Valuation Charge
        doc.setFontSize(7);
        doc.setTextColor("#000");
        if (datos.valuationCharge) {
            const valuationValue = fmtN(datos.valuationCharge);
            if (valuationValue) {
                doc.text(valuationValue, 95, 623);
            }
        }

        // linea vertical 
        doc.line(120, 614, 120, 632, "F") // vertical
        //linea final del cuadro
        doc.line(20, 632, 210, 632, "F") // horizontal

        //Terceros 2 cuadros con un titulo
        // primer titulo tax
        doc.setFontSize(5);
        doc.line(105, 639, 130, 639, "F") // horizontal
        doc.line(100, 632, 105, 639, "F") // lineas diagonales
        doc.line(130, 639, 135, 632, "F") // lineas diagonales
        doc.text(`Tax`, 112, 637.5)

        // Imprimir valor de Tax (IVA, cod_rubro=133)
        // Se coloca en el lado Prepaid o Collect según taxTipoPago
        doc.setFontSize(7);
        doc.setTextColor("#000");
        if (datos.tax) {
            const taxValue = fmtN(datos.tax);
            const taxTipoPago = String(datos.taxTipoPago || '').toUpperCase();
            const taxIsPrepaid = taxTipoPago.includes('PREPAID') || (!taxTipoPago.includes('COLLECT') && esPrepaid);
            const taxIsCollect = taxTipoPago.includes('COLLECT') || (!taxTipoPago.includes('PREPAID') && esCollect);
            if (taxIsPrepaid && !taxIsCollect) {
                doc.text(taxValue, 45, 647.5);
            } else if (taxIsCollect && !taxIsPrepaid) {
                doc.text(taxValue, 150, 647.5);
            } else {
                // ambos o indeterminado: colocar en ambos lados activos
                if (esPrepaid) doc.text(taxValue, 45, 647.5);
                if (esCollect) doc.text(taxValue, 150, 647.5);
            }
        }

        // linea vertical 
        doc.line(120, 639, 120, 657, "F") // vertical
        //linea final del cuadro
        doc.line(20, 657, 210, 657, "F") // horizontal

        //Cuadro de la derecha 1
        // Box: x=210, y=584, w=337, h=73  →  spans x=[210,547], y=[584,657]
        doc.rect(210, 584, 337, 73);
        // Título "Other Charges" a la izquierda del header
        doc.setFont("Helvetica", "bold");
        doc.text(`Other Charges`, 215, 590);
        doc.setFont("Helvetica", "normal");

        // Divisor vertical entre Due Agent (izq) y Due Carrier (der)
        // Left col: x=210..378, center=294 | Right col: x=378..547, center=462
        const ocDivX = 378;
        doc.line(ocDivX, 591, ocDivX, 657, "F");

        // Layout horizontal: Due Agent a la izquierda, Due Carrier a la derecha
        try {
            doc.setFontSize(6.5);
            const ocLineH = 8;
            const ocMaxY = 654;

            // Columna izquierda (Due Agent)
            const ocLCenterX = 294;  // centro de col izquierda para títulos
            const ocLItemX = 215;    // x base para items de col izquierda

            // Columna derecha (Due Carrier)
            const ocRCenterX = 462;  // centro de col derecha para títulos
            const ocRItemX = 383;    // x base para items de col derecha

            // Renderiza columna Due Agent
            const renderColAgent = () => {
                let ocY = 598;
                doc.setFont("Helvetica", "bold");
                doc.text("Due Agent", ocLCenterX, ocY, { align: 'center' });
                doc.setFont("Helvetica", "normal");
                ocY += ocLineH;

                const renderItems = (items) => {
                    for (const g of items) {
                        if (ocY > ocMaxY) break;
                        const lineTxt = [g.siglas, g.venta ? fmtN(g.venta) : ''].filter(Boolean).join(' ');
                        if (lineTxt) { doc.text(lineTxt, ocLItemX, ocY); ocY += ocLineH; }
                    }
                };

                if (isPrepaidCollect) {
                    if (dueAgentPrepaidItems.length > 0) {
                        if (ocY <= ocMaxY) {
                            doc.setFont("Helvetica", "italic");
                            doc.text("Prepaid", ocLItemX + 4, ocY);
                            doc.setFont("Helvetica", "normal");
                            ocY += ocLineH;
                            renderItems(dueAgentPrepaidItems);
                        }
                    }
                    if (dueAgentCollectItems.length > 0) {
                        if (ocY <= ocMaxY) {
                            doc.setFont("Helvetica", "italic");
                            doc.text("Collect", ocLItemX + 4, ocY);
                            doc.setFont("Helvetica", "normal");
                            ocY += ocLineH;
                            renderItems(dueAgentCollectItems);
                        }
                    }
                } else {
                    renderItems(dueAgentItems);
                }
            };

            // Renderiza columna Due Carrier
            const renderColCarrier = () => {
                let ocY = 598;
                doc.setFont("Helvetica", "bold");
                doc.text("Due Carrier", ocRCenterX, ocY, { align: 'center' });
                doc.setFont("Helvetica", "normal");
                ocY += ocLineH;

                const renderItems = (items) => {
                    for (const g of items) {
                        if (ocY > ocMaxY) break;
                        const lineTxt = [g.siglas, g.venta ? fmtN(g.venta) : ''].filter(Boolean).join(' ');
                        if (lineTxt) { doc.text(lineTxt, ocRItemX, ocY); ocY += ocLineH; }
                    }
                };

                if (isPrepaidCollect) {
                    if (dueCarrierPrepaidItems.length > 0) {
                        if (ocY <= ocMaxY) {
                            doc.setFont("Helvetica", "italic");
                            doc.text("Prepaid", ocRItemX + 4, ocY);
                            doc.setFont("Helvetica", "normal");
                            ocY += ocLineH;
                            renderItems(dueCarrierPrepaidItems);
                        }
                    }
                    if (dueCarrierCollectItems.length > 0) {
                        if (ocY <= ocMaxY) {
                            doc.setFont("Helvetica", "italic");
                            doc.text("Collect", ocRItemX + 4, ocY);
                            doc.setFont("Helvetica", "normal");
                            ocY += ocLineH;
                            renderItems(dueCarrierCollectItems);
                        }
                    }
                } else {
                    renderItems(dueCarrierItems);
                }
            };

            if (dueAgentItems.length > 0) renderColAgent();
            if (dueCarrierItems.length > 0) renderColCarrier();

            // Fallback si no hay gastos estructurados
            if (gastosParaPdf.length === 0) {
                const oc = (datos.otherCharges || '').toString();
                if (oc) {
                    doc.setFontSize(7);
                    const ocLines = doc.splitTextToSize(oc, 160);
                    ocLines.forEach((line, i) => {
                        if (598 + i * ocLineH <= ocMaxY) doc.text(line, 215, 598 + i * ocLineH);
                    });
                }
            }
        } catch (_) { }

        //Cuartos 2 cuadros con un titulo
        // primer titulo Total Other Charges Due Agent
        doc.setFontSize(5);
        doc.line(55, 664, 160, 664, "F") // horizontal
        doc.line(50, 657, 55, 664, "F") // lineas diagonales
        doc.line(160, 664, 165, 657, "F") // lineas diagonales
        doc.text(`Total Other Charges Due Agent`, 65, 662)

        // Imprimir valor de Total Other Charges Due Agent
        doc.setFontSize(7);
        doc.setTextColor("#000");
        if (isPrepaidCollect) {
            const dueAgentPrepaidStr = fmtN(dueAgentPrepaidTotal);
            const dueAgentCollectStr = fmtN(dueAgentCollectTotal);
            if (dueAgentPrepaidStr !== '') doc.text(dueAgentPrepaidStr, 45, 672);
            if (dueAgentCollectStr !== '') doc.text(dueAgentCollectStr, 150, 672);
        } else if (dueAgentTotalStr !== '') {
            if (esPrepaid) doc.text(dueAgentTotalStr, 45, 672);
            if (esCollect) doc.text(dueAgentTotalStr, 150, 672);
        }

        // linea vertical 
        doc.line(120, 664, 120, 682, "F") // vertical
        //linea final del cuadro
        doc.line(20, 682, 210, 682, "F") // horizontal

        //Quintos 2 cuadros con un titulo
        // primer titulo Total Other Charges Due Carrier
        doc.setFontSize(5);
        doc.line(55, 689, 160, 689, "F") // horizontal
        doc.line(50, 682, 55, 689, "F") // lineas diagonales
        doc.line(160, 689, 165, 682, "F") // lineas diagonales
        doc.text(`Total Other Charges Due Carrier`, 65, 687)

        // Imprimir valor de Total Other Charges Due Carrier
        doc.setFontSize(7);
        doc.setTextColor("#000");
        if (isPrepaidCollect) {
            const dueCarrierPrepaidStr = fmtN(dueCarrierPrepaidTotal);
            const dueCarrierCollectStr = fmtN(dueCarrierCollectTotal);
            if (dueCarrierPrepaidStr !== '') doc.text(dueCarrierPrepaidStr, 45, 697);
            if (dueCarrierCollectStr !== '') doc.text(dueCarrierCollectStr, 150, 697);
        } else if (dueCarrierTotalStr !== '') {
            if (esPrepaid) doc.text(dueCarrierTotalStr, 45, 697);
            if (esCollect) doc.text(dueCarrierTotalStr, 150, 697);
        }

        // linea vertical 
        doc.line(120, 689, 120, 707, "F") // vertical
        //linea final del cuadro
        doc.line(20, 707, 210, 707, "F") // horizontal


        // cuadros grises 1
        // linea vertical 
        doc.line(120, 707, 120, 732, "F") // vertical
        //linea final del cuadro
        doc.line(20, 732, 210, 732, "F") // horizontal

        //Cuadro de la derecha 2
        doc.rect(210, 657, 337, 75);
        doc.setFontSize(7);
        const lines3 = doc.splitTextToSize(`Shipper certifies that the particulars on the face hereof are correct and that insofar as any part of the consignment contains dangerous goods, such part is properly described by name and is in proper condition for carriage by air according to the applicable Dangerous Goods Regulations`, 335);
        doc.text(lines3, 212, 664, { align: "left" });

        //Septimos 2 cuadros con un titulo
        // primer titulo Total Other Charges Due Agent
        doc.line(35, 739, 105, 739, "F") // horizontal
        doc.line(30, 732, 35, 739, "F") // lineas diagonales
        doc.line(105, 739, 110, 732, "F") // lineas diagonales
        doc.setFontSize(5);
        doc.text(`Total Prepaid`, 55, 737.5)

        // Imprimir valor de Total Prepaid (calculado)
        doc.setFontSize(7);
        doc.setTextColor("#000");
        if (totalPrepaidStr !== '') {
            doc.text(totalPrepaidStr, 55, 747);
        } else if (datos.totalPrepaid != null) {
            doc.text(fmtN(datos.totalPrepaid), 55, 747);
        }

        // segundo titulo Total Other Charges Due Agent
        doc.line(135, 739, 195, 739, "F") // horizontal
        doc.line(130, 732, 135, 739, "F") // lineas diagonales
        doc.line(195, 739, 200, 732, "F") // lineas diagonales
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(5);
        doc.text(`Total Collect`, 150, 737.5)

        // Imprimir valor de Total Collect (calculado)
        doc.setFontSize(7);
        doc.setTextColor("#000");
        if (totalCollectStr !== '') {
            doc.text(totalCollectStr, 150, 747);
        } else if (datos.totalCollect != null) {
            doc.text(fmtN(datos.totalCollect), 150, 747);
        }

        // linea vertical 
        doc.line(120, 732, 120, 754, "F") // vertical
        //linea final del cuadro
        doc.line(20, 754, 210, 754, "F") // horizontal

        //Octavos 2 cuadros con un titulo
        // primer titulo Total Other Charges Due Agent
        doc.setFontSize(5);
        doc.line(25, 761, 115, 761, "F") // horizontal
        doc.line(20, 754, 25, 761, "F") // lineas diagonales
        doc.line(115, 761, 120, 754, "F") // lineas diagonales
        doc.text(`Currency Conversion Rates`, 40, 759.5)

        // segundo titulo Total Other Charges Due Agent
        doc.line(125, 761, 205, 761, "F") // horizontal
        doc.line(120, 754, 125, 761, "F") // lineas diagonales
        doc.line(205, 761, 210, 754, "F") // lineas diagonales
        doc.text(`CC. Charges In Dest. Currency`, 130, 759.5)


        // linea vertical 
        doc.line(120, 754, 120, 779, "F") // vertical
        //linea final del cuadro
        doc.line(20, 779, 210, 779, "F") // horizontal


        //Novenos 2 cuadros con un titulo									  

        doc.text(`For Carrier's use only`, 40, 790)
        doc.text(`At Destination`, 50, 795)

        // primer titulo Total Other Charges Due Agent
        doc.line(135, 786, 195, 786, "F") // horizontal
        doc.line(130, 779, 135, 786, "F") // lineas diagonales
        doc.line(195, 786, 200, 779, "F") // lineas diagonales
        doc.text(`Charges at Destination`, 140, 784.5)

        // linea vertical 
        doc.line(120, 779, 120, 804, "F") // vertical

        //Cuadro de la derecha 2
        doc.rect(210, 732, 337, 47);

        doc.setLineDash([1], 1);
        doc.line(210, 767, 547, 767) // horizontal
        doc.setFontSize(5);
        doc.text(`at (place)`, 345, 775)
        doc.text(`Executed on (date)`, 220, 775)
        doc.text(`Signature if Isuing Carrier or Its Agent`, 460, 775)

        // Mapear datos de firma y ejecución (segunda sección)
        doc.setFontSize(8);
        doc.setTextColor("#000");

        const executedDateText = formatDateForPdf(datos.executedOnDate ?? new Date());
        const executedPlaceText = datos.executedAtPlace
            ? String(datos.executedAtPlace).trim()
            : 'GUATEMALA';
        const shipperSignatureText = datos.signature ? String(datos.signature) : '';
        const carrierSignatureText = 'CROPA S.A.';

        if (executedDateText) {
            doc.text(executedDateText, 215, 765);
        }
        if (executedPlaceText) {
            doc.text(executedPlaceText, 328, 765);
        }
        doc.text(carrierSignatureText, 460, 765);

        doc.setLineDash([], 0);

        doc.rect(210, 779, 100, 25);
        // primer titulo Total Other Charges Due Agent
        doc.setFontSize(5);
        doc.line(225, 786, 295, 786, "F") // horizontal
        doc.line(220, 779, 225, 786, "F") // lineas diagonales
        doc.line(295, 786, 300, 779, "F") // lineas diagonales
        doc.text(`Total Collect Charges`, 235, 784.5)

        // Imprimir valor de Total Collect Charges
        doc.setFontSize(7);
        doc.setTextColor("#000");
        if (datos.totalCollectCharges) {
            const totalCollectChargesValue = datos.totalCollectCharges || '';
            if (totalCollectChargesValue) {
                doc.text(String(totalCollectChargesValue), 235, 796);
            }
        }
        // Impresiones redundantes eliminadas: referencias a variables inexistentes (pdfData)

    }

    let diseño = () => {// doc.addPage();

        //Linea de los totales
        doc.line(20, 565, 95, 565, "F")
        doc.line(288, 565, 377, 565, "F")
    }

    const copias = Array.isArray(datos.copias) && datos.copias.length > 0 ? datos.copias : null;

    const drawAwbPage = () => {
        addWatermark(doc);
        doc.internal.write('q');
        doc.internal.write(`1 0 0 1 ${xOff.toFixed(2)} 0 cm`);
        header();
        cotizacion();
        footer();
        doc.internal.write('Q');
    };

    const addCopyLabel = (label) => {
        const pageHeight = doc.internal.pageSize.getHeight
            ? doc.internal.pageSize.getHeight()
            : doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.getWidth
            ? doc.internal.pageSize.getWidth()
            : doc.internal.pageSize.width;
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor('#000');
        doc.text(label, pageWidth / 2, pageHeight - 8, { align: 'center' });
    };

    const isOriginalLabel = (label) =>
        typeof label === 'string' && label.toUpperCase().startsWith('ORIGINAL');

    if (copias) {
        copias.forEach((copyLabel, idx) => {
            if (idx > 0) doc.addPage();
            drawAwbPage();
            addCopyLabel(copyLabel);
            if (isOriginalLabel(copyLabel)) {
                addLegalNoticeLastPage(doc);
            }
        });
    } else {
        drawAwbPage();
    }

    return doc.output(outputType);
}

function addLegalNoticeLastPage(doc) {
    doc.addPage();

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor("#000");

    const marginX = 18;
    const marginTop = 28;
    const marginBottom = 25;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const fontSize = 7;
    const lineHeight = 9.5;
    const columnGap = 8;
    const colWidth = (pageWidth - marginX * 2 - columnGap) / 2;
    const col1X = marginX;
    const col2X = marginX + colWidth + columnGap;

    // Header — centered, bold, full width
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    const headerText = "NOTICE CONCERNING CARRIER'S LIMITATION OF LIABILITY";
    const headerWidth = doc.getTextWidth(headerText);
    doc.text(headerText, (pageWidth - headerWidth) / 2, marginTop);

    const headerHeight = lineHeight * 2;
    const startY = marginTop + headerHeight;

    // Thin divider under header
    doc.setLineWidth(0.3);
    doc.line(marginX, startY - lineHeight * 0.5, pageWidth - marginX, startY - lineHeight * 0.5);

    const noticeText = `If the carriage involves an ultimate destination or stop in a country other than the country of departure, the Montreal Convention or the Warsaw Convention may be applicable to the liability of the Carrier in respect of loss of, damage or delay to cargo. Carrier's limitation of liability in accordance with those Conventions shall be as set forth in subparagraph 4 unless a higher value is declared.

CONDITIONS OF CONTRACT
1. In this contract and the Notices appearing hereon:
CARRIER includes the air carrier issuing this air waybill and all carriers that carry or undertake to carry the cargo or perform any other services related to such carriage.
SPECIAL DRAWING RIGHT (SDR) is a Special Drawing Right as defined by the International Monetary Fund.
WARSAW CONVENTION means whichever of the following instruments is applicable to the contract of carriage: the Convention for the Unification of Certain Rules Relating to International Carriage by Air, signed at Warsaw, 12 October 1929; that Convention as amended at The Hague on 28 September 1955; that Convention as amended at The Hague 1955 and by Montreal Protocol No. 1, 2, or 4 (1975) as the case may be.
MONTREAL CONVENTION means the Convention for the Unification of Certain Rules for International Carriage by Air, done at Montreal on 28 May 1999.

2.1 Carriage is subject to the rules relating to liability established by the Warsaw Convention or the Montreal Convention unless such carriage is not "international carriage" as defined by the applicable Conventions.
2.2 To the extent not in conflict with the foregoing, carriage and other related services performed by each Carrier are subject to:
2.2.1 applicable laws and government regulations;
2.2.2 provisions contained in the air waybill, Carrier's conditions of carriage and related rules, regulations, and timetables (but not the times of departure and arrival stated therein) and applicable tariffs of such Carrier, which are made part hereof, and which may be inspected at any airports or other cargo sales offices from which it operates regular services. When carriage is to/from the USA, the shipper and the consignee are entitled, upon request, to receive a free copy of the Carrier's conditions of carriage. The Carrier's conditions of carriage include, but are not limited to:
2.2.2.1 limits on the Carrier's liability for loss, damage or delay of goods, including fragile or perishable goods;
2.2.2.2 claims restrictions, including time periods within which shippers or consignees must file a claim or bring an action against the Carrier for its acts or omissions, or those of its agents;
2.2.2.3 rights, if any, of the Carrier to change the terms of the contract;
2.2.2.4 rules about Carrier's right to refuse to carry;
2.2.2.5 rights of the Carrier and limitations concerning delay or failure to perform service, including schedule changes, substitution of alternate Carrier or aircraft and rerouting.

3. The agreed stopping places (which may be altered by Carrier in case of necessity) are those places, except the place of departure and place of destination, set forth on the face hereof or shown in Carrier's timetables as scheduled stopping places for the route. Carriage to be performed hereunder by several successive Carriers is regarded as a single operation.

4. For carriage to which the Montreal Convention does not apply, Carrier's liability limitation for cargo lost, damaged or delayed shall be 26 SDRs per kilogram unless a greater per kilogram monetary limit is provided in any applicable Convention or in Carrier's tariffs or general conditions of carriage.

5.1 Except when the Carrier has extended credit to the consignee without the written consent of the shipper, the shipper guarantees payment of all charges for the carriage due in accordance with Carrier's tariff, conditions of carriage and related regulations, applicable laws (including national laws implementing the Warsaw Convention and the Montreal Convention), government regulations, orders and requirements.
5.2 When no part of the consignment is delivered, a claim with respect to such consignment will be considered even though transportation charges thereon are unpaid.

6.1 For cargo accepted for carriage, the Warsaw Convention and the Montreal Convention permit shipper to increase the limitation of liability by declaring a higher value for carriage and paying a supplemental charge if required.
6.2 In carriage to which neither the Warsaw Convention nor the Montreal Convention applies Carrier shall, in accordance with the procedures set forth in its general conditions of carriage and applicable tariffs, permit shipper to increase the limitation of liability by declaring a higher value for carriage and paying a supplemental charge if so required.

7.1 In cases of loss of, damage or delay to part of the cargo, the weight to be taken into account in determining Carrier's limit of liability shall be only the weight of the package or packages concerned.
7.2 Notwithstanding any other provisions, for "foreign air transportation" as defined by the U.S. Transportation Code:
7.2.1 in the case of loss of, damage or delay to a shipment, the weight to be used in determining Carrier's limit of liability shall be the weight which is used to determine the charge for carriage of such shipment; and
7.2.2 in the case of loss of, damage or delay to a part of a shipment, the shipment weight in 7.2.1 shall be prorated to the packages covered by the same air waybill whose value is affected by the loss, damage or delay. The weight applicable in the case of loss or damage to one or more articles in a package shall be the weight of the entire package.

8. Any exclusion or limitation of liability applicable to Carrier shall apply to Carrier's agents, employees, and representatives and to any person whose aircraft or equipment is used by Carrier for carriage and such person's agents, employees and representatives.

9. Carrier undertakes to complete the carriage with reasonable dispatch. Where permitted by applicable laws, tariffs and government regulations, Carrier may use alternative carriers, aircraft or modes of transport without notice but with due regard to the interests of the shipper. Carrier is authorized by the shipper to select the routing and all intermediate stopping places that it deems appropriate or to change or deviate from the routing shown on the face hereof.

10. Receipt by the person entitled to delivery of the cargo without complaint shall be prima facie evidence that the cargo has been delivered in good condition and in accordance with the contract of carriage.
10.1 In the case of loss of, damage or delay to cargo a written complaint must be made to Carrier by the person entitled to delivery. Such complaint must be made:
10.1.1 in the case of damage to the cargo, immediately after discovery of the damage and at the latest within 14 days from the date of receipt of the cargo;
10.1.2 in the case of delay, within 21 days from the date on which the cargo was placed at the disposal of the person entitled to delivery.
10.1.3 in the case of non-delivery of the cargo, within 120 days from the date of issue of the air waybill, or if an air waybill has not been issued, within 120 days from the date of receipt of the cargo for transportation by the Carrier.
10.2 Such complaint may be made to the Carrier whose air waybill was used, or to the first Carrier or to the last Carrier or to the Carrier, which performed the carriage during which the loss, damage or delay took place.
10.3 Unless a written complaint is made within the time limits specified in 10.1 no action may be brought against Carrier.
10.4 Any rights to damages against Carrier shall be extinguished unless an action is brought within two years from the date of arrival at the destination, or from the date on which the aircraft ought to have arrived, or from the date on which the carriage stopped.

11. Shipper shall comply with all applicable laws and government regulations of any country to or from which the cargo may be carried, including those relating to the packing, carriage or delivery of the cargo, and shall furnish such information and attach such documents to the air waybill as may be necessary to comply with such laws and regulations. Carrier is not liable to shipper and shipper shall indemnify Carrier for loss or expense due to shipper's failure to comply with this provision.

12. No agent, employee or representative of Carrier has authority to alter, modify or waive any provisions of this contract.`;

    const noticeSections = noticeText.trim().split(/\n\s*\n/);
    const introParagraph = noticeSections[0].trim();
    const remainingText = noticeSections.slice(1).join('\n\n').trim();

    const fullWidth = pageWidth - marginX * 2;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(fontSize);

    const introLines = doc.splitTextToSize(introParagraph, fullWidth);
    let columnStartY = startY + lineHeight * 0.5;
    doc.text(introLines, marginX, columnStartY, { align: "left" });
    columnStartY += introLines.length * lineHeight + (fontSize * 1.15);

    let noticeTextForColumns = remainingText;
    if (noticeTextForColumns.startsWith('CONDITIONS OF CONTRACT')) {
        const heading = 'CONDITIONS OF CONTRACT';
        doc.setFont("Helvetica", "bold");
        doc.text(heading, pageWidth / 2, columnStartY, { align: "center" });
        columnStartY += lineHeight + (fontSize * 0.5);
        doc.setFont("Helvetica", "normal");
        noticeTextForColumns = noticeTextForColumns.slice(heading.length).trim();
    }

    // Vertical column divider starts after the heading and introductory paragraph
    const dividerX = col1X + colWidth + columnGap / 2;
    doc.setLineWidth(0.2);
    doc.line(dividerX, columnStartY, dividerX, pageHeight - marginBottom);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(fontSize);

    const BOLD_PREFIXES = [
        'CONDITIONS OF CONTRACT',
    ];

    // Build flat list of drawable entries
    const flatEntries = [];
    const blankHeight = lineHeight;
    const rawLines = noticeTextForColumns.split('\n');
    for (let index = 0; index < rawLines.length; index++) {
        const para = rawLines[index];
        const trimmed = para.trim();
        if (!trimmed) {
            flatEntries.push({ isBlank: true });
            continue;
        }
        const isBold = BOLD_PREFIXES.some((p) => trimmed.startsWith(p));
        doc.setFont('Helvetica', isBold ? 'bold' : 'normal');
        const wrapped = doc.splitTextToSize(trimmed, colWidth);
        for (const line of wrapped) {
            flatEntries.push({ text: line, isBold });
        }

        const nextTrimmed = rawLines[index + 1]?.trim();
        const isNumberedPoint = /^\d+(?:\.\d+)*\b/.test(trimmed);
        const isUppercaseHeading = /^[A-Z][A-Z\s()']*$/.test(trimmed);
        if ((isNumberedPoint || isUppercaseHeading) && nextTrimmed) {
            flatEntries.push({ isBlank: true });
        }
    }

    // Balance columns by height
    const totalHeight = flatEntries.reduce(
        (sum, e) => sum + (e.isBlank ? blankHeight : lineHeight),
        0
    );
    const halfHeight = totalHeight / 2;
    let runningHeight = 0;
    let splitIdx = flatEntries.length;
    for (let i = 0; i < flatEntries.length; i++) {
        const h = flatEntries[i].isBlank ? blankHeight : lineHeight;
        if (runningHeight + h > halfHeight) {
            splitIdx = i;
            break;
        }
        runningHeight += h;
    }
    const col1Entries = flatEntries.slice(0, splitIdx);
    const col2Entries = flatEntries.slice(splitIdx);

    // Render column 1
    doc.setFontSize(fontSize);
    let y = columnStartY;
    for (const entry of col1Entries) {
        if (entry.isBlank) { y += blankHeight; continue; }
        doc.setFont('Helvetica', entry.isBold ? 'bold' : 'normal');
        doc.text(entry.text, col1X, y);
        y += lineHeight;
    }

    // Render column 2
    y = columnStartY;
    for (const entry of col2Entries) {
        if (entry.isBlank) { y += blankHeight; continue; }
        doc.setFont('Helvetica', entry.isBold ? 'bold' : 'normal');
        doc.text(entry.text, col2X, y);
        y += lineHeight;
    }
}
