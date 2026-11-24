// update comment
import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { styled, useTheme } from '@mui/material/styles';
import { Box, Button, Drawer, Grid, Icon, Typography, IconButton } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../api";
import { decryptId } from "../../../api/encryptDecrypt";
import { useDispatch, useSelector } from "react-redux";
import { apagarCarga, encenderCarga } from "../../../store/slices/status/statusSlice";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import FormularioEntidadAsignacion from "../../../views/Entidad/EntidadAsignacion/FormularioEntidadAsignacion";
import TablaComponent from "../../../components/Tabla/TablaComponent";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
import LoaderComponent from "@/components/Loader/LoaderComponent";
// import VirtualizedTableComponent from "../../../components/Tabla/VirtualizedTableComponent";

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { useFetchEmpleados } from "@/hooks/Fetch/useFetchConfiguracion";
import { 
    useFetchEmpresas,
    useFetchCentrosCosto,
    useFetchTipos,
    useFetchEstados
} from "@/hooks/Fetch/useFetchCatalog";

import TablaEntidadAsignacionPersonal from "@/views/Entidad/EntidadAsignacion/TablaEntidadAsignacionPersonal";
import { ReporteCliente } from "@/views/Actividades/ReporteCliente";
import { GraficasEmbarques } from "@/views/Actividades/GraficasEmbarques";

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-start',
}));


const VistaMisAsignaciones = (props) => {
    /**
     * # ---------------------------------------------------------------------------- #
     * #                                 USE NAVIGATE                                 #
     * # ---------------------------------------------------------------------------- #
     * Navegacion para regresar a la lista anterior y cualquier ruta necesaria en el futuro
     */
    const navigate = useNavigate();
    const formRef = useRef(null);
    /**
     * # ---------------------------------------------------------------------------- #
     * #                                   USE STATE                                  #
     * # ---------------------------------------------------------------------------- #
     * Lista de States
     */

    const estados = useFetchEstados();
    const tipos = useFetchTipos();
    const empresas = useFetchEmpresas();
    const cencos = useFetchCentrosCosto();
    const empleados = useFetchEmpleados();

    const usuario = useSelector((state) => state.auth);
    const { cod_usuario, puesto_default } = useSelector((state) => state.auth);
    const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);

    let { updateData, setUpdateData } = props;
    const [data, setData] = useState({
        fecha_inicio: null,
        fecha_fin: null,
        tipo: null,
    });
    const [asignaciones, setAsignaciones] = useState([]);
    const [entidades, setEntidades] = useState([]);
    const [cliente, setCliente] = useState(null);
    // const [tipos, setTipos] = useState();
    const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState([]);
    const [entidadesSeleccionadas, setEntidadesSeleccionadas] = useState([]);
    const [open, setOpen] = useState(false);
    const [open2, setOpen2] = useState(false);
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false);

  const encabezadosEmpleados = [
    // { name: "cod_empleado", label: "Código", campo: "cod_empleado" },
    { name: "nom_empleado", label: "Nombre", campo: "nom_empleado", formato: (val, row) => `${row.content.nom_empleado} ${row.content.apellido_emp}` },
  ];

  const encabezadosClientes = [
    // { name: "cod_empleado", label: "Código", campo: "cod_empleado" },
    { name: "entidad_nombre", label: "Nombre", campo: "entidad_nombre" },
  ];

    const handleDrawerOpen = async (asignacion) => {
        await api
        .get("api/appweb/recuperar-datos-entidad-resumen", {
            params: { cod_entidad:  asignacion.cod_entidad},
        })
        .then(({ data }) => {
            const clienteData = data.data[0]
            if(!clienteData) return

            setCliente({
                estado: clienteData.estado_desc,
                entidad_id: clienteData.cod_entidad,
                entidad_nombre: clienteData.entidad_nombre,
                ciudad: clienteData.nombre_ciudad,
                pais: clienteData.nombre_pais,
                industria: clienteData.nom_industria_es,
                tipo: clienteData.entidad_clasificacion,
                asesor: usuario
            })
        })
        .catch((e) => console.error(e));
        setOpen(true);
    };
    const handleDrawerClose = () => {
        setCliente(null)
        setOpen(false);
    };

    const handleSolicitud = () => {
        setOpen2(i => !i)
    };
    useEffect(() => {
        if(!!open2) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [open2]); 

  /**
   * # ---------------------------------------------------------------------------- #
   * #                               CONSULTA DE DATOS                              #
   * # ---------------------------------------------------------------------------- #
   * Consulta a base de datos de la lista
   */

//   // Realizar la consulta

  const obtenerAsignaciones = useCallback(async () => {
        console.log("update")
        await api
            .get("api/appweb/lista-asignacion-entidad", {
                params: { cod_usuario },
            })
            .then(({ data }) => {
            setAsignaciones(data.data);
            })
            .catch((e) => console.error(e));
    }, [updateData]);
  

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerAsignaciones()]).then(() => dispatch(apagarCarga()));
  }, [obtenerAsignaciones, dispatch]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  return (
    <Box sx={{ p: 1, m: 0 }} position={"relative"}>
        <LoaderComponent open={isLoading} />
        <TablaEntidadAsignacionPersonal 
            lista={asignaciones} 
            onView={handleDrawerOpen}
            onNew={handleSolicitud}
            updateData={updateData} setUpdateData={setUpdateData} 
        />

        <Box sx={{mt: 2}} ref={formRef} display={!!open2 ? "box" : "none"}>
            <Typography variant="h4">Solicitar Asignacion</Typography>
            <FormularioEntidadAsignacion 
                asignacion={null} 
                solicitud={true}
                // query={query}
                catalogos={{ 
                    empresas: empresas.data || [], 
                    cencos: cencos.data || [], 
                    empleados: empleados.data || [], 
                    tipos: tipos.data || [], 
                    estados: estados.data || [], 
                    entidades,
                }} 
            />
        </Box>
        
        <Drawer
            sx={{
                width: "100%",
                height: "92vh",
                zIndex: 20000,
                '& .MuiDrawer-paper': {
                    width: "100%",
                    zIndex: 20000,
                    height: "92vh",
                    boxSizing: 'border-box',
                },
                '& .MuiDrawer-root': {
                    zIndex: 20000,
                },
            }}
            variant="persistent"
            anchor="bottom"
            open={open}
        >
            <DrawerHeader sx={{ backgroundColor: 'primary.main', justifyContent: "flex-end", color: "white.main", px: 1 }}>
                <Icon
                    onClick={handleDrawerClose}
                    className={"c-x1"}
                    sx={{
                        mr: 3, 
                        "&:hover": {
                            cursor: "pointer",
                        },
                    }}
                />
            </DrawerHeader>
            <Box sx={{ m: 1 }}>
                {
                    !!cliente && 
                    <GraficasEmbarques 
                        cardAsignacion={true}
                        cliente={cliente} 
                        usuario={usuario}
                        cod_empresa={currentEmpresa.cod_empresa} cod_cenco={currentCentroCosto.cod_cc} 
                        // cod_empresa={1} cod_cenco={16} usuario={{cod_usuario: 52, nombre: "TEST"}}
                    />
                }
            </Box>
        </Drawer>
    </Box>
  );
};

export default VistaMisAsignaciones;
