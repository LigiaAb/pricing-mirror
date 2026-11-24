import { useState, useCallback } from "react"
import TablaComponent from "../../../components/Tabla/TablaComponent"
import { Box, Icon } from "@mui/material"
import FormularioSolicitud from "./FormularioSolicitud"
import useSolicitud from "./hooks/useSolicitud"
export default function TablaSolitudes() {
    const [formModalSolicitud,setFormModalSolicitud] = useState(false)
    const{solicitudes, getSolicitudes} = useSolicitud()
    
    const onClose =async ()=>{
        await getSolicitudes()
        setFormModalSolicitud(false)
    }

    const fnOpenForm = useCallback(()=>{
        setFormModalSolicitud(true)
    }, [])

    const columnassolicitudeTable=[
        {
            name: "solicitud_id",
            label: 'Numero de solicitud',
            campo: 'solicitud_id',
            align: 'center'
        },
        {
            name: "entidad_nombre",
            label: 'Cliente',
            campo: 'entidad_nombre',
            align: 'center'
        },
        {
            name: "almacen",
            label: 'Almacén',
            campo: 'almacen_nom',
            align: 'center'
        },
        {
            name: "line",
            label: 'Fecha',
            campo: 'solicitud_fecha',
            align: 'center'
        },
        {
            name: "soliticut_fac",
            label: 'Factura de la solicitud',
            campo: 'solicitud_fac',
            align: 'center'
        },
        {
            name: "consignatario",
            label: 'Consignatario',
            campo: 'solicitud_consignatario',
            align: 'center'
        },
    
    ]

    return (
        <>
            <Box>
                <TablaComponent
                    select={false}
                    id="solicitud_id"
                    encabezado={columnassolicitudeTable}
                    datos={solicitudes}
                    onFilaSeleccionada={(seleccion) => console.log(seleccion)}
                    eventosDeTabla={{
                        delete:(row)=>console.log('eliminar'),
                        pdf:(row)=>{
                            console.log('descargar pdf')
                        }
                    }}
                    botones={{
                        agregar: {
                            label: <>Crear solicitud <Icon sx={{ my: 0.5, ml: 1, fontSize: 16 }} className="c-suma" /></>,
                            onClick:()=>fnOpenForm()
                        }
                    }}
                />
                <FormularioSolicitud
                    open={formModalSolicitud}
                    close={onClose}
                />
            </Box>
        </>
    )
}
