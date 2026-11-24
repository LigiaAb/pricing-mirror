import { useCallback, useEffect, useState } from "react"
import { api } from "../../../../api"
import { jsPDF } from "jspdf"
import moment from "moment"
export default function useDespachos() {

    const [despachos, setDespachos] = useState([])
    const [solicitud, setSolicitud] = useState({})
    const [regimenes, setRegimenes] = useState([])
    const [aduanas, setAduanas] = useState([])
    const [prepasSinSalidas, setPrepasSinSalidas] = useState([])


    const getPrepasSinSalidas = useCallback(async () => {
        const { data } = await api.get("/api/appweb/lista-prepassinsalidas")
        setPrepasSinSalidas(data.data.map(i => { return { value: i.solicitud_id, label: i.solicitud_id } }))
    }, [])

    const getSolicitud = useCallback(async (solicitud_id) => {
        const { data } = await api.get("/api/appweb/prepasinsalida/" + solicitud_id)

        setSolicitud(data.data)
    }, [])
    const getRegimenes = useCallback(async () => {

        try {
            const { data } = await api.get("api/appweb/lista-regimen", {
                params: {
                    es_operativa: true
                }
            })

            setRegimenes(data.data)
        } catch (error) {
            console.log(error)
        }
    }, [])
    const getAduanas = useCallback(async () => {
        try {
            const { data } = await api.get("api/appweb/lista-punto_enlace_aduana")
            setAduanas(data.data)

        } catch (error) {
            console.log(error)
        }
    }, [])

    const enviarDespacho = useCallback(async (formDespacho) => {
        try {
            const { data } = await api.post("/api/appweb/enviar-despacho", {
                ...formDespacho
            })

        } catch (error) {
            console.log(error)
        }
    }, [])

    const obtenerDespachos = useCallback(async () => {
        try {
            const { data } = await api.get("/api/appweb/lista-salidas")
            setDespachos(data.data.map(i => {
                return {
                    ...i,
                    salida_fecha: i.salida_fecha.split("T")[0],
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
        }
        catch (error) {
            console.log(error)
        }
    }, [])

    const obtenerDespachoDetalleyPDF = useCallback(async (salida_id) => {
        try {
            const { data } = await api.get("/api/appweb/obtener-salida/" + salida_id)
            const datos =data.data
            const cabeceraSalida = {
                fecha: moment().format("DD/MM/YYYY"),
                hora: moment().format("HH:mm:ss"),
                reporte: "Report salida",
                declaracionAduanera: datos[0].salida_identificacion.toString(),
                fileSalida: "",
                fechaSalida: datos[0].salida_fecha.split("T")[0],
                solicitudDespacho: "642522",
                consolidado: "0",
                cliente: datos[0].entidad_nombre.toString(), // "PRICESMART CEDI VN",
                destino: "--GT    GUATEMALA",
                regimen: "--",
                almacen: datos[0].almacen_nom.toString(),
                aduana: "--",
                tipoCambio: datos[0].salida_tipocam.toString(),
                totalTarimas: datos[0].salida_cantidadtarimas.toString(),
                consignatario: datos[0].solicitud_consignatario.toString
            };
            const datosPieSalida = {
                totalUnidades: "--2088.000",
                totalBultos: "--175.000",
                totalTarimas: "--9.838",
                operadoPor: "--ALMACEN3",
                fechaOperado: "--11/03/2026 16:51"
            };
            // Generamos varios artículos de ejemplo para probar las múltiples hojas
            const detallesSalida = [];
            for (let i = 0; i < datos.length; i++) {
                detallesSalida.push({
                    articuloCodigo: datos[0].articulo_sku.toString(),
                    articuloDesc: datos[0].articulo_des.toString(),
                    unidadesSalida: "12.000",
                    cantidadBultos: "1.000",
                    cantidadTarimas: "---0.0",
                    existenciaUnidades: "--0.000",
                    existenciaBultos: "--0.667",
                    existenciaTarimas: "--0.667",
                    factura: datos[0].solicitud_fac.toString(),
                    declaracionIngreso: datos[0].ingreso_identificacion.toString(),
                    partidaArancelaria: "--0000.00.0",
                    status: "INVENTARIO",
                    fileIngreso: "--CDAGI25006543"
                });
            }

            generarReporteSalidaPDF(cabeceraSalida, detallesSalida, datosPieSalida);
        } catch (error) {
            console.log(error)
        }
    }, [])


    function generarReporteSalidaPDF(datosCabecera, lineasDetalle, datosPie) {
        // Inicializamos jsPDF: portrait (vertical), unidad de medida pt (puntos), tamaño carta
        const doc = new jsPDF('p', 'pt', 'letter');

        const marginX = 40;
        const rightX = 570;
        const yLimite = 720;     // Límite en 'Y' antes de hacer el salto de página
        const itemHeight = 75;   // Espacio vertical por cada bloque de "Articulo"

        // ----------------------------------------------------------------------------------
        // SIMULADOR DE ESPACIO: Calcula el número correcto de páginas antes de imprimir
        // ----------------------------------------------------------------------------------
        let totalPaginas = 1;
        let simY = 250; // La página 1 tiene un encabezado muy grande (inicia en Y=250)
        for (let i = 0; i < lineasDetalle.length; i++) {
            if (simY + itemHeight > yLimite) {
                totalPaginas++;
                simY = 105; // Las siguientes páginas no tienen Cabecera grande, inician en Y=105
            }
            simY += itemHeight;
        }
        // Si la caja final (Pie de datosPie) no cupo en la última página, se añade 1 hoja más
        if (simY + 45 > yLimite) {
            totalPaginas++;
        }
        let paginaActual = 1;
        let posY = 0;
        // ----------------------------------------------------------------------------------
        // FUNCIÓN DE ENCABEZADO
        // ----------------------------------------------------------------------------------
        const dibujarEncabezado = (pagina) => {
            posY = 40;

            // 1. Zofacro & Textos Izquierdos
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold"); doc.text("CROPA | DSV", marginX, posY);
            doc.setFont("helvetica", "normal"); doc.text("San Pedro Sula", marginX, posY + 10);
            doc.text("Tel: (504) 2549 0850", marginX, posY + 20);
            // 2. Títulos Centrales (Cursiva)
            doc.setFontSize(14); doc.setFont("helvetica", "italic");
            doc.text("Salida", 306, posY + 5, { align: "center" });
            doc.setFontSize(12); doc.setFont("helvetica", "bolditalic");
            doc.text(`${datosCabecera.almacen}`, 306, posY + 20, { align: "center" });
            // 3. Textos Derechos
            doc.setFontSize(8); doc.setFont("helvetica", "bold");
            doc.text("Página:", 480, posY, { align: "right" });
            doc.text(`${pagina}   De: ${totalPaginas}`, 490, posY);

            doc.text("Fecha:", 480, posY + 10, { align: "right" });
            doc.text(`${datosCabecera.fecha}`, 490, posY + 10);

            doc.text("Hora:", 480, posY + 20, { align: "right" });
            doc.text(`${datosCabecera.hora}`, 490, posY + 20);

            doc.text("Reporte:", 480, posY + 30, { align: "right" });
            doc.setFont("courier", "normal"); // estilo del texto del reporte
            doc.text(`${datosCabecera.reporte}`, 490, posY + 30);
            posY += 50;
            doc.setLineWidth(0.5);
            doc.line(marginX, posY, rightX, posY);
            // -- SOLO EN LA PÁGINA 1 SE DIBUJA LA INFORMACIÓN COMPLETA --
            if (pagina === 1) {
                posY += 20;
                doc.setFontSize(14); doc.setFont("helvetica", "bolditalic");
                doc.text("Salida Definitiva de Mercaderia", 306, posY, { align: "center" });

                posY += 25;
                doc.setFontSize(8);

                // Fila 1
                doc.setFont("helvetica", "bold"); doc.text("Declaración Aduanera:", marginX, posY);
                doc.setFont("helvetica", "normal"); doc.text(datosCabecera.declaracionAduanera, 150, posY);
                doc.setFont("helvetica", "bold"); doc.setTextColor(43, 0, 128); // Color Morado Oscuro/Azul para label
                doc.text("File salida:", 210, posY); doc.setTextColor(0);
                doc.setFont("helvetica", "normal"); doc.text(datosCabecera.fileSalida || "", 260, posY);
                doc.setFont("helvetica", "bold"); doc.text("Fecha de Salida:", 410, posY);
                doc.setFont("helvetica", "normal"); doc.text(datosCabecera.fechaSalida, 480, posY);
                // Fila 2
                posY += 15;
                doc.setFont("helvetica", "bold"); doc.text("Solicitud de Despacho:", marginX, posY);
                doc.setFont("helvetica", "normal"); doc.text(datosCabecera.solicitudDespacho, 150, posY);
                doc.setFont("helvetica", "bold"); doc.text("Consolidado:", 410, posY);
                doc.setFont("helvetica", "normal"); doc.text(datosCabecera.consolidado, 480, posY);
                // Fila 3
                posY += 15;
                doc.setFont("helvetica", "bold"); doc.text("Cliente:", marginX, posY);
                doc.setFont("helvetica", "normal"); doc.text(datosCabecera.cliente, 150, posY);
                doc.setFont("helvetica", "bold"); doc.text("Destino:", 340, posY);
                doc.setFont("helvetica", "normal"); doc.text(datosCabecera.destino, 400, posY);
                // Fila 4
                posY += 15;
                doc.setFont("helvetica", "bold"); doc.text("Régimen:", marginX, posY);
                doc.setFont("helvetica", "normal"); doc.text(datosCabecera.regimen, 150, posY);
                doc.setFont("helvetica", "bold"); doc.text("Aduana:", 340, posY);
                doc.setFont("helvetica", "normal"); doc.text(datosCabecera.aduana, 400, posY);
                // Fila 5
                posY += 15;
                doc.setFont("helvetica", "bold"); doc.text("Tipo de Cambio:", marginX, posY);
                doc.setFont("helvetica", "normal"); doc.text(datosCabecera.tipoCambio, 150, posY);
                doc.setFont("helvetica", "bold"); doc.text("Total tarimas:", 210, posY);
                doc.setFont("helvetica", "normal"); doc.text(datosCabecera.totalTarimas, 270, posY);
                doc.setFont("helvetica", "bold"); doc.text("Consignatario:", 340, posY);
                doc.setFont("helvetica", "normal"); doc.text(datosCabecera.consignatario, 400, posY);

                posY += 15;
                doc.setLineWidth(0.5);
                doc.line(marginX, posY, rightX, posY);
                posY += 20;
                doc.setFontSize(14); doc.setFont("helvetica", "bolditalic");
                doc.text("Detalle de Salida por Código", 306, posY, { align: "center" });

                posY += 20; // Dejamos el Cursor en Y=250 aprox, listo para la info.
            } else {
                // SI ES PÁGINA 2 o MAYOR
                posY += 15; // Empezamos directamente debajo de la línea
            }
        };
        // Imprimir 1ra página
        dibujarEncabezado(paginaActual);
        // ----------------------------------------------------------------------------------
        // ITERAR DATOS DE LA TABLA DINÁMICA
        // ----------------------------------------------------------------------------------
        lineasDetalle.forEach((linea) => {
            if (posY + itemHeight > yLimite) {
                doc.addPage();
                paginaActual++;
                dibujarEncabezado(paginaActual);
            }

            doc.setFontSize(8);
            // Columna 1
            doc.setFont("helvetica", "bold"); doc.text("Articulo:", marginX, posY);
            doc.setFont("helvetica", "normal"); doc.text(linea.articuloCodigo, marginX + 45, posY);
            doc.text(linea.articuloDesc, 240, posY); // Info expansiva
            // Columna 2
            posY += 15;
            doc.setFont("helvetica", "bold"); doc.text("Unidades de Salida......:", marginX, posY);
            doc.setFont("helvetica", "normal"); doc.text(linea.unidadesSalida, 200, posY, { align: "right" });
            doc.setFont("helvetica", "bold"); doc.text("Cantidad de Bultos......:", 240, posY);
            doc.setFont("helvetica", "normal"); doc.text(linea.cantidadBultos, 400, posY, { align: "right" });
            doc.setFont("helvetica", "bold"); doc.text("Cantidad de Tarimas..:", 430, posY);
            doc.setFont("helvetica", "normal"); doc.text(linea.cantidadTarimas, 560, posY, { align: "right" });
            // Columna 3
            posY += 15;
            doc.setFont("helvetica", "bold"); doc.text("Existencia en Unidades:", marginX, posY);
            doc.setFont("helvetica", "normal"); doc.text(linea.existenciaUnidades, 200, posY, { align: "right" });
            doc.setFont("helvetica", "bold"); doc.text("Existencia en Bultos....:", 240, posY);
            doc.setFont("helvetica", "normal"); doc.text(linea.existenciaBultos, 400, posY, { align: "right" });
            doc.setFont("helvetica", "bold"); doc.text("Existencia en Tarimas:", 430, posY);
            doc.setFont("helvetica", "normal"); doc.text(linea.existenciaTarimas, 560, posY, { align: "right" });
            // Columna 4
            posY += 15;
            doc.setFont("helvetica", "bold"); doc.text(`Factura....`, marginX, posY);
            doc.setFont("helvetica", "normal"); doc.text(`${linea.factura}`, marginX + 40, posY);
            doc.setFont("helvetica", "bold"); doc.text("Declaración de Ingreso:", 240, posY);
            doc.setFont("helvetica", "normal"); doc.text(linea.declaracionIngreso, 400, posY, { align: "right" });
            doc.setFont("helvetica", "bold"); doc.text("Partida Arancelaria...:", 430, posY);
            doc.setFont("helvetica", "normal"); doc.text(linea.partidaArancelaria, 560, posY, { align: "right" });
            // Columna 5
            posY += 15;
            doc.setFont("helvetica", "bold"); doc.text("Status", marginX, posY);
            doc.setFont("helvetica", "normal"); doc.text(linea.status, marginX + 30, posY);

            doc.setFont("helvetica", "bold");
            doc.setTextColor(43, 0, 128); // Azul morado oscuro
            doc.text("File de ingreso:", 430, posY);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(200, 50, 50); // Rojo claro
            doc.text(linea.fileIngreso, 560, posY, { align: "right" });
            doc.setTextColor(0); // Reiniciar al negro oscuro tradicional

            posY += 15; // Margen separador antes del ciclo del nuevo ítem
        });
        // ----------------------------------------------------------------------------------
        // FINAL DEL REPORTE (Añadimos Footer de Totales de la hoja final)
        // ----------------------------------------------------------------------------------
        if (posY + 45 > yLimite) {
            doc.addPage();
            paginaActual++;
            dibujarEncabezado(paginaActual);
        }
        posY += 5;
        doc.setLineWidth(1); doc.line(marginX, posY, rightX, posY); // Línea negra gruesa
        posY += 15;
        doc.setFontSize(8);
        // Footers lado Izquierdo Formateados al Margen 200pt a la derecha de forma alineada en 'right'
        doc.setFont("helvetica", "bold"); doc.text("Total de Unidades:", marginX, posY);
        doc.setFont("helvetica", "normal"); doc.text(datosPie.totalUnidades, 200, posY, { align: "right" });
        posY += 15;
        doc.setFont("helvetica", "bold"); doc.text("Total de Bultos....:", marginX, posY);
        doc.setFont("helvetica", "normal"); doc.text(datosPie.totalBultos, 200, posY, { align: "right" });
        posY += 15;
        doc.setFont("helvetica", "bold"); doc.text("Total de Tarimas..:", marginX, posY);
        doc.setFont("helvetica", "normal"); doc.text(datosPie.totalTarimas, 200, posY, { align: "right" });
        // Footers lado Derecho (Centrados de forma variable)
        doc.setFont("helvetica", "bold"); doc.text("Operado por:", 260, posY);
        doc.setFont("helvetica", "normal"); doc.text(datosPie.operadoPor, 320, posY);
        doc.setFont("helvetica", "bold"); doc.text("en fecha:", 420, posY);
       // doc.setFont("helvetica", "normal"); doc.text(datosPie.fecha_salida, 440, posY);
        doc.setFont("helvetica", "bold"); doc.text("en fecha:", 450, posY);
        doc.setFont("helvetica", "normal"); doc.text(datosPie.fechaOperado, 470, posY);
        posY += 10;
        doc.setLineWidth(1); doc.line(marginX, posY, rightX, posY); // Línea final
        // Finalmente mandamos a descargar el PDF
        doc.save(`Reporte_${datosCabecera.reporte}.pdf`);
    }
    useEffect(() => {
        Promise.all([
            getPrepasSinSalidas(),
            getAduanas(),
            getRegimenes(),
            obtenerDespachos()
        ]);
    }, [getPrepasSinSalidas, getRegimenes, getAduanas, obtenerDespachos])



    return {
        despachos,
        getPrepasSinSalidas,
        prepasSinSalidas,
        solicitud,
        getSolicitud,
        aduanas,
        regimenes,
        enviarDespacho,
        obtenerDespachoDetalleyPDF,
        obtenerDespachos
    }

}