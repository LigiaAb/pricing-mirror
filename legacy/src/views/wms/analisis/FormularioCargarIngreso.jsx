import { Box, Drawer, Snackbar } from "@mui/material"
import FormularioComponent from "../../../components/Formulario/FormularioComponent"
import { useCallback, useMemo, useState } from "react"
import TablaComponent from "../../../components/Tabla/TablaComponent"
import exceljs from 'exceljs'
import useAlmacen from "../almacen/hooks/useAlmancen"
import useIngreso from "./hooks/useIngresos"
import moment from "moment"

const FormularioCargarIngreso = ({ open, close }) => {

    const { almacenes, entidades, paises } = useAlmacen()
    const { monedas, regimenes, aduanas, ingresotipo, ingresoDoc, sendIngreso, result, closeSnake } = useIngreso()

    const [valores, setValores] = useState({
        archivo: null
    })
    const [fileData, setFileData] = useState({
        select_almacen: null,
        select_entidad: null,
        select_aduana: null,
        select_regimen: null,
        select_pais: null,
        select_moneda: null,
        select_ingresotipo: null,
        select_ingdoc: null,
        documento: "",
        fechaing: "",
        proveedor: "",
        embarque: "",
        dembarque: "",
        dua: "",
        detalle: []
    })


    const inputs = useMemo(() => {
        const { archivo } = valores
        return [
            {
                tipo:'titulo',
                val:"Nuevo ingreso"
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
            , select_moneda
            , select_regimen
            , select_aduana
            , select_ingresotipo
            , select_ingdoc
            , documento,
            fechaing,
            proveedor,
            embarque,
            dembarque,
            dua,
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
                //grupoId: "propiedades",
                id: "select_aduana",
                tipo: "select",
                val: select_aduana,
                options: aduanas.map(i => {
                    return {
                        value: i.puntoenlace_id,
                        label: i.puntoenlace_id + " - " + i.puntoenlace_nombre
                    }
                }),
                label: "Aduana",
                actions: [
                    { nombre: "accion 1", onClick: () => { }, icono: "c-suma" },
                ],
            },
            {
                //grupoId: "propiedades",
                tipo: "select",
                id: "select_regimen",
                val: select_regimen,
                options: regimenes.map(i => {
                    return {
                        value: i.regimen_id,
                        label: i.regimen_id + " - " + i.regimen_prefijo
                    }
                }),
                label: "Regimen",
                /* actions: [
                    { nombre: "accion 1", onClick: () => { }, icono: "c-suma" },
                ],
                */
            },
            {
                tipo: 'select',
                id: 'select_pais',
                label: 'Pais de origen',
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
                id: 'select_moneda',
                label: 'Moneda',
                val: select_moneda,
                options: monedas.map((i) => {
                    return {
                        value: i.cod_moneda,
                        label: i.cod_moneda + " - " + i.simbolo_moneda
                    }
                })
            },
            {
                tipo: 'select',
                id: 'select_ingresotipo',
                label: 'Tipo de ingreso',
                val: select_ingresotipo,
                options: ingresotipo.map(i => {
                    return {
                        value: i.ingtipo_id,
                        label: i.ingtipo_id + " - " + i.ingtipo_description
                    }
                }),
            },
            {
                tipo: 'select',
                id: 'select_ingdoc',
                label: 'Tipo de documento',
                val: select_ingdoc,
                options: ingresoDoc.map(i => {
                    return {
                        value: i.ingdoc_id,
                        label: i.ingdoc_id + " - " + i.ingdoc_description
                    }
                }),
            },
            {
                tipo: 'text',
                label: 'Documento',
                id: 'documento',
                val: documento
            },
            {
                tipo: 'date',
                label: 'Fecha del documento',
                id: 'fechaing',
                val: fechaing
            },
            {
                tipo: 'text',
                label: 'Proveedor/consignatario',
                id: 'proveedor',
                val: proveedor
            },
            {
                tipo: 'text',
                label: 'EMBARQUE',
                id: 'embarque',
                val: embarque
            },
            {
                tipo: 'text',
                label: 'DEMBARQUE',
                id: 'dembarque',
                val: dembarque
            },
            {
                tipo: 'text',
                label: 'DUA',
                id: 'dua',
                val: dua
            }

        ]
    }, [fileData, almacenes, entidades, regimenes, monedas, ingresotipo])

    const onInput = async ({ id, val }) => {

        if (val) {
            await loadFile(val)
        }
        setValores((v) => ({ ...v, [id]: val }));
    };

    const onInputsForm = useCallback(async ({ id, val }) => {
        setFileData((v) => ({ ...v, [id]: val }
        ))
    }, [])

    const encabezado = [
        {
            name: "noTarima",
            label: 'Numero de tarima',
            campo: 'noTarima',
            align: 'center'
        },
        {
            name: "articulo",
            label: 'Articulo',
            campo: 'artcode',
            align: 'center'
        },
        {
            name: "Lote",
            label: 'Lote',
            campo: 'lote',
            align: 'center'
        },
        {
            name: "cajaxtarima",
            label: 'Cajas por tarima',
            campo: 'cajasxtarima',
            align: 'center'
        },
        {
            name: "unixcaja",
            label: 'Unidades por caja',
            campo: 'unixcaja',
            align: 'center'
        },
        {
            name: "expiracion",
            label: 'Expiración',
            campo: 'expiracion',
            align: 'center'
        },
        {
            name: "valor",
            label: 'valor',
            campo: 'valor',
            align: 'center'
        },
        {
            name: "documento",
            label: 'Localización',
            campo: 'localizacion',
            align: 'center'
        },
        ,
        {
            name: "serie",
            label: 'Serie',
            campo: 'serie',
            align: 'center'
        },
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

    const loadFile = async(file) => {
        console.log(almacenes)
        try {
            let dataRead = {}

            const arrayBuffer = await fileToArrayBuffer(file)
            const workbook = new exceljs.Workbook()
            await workbook.xlsx.load(arrayBuffer)

            const sheetTemplate = workbook.getWorksheet(1)
            dataRead.almacen_id = sheetTemplate.getCell('C1').value
            dataRead.entidad_id = sheetTemplate.getCell('C2').value
            dataRead.aduana_id = sheetTemplate.getCell('C3').value
            dataRead.regimen_id = sheetTemplate.getCell('C4').value
            dataRead.pais_id = sheetTemplate.getCell('C5').value
            dataRead.monedas_id = sheetTemplate.getCell('C6').value
            dataRead.ingresotipo_id = sheetTemplate.getCell('C7').value
            dataRead.tipdoc_id = sheetTemplate.getCell('F1').value
            dataRead.documento = sheetTemplate.getCell('F2').value
            dataRead.fechaing = sheetTemplate.getCell('F3').value
            dataRead.consignatario = sheetTemplate.getCell('F4').value
            dataRead.embarque = sheetTemplate.getCell('F5').value
            dataRead.dembarque  = sheetTemplate.getCell('F6').value
            dataRead.dua = sheetTemplate.getCell('F7').value

            let inicio = 11
            let detalle = []
            let index = 1

            for (let fila = inicio; fila < sheetTemplate.rowCount; fila++) {
                
                const noTarCelda =  sheetTemplate.getCell(`A${fila}`)
                const noTarima = noTarCelda.value

                const artcodCelda = sheetTemplate.getCell(`B${fila}`);
                const artcode = artcodCelda.value;

                const loteCelda = sheetTemplate.getCell(`E${fila}`)
                const lote = loteCelda.value

                const cajasxtarimaCelda = sheetTemplate.getCell(`F${fila}`)
                const cajasxtarima = cajasxtarimaCelda.value

                const unixcajaCelda = sheetTemplate.getCell(`G${fila}`)
                const unixcaja = unixcajaCelda.value

                const expiracionCelda = sheetTemplate.getCell(`I${fila}`)
                const expiracion = expiracionCelda.value

                const valorCelda = sheetTemplate.getCell(`J$${fila}`)
                const valor = valorCelda.value

                const localizacionCelda = sheetTemplate.getCell(`K$${fila}`)
                const localizacion = localizacionCelda.value
                const serieCelda = sheetTemplate.getCell(`L$${fila}`)
                const serie = serieCelda.value

                if (artcode && lote && cajasxtarima) {

                    detalle.push({
                        artcode: artcode,
                        lote: lote,
                        cajasxtarima: cajasxtarima,
                        unixcaja: unixcaja,
                        expiracion: moment(expiracion, 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ').isValid()?moment(expiracion, 'ddd MMM DD YYYY HH:mm:ss [GMT]ZZ').add(1,'day').format('YYYY-MM-DD'):'',
                        valor: Number(valor.result).toFixed(2),
                        localizacion: localizacion,
                        numero: index,
                        noTarima: noTarima,
                        serie: serie,
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

                    index += 1
                }

            }
            const find_almacen= almacenes.find((i)=>i.ALMACEN_ID == dataRead.almacen_id)

            const find_entidad= entidades.find(i=>i.entidad_id == dataRead.entidad_id)
            const find_aduana= aduanas.find(i=>i.puntoenlace_id == dataRead.aduana_id)
            const find_regimen= regimenes.find(i=>i.regimen_id == dataRead.regimen_id)
            const find_pais= paises.find(i=>i.cod_pais == dataRead.pais_id)
            const find_moneda= monedas.find(i=>i.cod_moneda == dataRead.monedas_id)
            const find_ingresotipo= ingresotipo.find(i=>i.ingtipo_id == dataRead.ingresotipo_id)
            const find_ingdoc= ingresoDoc.find(i=>i.ingdoc_id == dataRead.tipdoc_id)

            setFileData((v) => ({
                ...v,
                select_almacen: find_almacen? {value: find_almacen.ALMACEN_ID,label: find_almacen.ALMACEN_NOM}:null,
                select_entidad: find_entidad? {value: find_entidad.entidad_id,label: find_entidad.entidad_nombre}:null,
                select_aduana: find_aduana? {value: find_aduana.puntoenlace_id,label: find_aduana.puntoenlace_nombre}:null,
                select_regimen: find_regimen? {value: find_regimen.regimen_id,label: find_regimen.regimen_description}:null,
                select_pais: find_pais? {value: find_pais.cod_pais,label: find_pais.nombre_pais}:null,
                select_moneda: find_moneda? {value: find_moneda.cod_moneda,label: find_moneda.simbolo_moneda}:null,
                select_ingresotipo: find_ingresotipo? {value: find_ingresotipo.ingtipo_id,label: find_ingresotipo.ingtipo_description}:null,
                select_ingdoc: find_ingdoc? {value: find_ingdoc.ingdoc_id,label: find_ingdoc.ingdoc_description}:null,
                documento: dataRead.documento,
                fechaing: dataRead.fechaing ,
                proveedor: dataRead.consignatario,
                embarque: dataRead.embarque,
                dembarque: dataRead.dembarque,
                dua: dataRead.dua,
                detalle: detalle
            }
            ))


        } catch (error) {
            console.log(error)
        }
    }

    const valideInputs=() => {

        if( fileData.select_almacen 
            && fileData.select_entidad 
            && fileData.select_pais 
            && fileData.select_moneda
            && fileData.detalle.length > 0
        ){
            return true
        }
        
    return false

    }

  
    const saveIng = async () => {
        try {
             if(valideInputs()==false   ){
                return
            } 

              await sendIngreso(fileData)
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

    const deleteDetalle = useCallback((numero) => {
        console.log("elimiando", numero)
    setFileData((prev) => {
        // Buscar el registro a eliminar por su número único (identificador de fila)
        const registroAEliminar = prev.detalle.find(item => item.numero === numero);
        if (!registroAEliminar) return prev;

        const tarimaEliminar = Number(registroAEliminar.noTarima); // Asegurar que sea número

        const ocurrencias = prev.detalle.filter(item => Number(item.noTarima) === tarimaEliminar).length;

        if (ocurrencias > 1) {
            return {
                ...prev,
                detalle: prev.detalle.filter(item => item.numero !== numero)
            };
        } else {
            const nuevoDetalle = prev.detalle
                .filter(item => item.numero !== numero) // Eliminar
                .map(item => {
                    const tarimaActual = Number(item.noTarima);
                    if (tarimaActual > tarimaEliminar) {
                        return { ...item, noTarima: tarimaActual - 1 };
                    }
                    return item;
                });
            return {
                ...prev,
                detalle: nuevoDetalle
            };
        }
    });
        console.log("eliminado", numero)

}, []);

    return (
        <Box
            sx={{ p: 2 }}
        >

            <Drawer
                anchor="'right'"
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
                            bottom:'5%',
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
                            visible: true,
                            texto: 'Confimar ingreso',
                            onClick: () => saveIng()
                        }
                    }
                    }
                />
                <TablaComponent
                    sx={
                        {
                            p: 16
                        }
                    }
                    eventosDeTabla={{
                        delete:(row)=>deleteDetalle(row.content.numero),

                    }}
                    id={"numero"}
                    encabezado={encabezado}
                    datos={fileData.detalle}

                />
            </Drawer>
            <Snackbar
            open={result.open}
            autoHideDuration={6000}
            onClose={closeSnake}
            message={result.message}
            sx={
                {
                    bgcolor:'red',
                    color: 'white'
                }
            }
        />
        </Box>
    )
}

export default FormularioCargarIngreso