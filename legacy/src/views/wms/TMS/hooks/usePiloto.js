import { useCallback } from "react"
import { api } from "../../../../api"
function usePiloto() {

const createPiloto = useCallback(async(datos)=>{
const {data} =await api.post('api/appweb/crear-piloto', {
    ...datos
})
},[])

  return {
    createPiloto
  }
}

export default usePiloto