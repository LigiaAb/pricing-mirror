import { useState } from "react"
import TablaComponent from "../../../components/Tabla/TablaComponent"
import { FormDespacho } from "./FormDespacho"
import useDespachos from "./hooks/useDespachos"
export default function TablaDespachos(){
    const [open, setOpen] =useState(false)

    const {despachos, obtenerDespachoDetalleyPDF, obtenerDespachos} = useDespachos()
    const headers = [
        { label: "Salida", campo: "salida_id", name: "salida_id", align: "center"}
        , { label: "Almacen", campo: "almacen_nom", name: "almacen_nom", align: "center"}
        , { label: "Cliente", campo: "entidad_nombre", name: "entidad_nombre", align: "center"}
        , { label: "Indentificación de salida", campo: "salida_identificacion", name: "salida_identificacion", align: "center"}
        , { label: "Cantidad de tarimas", campo: "salida_cantidadtarimas", name: "salida_cantidadtarimas", align: "center"}
        , { label: "Fecha de salida", campo: "salida_fecha", name: "salida_fecha", align: "center"}
    ]   

    return(
        <>
        <div>
            <TablaComponent
            id="salida_id"
            encabezado={headers}
            datos={despachos}
            botones={{
                add:{
                    label: "Despachar",
                    visible:true,
                    onClick: ()=> setOpen(true)
                }
            }}
            eventosDeTabla={
                {
                    pdf:(row)=>{
                        obtenerDespachoDetalleyPDF(row.content.salida_id)
                    },
                    delete:(row)=>{
                        console.log("Eliminar salida:", row.content.salida_id)
                    }
                }
            }
            />
            <FormDespacho
            obtenerDespachos={obtenerDespachos}
            open={open}
            onClose={() => setOpen(false)}
            />
        </div>

        </>
    )
}