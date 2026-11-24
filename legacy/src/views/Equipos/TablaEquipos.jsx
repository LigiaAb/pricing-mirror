import react from "react";
import { Box, Typography } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import { useNavigate } from "react-router-dom";
import { encryptId } from "../../api/encryptDecrypt";
import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { api } from "../../api";
import { useFetchEstados, useFetchTipos } from "../../hooks/Fetch/useFetchCatalog";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";

 
const TablaEquipos = (props) => {


    const { lista, reConsultar,  } = props;
    // const { estados = []} = catalogos;
    const transportes = useFetchTipos({tipo_tabla:"TRANSPORTE"});
    const estados = useFetchEstados({"cod_tipo": 25});
    const navigate = useNavigate();

    const [viewForm, setViewForm] = useState(false) 
    const[mostrarAlerta, setMostrarAlerta] = useState(false);
    const [filaSeleccionada, setFilaSeleccionada] = useState(null);

    // Encabezados
const encabezados = [
    { name: "cod_equipo", label: "Id", campo: "cod_equipo", align: "center"},
    { name: "equipo_codigo", label: "Codigo", campo: "equipo_codigo", align: "center"},
    { name: "equipo_descripcion", label: "Operativo", campo:"equipo_descripcion", align: "center"},
    { name: "equipo_tamanio", label: "Tamaño", campo: "equipo_tamanio", align: "center"},
    { name: "equipo_capacidad", label: "Capacidad", campo:"equipo_capacidad", align: "center"},
    { name: "equipo_operativo", label: "Operativo", campo: "equipo_operativo", align:"center", formato: (val) => <Typography color={val ? "success" : "error"} component="span" className={val ? "c-cheque" : "c-x1"} />},
    { name: "equipo_teu", label: "Teu", campo: "equipo_teu", align: "center"},
    { name: "cod_estado", label: "Estado", campo: "cod_estado", formato: (val,row) => <Typography color={val==1 ? "success" : "error"} component="span">{row.content.estado?.estado_desc}</Typography> },
    { name: "cod_tipo", label: "Tipo", campo: "cod_tipo",  formato: (val,row) => <Typography component="span">{row.content.transporte?.label}</Typography>},
];



// Tabla Equipos
const datos = useMemo(() => {
    return lista.map((i) => {
        // Generacion de objeto para propiedades de celdas
        let o = {};
        Object.keys(i).forEach(
            (d) =>
            (o[d] = {
                color: undefined,   
                bold: undefined,   
            })
        );

        return {
            ...i,

           estado: estados.data?.find((e) => i.cod_estado === e.cod_estado),
            transporte: transportes.data?.find(t => t.value === i.cod_tipo),

            accionesDeTabla: {
                add: false,
                view: true,
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

            propiedadesDeTabla: o,
        }

    })
}, [lista, estados.data, transportes])


const verAFila = (fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`);

const Editar =(fila) => fila && navigate(`${encryptId(`${fila?.id}`)}`)

const eliminarFila = (fila) => api.post("/api/appweb/actualizar-equipo", {...fila.content, cod_estado: 4}).then((i) => reConsultar())

console.log("datos de la tabla", datos);


    return(
        <Box sx={{ p: 1, m: 0 }}>
            <TablaComponent 
            id = "cod_equipo"
            encabezado = {encabezados}
            datos = {datos}
            select={false}
            eventosDeTabla={{
                view: verAFila,
                edit: Editar,
                delete: (fila) => {
                    setMostrarAlerta(true);
                    setFilaSeleccionada(fila)
                }
            }}
            botones={{ nuevo: {label: "nuevo", onClick: () => navigate(`${encryptId(`new`)}`), color: "primary"}}}
            multipleSelect
            />
            <ActionAlertComponent 
            aceptar={() =>{
                eliminarFila(filaSeleccionada);
                setMostrarAlerta(false);
            }}
            cancelar={() => {
                setMostrarAlerta(false);
            }}
            openDialog = {mostrarAlerta}
            tipo="error"
            handleClose={() => {}}
            content={"¿Esta seguro que desea eliminar el registro?"}
            />
        </Box>
    )
}

TablaEquipos.propTypes = {
  // LISTA DE DATOS
  lista: PropTypes.array,
  // CATALOGOS
  estados: PropTypes.array,
  // EVENTOS
  reConsultar: PropTypes.func,
};

export default TablaEquipos;