import { Box, Icon, Pagination } from "@mui/material"
import { jsPDF } from "jspdf"
import qrcode from "qrcode-generator"
import TablaComponent from "../../../components/Tabla/TablaComponent"
import { useCallback, useEffect, useState } from "react"
import FormularioCargarIngreso from "./FormularioCargarIngreso"
import { api } from "../../../api"
import generarExcel from "@/utils/GeneradorExcel/_generador_excel_v2"
import { FormularioFiltrarIngreso } from "./FormularioFiltrarIngreso"


const TablaIngresos = () => {
    const header = [
        {
            name: "ingreso_id",
            label: 'Ingreso correlativo',
            campo: 'INGRESO_ID',
            align: 'center'
        },
        {
            name: "ingreso_identificacion",
            label: 'Identifacion de ingreso',
            campo: 'INGRESO_IDENTIFICACION',
            align: 'center'
        },
        {
            name: "entidad",
            label: 'Cliente',
            campo: 'ENTIDAD_NOMBRE',
            align: 'center'
        },
        {
            name: "almacen",
            label: 'Almacen',
            campo: 'ALMACEN_NOM',
            align: 'center'
        },
        {
            name: "ingreso_fecha",
            label: 'Fecha de ingreso',
            campo: 'FECHAING',
            align: 'center'
        }
    ]

        const [openFormCargar, setOpenFormCargar] = useState(false)
        const [openFormFiltrar, setOpenFormFiltrar] = useState(false)    
    const [ingresos, setIngresos] = useState([])
    const [params, setParams] = useState({page: 1, page_size: 10, last_page: 1})

    const ingresosFn = useCallback(async(entidad_id=0, identificacion = '') => {
        try {
            const { data } = await api.get("/api/appweb/obtener-ingresos",{
                params: {
                    page: params.page,
                    page_size: params.page_size, 
                    entidad_id: entidad_id,
                    indentificacion: identificacion
                }
            })
            setParams(prev => ({...prev, last_page: data.data.pagination.lastPage}))

            setIngresos(data.data.data.map((item) => ({
                ...item,
                accionesDeTabla: {
                    add: false,
                    view: false,
                    go: false,
                    copy: false,
                    paste: false,
                    auth: item.INGEST_ID == 1 ? false : true,
                    edit: false,
                    excel: item.INGEST_ID == 1 ? true : false,
                    pdf: item.INGEST_ID == 1 ? true : false,
                    download: false,
                    delete: true,
                },
            })))
        } catch (error) {
            console.log(error)
        }
    }, [params.page])

    useEffect(() => {
        ingresosFn()
    }, [ingresosFn])


    const fnOpenFormCargar = useCallback(() => {
        setOpenFormCargar(true)
    }, [])

    const fnCloseFormCargar = useCallback(() => {
        setOpenFormCargar(false)
        ingresosFn()
    })

    const crearExcel = useCallback(async (ingreso_id) => {
        try {
            const { data } = await api.get(`/api/appweb/obtener-ingreso/${ingreso_id}`)

            const datos = data.data.map(i => {
                return {
                    Articulo: i.articulo_des,
                    Sku: i.articulo_sku,
                    Cantidad: i.ingmov_unidades*i.ingmov_bulto,
                    Serie: i.ingmov_serie,
                    Lote: i.ingmov_lote,
                }
            })
            const header = []
            header['Almacen: '] = data.data[0].almacen_nom;
            header['Cliente: '] = data.data[0].entidad_nombre;
            header['Documento de identificación: '] = data.data[0].ingreso_identificacion
            generarExcel({
                descargar: true,
                propiedades: {
                    title: `Reporte de Ingreso - ERPWEB - ${ingreso_id}.xlsx`,
                    subject: "Reporte en excel",
                    author: "ERP-web",
                    creator: "ERP-web",
                },
                titulo: `Reporte de Ingreso`,
                horizontal: true,
                bottom: true,
                hojas: [
                    {
                        nombre: "Ingreso",
                        header: header,
                        datos: datos,
                    }
                ]

            })

        } catch (error) {
            console.log(error)
        }
    }, [])


    const generarPDFfn = useCallback(async(ingreso_id) => {


        try {
            const { data } = await api.get(`/api/appweb/obtener-ingreso/${ingreso_id}`)

            const datos = data.data.map(i => {
                return {
                    titulo: i.entidad_nombre,
                    producto: i.articulo_des,
                    lote: i.ingmov_lote.toString(),
                    codigo: i.articulo_sku.toString(),
                    bulto: i.ingmov_bulto.toString(),
                    unidades: i.ingmov_unidades.toString(),
                    ingreso: i.ingreso_fecha.split('T')[0],
                    poliza: i.ingreso_identificacion.toString(),
                    fileEmb:i.ingreso_embarque.toString(),
                    qrCode: i.localiza_id.toString(),
                    vence: i.ingmov_fecvenc.split('T')[0]
                }
            })
            generarPDF(datos)

        } catch (error) {
            console.log(error)
        }
    }, [])


    const generarPDF = (datos) => {
        const doc = new jsPDF('landscape', 'mm', 'letter');

        // Dimensiones de la hoja carta horizontal: 279.4mm x 215.9mm
        const pageWidth = 279.4;
        const pageHeight = 215.9;

        datos.forEach((item, index) => {
            if (index > 0) doc.addPage();

            // Centrar el contenido (márgenes izquierdo y derecho iguales)
            const contentWidth = 250; // Ancho del contenido
            const left = (pageWidth - contentWidth) / 2; // Centrado automático
            const top = 20; // Margen superior

            // === 1. TÍTULO / NOMBRE DEL CLIENTE ===
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text(item.titulo || 'PHARMA 99 SOCIEDAD ANON', left, top + 5);

            // === 2. DESCRIPCIÓN PRODUCTO ===
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('DESCRIPCION PRODUCTO:', left, top + 20);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.text(item.producto || 'CANDESARTAN CILEXETIL PARA FARMACIA', left, top + 33);

            // === 3. LOTE Y VENCE ===
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('LOTE:', left, top + 48);
            doc.setFont('helvetica', 'normal');
            doc.text(item.lote || 'V331', left + 25, top + 48);
            doc.setFont('helvetica', 'bold');
            doc.text('VENCE:', left + 120, top + 48);
            doc.setFont('helvetica', 'normal');
            doc.text(item.vence || '/ /', left + 150, top + 48);

            // === 4. CÓDIGO Y MANIFIESTO ===
            doc.setFont('helvetica', 'bold');
            doc.text('CODIGO:', left, top + 63);
            doc.setFont('helvetica', 'bold');
            doc.text(item.codigo || 'CANDESAR', left + 35, top + 63);
            doc.setFont('helvetica', 'bold');
            doc.text('MANIFIESTO:', left + 120, top + 63);

            // === 5. BULTOS E INGRESO ===
            doc.setFont('helvetica', 'bold');
            doc.text('Bultos:', left, top + 78);
            doc.setFont('helvetica', 'normal');
            doc.text(item.bulto || '1 / 1', left + 35, top + 78);
            doc.setFont('helvetica', 'bold');
            doc.text('Ingreso el:', left + 120, top + 78);
            doc.setFont('helvetica', 'normal');
            doc.text(item.ingreso || '11/07/2025 14:30', left + 165, top + 78);

            // === 6. UNIDADES POR BULTO ===
            doc.setFont('helvetica', 'bold');
            doc.text('Unidades por Bulto:', left, top + 93);
            doc.setFont('helvetica', 'normal');
            doc.text(item.unidades || '16128.000', left + 80, top + 93);

            // === 7. PÓLIZA ===
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('POLIZA:', left, top + 113);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(28);
            doc.text(item.poliza || '3775712613', left + 50, top + 114);

            // === 8. No. File / Emb (DA) ===
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('No. File / Emb (DA):', left, top + 134);

            // === 9. QR ===
            const textoQR = item.qrCode || '0';
            const qr = qrcode(0, 'M');
            qr.addData(textoQR);
            qr.make();
            const qrDataURL = qr.createDataURL(8);
            doc.addImage(qrDataURL, 'PNG', left + 172, top + 100, 80, 80, undefined, 'FAST');
            // === 10. CÓDIGO FINAL ===
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(item.qrCode || '0', left + 210, top + 178, { align: 'center' });

            // === BORDES (centrados) ===
            doc.setDrawColor(0);
            doc.setLineWidth(0.5);

            // Rectángulo general
            doc.rect(left - 5, top - 5, contentWidth + 10, 190);

            // Líneas horizontales
            doc.line(left - 5, top + 12, left + contentWidth + 5, top + 12);
            doc.line(left - 5, top + 37, left + contentWidth + 5, top + 37);
            doc.line(left - 5, top + 55, left + contentWidth + 5, top + 55);
            doc.line(left - 5, top + 70, left + contentWidth + 5, top + 70);
            doc.line(left - 5, top + 85, left + contentWidth + 5, top + 85);
            doc.line(left - 5, top + 100, left + contentWidth + 5, top + 100);
            doc.line(left - 5, top + 125, left + contentWidth - 80, top + 125);
            doc.line(left - 5, top + 145, left + contentWidth - 80, top + 145);

            // Línea vertical (para separar el QR)
            doc.line(left + 170, top + 100, left + 170, top + 185);
        });

        doc.save('etiquetas.pdf');
    };

    const hanlePage = useCallback((event, value) => {
        setParams(prev => ({...prev, page: value}))
     }, [])

    const fnOpenFormFiltrar = useCallback(() => {
        setOpenFormFiltrar(true)
    }, []) 

    const fnFiltrarIngresos = useCallback((filtro) => {
       let entidad_id = filtro.select_entidad ? filtro.select_entidad.value : 0
       let identificacion = filtro.text_identificacion ? filtro.text_identificacion : ''
        ingresosFn(entidad_id, identificacion)
    }
    ,[])



    return (
        <Box
            sx={{
                marginTop: 2
            }}
        >
            <TablaComponent
                id="INGRESO_ID"
                datos={ingresos}
                encabezado={header}
                useSeach={false}
                usePagination={false}
                botones={{
                    agregar: {
                        label: <>Cargar Ingreso <Icon sx={{ my: 0.5, ml: 1, fontSize: 16 }} className="c-cargar" /></>,
                        onClick: () => fnOpenFormCargar()
                    },
                    filtrar: {
                        label: <>Filtrar Ingresos <Icon sx={{ my: 0.5, ml: 1, fontSize: 16 }} className="c-lista" /></>,
                        onClick: () => fnOpenFormFiltrar()
                    }
                }}
                eventosDeTabla={{
                    delete: (row) => console.log('eliminar'),

                    auth: (row) => {
                        console.log('ver detalle')
                    },
                    pdf: (row) => {
                        generarPDFfn(row.content.INGRESO_ID)
                    },
                    excel: (row) => {
                        crearExcel(row.content.INGRESO_ID)
                    }
                }}

            />
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',   
                    marginTop: 2
                }}
            >
            <Pagination
            color="primary" count={params.last_page} page={params.page} 
             showFirstButton showLastButton 
             onChange={hanlePage}
             />
                
            <br/>
            </Box>
            <FormularioCargarIngreso
                open={openFormCargar}
                close={fnCloseFormCargar}
            />
            <FormularioFiltrarIngreso
                anchor="right"
                open={openFormFiltrar}
                close={()=> setOpenFormFiltrar(false)}
                fnFiltrarIngresos={fnFiltrarIngresos}
                botonesAbajo
            />

        </Box>

    )
}

export default TablaIngresos