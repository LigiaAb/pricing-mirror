import react, {useMemo, useCallback, useState, useEffect} from "react";
import { decryptId } from "../../api/encryptDecrypt";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Box, Button, Icon, Typography } from "@mui/material";
import TabComponent from "../../components/Tabs/TabComponent";
import FormularioEquipos from "../../views/Equipos/FormularioEquipos";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { api } from "../../api";



const VistaEquipos = () => {
    
    let { encryptedId } = useParams();
    let id = useMemo(() => decryptId(encryptedId),[encryptedId])

    const navigate = useNavigate();

    const [item, setItem] = useState();
    const [estados, setEstados] = useState();
    const dispatch = useDispatch();

//Obtener datos del crud
    const obtenerDatos = useCallback(async() =>{
        id === "new"
        ? null
        :await api.get("/api/appweb/lista-equipo" , { params: {cod_equipo: id}})
            .then(({data}) => setItem(data.data[0]))
            .catch((e) => console.error(e));
    },[id]);

    // Obtener el catalogo de estados
    const obtenerEstados = useCallback(async () => {
        await api.get("api/appweb/listaestados")
        .then(({data}) => setEstados(data.data))
        .catch((e) => console.error(e))
    },[]);

    const hacerConsultas = useCallback (async () => {
        await Promise.all([obtenerEstados(), obtenerDatos()]).then(() => dispatch(apagarCarga()));
    }, [obtenerDatos,obtenerEstados, dispatch]);

    useEffect(() => {
        hacerConsultas();
    },[hacerConsultas]);

    useEffect(() => {
        dispatch(encenderCarga());
    }, [dispatch]);


    return(
        <Box sx = {{p:1, m :0 }}>
            <Button color="primary" onClick={() => navigate(`/configuracion/crud/equipos`)}>
                <Icon className="c-derecha-arriba-izquierda" />
                Regresar a la lista
            </Button>

            <Typography variant="h4">Equipos {id}</Typography>

            <TabComponent 
            tabInicial={1}
            opciones={[
                {
                    id:1,
                    label:"Informacion de componente",
                    content: (
                        <Box sx={{ p:1, m: 0}}>
                            <FormularioEquipos id={id} equipos={item} catalogos={{estados}} />
                        </Box>
                    )
                }
            ]}
            
            
            />
        </Box>
    )
}

export default VistaEquipos;