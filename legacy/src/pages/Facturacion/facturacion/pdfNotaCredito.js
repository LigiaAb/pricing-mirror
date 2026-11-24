import jsPDF from "jspdf";
import image from "../../../assets/logo-cropa-dsv-1024x205.png";
import NumeroALetras from "../../../utils/numeroALetras";


const pdfNotaCredito = (pdfData, pdfItems = []) => {

    const doc = new jsPDF(pdfData.horizontal ? "l" : "p", pdfData.tamano || "pt", pdfData.format || "a4");

    const margins = {
            top: 330,
            bottom:40,
            left:40,
            width:460
        }

    let subTotalMonto = 0;
    let totalMonto = 0;
    let totalQuetzales = 0;

    const header = () => {

        doc.addImage(image, 'PNG', 45, 40, 25 * 6.5, 5 * 6.5); // Ajusta la posición y tamaño

        doc.setFontSize(7);
        doc.text("Cropa Sociedad Anonima", 55, 85);
        doc.text("Exclusive Agent of DSV Air & Sea Holding A/S", 55, 95)
        doc.text("3a. calle 6-70 Zona 13 Pamplona, Guatemala", 55, 105)
        doc.text("Teléfono: (502) 2259-0600", 55, 115);
        doc.text("informacion@cropa.com.gt", 55, 125);

        doc.setFont("Helvetica", "bold")
        doc.setFontSize(12);
        doc.text("NOTA DE CREDITO / CREDIT NOTE", 360, 60)

        doc.setFontSize(9);
        doc.text("Fecha / Date:", 415, 75)
        doc.text("NI / Internal Number: ", 415, 85)
        doc.text("Moneda / Currency: ", 415, 95)

        doc.text("N. Fiscal / Fiscal Number: ", 55, 195)
        doc.text("Razon Social / Name: ", 55, 210)
        doc.text("Direccion / Address: ", 55, 225)
        doc.text("Embarque / Vessel: ", 55, 255)
        doc.text("Identificacion Fiscal / TAX ID: ", 55, 270)

        doc.setTextColor("#FFFFFF")

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b")
        doc.rect(55, 300, 520, 20, "F")
        doc.text("Servicio / Service ", 80, 313)
        doc.text("Valor / Amount ", 540, 313, { align: "right" })

        doc.setTextColor("#000")
        doc.setDrawColor("#000");
        doc.setFillColor("#000")
        doc.rect(55, 570, 520, 22)
        doc.text("TOTAL DE CARGOS / TOTAL CHARGES", 60, 580)
        doc.rect(55, 594, 350, 60)
        doc.text("Observacion / Observation ",60,604)
        doc.rect(408, 594, 167, 15)
        doc.line(491,594,491,609)
        doc.text("SUBTOTAL: ",413,605)
        doc.rect(408, 612, 167, 15)
        doc.line(491,612,491,627)
        doc.text("ITBMS / TAX: ",413,622)
        doc.rect(408, 630, 167, 24)
        doc.line(491,630,491,654)
        doc.text("TOTAL",413,645)
        doc.rect(55, 656, 520, 22)
        doc.text("MOTIVO DE ANULACION / REASON CANCELLATION: ",60,670)




        const drawCustomPatternLine = (startX, startY, endX) => {
            
            const segmentLength = 25; // longitud de cada línea larga
            const dotSpacing = 2;     // espacio entre puntos
            const dotCountPattern = [1, 2, 3]; // patrón de puntos
            let x = startX;

            while (x < endX) {
                // Dibuja línea larga
                doc.line(x, startY, x + segmentLength, startY);
                x += segmentLength + dotSpacing;

                // Dibuja puntos según el patrón
                for (let dots of dotCountPattern) {
                    for (let i = 0; i < dots; i++) {
                        doc.circle(x, startY, 0.5, 'F'); // punto pequeño
                        x += dotSpacing;
                    }
                    // Después de cada grupo de puntos, dibuja otra línea larga
                    if (x + segmentLength < endX) {
                        doc.line(x, startY, x + segmentLength, startY);
                        x += segmentLength + dotSpacing;
                    }
                }
            }
        };

        drawCustomPatternLine(55,680,565)

        doc.rect(55,683,520,13)
        doc.text("Emitido por / issued by: ",60,692)


        doc.setFont("Helvetica", "normal")

        doc.text(`${pdfData.fecha}`,560,75, {align:"right"})
        doc.text(`${pdfData.internalNumber}`,560,85, {align:"right"})
        doc.text(`${pdfData.moneda}`,560,95, {align:"right"})

        doc.text(`${pdfData.fiscalNumber}`,185,195)
        doc.text(`${pdfData.razonSocial}`,185,210)
        doc.text(`${pdfData.direccion}`,185,225)
        doc.text(`${pdfData.vessel}`,145,255)
        doc.text(`${pdfData.taxId}`,185,270)

        const lines = doc.splitTextToSize(`${pdfData.observaciones}`,320)
        doc.text(lines,70,614)

        doc.text(`${pdfData.motivoAnulacion}`,295,670)
        doc.text(`${pdfData.emitidoPor}`,170,692)




    }

    const credito = () => {

        const addItemsToDoc = () => {

            let startY = 330;
            const rowHeight = 15;
            const rectWidth = 520; // ancho de la tabla
            const rectX = 55; // posición X inicial




            doc.setTextColor("#000")

            pdfItems.forEach((item, index) => {

                if (index % 2 === 0) {
                    doc.setFillColor(230, 230, 230); // gris claro
                    doc.rect(rectX, startY - 10, rectWidth, rowHeight, "F"); // dibuja el rectángulo
                }

                doc.text(`${item.rubro}`, 80, startY);
                doc.text(`${item.monto.toFixed(2)}`, 540, startY, { align: "right" })
                startY += rowHeight;

                subTotalMonto += item.monto;

                if (startY >= 555) {
                        doc.addPage();
                        header();
                        startY = margins.top;
                    }

            });
            
            doc.text(`${subTotalMonto.toFixed(2)}`, 555, 605, { align: "right" })
            
            totalMonto = pdfData.tax + subTotalMonto;
            doc.text(`${pdfData.tax.toFixed(2) || 0}`, 555, 622,{ align: "right" })

            doc.text(`${totalMonto.toFixed(2)}`,555,645,{ align: "right" })

            const totalEnLetras = NumeroALetras(totalMonto, "DOLAR", "DOLARES")
            doc.setFontSize(9);
            const textoLetras = doc.splitTextToSize(`${totalEnLetras}`, 500);
            doc.text(textoLetras, 100, 590);

        }

        addItemsToDoc()
    }


    header();
    credito();



    return doc.output("datauristring");

}

export default pdfNotaCredito;