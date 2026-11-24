import jsPDF from "jspdf";
import image from "../../../assets/logo-cropa-dsv-1024x205.png";
import { add } from "date-fns";
import { far } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { bottomNavigationActionClasses } from "@mui/material";
import NumeroALetras from "../../../utils/numeroALetras";
import moment from "moment";


const pdfFactura = (pdfData, pdfItems = []) => {

    const doc = new jsPDF(pdfData.horizontal ? "l" : "p", pdfData.tamano || "pt", pdfData.format || "a4");

    const margins = {
        top: 290,
        bottom: 40,
        left: 40,
        width: 460
    }
    let totalMonto = 0;
    let totalQuetzales = 0;
    let importeGravado15 = 0.15;
    let importeGravado18 = 0.18;
    let isv15=0.15;
    let isv18 = 0.18;
    let totalHonduras = 0;
    let totalImportes = 0; 
    let totalLempiras = 0;


    const header = () => {

        doc.addImage(image, 'PNG', 35, 40, 25 * 6.5, 5 * 6.5); // Ajusta la posición y tamaño

        doc.setFontSize(10);
        doc.setTextColor("#00205b");
        doc.text("NIT: 327955-3", 40, 95);
        doc.setFontSize(8);
        doc.text("Régimen FEL", 40, 110);
        doc.text("Documento Tributario Electronico", 40, 120);

        doc.setFontSize(7);
        doc.text("Cropa Sociedad Anonima", 395, 45);
        doc.text("3a. calle 6-70 Zona 13 Pamplona, Guatemala", 395, 55)
        doc.text("Teléfono: (502) 2259-0600", 395, 65);
        doc.text("informacion@cropa.com.gt", 395, 75);
        doc.text("Serie: ", 395, 110)
        doc.text("Numero: ", 395, 120)
        doc.text(`${pdfData.serie || ""}`, 430, 110)
        doc.text(`${pdfData.numero || ""}`, 430, 120)

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b")
        doc.setFontSize(10);

        doc.roundedRect(395, 85, 165, 15, 7, 7, "F")
        doc.setTextColor("#FFFFFF");

        doc.setFillColor("#00205b")
        doc.setTextColor("#00205b");
        doc.roundedRect(40, 125, 520, 90, 5, 5)

        doc.rect(395, 125, 0.7, 25, "F");//linea vertical  
        doc.rect(40, 150, 520, 0.5, "F");
        doc.rect(40, 180, 520, 0.5, "F");

        doc.text("FECHA: ", 45, 140)
        doc.text("NIT: ", 405, 140)
        doc.text("NOMBRE: ", 45, 163)
        doc.text("DIRECCION: ", 45, 193)

        doc.text("Identificacion Fiscal / TAX ID: ", 45, 235)
        doc.text("Embarque / Vessel: ", 45, 250)
        doc.text("Fecha de Llegada / Arrival Date: ", 45, 265)
        doc.text("Cliente / Client: ", 45, 280)
        doc.text("Encargado / in Charge: ", 45, 295)
        doc.text("Contenedor / Container: ", 45, 310)




        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b")

        doc.roundedRect(40, 345 - 10, 520, 30, 5, 5, "F")
        doc.roundedRect(40, 355 - 10, 520, 280, 5, 5)
        doc.line(470, 355 - 10, 470, 635 - 10)
        doc.roundedRect(40, 635 - 10, 365, 25, 5, 5)
        doc.roundedRect(405, 635 - 10, 65, 25, 5, 5, "F")
        doc.roundedRect(470, 635 - 10, 90, 25, 5, 5)


        doc.setDrawColor("#FFFFFF");
        doc.setTextColor("#FFFFFF");
        doc.setFillColor("#FFFFFF")
        doc.line(470, 345 - 10, 470, 375 - 10)
        doc.setFont("Helvetica", "bold")

        doc.text("FACTURA", 477.5, 95, { align: "center" });
        doc.text("DESCRIPCION", 255, 365 - 10, { align: "center" });
        doc.text("TOTAL", 515, 365 - 10, { align: "center" });
        doc.text("TOTAL", 435, 651 - 10, { align: "center" });

        doc.setFont("Helvetica", "normal")

        doc.setDrawColor("#00205b");
        doc.setFillColor("#00205b")
        doc.setTextColor("#00205b");

        doc.text("*AGENTE DE RETENCION DEL IVA*", 255, 570 - 10, { align: "center" })
        doc.text("*SUJETO A PAGO TRIMESTRALES*", 255, 580 - 10, { align: "center" })

        doc.setFontSize(8);

        doc.text("SERVICIOS LOCALES DE IMPORTACION 2024", 45, 610 - 10)
        
        
        doc.setFontSize(7);
        doc.text("Esta factura se considera cancelada unicamente si esta acompañada del recibo de caja correspondiente ", 45, 625 - 10)
        doc.text("Total en letras: ", 45, 645 - 10)
        
        doc.setFontSize(10);

        doc.text(`${moment(pdfData.fecha).format("DD/MM/YYYY")}`, 100, 140);
        doc.text(`${pdfData.nit || ""}`, 425, 140);
        doc.text(`${pdfData.nombre || ""}`, 100, 163);

        doc.text(`${pdfData.taxId}`, 180, 235)
        doc.text(`${pdfData.embarque}`, 140, 250)
        doc.text(`${pdfData.fechaLlegada}`, 190, 265)
        doc.text(`${pdfData.cliente}`, 120, 280)
        doc.text(`${pdfData.encargado}`, 150, 295)
        doc.text(`${pdfData.contenedor}`, 155, 310)
        
        const lines = doc.splitTextToSize(`${pdfData.direccion || ""}`, 410);
        doc.text(lines, 110, 193);
        
        doc.setFontSize(8);
        
        
    }
    
    const footer = () => {
        if (pdfData.codPais === 1) {
            
            doc.text(`TIPO DE CAMBIO: Q7.760000 * USD$ 1.00 VALOR TOTAL EN  `, 45, 600 - 10)
            doc.roundedRect(40, 650, 520, 35, 5, 5)
            doc.roundedRect(40, 685, 520, 20, 5, 5)

            doc.text("AUTORIZACION: ", 45, 663)
            doc.text("CERTIFICADOR: ", 45, 678)
            doc.text("Fecha y hora de certificacion (autorizacion del documento): ", 45, 698)

            doc.text(`${pdfData.autorizacion}`, 110, 663)
            doc.text(`${pdfData.certificador} NIT: ${pdfData.nitCertificador}`, 110, 678)

            doc.text("HECHO POR: ",50,750)
            doc.text("AUTORIZADO POR: ",250,750)
            doc.text(`${pdfData.hechoPor}`,105,750)
            doc.text(`${pdfData.autorizadoPor}`,325,750)


            if (pdfData.autorizado === true) {
                doc.text(`${moment(pdfData.fechaAutorizado).format("DD/MM/YYYY")}`, 260, 698)
            }


        } else if (pdfData.codPais === 2) {

            doc.roundedRect(40, 650, 520, 75, 5, 5)
            doc.text(`TIPO DE CAMBIO: HNL 23.33 * USD$ 1.00 VALOR TOTAL EN  `, 45, 600 - 10)

            
            doc.setFontSize(7);
            doc.text("AUTORIZACION: ", 45, 663)
            doc.text("CERTIFICADOR: ", 45, 688)
            doc.text("Fecha y hora de certificacion (autorizacion del documento): ", 45, 702)

            doc.text(`${pdfData.autorizacion}`, 55, 673)
            doc.text(`${pdfData.certificador} NIT: ${pdfData.nitCertificador}`, 100, 688)

            if (pdfData.autorizado === true) {
                doc.text(`${pdfData.fechaAutorizado}`, 55, 712)
            }
            doc.line(250, 650, 250, 725)


            doc.text("IMPORTE EXONERADO  ", 260, 660)
            doc.text("VALOR EXENTO   ", 260, 670)
            doc.text("IMPORTE GRAVADO 15% ", 260, 680)
            doc.text("IMPORTE GRAVADO 18% ", 260, 690)
            doc.text("ISV 15% ", 260, 700)
            doc.text("ISV 18% ", 260, 710)
            doc.text("TOTAL A PAGAR ", 260, 720)

            doc.line(470, 650, 470, 725)

            doc.text("HECHO POR: ",50,750)
            doc.text("AUTORIZADO POR: ",250,750)
            doc.text(`${pdfData.hechoPor}`,100,750)
            doc.text(`${pdfData.autorizadoPor}`,320,750)


        }

    }

    const factura = () => {

        const addItemsToDoc = () => {

            let startY = 380;
            const moneda = pdfItems[0]?.moneda ?? "";


            pdfItems.forEach((item) => {
                const maxWidth = 400 < margins.width ? 400 : margins.width;
                doc.setFontSize(9);

                if (item.rubro) {
                    const texto = doc.splitTextToSize(item.rubro, maxWidth);
                    texto.forEach((line) => {
                        doc.text(line, 55, startY);
                        startY += 15;
                    })

                } else {
                    startY += 15;
                }

                doc.text(`${item.moneda}`, 475, startY - 15)
        doc.text(`moneda: ${item.moneda}`, 405, 338 - 10)

                doc.text(`${item.monto ? item.monto.toFixed(2) : ''}`, 555, startY - 15, { align: "right" });
                totalMonto += item.monto;
                totalQuetzales = totalMonto * 7.76
                totalLempiras = totalMonto * 26.33

                if (startY >= 560) {
                    doc.addPage();
                    header();
                    footer();
                    startY = margins.top;
                }
            });
            
            if(pdfData.codPais === 2){
                
                if (pdfData.importe15 === true && pdfData.importe18 === false){
                    
                    doc.text(`${pdfData.valorExonerado || "--"}`,480,660)
                    doc.text(`${pdfData.valorExento || "--"}`,480,670)
                    
                    totalImportes = importeGravado15 * totalMonto;
                    doc.text(`${totalMonto.toFixed(2)}`,480,680)
                    doc.text(`${totalImportes.toFixed(2)}`,480, 700)
                    doc.text("--",480,690)
                    doc.text("--",480,710)
                    totalHonduras = totalMonto + totalImportes +pdfData.valorExonerado +pdfData.valorExento
                    doc.text(`${totalHonduras.toFixed(2)}`,480,720)
                    doc.text(`$ ${totalMonto.toFixed(2)}`, 555, 641, { align: "right" })
                    doc.setFontSize(8);
                    doc.text(`HNL ${totalLempiras.toFixed(2)}`, 275, 590)
                    const totalEnLetras = NumeroALetras(totalHonduras, "DOLAR", "DOLARES")
                    doc.setFontSize(7);
                    const textoLetras = doc.splitTextToSize(`${totalEnLetras}`, 280);
                    doc.text(textoLetras, 100, 635);

                } else if(pdfData.importe15 === false && pdfData.importe18 === true){

                    doc.text(`${pdfData.valorExonerado || "--"}`,480,660)
                    doc.text(`${pdfData.valorExento || "--"}`,480,670)

                    totalImportes = importeGravado18 * totalMonto;
                    doc.text(`${totalMonto.toFixed(2)}`,480,690)
                    doc.text(`${totalImportes.toFixed(2)}`,480, 710)
                    doc.text("--",480,680)
                    doc.text("--",480,700)
                    totalHonduras = totalMonto + totalImportes +pdfData.valorExonerado +pdfData.valorExento
                    doc.text(`${totalHonduras.toFixed(2)}`,480,720)
                    doc.text(`$ ${totalMonto.toFixed(2)}`, 555, 641, { align: "right" })
                    doc.setFontSize(8);
                    doc.text(`HNL ${totalLempiras.toFixed(2)}`, 275, 590)
                    const totalEnLetras = NumeroALetras(totalHonduras, "DOLAR", "DOLARES")
                    doc.setFontSize(7);
                    const textoLetras = doc.splitTextToSize(`${totalEnLetras}`, 280);
                    doc.text(textoLetras, 100, 635);

                }

            }

            if(pdfData.codPais === 1){

            doc.text(`${moneda} ${totalMonto.toFixed(2)}`, 555, 641, { align: "right" })
            doc.setFontSize(8);
            doc.text(`Q ${totalQuetzales.toFixed(2)}`, 275, 590)
            const totalEnLetras = NumeroALetras(totalMonto, "DOLAR", "DOLARES")
            doc.setFontSize(7);
            const textoLetras = doc.splitTextToSize(`${totalEnLetras}`, 280);
            doc.text(textoLetras, 100, 635);
            }



        }

        addItemsToDoc();

    }


    header();
    footer();
    factura();

    return doc.output("datauristring");


}


export default pdfFactura;