import react, { useState, useCallback, useMemo, useEffect } from "react";
import TablaEquipos from "../../views/Equipos/TablaEquipos";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { Box, Typography } from "@mui/material";
import { api } from "../../api";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useFetchTipos } from "../../hooks/Fetch/useFetchCatalog";


const ListaEquipos = () => {


    const dispatch = useDispatch();
    const [datos, setDatos] = useState([])
    const [estados, setEstados] = useState([])
    const [valores, setValores] = useState({ cod_tipo: null, equipo_operativo: "todos" })

    // obtiene filtrados el tipo de transporte
    const transportes = useFetchTipos({ tipo_tabla: "TRANSPORTE" });

    //Filtro de datos por el tipo y el operativo
    const inputs = useMemo(() => [
        {
            tipo: "select",
            options: transportes.data,
            label: "transporte",
            id: "cod_tipo",
            val: valores["cod_tipo"]
        },
        {
            tipo: "radio",
            id: "equipo_operativo",
            label: "operativo",
            val: valores["equipo_operativo"],
            options: [
                { label: "todos", value: "todos" },
                { label: "Operativo", value: true },
                { label: "No operativo", value: false }
            ]
        }
    ], [transportes.data, valores])

    console.log(datos.map(d => d.equipo_operativo));

    //Filtros para datos
    //lista de filtros para la lista de datos
    const lista = useMemo(() =>
        datos.map((i) => ({ ...i, estado: estados.find((e) => i.cod_estado === e.cod_estado) }))
            .filter((i) => (valores["cod_tipo"] ? i.cod_tipo === valores["cod_tipo"].value : true))
            .filter((i) => (valores["equipo_operativo"] !== "todos" ? i.equipo_operativo === valores["equipo_operativo"] : true)),
        [datos, estados, valores]
    )


    // obtiene los estados de la base de datos
    const obtenerEstados = useCallback(async () => {
        await api
            .get("api/appweb/listaestados")
            .then(({ data }) => setEstados(data.data))
            .catch((e) => console.error(e));
    }, []);

    // obtiene los datos de equipos de la base de datos
    const obtenerDatos = useCallback(async () => {
        await
            api.get("/api/appweb/lista-equipo")
                .then(({ data }) => setDatos(data.data))
                .catch((e) => console.error(e));
    }, [])

    //Realiza la consulta
    const hacerConsultas = useCallback(async () => {
        await Promise.all([obtenerEstados(), obtenerDatos()]).then(() => dispatch(apagarCarga()));
    }, [obtenerEstados, obtenerDatos, dispatch]);

    useEffect(() => {
        hacerConsultas();
    }, [hacerConsultas]);

    useEffect(() => {
        dispatch(encenderCarga());
    }, [dispatch]);


    return (
        <Box sx={{ p: 1, m: 0 }}>
            <Typography variant="h3">Equipos</Typography>

            <Box sx={{ p: 1, m: 0, my: 1 }}>
                <FormularioComponent
                    inputs={inputs}
                    onInput={({ id, val }) => {
                        let nuevoValor = val;
                        if (id === "equipo_operativo") {
                            if ( val === "todos") {
                                nuevoValor = "todos";
                            } else {
                                nuevoValor = val === true || val === "true";
                            }
                        }
                        setValores((v) => ({ ...v, [id]: nuevoValor }))
                    }}
                    botones={{
                        agregar: { visible: false },
                    }}
                />
            </Box>

            <TablaEquipos lista={lista} reConsultar={obtenerDatos} catalogos={{ estados }} />
        </Box>
    )
}

export default ListaEquipos;