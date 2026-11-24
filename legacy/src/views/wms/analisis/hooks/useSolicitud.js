import { useCallback, useEffect, useState } from "react"
import { api } from "../../../../api"
import moment from "moment"
export default function useSolicitud() {
    const [articulos, setArticulos] = useState([])
    const [estadoIng, setEstadoIng] = useState([])
    const [solicitudes, setSolicitudes] = useState([])
    const getArticulos = useCallback(async () => {
        const { data } = await api.get("/api/appweb/lista-articulos")

        setArticulos(data.data)

    }, [])

    const getEstadoDocIng = useCallback(async () => {   
        const {data} = await api.get("/api/appweb/lista-estadodocing")
        setEstadoIng(data.data)
    
    },[])

     const getSolicitudes = useCallback(async () => {   
        const {data} = await api.get("/api/appweb/lista-solicitudes")
        setSolicitudes(data.data.map(i=>{

            return {
                ...i,
                solicitud_fecha: moment(i.solicitud_fecha, 'YYYY-MM-DD').format('YYYY-MM-DD'),
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
        }))
    
    },[])

        const saveSolicitud = useCallback(async (data) => {
        try {
            const response = await api.post('/api/appweb/crear-solicitud', data)
            return response.data
        }   catch (error) { 
            return error.response.data 
        }
    },[])

    useEffect(() => {
        Promise.all([
            getArticulos(),
            getEstadoDocIng(),
            getSolicitudes()
        ])
    }, [getArticulos, getEstadoDocIng, getSolicitudes])


    return {
        articulos,
        estadoIng,
        saveSolicitud,
        solicitudes,
        getSolicitudes
    }
}