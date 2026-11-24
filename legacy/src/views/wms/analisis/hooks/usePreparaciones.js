import { useCallback, useEffect, useState } from "react"
import { api } from "../../../../api"
import jsPDF from "jspdf"
import moment from "moment"
import jspdfBarcode from "jspdf-barcode"
import a from "@/documentacion/qaDocHeader"
export default function usePreparaciones() {
    const [preparaciones, setPreparaciones] = useState([])

    const getPreparaciones = useCallback(async () => {
        const { data } = await api.get("/api/appweb/lista-preparacion")
        setPreparaciones(data.data.map(prepa => {
            return {
                ...prepa,
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
    }, [])

    const saveToPreparacion = useCallback(async (solicitud_id) => {
        const { data } = await api.post("/api/appweb/crear-preparacion", {
            solicitud_id: solicitud_id
        })
    }, [])

    const imprimirPDfPrepa = useCallback(async (solicitud_id) => {
        const { data } = await api.get(`/api/appweb/obtener-lineasprepa/${solicitud_id}`)
        if (data.data.length > 0) {
            createPDF(data.data)
        }

    }, [])


    function createPDF(data) {
        
        const cabeceraFake = {
            numero: data[0].solicitud_id[0], // ,
            codigoBarras: data[0].solicitud_id[0], // Se visualiza como texto con asteriscos, ej: *SOL...*
            fechaImpresion: moment().format("DD/MM/YYYY"), // "03.02/2026",
            horaImpresion: moment().format("HH:mm:ss"), // "14:30:45",
            cliente: data[0].entidad_nombre, // "PRICESMART CEDI VN",
            fechaPedido: data[0].solicitud_fecha.split("T")[0],
            consignatario: data[0].solicitud_consignatario,
            destino: data[0].pais_nombre,
            transporte: "Terrestre / Marítimo",
            factura: data[0].solicitud_fac, // "FS-00000001"
        };
        // Generamos 15 registros de manera automática para forzar a que salga más de 1 página
        const detallesFake = [];
        for (let i = 0; i < data.length; i++) {
            console.log(data[i].articulo_sku.toString())
            detallesFake.push({
                codigo: data[i].articulo_sku.toString(),
                descripcion: data[i].articulo_des,
                lote: data[i].ingmov_lote,
                motor: "",
                color: "",
                fVenc: data[i].ingmov_fecvenc.split("T")[0],
                declaracion: data[i].ingreso_identificacion,
                bultos: data[i].prep_cant/data[i].ingmov_bulto,
                unidades: data[i].prep_cant,
                localizacion: `${data[i].localiza_bod} - ${data[i].localiza_rac} - ${data[i].localiza_tramo} - ${data[i].localiza_nivel}- ${data[i].localiza_espacio}`,
                etiqueta: data[i].localiza_id[0].toString(), // Aquí podrías generar un código de barras real o un QR usando alguna librería adicional
            });
        }
        generarComprobantePDF(cabeceraFake, detallesFake)

    }
    function generarComprobantePDF(datosCabecera, lineasDetalle) {
        // Inicializamos jsPDF: portrait (vertical), unidad de medida pt (puntos), tamaño carta
        const doc = new jsPDF ('p', 'pt', 'letter');

        const marginX = 40;
        const yLimite = 720;     // Límite en 'Y' antes de hacer el salto de página
        const yInicioLineas = 295; // Donde comienza la primera línea tras el encabezado
        const alturaItem = 45;   // El espacio vertical que ocupa cada registro de tu tabla

        // Calcular en cuántas páginas va a caber toda tu data para el texto "Pagina: 1 de X"
        const itemsPorPag = Math.floor((yLimite - yInicioLineas) / alturaItem);
        const totalPaginas = Math.ceil(lineasDetalle.length / itemsPorPag) || 1;
        let paginaActual = 1;
        let posY = 0;
        // Función que redibuja todo el encabezado y reiniciar `posY`
        const dibujarEncabezado = (pagina) => {
            posY = 40;

            // ----------------------------------------------------
            // 1. Logo y Textos Izquierdos
            // ----------------------------------------------------
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("CROPA | DSV", marginX, posY); // Puedes reemplazar esto con doc.addImage(...) luego

            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text("Cropa San Pedro, HN", marginX, posY + 12);
            doc.text("(503-) 0000-0000", marginX, posY + 22);
            // ----------------------------------------------------
            // 2. Títulos Centrales
            // ----------------------------------------------------
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("Preparación de Pedido", 306, posY, { align: "center" });
            doc.setFontSize(22);
            doc.text("Número " + datosCabecera.numero, 306, posY + 25, { align: "center" });

            doc.setFontSize(30);
            // Aquí puedes cambiarlo más adelante por una fuente de código de barras

            jspdfBarcode(doc, `000${datosCabecera.numero}`, {
                x: 306 - 40, // Centrado respecto al texto
                y: posY + 66,
                fontSize: 28,
                textColor: "#000000",
                align: "center",
            });

            // ----------------------------------------------------
            // 3. Textos Derechos (Paginación, fechas)
            // ----------------------------------------------------
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const rightX = 570;
            doc.text(`Pagina:     ${pagina}      de    ${totalPaginas}`, rightX, posY, { align: "right" });
            doc.text(`Fecha:      ${datosCabecera.fechaImpresion}`, rightX, posY + 12, { align: "right" });
            doc.text(`Hora:       ${datosCabecera.horaImpresion}`, rightX, posY + 24, { align: "right" });
            doc.setFont("courier", "normal"); // Estilo monoespaciado igual a la imagen
            //doc.text("PPreparacionPedidoPDF", rightX, posY + 40, { align: "right" });
            posY += 85; // Bajamos en Y para pintar la caja
            // ----------------------------------------------------
            // 4. Caja del Cliente (Borde negro)
            // ----------------------------------------------------
            doc.setFont("helvetica", "normal");
            doc.setLineWidth(1);
            doc.rect(marginX, posY, 530, 45); // Dibuja la caja rectangular

            doc.setFontSize(10);
            doc.text(`Cliente:        ${datosCabecera.cliente}`, marginX + 5, posY + 12);
            doc.text(`Fecha:      ${datosCabecera.fechaPedido}`, 300, posY + 12);
            doc.text(`Consignatario:  ${datosCabecera.consignatario}`, marginX + 5, posY + 26);
            doc.text(`Destino:    ${datosCabecera.destino}`, 300, posY + 26);
            doc.text(`Transporte:     ${datosCabecera.transporte}`, marginX + 5, posY + 40);
            posY += 75;
            // ----------------------------------------------------
            // 5. Títulos de las Columnas
            // ----------------------------------------------------
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text("Código", marginX, posY);
            // En la imagen hay una subdivisión rara, la replicamos:
            doc.text("Declaración", 140, posY + 8);
            doc.text("Descripción", 200, posY);
            doc.text("Bultos", 220, posY + 8);
            doc.text("Unidades", 280, posY + 8);
            doc.text("Localización", 380, posY + 8);
            doc.text("Etiqueta", 480, posY + 8);
            posY += 25;
            // ----------------------------------------------------
            // 6. Factura y Carril asignado
            // ----------------------------------------------------
            doc.setFontSize(14);
            doc.text(`Factura       ${datosCabecera.factura}`, 250, posY);

            posY += 20;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("Carril asignado:  _______________________", marginX + 15, posY);

            posY += 10;
            doc.setLineWidth(0.5);
            doc.line(marginX, posY, 570, posY); // Línea horizontal divisora principal

            posY += 15; // Dejamos el Cursor Y listo para que empiecen las líneas de detalle
        };
        // ----------------------------------------------------------------------------------
        // DIBUJAMOS LA PRIMERA PÁGINA
        // ----------------------------------------------------------------------------------
        dibujarEncabezado(paginaActual);
        // ----------------------------------------------------------------------------------
        // ITERAMOS SOBRE LOS DETALLES GENERANDO PÁGINAS AUTOMÁTICAMENTE
        // ----------------------------------------------------------------------------------
        lineasDetalle.forEach((linea) => {
            // ¿Nos quedamos sin espacio en la página? => Nueva página
            if (posY > yLimite) {
                doc.addPage();
                paginaActual++;
                dibujarEncabezado(paginaActual);
            }
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            // Fila 1 del item: Código y Descripción
            doc.text(`${linea.codigo}`, marginX, posY);
            doc.text(`${linea.descripcion}`, 200, posY);

            posY += 12;
            // Fila 2 del item: Lote, Motor, Color, Vencimiento
            doc.setFont("helvetica", "bold");
            doc.text("Lote: ", marginX, posY);
            doc.setFont("helvetica", "normal");
            doc.text(`${linea.lote}`, marginX + 50, posY);

            doc.setFont("helvetica", "bold");
            //doc.text("Motor: ", 220, posY);
            doc.setFont("helvetica", "normal");
            //doc.text(`${linea.motor}`, 250, posY);
            doc.setFont("helvetica", "bold");
            //doc.text("Color: ", 350, posY);
            doc.setFont("helvetica", "normal");
           // doc.text(`${linea.color}`, 380, posY);
            doc.setFont("helvetica", "bold");
            doc.text("F Venc. ", 470, posY);
            doc.setFont("helvetica", "normal");
            doc.text(`${linea.fVenc}`, 510, posY);
            posY += 12;
            // Fila 3 del item: Cantidades y Ubicaciones
            // Formateamos numéricamente según la foto ("15.60", "156.000 PZA")
            let bultosFormat = Number(linea.bultos).toFixed(2);
            let uniFormat = `${Number(linea.unidades).toFixed(3)} PZA`;

            doc.text(`${linea.declaracion}`, 130, posY);
            doc.text(`${bultosFormat}`, 220, posY);
            doc.text(`${uniFormat}`, 260, posY);
            doc.text(`${linea.localizacion}`, 370, posY);
            doc.text(`${linea.etiqueta}`, 480, posY);
            posY += 10;

            // Línea separadora fina al final del registro
            doc.setLineWidth(0.3);
            doc.line(marginX, posY, 570, posY);

            posY += 12; // Avanzamos el puntero para la siguiente vuelta del loop
        });
        // ----------------------------------------------------------------------------------
        // FINAL DEL REPORTE (Total de tarimas)
        // ----------------------------------------------------------------------------------
        // Verificamos si hay espacio para el pie de página, de lo contrario lo pasa de hoja
        if (posY > yLimite - 20) {
            doc.addPage();
            paginaActual++;
            dibujarEncabezado(paginaActual);
        }
        posY += 15;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Total de Tarimas a despachar     ______________________", marginX + 80, posY);
        // Finalmente mandamos a descargar el PDF en el navegador
        doc.save("Preparacion_"+datosCabecera.numero+".pdf");
    }

  


    useEffect(() => {
        getPreparaciones()
    }, [getPreparaciones])

    return {
        preparaciones,
        saveToPreparacion,
        imprimirPDfPrepa,
        getPreparaciones
    }
}
