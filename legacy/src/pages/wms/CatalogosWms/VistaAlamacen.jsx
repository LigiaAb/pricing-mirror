import { useCallback, useEffect } from "react";
import FormularioAlmacen from "../../../views/wms/almacen/FormularioAlmacen"
import { decryptId } from "../../../api/encryptDecrypt";
import { useNavigate,useParams} from "react-router-dom";
import { useDispatch } from "react-redux";
import { encenderCarga,apagarCarga } from "../../../store/slices/status/statusSlice";
const VistaAlmacen =()=>{
 let { encryptedId } = useParams();
  let id = decryptId(encryptedId);
  const navigate= useNavigate()
    const dispatch = useDispatch();


  const obtenerDatos = useCallback(async () => {
    id === "new"
      ? null
      : await api
          .get("api/appweb/lista-accion", { params: { cod_accion: id } })
          .then(({ data }) => setItem(data.data[0]))
          .catch((e) => console.error(e));
  }, [id]);

   const hacerConsultas = useCallback(async () => {
    dispatch(encenderCarga());
    try {
      await Promise.all([ obtenerDatos()]);
    } finally {
      dispatch(apagarCarga());
    }
  }, [obtenerDatos, dispatch]);
  // Ejecutar las consultas al montar el componente
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
    return(
        <>
        <FormularioAlmacen/>
        </>
    ) 
}

export default VistaAlmacen