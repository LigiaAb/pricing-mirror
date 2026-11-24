import { useCallback, useEffect, useMemo, useState } from "react"
import  {api}  from "../../../api"


export default function useArticulos(){

    const [articulos, setArticulos]  = useState([])
    const [entidades, setEntidades] =  useState([])
    const getArticulos = useCallback(async()=>{
    const {data} =await api.get("/api/appweb/lista-articulos")

        setArticulos(data.data)

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
            console.log("Error OA"+error)
            
        }
        
    },[])


    const  sumbitArticulo =useCallback((formData)=>{
        try {
            const {data} = api.post("/api/appweb/crear-articulo",formData)

            if(data){
                getArticulos()
            }
            return 
        } catch (error) {
            console.log(error)
        }
    },[])
    

  
    useEffect(()=>{
        getArticulos()
        load_entidades()
        
    },[ getArticulos, load_entidades])
    
    return {
        articulos,
        entidades,
        sumbitArticulo,
        getArticulos
    }
}

