import React, { useState } from 'react';
import jsPDF from 'jspdf';
import image from "../assets/logo-cropa-dsv-1024x205.png";

const reciboPdf = (pdfData, pdfItems = [], opcionales = []) => {

    const doc = new jsPDF(pdfData.horizontal ? "l" : "p", "pt", pdfData.tamano || "letter");
    
    const header = () => {
        
        doc.addImage(image, 'PNG', 25, 60, 25 * 6.5, 5 * 6.5); // Ajusta la posición y tamaño
        
        // doc.setFontSize(8);
        
        doc.setFontSize(8);
        doc.text("3a. Calle 6-70 Zona 13 Pamplona", 306, 25, { align: "center" });
        doc.text("PBX: 3474-9000 / 2259-0600 FAX: 2472-3413", 306, 40, { align: "center" });
        doc.text("GUATEMALA, 02 DE DICIEMBRE DE 2025", 570, 85, { align: "right" });

        doc.setFontSize(11);
        doc.text("RECIBO DE CAJA:", 525, 50, { align: "center" });

        doc.setFont("helvetica", "bold"); // Cambiar la fuente a negrita
        doc.text("RECIBIMOS DE:",30, 150);
        doc.text("LA CANTIDAD DE:",30, 200);
        doc.text("POR CONCEPTO DE:",30, 250);
        
        doc.setFont("helvetica", "normal"); // Cambiar la fuente a normal
        doc.text(`${pdfData.recibimosDe || ""}`, 130, 150);
        
        const montoEnLetras = doc.splitTextToSize(pdfData.cantidadDe, 400);
        doc.text(montoEnLetras, 130, 200);

        const conceptoEnLetras = doc.splitTextToSize(pdfData.porConceptoDe, 400);
        doc.text(conceptoEnLetras, 145, 250);





        doc.setFontSize(15);
        doc.setFont("helvetica", "bold"); // Cambiar la fuente a negrita

        doc.text(`${pdfData.reciboCaja || ""}`, 575, 70, { align: "right" });

        doc.setFontSize(25);
        doc.text(`Q ${pdfData.monto?.toFixed(2) || "0.00"}`, 540, 330, { align: "right" });









    }

    header();

        return doc.output("datauristring");

}
export default reciboPdf;