import TablaComponent from '@/components/Tabla/TablaComponent'
import React, { useEffect, useState } from 'react'
import useReporteInventarioExistencias from './hooks/useReporteInventarioExistencias'
import FormularioFiltroReporte from './FormularioFiltroReporte'

function TablaReporteInventarioExistencias() {
const {getInventario, datosInventario}=useReporteInventarioExistencias()

    const [open, setOpen] = useState(false)

  

    const fnClose=()=>{
        setOpen(false)
    }
    
        const encabezados = [
    { name: "articulo_sku", label: "SKU Artículo", campo: "articulo_sku" },
    { name: "ingest_descripcion", label: "Estado", campo: "ingest_descripcion" },
    //{ name: "ingmov_bulto", label: "Bulto", campo: "ingmov_bulto" },
    //{ name: "ingmov_unidades", label: "Unidades", campo: "ingmov_unidades" },
    { name: "ingmov_lote", label: "Lote", campo: "ingmov_lote" },
    { name: "ingmov_fecvenc", label: "Fecha Vencimiento", campo: "ingmov_fecvenc" },
    //{ name: "ingmov_reserva", label: "Reserva", campo: "ingmov_reserva" },
    //{ name: "ingmov_salidas", label: "Salidas", campo: "ingmov_salidas" },
    //{ name: "ingmov_ajuste", label: "Ajuste", campo: "ingmov_ajuste" },
   // { name: "ingmov_merma", label: "Merma", campo: "ingmov_merma" },
    //{ name: "ingmov_devolucion", label: "Devolución", campo: "ingmov_devolucion" },
    //{ name: "ingmov_valor", label: "Valor", campo: "ingmov_valor" },
    { name: "disponibles", label: "Disponibles", campo: "disponibles" },
];



  return (
    <>
    <TablaComponent
    id="numero_fila"
    encabezado={encabezados}
    datos={datosInventario}
    botones={
        {
            filtrar:{
                label:'Filtrar',
                onClick:()=>{setOpen(true)}
            }
        }
    }
    />
    <FormularioFiltroReporte
     open={open}
     anchor="right"
     close = {fnClose}
     fnGetInventario= {getInventario}
    />
    </>
  )
}

export default TablaReporteInventarioExistencias
