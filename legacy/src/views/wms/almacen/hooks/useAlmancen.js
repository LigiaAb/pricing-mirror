import { useCallback, useEffect, useState } from "react"
import {api} from '../../../../api'
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
export default function useAlmacen(){
    const [almacenes, setAlmacenes] = useState([]) 
    const [paises, setPaises] = useState([])
    const [entidades, setEntidades] = useState([])


    const load_almacenes = useCallback(async()=>{
        try {
            const {data} = await api.get("api/appweb/lista-almacenes")
            setAlmacenes(data.data.data)
        } catch (error) {
            console.log(error)
        }
    },[])

    const load_paises =  useCallback(async()=>{
        try {
            const {data} = await api.get("/api/appweb/listapaises")

            setPaises(data.data)
        } catch (error) {
            console.log(error)
        }
    },[])

    const load_entidades  = useCallback(async ()=>{
    try {
        const {data} =await  api.get("/api/appweb/lista-entidad",{
            params:{
                tipo_entidad:'CLIENTE'
            }
        })

        setEntidades(data.data.data)
    } catch (error) {
        console.log(error)

    }

    },[])

    const navigate = useNavigate()
    const {cod_usuario}= useSelector((state)=>state.auth)
    const create_almacen =  useCallback(async(formData)=>{

        const {data} = await api.post("/api/appweb/crear-almacen", {...formData,cod_usuario})
        navigate("/wms/wms-catalogo/almacen")
    },[])


    useEffect(()=>{ 
        load_almacenes()
        load_paises()
        load_entidades()

    },[load_almacenes])
    return{
        almacenes,
        load_almacenes,
        paises,
        create_almacen,
        entidades
    }
} 