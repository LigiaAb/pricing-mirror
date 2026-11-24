import { Box, Drawer, Snackbar, Portal } from "@mui/material"
import FormularioComponent from "../../../components/Formulario/FormularioComponent"
import { useCallback, useMemo, useState } from "react"
import TablaComponent from "../../../components/Tabla/TablaComponent"
import exceljs from 'exceljs'
import useAlmacen from "../almacen/hooks/useAlmancen"
import useIngreso from "./hooks/useIngresos"
import useArticulos from "../../wms/Articulos/useArticulos"
import moment from "moment"
import useSolicitud from "./hooks/useSolicitud"
import { set } from "date-fns"


const FormularioSolicitud = ({ open, close }) => {

    const { almacenes, entidades, paises } = useAlmacen()
    const { monedas, regimenes, aduanas, ingresotipo, ingresoDoc } = useIngreso()
    const { articulos, estadoIng, saveSolicitud } = useSolicitud()
    const [openSnake, setOpenSnake] = useState(false)
    const [messgageSnackbar, setMessageSnackbar] = useState('')
    const [keySnakebar, setKeySnakebar] = useState('1')
    const [fileInputKey, setFileInputKey] = useState(1)
    const [valores, setValores] = useState({
        archivo: null
    })

    const tipos_salidas = [
        {
            value: 1,
            label: '1  Por declaracion del cliente'
        },
        {
            value: 2,
            label: '2 FEFO'
        }
    ]

    const [fileData, setFileData] = useState({
        select_almacen: null,
        select_entidad: null,
        select_aduana: null,
        select_regimen: null,
        select_pais: null,
        select_moneda: null,
        select_solicitudtipo: null,
        select_ingdoc: null,
        select_tipotrans: null,
        documento: "",
        fecsal: "",
        proveedor: "",
        embarque: "",
        dembarque: "",
        dua: "",
        op: 0,
        select_bultent: null,
        detalle: []
    })
    const [detsol, setDetSol] = useState({
        articulo_id: null,
        cantidad_id: 0,
        lote_id: "",
        tipo_salida_id: null,
        estado_mer_id: null
    })
    const inputs = useMemo(() => {
        const { archivo } = valores
        return [
            {
                tipo: 'titulo',
                val: "Nueva solicitud"
            },
            {
                tipo: 'archivo',
                label: 'Archivo Ingreso',
                id: 'select_id',
                val: archivo,
                acceptedFiles: ".xls,.xlsx"
            }
        ]
    }, [valores])

    const inputsForm = useMemo(() => {
        const { select_almacen
            , select_entidad
            , select_pais
            , select_solicitudtipo
            , op,
            fecsal,
            consignatario,
            despcliente,
            factura,
            embarque,
            select_bultent,
            select_tipotrans,
        } = fileData
        return [
            {
                tipo: 'select',
                id: 'select_almacen',
                label: 'Almacen',
                val: select_almacen,
                options: almacenes.map(i => {
                    return {
                        value: i.ALMACEN_ID,
                        label: `${i.ALMACEN_ID} - ${i.ALMACEN_NOM}`
                    }
                })
            },
            {
                tipo: 'select',
                id: 'select_entidad',
                label: 'Cliente',
                val: select_entidad,
                options: entidades.map(item => {
                    return {
                        value: item.entidad_id,
                        label: `${item.entidad_id} - ${item.entidad_nombre}`
                    }
                })
            },
            {
                tipo: 'select',
                id: 'select_solicitudtipo',
                label: 'Tipo de solicitud',
                val: select_solicitudtipo,
                options: [
                    {
                        value: '1',
                        label: 'Salida'
                    },
                    {
                        value: '2',
                        label: 'Proceso'
                    }
                ],
            },
            {
                tipo: 'select',
                id: 'select_pais',
                label: 'Pais de Destino',
                val: select_pais,
                options: paises.map(i => {
                    return {
                        value: i.cod_pais,
                        label: `${i.cod_pais} -${i.ref_pais} - ${i.nombre_pais}`
                    }
                })
            },

            {
                tipo: 'select',
                id: 'select_bultent',
                label: 'Bultos enteros',
                val: select_bultent,
                options: [{
                    value: '1',
                    label: 'Si'
                }, {
                    value: '0',
                    label: 'NO'
                }]
            },
            {
                tipo: 'select',
                id: 'select_tipotrans',
                label: 'Tipo transporte',
                val: select_tipotrans,
                options: [{
                    value: '1',
                    label: 'Carguero'
                }, {
                    value: '2',
                    label: 'Terrestre'
                }, {
                    value: '3',
                    label: 'Mari'
                }]
            },
            {
                tipo: 'text',
                label: 'Factura del cliente',
                id: 'factura',
                val: factura
            },
            {
                tipo: 'text',
                label: 'O.P',
                id: 'op',
                val: op
            },
            {
                tipo: 'date',
                label: 'Fecha aproximada de salida',
                id: 'fecsal',
                val: fecsal
            },
            {
                tipo: 'text',
                label: 'Consignatario',
                id: 'consignatario',
                val: consignatario
            },
            /* 
            {
            tipo: 'text',
            label: 'Remesa',
            id: 'remesa',
            val: embarque
            }, */
            {
                tipo: 'text',
                label: 'Despacho del cliente',
                id: 'despcliente',
                val: despcliente
            }

        ]
    }, [fileData, almacenes, entidades, monedas])

    const inputsDetSol = useMemo(() => {
        const { articulo_id, cantidad_id, lote_id, tipo_salida_id, estado_mer_id } = detsol
        return [
            {
                tipo: 'titulo',
                val: 'Detalle de la solicitud',
                id: 'titulodet'
            },
            {
                tipo: 'select',
                label: 'Producto',
                id: 'articulo_id',
                val: articulo_id,
                options: articulos.map(item => {
                    return {
                        value: item.articulo_id,
                        label: `${item.articulo_id} -${item.articulo_sku}-${item.articulo_des}`
                    }
                }),
            },
            {
                tipo: 'number',
                label: 'Cantidad',
                id: 'cantidad_id',
                val: cantidad_id
            },
            {
                tipo: 'text',
                label: 'Lote',
                id: 'lote_id',
                val: lote_id
            },
            {
                tipo: 'select',
                label: 'Tipo de salida',
                id: 'tipo_salida_id',
                options: tipos_salidas,
                val: tipo_salida_id
            },
            {
                tipo: 'select',
                label: 'Estado de mercaderia',
                id: 'estado_mer_id',
                options: estadoIng.map(item => {
                    return {
                        value: item.ingest_id,
                        label: `${item.ingest_id} - ${item.ingest_descripcion}`
                    }
                }),
                val: estado_mer_id
            }
        ]
    }, [articulos, estadoIng, detsol])

    const onInput = async ({ id, val }) => {

        if (val) {
            setValores((v) => ({ ...v, [id]: val }));
            await loadFile(val)
        }
            setValores((v) => ({ 'archivo': null }));
            setFileInputKey(prev => prev + 1)

    };
    const onInputsDetSol = useCallback(({ id, val }) => {
        setDetSol((v) => ({ ...v, [id]: val }))
    }, [])

    const onInputsForm = useCallback(async ({ id, val }) => {
        setFileData((v) => ({ ...v, [id]: val }
        ))
    }, [])

    const encabezado = [
        {
            name: "line",
            label: 'Linea',
            campo: 'numero',
            align: 'center'
        },
        {
            name: "product_sku",
            label: 'Sku',
            campo: 'articulo_sku',
            align: 'left'
        },
        {
            name: "product_des",
            label: 'Descripcion',
            campo: 'articulo_des',
            align: 'left'
        },
        {
            name: "cantidad",
            label: 'Cantidad',
            campo: 'cantidad_id',
            align: 'center'
        },
        {
            name: "Lote",
            label: 'Lote',
            campo: 'lote_id',
            align: 'center'
        },
        {
            name: "estado_mer",
            label: 'Estado de Mercaderia',
            campo: 'estado_merdes',
            align: 'center'
        },
        {
            name: "tiposalida",
            label: 'Tipo de salida',
            campo: 'tipo_salida_des',
            align: 'center'
        }
    ]

    const fileToArrayBuffer = (file) => {
        return new Promise((resolve, reject) => {

            if (!(file instanceof File)) {
                reject(new Error('El objeto no es un archivo válido'))
                return
            }


            const reader = new FileReader()

            reader.onload = (event) => {
                resolve(event.target.result)
            }

            reader.onerror = (error) => {
                reject(new Error(`Error al leer el archivo: ${error}`))
            }

            reader.onabort = () => {
                reject(new Error('Lectura del archivo abortada'))
            }

            reader.readAsArrayBuffer(file)
        })
    }

    const loadFile = async (file) => {
        console.log(articulos)

        try {
            let dataRead = {}

            const arrayBuffer = await fileToArrayBuffer(file)
            const workbook = new exceljs.Workbook()
            await workbook.xlsx.load(arrayBuffer)

            const sheetTemplate = workbook.getWorksheet(1)
            dataRead.almacen_id = sheetTemplate.getCell('C4').value
            dataRead.fecha = sheetTemplate.getCell('C6').value
            dataRead.transporte = sheetTemplate.getCell('C8').value
            dataRead.entidad_id = sheetTemplate.getCell('F4').value
            dataRead.documento = sheetTemplate.getCell('F5').value
            dataRead.solicitadoa = sheetTemplate.getCell('F6').value
            dataRead.piloto = sheetTemplate.getCell('I8').value
            dataRead.consignatario = sheetTemplate.getCell('I4').value
            dataRead.destino = sheetTemplate.getCell('I6').value
            dataRead.ordencliente = sheetTemplate.getCell('I9').value
            dataRead.placa = sheetTemplate.getCell('G7').value

            let inicio = 12
            let detalle = []
            let index = 1

            for (let fila = inicio; fila < sheetTemplate.rowCount; fila++) {

                const artcodCelda = sheetTemplate.getCell(`A${fila}`);
                const artcode = artcodCelda.value;

                const loteCelda = sheetTemplate.getCell(`C${fila}`)
                const lote = loteCelda.value

                const unidadesCelda = sheetTemplate.getCell(`D${fila}`)
                const unidades = unidadesCelda.value

                const estadoMerCelda = sheetTemplate.getCell(`E${fila}`)
                const estado_mer = estadoMerCelda.value

                const tipoSalidaCelda = sheetTemplate.getCell(`F${fila}`)
                const tipo_salida = tipoSalidaCelda.value
            
                
                if(artcode){

                    const articuloFind = articulos.find(i => i.articulo_sku.toString().trim() == artcode);
                    
                    const articulo_id = articuloFind ? articuloFind.articulo_id : null
                    
                    if(articulo_id ==undefined || articulo_id == null){
                        setKeySnakebar(artcode)
                        setOpenSnake(true)
                        setMessageSnackbar(`El artículo con SKU ${artcode} no se encontró en el catalogo.`)
                        continue
                    }
                    
                    if (articulo_id && artcode && unidades) {
                        const articulo_des = articulos.find(i => i.articulo_sku.toString().trim() == artcode.toString().trim())?.articulo_des.toString().trim() || null
                        
                        detalle.push({
                        articulo_id: articuloFind.articulo_id,
                        articulo_sku: artcode,
                        articulo_des: articuloFind.articulo_des,
                        cantidad_id: unidades,
                        lote_id: lote,
                        tipo_salida_id: tipos_salidas.find(i => i.value == tipo_salida)?.value || null,
                        tipo_salida_des: tipos_salidas.find(i => i.value == tipo_salida)?.label || '',
                        estado_mer_id: estadoIng.find(i => i.ingest_id == estado_mer)?.ingest_id || null,
                        estado_merdes: estadoIng.find(i => i.ingest_id == estado_mer)?.ingest_descripcion || '',
                        numero: index,
                        accionesDeTabla: {
                            add: false,
                            view: false,
                            go: false,
                            copy: false,
                            paste: false,
                            auth: false,
                            edit: false,
                            excel: false,
                            pdf: false,
                            download: false,
                            delete: true,
                        },
                    })
                    
                }
                    index += 1
                }
                
            }
            const find_almacen = almacenes.find((i) => i.ALMACEN_ID == dataRead.almacen_id)

            const find_entidad = entidades.find(i => i.entidad_id == dataRead.entidad_id)
            const find_aduana = aduanas.find(i => i.puntoenlace_id == dataRead.aduana_id)
            const find_regimen = regimenes.find(i => i.regimen_id == dataRead.regimen_id)
            const find_pais = paises.find(i => i.cod_pais == dataRead.pais_id)
            const find_moneda = monedas.find(i => i.cod_moneda == dataRead.monedas_id)
            const find_ingresotipo = ingresotipo.find(i => i.ingtipo_id == dataRead.ingresotipo_id)
            const find_ingdoc = ingresoDoc.find(i => i.ingdoc_id == dataRead.tipdoc_id)

            setFileData((v) => ({
                ...v,
                select_almacen: find_almacen ? { value: find_almacen.ALMACEN_ID, label: find_almacen.ALMACEN_NOM } : null,
                select_entidad: find_entidad ? { value: find_entidad.entidad_id, label: find_entidad.entidad_nombre } : null,
                select_aduana: find_aduana ? { value: find_aduana.puntoenlace_id, label: find_aduana.puntoenlace_nombre } : null,
                select_regimen: find_regimen ? { value: find_regimen.regimen_id, label: find_regimen.regimen_description } : null,
                select_pais: find_pais ? { value: find_pais.cod_pais, label: find_pais.nombre_pais } : null,
                select_moneda: find_moneda ? { value: find_moneda.cod_moneda, label: find_moneda.simbolo_moneda } : null,
                select_ingresotipo: find_ingresotipo ? { value: find_ingresotipo.ingtipo_id, label: find_ingresotipo.ingtipo_description } : null,
                select_ingdoc: find_ingdoc ? { value: find_ingdoc.ingdoc_id, label: find_ingdoc.ingdoc_description } : null,
                documento: dataRead.documento,
                fecsal: dataRead.fecha,
                factura: dataRead.ordencliente,
                consignatario: dataRead.consignatario,
                dua: dataRead.dua,
                detalle: detalle
            }
            ))

            

        } catch (error) {
            console.log(error)
        }

    }

    const valideInputs = () => {

        if (fileData.select_almacen
            && fileData.select_entidad
            && fileData.select_pais
            && fileData.detalle.length > 0
        ) {
            return true
        }

        return false

    }
    const valideInputsDetSol = () => {
        let valide = false

        if (detsol.articulo_id && detsol.cantidad_id > 0 && detsol.tipo_salida_id && detsol.estado_mer_id) {
            valide = true
        }

        return valide

    }
    const addDetailsol = () => {
        if (valideInputsDetSol() == false) {

            return
        }
        const { articulo_id, cantidad_id, lote_id, tipo_salida_id, estado_mer_id } = detsol
        setFileData((v) => ({
            ...v,
            detalle: [
                ...v.detalle,
                {
                    articulo_id: articulo_id.value,
                    articulo_des: articulos.find(i => i.articulo_id == articulo_id.value)?.articulo_des || '',
                    cantidad_id: cantidad_id,
                    lote_id: lote_id,
                    tipo_salida_id: tipo_salida_id,
                    tipo_salida_des: tipo_salida_id.label,
                    estado_mer_id: estado_mer_id.value,
                    estado_merdes: estado_mer_id.label,
                    numero: v.detalle.length + 1,
                    accionesDeTabla: {
                        add: false,
                        view: false,
                        go: false,
                        copy: false,
                        paste: false,
                        auth: false,
                        edit: false,
                        excel: false,
                        pdf: false,
                        download: false,
                        delete: true,
                    },
                }
            ]
        }))

        setDetSol((i) => {
            return {
                ...i,
                articulo_id: null,
                cantidad_id: 0,
                lote_id: '',
            }
        })
    }

    const sendSol = async () => {
        try {
            if (valideInputs() == false) {

                setOpenSnake(true)
                setMessageSnackbar("Faltan campos por llenar")
                return
            }

            await saveSolicitud(fileData)
            setFileData({
                ...fileData,
                select_almacen: null,
                select_entidad: null,
                select_pais: null,
                select_moneda: null,
                documento: '',
                fechaing: '',
                proveedor: '',
                embarque: '',
                dembarque: '',
                dua: '',
                detalle: []
            })

            close()


        } catch (error) {
            //console.log(error)
        }
    }
    const handleCloseSnake = () => {
        setOpenSnake(false)
    }
    const deleteDetalleSol = (row_num) => {
        setFileData((v) => ({
            ...v,
            detalle: v.detalle.filter(i => i.numero !== row_num).map((item, index) => {
                return {
                    ...item,
                    numero: index + 1
                }
            })
        }))
    }

    return (
        <Box
            sx={{ p: 2 }}
        >

            <Drawer
                anchor="right"
                open={open}
                onClose={close}
                sx={{

                    '& .MuiDrawer-paper': {
                        padding: '16px',
                        width: '75%',
                        maxWidth: '95vw',
                        boxSizing: 'border-box',
                        ...('right') && {
                            top: '8%',
                            bottom: '5%',
                            transform: 'translateY(-50%)',
                            height: 'auto',
                        },
                        ...('top') && {
                            left: '15%',
                            transform: 'translateX(-30%)',
                        },
                    },
                }}
            >
                <FormularioComponent
                    inputs={inputs}
                    onInput={onInput}
                    key={fileInputKey}
                    botones={{
                        agregar: {
                            visible: false
                        }
                    }}
                />


                <FormularioComponent
                    inputs={inputsForm}
                    onInput={onInputsForm}
                    botones={{
                        agregar: {
                            visible: false,
                            texto: 'Confimar',
                            onClick: () => saveIng()
                        }
                    }
                    }

                />

                <FormularioComponent
                    inputs={inputsDetSol}
                    onInput={onInputsDetSol}

                    botones={{
                        agregar: {
                            visible: true,
                            texto: 'Agregar detalle',
                            onClick: () => addDetailsol()
                        },
                        enviar: {
                            visible: true,
                            texto: 'Confirmar',
                            onClick: () => sendSol()
                        }
                    }
                    }
                />

                <TablaComponent

                    id={"numero"}
                    encabezado={encabezado}
                    datos={fileData.detalle}
                    eventosDeTabla={{
                        delete: (row) => deleteDetalleSol(row.content.numero),

                    }}

                />
            </Drawer>
            <Portal>

            <Snackbar
                open={openSnake}
                autoHideDuration={6000}
                onClose={handleCloseSnake}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                message={messgageSnackbar}
                sx={
                    {
                        bgcolor: 'red',
                        color: 'white'
                    }
                }
                key={keySnakebar}
                />
                </Portal>
        </Box>
    )
}

export default FormularioSolicitud