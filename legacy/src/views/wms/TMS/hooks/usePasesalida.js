import React, { useCallback, useEffect, useState } from 'react'
import { jsPDF } from "jspdf";
import jspdfBarcode from "jspdf-barcode";
import { api } from '@/api'
const usePasesalida = () => {
    const [pilotos, setPilotos] = useState([])
    const [pasesSalidas, setPasesSalidas] = useState([])

    const obtenerPasesSalidas = useCallback(async()=>{
        const {data} = await api.get('/api/appweb/listar-pasessalidas')
        setPasesSalidas(data.data.map((ifo)=>{
            return{
                ...ifo,
                accionesDeTabla: {
                    add: false,
                    view: false,
                    go: false,
                    copy: false,
                    paste: false,
                    auth: false,
                    edit: false,
                    excel: false,
                    pdf: true,
                    download: false,
                    delete: true,
                },
            }
        }))
    },[])

    const getPilotos = useCallback(async()=>{
    
        const {data} =await api.get('/api/appweb/listar-pilotos')
        setPilotos(data.data)
    },[])

    const crearPase = useCallback(async(datos)=>{
        const {data} =await  api.post("/api/appweb/crear-pase",datos)
    },[])
    
    const valideSolicitud  = useCallback(async(solicitud_id)=>{
        const {data} = await api.get("/api/appweb/validar-solicitudsal",{
            params:{
                solicitud_id:solicitud_id
            }
        })
        return data.data
    },[])

    // Funciones para generar pdf
 function generarPDF(datos) {
    console.log(datos)
    const doc = new jsPDF('p', 'pt', 'letter'); 
    
    const alignRight = 570; 
    const marginX = 40;     
    // ================================================================
    // ====================== PÁGINA 1: DESPACHO ======================
    // ================================================================
    
    // HEADER
    doc.setFont("helvetica", "bold");
    doc.setTextColor(11, 31, 99); 
    doc.setFontSize(22);
    doc.text("CROPA | DSV", marginX, 50);
    
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("www.grupocropa.com", alignRight, 30, { align: "right" });
    doc.text(datos.almacen_nom, alignRight, 40, { align: "right" });
    doc.text(datos.almacen_direccion, alignRight, 50, { align: "right", maxWidth:300});
    doc.text(`Tel : (${datos.almacen_telefonoprefijo}) ${datos.almacen_telefono}`, alignRight, 70, { align: "right" });
    // BARCODE
    const barcodeData = `${datos.pase_id}`;
    jspdfBarcode(doc, barcodeData, {
        x: 180,              
        y: 100,               
        fontSize: 24,        
        textColor: "#000000",
    });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    // TÍTULO Y FECHA
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DESPACHO DE MERCADERIA", marginX, 160);
    doc.setLineWidth(1);
    doc.line(marginX, 162, 230, 162); 
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("17/04/26   14:42:26", alignRight, 160, { align: "right" });
    // CUERPO PRINCIPAL
    let startY = 190;
    let lineSpacing = 22;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("SE PRESENTÓ EN OFICINAS DEL CENTRO DE DISTRIBUCIÓN CROPA", marginX, startY);
    
    startY += lineSpacing;
    doc.setFont("helvetica", "bold");
    doc.text("FECHA:", marginX, startY);
    doc.setFont("helvetica", "normal");
    doc.text("Viernes 27 de Marzo de 2026 a las 00:00 Horas", 90, startY);
    
    startY += lineSpacing;
    doc.setFont("helvetica", "bold");
    doc.text("EL PILOTO:", marginX, startY);
    doc.setFont("helvetica", "normal");
    doc.text("HECTOR RIVERA", 120, startY);
    
    startY += lineSpacing;
    doc.setFont("helvetica", "bold");
    doc.text("PARA CARGAR MERCADERÍA DE LA CUENTA:", marginX, startY);
    doc.setFont("helvetica", "normal");
    doc.text("CLARO SAP", 330, startY);
    
    startY += lineSpacing;
    doc.setFont("helvetica", "bold");
    doc.text("AMPARADO CON DOCUMENTO", marginX, startY);
    doc.setFont("helvetica", "normal");
    doc.text("SPSCLARO270326-S4901402565", 230, startY);
    
    startY += 15;
    doc.setLineWidth(0.5);
    doc.line(marginX, startY, alignRight, startY);
    // VEHÍCULOS
    startY += 20;
    doc.setFont("helvetica", "bold");
    doc.text("VEHICULOS A PRESENTAR EN RAMPA", marginX, startY);
    doc.text("TCA6478", 260, startY);
    
    startY += 15;
    doc.setFillColor(210, 210, 210); 
    doc.rect(140, startY, 120, 25, 'FD'); 
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Hora Ingreso a Rampa", 140, startY + 35);
    doc.rect(400, startY, 120, 25, 'FD');
    doc.text("Hora de Salida de Rampa", 400, startY + 35);
    
    startY += 60;
    doc.rect(140, startY, 120, 25, 'FD');
    doc.text("Cantidad Tarimas", 140, startY + 35);
    doc.rect(270, startY + 10, 15, 15, 'S'); 
    doc.text("Bultos", 300, startY + 22);
    doc.rect(330, startY + 10, 15, 15, 'S'); 
    
    startY += 45;
    doc.setLineWidth(0.5);
    doc.line(marginX, startY, alignRight, startY);
    // NOTA Y OBSERVACIONES
    startY += 15;
    doc.setFont("helvetica", "normal");
    doc.text("Nota:  No se aceptan reclamos después de entregada la mercadería", 80, startY);
    
    startY += 45;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Observaciones:", marginX, startY);
    doc.rect(120, startY - 10, 450, 60, 'S'); 
    // FIRMAS
    startY += 110;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    doc.text("Entregado por", marginX, startY);
    doc.line(130, startY, 280, startY); 
    doc.text("Nombre", 190, startY + 12);
    doc.line(380, startY, 570, startY); 
    doc.text("Firma", 460, startY + 12);
    
    startY += 60;
    doc.text("Recibido por", marginX, startY);
    doc.line(130, startY, 280, startY); 
    doc.text("Nombre", 190, startY + 12);
    doc.line(380, startY, 570, startY); 
    doc.text("Firma", 460, startY + 12);
    
    startY += 30;
    doc.setFont("helvetica", "bold");
    doc.text("Firma de Recepción de Carga completa y en buen estado", 180, startY);
    // PIE DE PÁGINA (Hoja 1)
    const footerY = 750; 
    doc.setFillColor(11, 31, 99);
    doc.rect(marginX, footerY, 530, 15, 'F'); 
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("• DISTRIBUTION CENTER • IMPORT/EXPORT • CUSTOMS MANAGEMENT • MOVERS", 305, footerY + 11, { align: "center" });
    // ================================================================
    // ===================== PÁGINA 2: PROTOCOLO ======================
    // ================================================================
    
    doc.addPage(); // <-- Agrega la segunda hoja
    
    // ENCABEZADO TIPO TABLA (Rectángulo principal)
    doc.setLineWidth(0.5);
    doc.setTextColor(0, 0, 0);
    doc.rect(40, 40, 530, 80, 'S'); // Borde tabla principal
    // Líneas divisoras verticales del encabezado
    doc.line(180, 40, 180, 120); // Separa Logo y Título
    doc.line(330, 40, 330, 120); // Separa Título e Información
    // Columna 1: Logo
    doc.setFontSize(22);
    doc.setTextColor(11, 31, 99); 
    doc.setFont("helvetica", "bold");
    doc.text("cropa | DSV", 50, 75);
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("ALMACEN GENERAL", 65, 110);
    // Columna 2: Título Central
    doc.setFontSize(10);
    doc.text("PROTOCOLO DE", 215, 65);
    doc.text("ACEPTACION Y", 215, 80);
    doc.text("RECEPCION", 225, 95);
    // Columna 3: Información
    // Líneas divisorias horizontales
    doc.line(330, 66, 570, 66);
    doc.line(330, 93, 570, 93);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Solicitud. No.", 340, 55);
    doc.setFont("helvetica", "normal");
    doc.text("94463", 420, 55);
    doc.text("Página:", 480, 50);
    doc.setFont("helvetica", "bold");
    doc.text("1 de 1", 520, 50);
    doc.text("Cliente", 340, 82);
    doc.setFont("helvetica", "normal");
    doc.text("LABORATORIOS FINLAY SA", 380, 82);
    doc.setFont("helvetica", "bold");
    doc.text("Fecha de Entrega", 340, 110);
    doc.setFont("helvetica", "normal");
    doc.text("17/04/2026", 440, 110);
    // SECCIÓN 1: PREPARADO
    let p2Y = 140;
    doc.rect(40, p2Y, 530, 50, 'S'); // Borde exterior
    
    // Líneas para escribir
    doc.line(60, p2Y + 30, 280, p2Y + 30); 
    doc.line(330, p2Y + 30, 550, p2Y + 30); 
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PREPARADO EN ALMACEN POR:", 70, p2Y + 42);
    doc.text("FECHA Y HORA", 400, p2Y + 42);
    // SECCIÓN 2: SUPERVISIÓN
    p2Y = 200;
    doc.rect(40, p2Y, 530, 50, 'S');
    
    doc.line(60, p2Y + 30, 280, p2Y + 30); 
    doc.line(330, p2Y + 30, 550, p2Y + 30); 
    doc.text("SUPERVISION DE MERCADERIA EN RAMPA POR:", 60, p2Y + 42);
    doc.text("FIRMA", 430, p2Y + 42);
    // SECCIÓN 3: REVISIÓN DE CARGA (Tabla grande)
    p2Y = 270;
    doc.rect(40, p2Y, 530, 260, 'S');
    // Título tabla
    doc.line(40, p2Y + 20, 570, p2Y + 20); // Línea horizontal
    doc.setFontSize(9);
    doc.text("REVISION DE CARGA POR TRANSPORTISTA", 200, p2Y + 14);
    // Subtítulos
    doc.line(40, p2Y + 60, 570, p2Y + 60); // Línea horizontal
    doc.text("RECIBIDO Y REVISADO EN ALMACEN", 80, p2Y + 40);
    doc.text("RECIBE TRANSPORTISTA", 370, p2Y + 40);
    // Divisor vertical principal de la tabla
    doc.line(305, p2Y + 20, 305, p2Y + 260);
    // Campos Izquierda
    doc.setFontSize(9);
    doc.text("Empresa", 50, p2Y + 90); doc.line(100, p2Y + 90, 290, p2Y + 90);
    doc.text("Nombre", 50, p2Y + 120); doc.line(100, p2Y + 120, 290, p2Y + 120);
    doc.text("Cargo", 50, p2Y + 150);  doc.line(100, p2Y + 150, 290, p2Y + 150);
    doc.text("Fecha y Hora", 50, p2Y + 180); doc.line(120, p2Y + 180, 290, p2Y + 180);
    doc.text("Firma", 50, p2Y + 230);  doc.line(100, p2Y + 230, 290, p2Y + 230);
    // Campos Derecha
    doc.text("Empresa", 315, p2Y + 90); doc.line(365, p2Y + 90, 555, p2Y + 90);
    doc.text("Nombre", 315, p2Y + 120); doc.line(365, p2Y + 120, 555, p2Y + 120);
    doc.text("Cargo", 315, p2Y + 150);  doc.line(365, p2Y + 150, 555, p2Y + 150);
    doc.text("Fecha y Hora", 315, p2Y + 180); doc.line(385, p2Y + 180, 555, p2Y + 180);
    doc.text("Firma", 315, p2Y + 230);  doc.line(365, p2Y + 230, 555, p2Y + 230);
    // Nota final lado derecho
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("NOTA: Sin observaciones, se dará por aceptada la carga", 315, p2Y + 245);
    doc.text("completa y producto en buen estado.", 315, p2Y + 255);
    // SECCIÓN 4: ENTREGADO EN BODEGA
    p2Y = 540;
    doc.rect(40, p2Y, 530, 160, 'S');
    // Título cajón
    doc.line(40, p2Y + 40, 570, p2Y + 40); // Línea horizontal
    doc.line(305, p2Y, 305, p2Y + 40); // Línea vertical corta
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("ENTREGADO EN BODEGA", 110, p2Y + 15);
    doc.text("POR:", 60, p2Y + 30);
    // Campos
    doc.text("Nombre", 120, p2Y + 65); doc.line(170, p2Y + 65, 520, p2Y + 65);
    doc.text("Cargo", 120, p2Y + 95); doc.line(170, p2Y + 95, 520, p2Y + 95);
    doc.text("Fecha y Hora", 120, p2Y + 125); doc.line(190, p2Y + 125, 520, p2Y + 125);
    doc.text("Firma", 120, p2Y + 155); doc.line(170, p2Y + 155, 520, p2Y + 155);
    // ================= OUTPUT =================
    doc.save("Despacho_y_Protocolo.pdf");
}
    return {
        pilotos,
        getPilotos,
        crearPase,
        valideSolicitud,
        pasesSalidas,
        obtenerPasesSalidas,
        generarPDF
  }

}

export default usePasesalida