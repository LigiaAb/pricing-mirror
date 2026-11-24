import { useCallback, useEffect, useState } from "react"
import { api } from "../../../../api"
import qrcode from "qrcode-generator"

// hooks para  la mayoria de los procesos propios de los ingresos  que tienen relacion con la venta de ingresos
export default function useIngreso() {
    const [monedas, setMonedas] = useState([])
    const [regimenes, setRegimenes] = useState([])
    const [aduanas, setAduanas] = useState([])
    const [ingresotipo, setIngresoTipos] = useState([])
    const [ingresoDoc, setIngresoDoc] = useState([])
    const [result, setResult] = useState({
        open: false,
        message: "Hola mundo"
    })

    const getMonedas = useCallback(async () => {

        try {
            const { data } = await api.get("api/appweb/lista-moneda", {
                params: {
                    es_operativa: true
                }
            })

            setMonedas(data.data)
        } catch (error) {
        }
    }, [])

    const getRegimenes = useCallback(async () => {

        try {
            const { data } = await api.get("api/appweb/lista-regimen", {
                params: {
                    es_operativa: true
                }
            })

            setRegimenes(data.data)
        } catch (error) {
            console.log(error)
        }
    }, [])
    const getAduanas = useCallback(async () => {
        try {
            const { data } = await api.get("api/appweb/lista-punto_enlace_aduana")
            setAduanas(data.data)

        } catch (error) {
            console.log(error)
        }
    }, [])

    const getIngresoTipo = useCallback(async () => {
        try {
            const { data } = await api.get("api/appweb/lista-ingresotipo")
            setIngresoTipos(data.data)
        } catch (error) {
            console.log(error)
        }
    }, [])

    const getIngresoDoc = useCallback(async () => {
        try {
            const { data } = await api.get("api/appweb/lista-ingresodoc")
            setIngresoDoc(data.data)
        } catch (error) {
            console.log(error)
        }
    }, [])

    const sendIngreso = useCallback(async (formData) => {
        
            const {data} = await api.post("api/appweb/crear-ingreso", { ...formData }).then((res) => res).catch(e=>e)
            
            if(!data.error){


                setResult({
                    open: true,
                    message: "Ingreso cargado correctamente"
                })
            }
            
            return data
    }, [])
    const closeSnake = () => {
        setResult({
            open: false,
            message: "Dont any description"
        })
    }

    useEffect(() => {
        Promise.all([ 
        getMonedas(),
        getRegimenes(),
        getAduanas(),
        getIngresoTipo(),
        getIngresoDoc()
        ])
    }, [getMonedas, getRegimenes, getAduanas, getIngresoTipo, getIngresoDoc])


    return {
        monedas,
        regimenes,
        aduanas,
        ingresotipo,
        ingresoDoc,
        sendIngreso,
        result,
        closeSnake
    }

}
