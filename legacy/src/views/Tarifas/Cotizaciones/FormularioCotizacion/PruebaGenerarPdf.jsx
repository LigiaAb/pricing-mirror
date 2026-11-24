import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
// import generarPDF from '../../../../pages/Tarifas/Calculo/_generarPdfCotizacion';
import image from "../../../../assets/logo-cropa-dsv-1024x205.png";
import generarPDF from './GenerarPdf';

import { api } from "../../../../api";
import { set } from 'date-fns';


const PruebaGenerarPDF = () => {
    const [pdfUri, setPdfUri] = useState(null); // Estado para almacenar el URI del PDF
    const [items,setItems] = useState([])
    const [opcionales, setOpcionales] = useState([])
    const [tipoTransporteSeleccionado, setTipoTransporteSeleccionado] = useState(0);
    const [datos, setDatos] = useState(null)
    const [criterio, setCriterio] = useState([])

   const obtenerDatos = useCallback(async () => {
    console.log("Obteniendo datos...");
        try {
            const response = await api.get("api/appweb/obtener-detalles-cotizacion?cod_cotizaciondetalle=256");
            console.log("datos",response.data);
            const data = response.data.data.datos;
            const item = response.data.data.items;
            const criterio = response.data.data.criterios;
            const opcionales = response.data.data.opcionales;
            console.log({data:data})
            console.log({items:item})
            console.log({criterios:criterio})
            console.log({opcionales:opcionales})

            console.log("Datos extraídos:", response.data.data);
            if (data ) {
                setDatos(data);
                const tipoTransporte = data.tipo_transporte !== undefined 
                    ? data.tipo_transporte 
                    : 0;

                setTipoTransporteSeleccionado(tipoTransporte);
                setItems(item)
                setCriterio(criterio)
                setOpcionales(opcionales)
            } else {
                console.error("Estructura de respuesta no válida");
                setTipoTransporteSeleccionado(0);
            }

        } catch (error) {
            console.error("Error al obtener los datos:", error);
        }
    }, []);

    useEffect(() => {
        obtenerDatos(); // Llama a la función al montar el componente
    }, [obtenerDatos]);

    
    

    const handleGenerarPDF = () => {

        console.log("Datos disponibles:", datos);
        console.log("items disponibles: ", items);
        console.log("criterio disponibles: ", criterio);

        if (!datos) {
            console.error("No hay datos disponibles para generar el PDF.");
            return;
        }


        const pdfItems = items.map(item => ({
            id: item.id,
            rubro: item.rubro,
            detalle: item.detalle,
            monto: item.monto,
            moneda: item.moneda
        }))
            // { id: 2, rubro: "Manejo, AWB", detalle: "", monto: 70.00, moneda: "$" },
            // { id: 3, rubro: "Recoleccion", detalle: "", monto: 165.00, moneda: "$" },
            // { id: 4, rubro: "Carga Screening", detalle: "", monto: 159.15, moneda: "$" },
            // { id: 5, rubro: "AES", detalle: "", monto: 25, moneda: "$" },
            // { id: 6, rubro: "Airport transfer Fee", detalle: "", monto: 159.15, moneda: "$" },
            // { id: 7, rubro: "In/Out Charges", detalle: "Almacenaje, 7 dias libres", monto: 169.76, moneda: "$" },
            // { id: 8, rubro: "Coordination Fee", detalle: "", monto: 1485.40, moneda: "$" },
            // { id: 9, rubro: "CC Fee, min $10.00", detalle: "3% sobre el valor del flete", monto: 44.56, moneda: "$" },
            // { id: 10, rubro: "Terminal Service", detalle: "3% sobre el valor de todos los gastos ", monto: 72, moneda: "Q" },
            // { id: 11, rubro: "Collection Charge", detalle: "5.26% sobre el valor del flete y gastos", monto: 126.24, moneda: "Q" },
            // { id: 12, rubro: "In/Out Charges", detalle: "Almacenaje, 7 dias libres", monto: 169.76, moneda: "$" },
            // { id: 13, rubro: "HOLA", detalle: "5.26% sobre el valor del flete y gastos", monto: 126.24, moneda: "Q" },
            // { id: 14, rubro: "HOLA2", detalle: "Almacenaje, 7 dias libres", monto: 169.76, moneda: "$" },
            // { id: 15, rubro: "MUNDO", detalle: "3% sobre el valor de todos los gastos ", monto: 72, moneda: "Q" },
            // { id: 16, rubro: "MUNDO2", detalle: "5.26% sobre el valor del flete y gastos", monto: 126.24, moneda: "Q" },
            // { id: 17, rubro: "YO NOSE", detalle: "Almacenaje, 7 dias libres", monto: 169.76, moneda: "$" },
            // { id: 18, rubro: "YO NOSE2", detalle: "5.26% sobre el valor del flete y gastos", monto: 126.24, moneda: "Q" },
            // { id: 19, rubro: "LALALALALAL", detalle: "Almacenaje, 7 dias libres", monto: 169.76, moneda: "$" },
            // { id: 20, rubro: "Flete aereo desde miami hacia Guatemala", detalle: "", monto: 1485.40, moneda: "$" },
            // { id: 21, rubro: "Manejo, AWB", detalle: "", monto: 70.00, moneda: "$" },
            // { id: 22, rubro: "Recoleccion", detalle: "", monto: 165.00, moneda: "$" },
            // { id: 23, rubro: "Carga Screening", detalle: "", monto: 159.15, moneda: "$" },
            // { id: 24, rubro: "AES", detalle: "", monto: 25, moneda: "$" },
            // { id: 25, rubro: "Airport transfer Fee", detalle: "", monto: 159.15, moneda: "$" },
            // { id: 26, rubro: "chanchito feliz", detalle: "3% sobre el valor de todos los gastos ", monto: 72, moneda: "Q" },
            // { id: 27, rubro: "felipe", detalle: "5.26% sobre el valor del flete y gastos", monto: 126.24, moneda: "Q" },
            // { id: 28, rubro: "nicolas", detalle: "3% sobre el valor de todos los gastos ", monto: 72, moneda: "Q" },
            // { id: 29, rubro: "trabajo", detalle: "5.26% sobre el valor del flete y gastos", monto: 126.24, moneda: "Q" },
            // // { id: 30, rubro: "feliz", detalle: "3% sobre el valor de todos los gastos ", monto: 72, moneda: "Q" },
            // { id: 31, rubro: "triste", detalle: "5.26% sobre el valor del flete y gastos", monto: 126.24, moneda: "Q" },
            // { id: 32, rubro: "nadie", detalle: "3% sobre el valor de todos los gastos ", monto: 72, moneda: "Q" },
            // { id: 33, rubro: "fuera", detalle: "5.26% sobre el valor del flete y gastos", monto: 126.24, moneda: "Q" },
            // { id: 34, rubro: "triste", detalle: "5.26% sobre el valor del flete y gastos", monto: 126.24, moneda: "Q" },
            // { id: 35, rubro: "nadie", detalle: "3% sobre el valor de todos los gastos ", monto: 72, moneda: "Q" },

    

        // const opcionales = [
        // //     { id: 15, rubro: "Tramite aduanal", detalle: "la declaracion cubre hasta 30 lineas a partir de la linea 31 se cobran Q2.00 por cada linea adicional", monto: 72, moneda: "Q", opcion: "S" },
        // //     { id: 16, rubro: "Transmision y validacion DUCA", detalle: "Rectificacion Q30.00 + DUCA Complementaria Q30.00", monto: 126.24, moneda: "Q", opcion: "S" },
        // //     { id: 17, rubro: "Tramite aduanal", detalle: "la declaracion cubre hasta 30 lineas a partir de la linea 31 se cobran Q2.00 por cada linea adicional", monto: 72, moneda: "Q", opcion: "S" },
        // //     { id: 18, rubro: "Transmision y validacion DUCA", detalle: "Rectificacion Q30.00 + DUCA Complementaria Q30.00", monto: 126.24, moneda: "Q", opcion: "S" },
        // //     { id: 19, rubro: "Hola Mundo", detalle: "la declaracion cubre hasta 30 lineas a partir de la linea 31 se cobran Q2.00 por cada linea adicional", monto: 72, moneda: "Q", opcion: "S" },
        // //     { id: 20, rubro: "Test 4", detalle: "Rectificacion Q30.00 + DUCA Complementaria Q30.00", monto: 126.24, moneda: "Q", opcion: "S" },
        // //     { id: 21, rubro: "Test 5", detalle: "Rectificacion Q30.00 + DUCA Complementaria Q30.00", monto: 126.24, moneda: "Q", opcion: "S" },
        // //     { id: 22, rubro: "Transmision y validacion DUCA", detalle: "Rectificacion Q30.00 + DUCA Complementaria Q30.00", monto: 126.24, moneda: "Q", opcion: "S" },
        // ];

        const pdfCriterio = criterio.map(cri => ({
            criterio: cri.criterio,
            valor: cri.valor
        }));

        const pdfOpcionales = opcionales.map(opc => ({
            id: opc.id,
            rubro: opc.rubro,
            detalle: opc.detalle,
            monto: opc.monto,
            moneda: opc.moneda
        }))

        // const tipoTransporteSeleccionado = transportes.transporte[1];

        const pdfData = {
            horizontal: false,
            tamano: "letter",
            fechaActual: datos.fecha_actual,
            centroCosto: datos.cenco,
            codCotizacion: datos.cod_cotizacion_cabecera,//Codigo cotizacion
            ano: datos.ano,
            contacto: datos.contacto ||"Contacto no disponible",
            version: datos.version,//NUMERO DE LA VERSION
            cliente: datos.cliente,
            tipo_transporte: tipoTransporteSeleccionado, //0=Aereo, 1= Maritimo, 2=Terrestre
            incoterm: datos.incoterm,
            origen: datos.origen,
            paisOrigen: datos.pais_origen,
            destino: datos.destino,
            paisDestino: datos.pais_destino,
            pesoVolumetrico: 1061,
            pesoReal: 577.05,
            chargeWeight: 1.40,
            tipoServicio: datos.tipo_servicio || "Directo o consolidado", //Directo o Consolidado
            salidas: "Semanales",
            tiempoTransito: "1-2 dias aproximadamente",
            fechaVencimiento: `${(function () {
                const fecha = new Date();
                fecha.setDate(fecha.getDate() + 15);
                return fecha.toLocaleDateString();
            })()}`,
            nombreCreador: datos.nombre_creador,
            puestoCreador: datos.puesto_creador,
            opcionales:"opcionales funcionan de la siguiente manera",

            descargar: false
        };


        
        const pdfDataUri = generarPDF(pdfData, pdfItems, pdfOpcionales, pdfCriterio); // Generar el PDF
        setPdfUri(pdfDataUri); // Almacenar el URI en el estado
        



    };

    const handleDescargarPDF = () => {
        const link = document.createElement('a');
        link.href = pdfUri;
        link.download = "cotizacion.pdf"; // Nombre del archivo a descargar
        link.click(); // Iniciar la descarga
    };

    return (
        <div>
            <h1>Generador de PDF</h1>
            <button onClick={handleGenerarPDF}>Generar PDF</button>

            {/* {pdfUri && (
                <div>
                    <h2>Previsualización del PDF</h2>
                    <iframe
                        src={pdfUri}
                        width="100%"
                        height="1000PX"
                        style={{ border: 'none' }}
                        title="Previsualización del PDF"
                    />
                    </div>
                    )} */}
                    <button onClick={handleDescargarPDF}>Descargar PDF</button>
            <p>Tipo de transporte seleccionado: {tipoTransporteSeleccionado}</p>
        </div>
        
    
    );
};

export default PruebaGenerarPDF;