import React, { useCallback, useState } from 'react'
import {api} from "../../../../api"        
 const useReporteInventarioExistencias = () => {   
    
    const [datosInventario, setDatosInventario] = useState([])
    
    const getInventario = useCallback(async(entidad_id)=>{

        const {data} =await api.get("/api/appweb/reporte-inventario",{
            params:{
                entidad_id:entidad_id
            }
        })
        
        setDatosInventario(data.data)
    },[])
    return {
        datosInventario,
        getInventario
    }
}
export default useReporteInventarioExistencias
