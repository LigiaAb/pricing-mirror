import jsPDF from "jspdf";
import image from "../../../assets/logo-cropa-dsv-1024x205.png";
import NumeroALetras from "../../../utils/numeroALetras";
import moment from "moment";



const pdfNotaDebito = (pdfData, pdfItems = []) => {

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
        doc.text("FACTURA / INVOICE", 450, 60)

        doc.setFontSize(9);
        doc.text("Fecha / Date:", 415, 75)
        doc.text("NI / Internal Number: ", 415, 85)
        doc.text("Moneda / Currency: ", 415, 95)

        doc.text("N. Fiscal / Fiscal Number: ", 55, 155)
        doc.text("Razon Social / Name: ", 55, 170)
        doc.text("Direccion / Address: ", 55, 192)
        doc.text("Identificacion Fiscal / TAX ID: ", 55, 230)
        doc.text("Embarque / Vessel: ", 55, 240)
        doc.text("Fecha de Llegada / Arrival Date: ", 55, 250)
        doc.text("Cliente / Client: ", 55, 260)
        doc.text("Encargado / In charge: ",55,270)
        doc.text("Contenedor / Container: ", 55, 280)


        doc.setTextColor("#FFFFFF")

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b")
        doc.rect(55, 300, 520, 20, "F")
        doc.text("Servicio / Service ", 80, 313)
        doc.text("Valor / Amount ", 540, 313, { align: "right" })

        doc.setTextColor("#000")
        doc.setDrawColor("#000");
        doc.setFillColor("#000")
        doc.rect(55, 540, 520, 22)
        doc.text("TOTAL DE CARGOS / TOTAL CHARGES", 60, 550)
        doc.rect(55, 564, 350, 41)
        doc.text("Observacion / Observation ",60,574)
        doc.rect(408, 564, 167, 10)
        doc.line(491,564,491,574)
        doc.text("SUBTOTAL: ",413,572)
        doc.rect(408, 577, 167, 10)
        doc.line(491,577,491,587)
        doc.text("ITBMS / TAX: ",413,585)
        doc.rect(408, 590, 167, 15)
        doc.line(491,590,491,605)
        doc.text("TOTAL",413,600)
        doc.rect(55, 607, 520, 10)
        // doc.text("MOTIVO DE ANULACION / REASON CANCELLATION: ",60,670)

        const drawCustomPatternLine = (startX, startY, endX) => {
            
            const startYLine = 619;
            const segmentLength = 25; // longitud de cada línea larga
            const dotSpacing = 2;     // espacio entre puntos
            const dotCountPattern = [1, 2, 3]; // patrón de puntos
            let x = startX;

            while (x < endX) {
                // Dibuja línea larga
                doc.line(x, startYLine, x + segmentLength, startYLine);
                x += segmentLength + dotSpacing;

                // Dibuja puntos según el patrón
                for (let dots of dotCountPattern) {
                    for (let i = 0; i < dots; i++) {
                        doc.circle(x, startYLine, 0.5, 'F'); // punto pequeño
                        x += dotSpacing;
                    }
                    // Después de cada grupo de puntos, dibuja otra línea larga
                    if (x + segmentLength < endX) {
                        doc.line(x, startYLine, x + segmentLength, startYLine);
                        x += segmentLength + dotSpacing;
                    }
                }
            }
        };

        drawCustomPatternLine(55,680,565)

        doc.rect(55,622,520,18)
        doc.text("Address: ",60,650)
        doc.text("Intermediary Swift: ",60,670)
        doc.text("Intermediary Bank account number: ",60,680)
        doc.rect(55,642,258,45) //1 de 2
        doc.text("Benefiaciary Bank Swift:  ",320,650)
        doc.text("Beneficiary Bank Name: ",320,660)
        doc.text("Account: ",320,670)
        doc.text("Benefiaciary Name: ",320,680)
        doc.rect(315,642,260,45) // 2 de 2
        doc.text("Enviar aviso de pago a / Send payment advice to: ",60,698)
        doc.rect(55,690,520,10)
        doc.text("Referencia de pago / payment reference: ",60,710)
        doc.rect(55,702,258,10) //1 de 4
        doc.text("Monto a pagar / Amount to pay: ", 320,710)
        doc.rect(315,702,260,10) //2 de 4
        doc.text("Emitido por / Issued By: ",60,722)
        doc.rect(55 ,714,258,10) //3 de 4
        doc.text("Monto facturado / Invoiced amount: ",320,722)
        doc.rect(315,714,260,10) //4 de 4


        doc.setFont("Helvetica", "normal")

        
        doc.text(`${moment(pdfData.fecha).format("DD/MM/YYYY")}`,560,75, {align:"right"})
        doc.text(`${pdfData.internalNumber}`,560,85, {align:"right"})
        doc.text(`${pdfData.moneda}`,560,95, {align:"right"})

        doc.text(`${pdfData.fiscalNumber}`,170,155)
        doc.text(`${pdfData.razonSocial}`,155,170)
        doc.text(`${pdfData.direccion}`,155,192)

        doc.text(`${pdfData.taxId}`,185,230)
        doc.text(`${pdfData.vessel}`,145,240)
        doc.text(`${pdfData.fechaLlegada}`,195,250)
        doc.text(`${pdfData.cliente}`,135,260)
        doc.text(`${pdfData.encargado}`,155,270)
        doc.text(`${pdfData.contenedor}`,165,280)


        const lines = doc.splitTextToSize(`${pdfData.observaciones}`,200)
        doc.text(lines,65,589);

        const lines2 = doc.splitTextToSize(`${pdfData.direccionBancoOrigen}`,200)
        doc.text(lines2, 110,650)

        doc.text(`${pdfData.intermediarySwiftBancoOrigen}`,145,670)
        doc.text(`${pdfData.bankAccountNumberBancoOrigen}`,220,680)

        doc.text(`${pdfData.beneficiaryBankSwiftBancoDestino}`,430,650)
        doc.text(`${pdfData.beneficiaryBankNameBancoDestino}`,430,660)
        doc.text(`${pdfData.accountBancoDestino}`,430,670)
        doc.text(`${pdfData.beneficiaryNameBancoDestino}`,430,680)

        doc.text(`${pdfData.enviarAvisoDePago}`,275,698)
        doc.text(`${pdfData.referenciaPago}`,235,710)
        doc.text(`${pdfData.emitidoPor}`,165,722)




    }

     const debito = () => {

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

                if (startY >= 540) {
                        doc.addPage();
                        header();
                        startY = margins.top;
                    }

            });
            
            doc.text(`${subTotalMonto.toFixed(2)}`, 555, 572, { align: "right" })
            
            totalMonto = pdfData.tax + subTotalMonto;
            doc.text(`${pdfData.tax.toFixed(2) || 0}`, 555, 585,{ align: "right" })

            doc.text(`${totalMonto.toFixed(2)}`,555,600,{ align: "right" })

            const totalEnLetras = NumeroALetras(totalMonto, "DOLAR", "DOLARES")
            doc.setFontSize(9);
            const textoLetras = doc.splitTextToSize(`${totalEnLetras}`, 500);
            doc.text(textoLetras, 100, 560);

            doc.text(`${totalMonto.toFixed(2)}`,510,710,{ align: "right" })
            doc.text(`${totalMonto.toFixed(2)}`,510,722,{ align: "right" })


        }

        addItemsToDoc()
    }





    header();
    debito();




    return doc.output("datauristring");

}

export default pdfNotaDebito;