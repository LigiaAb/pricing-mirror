import React, { useCallback, useEffect, useState } from "react";
import FormularioCompletoTipo from "../../views/Tipo/FormularioCompletoTipo";
import TabComponent from "../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
// import ModalTipo from "./ModalTipo";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import FormularioConfiguracionActividad from "../../views/ConfiguracionActividad/FormularioConfiguracionActividad";
const VistaConfiguracionActividades = () => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                               PARAMETROS DE URL                              #
   * # ---------------------------------------------------------------------------- #
   * Obtener la lista de paramentros de la url (id)
   */
  let { encryptedId } = useParams();
  let id = decryptId(encryptedId);
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                 USE NAVIGATE                                 #
   * # ---------------------------------------------------------------------------- #
   * Navegacion para regresar a la lista anterior y cualquier ruta necesaria en el futuro
   */
  const navigate = useNavigate();
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                   USE STATE                                  #
   * # ---------------------------------------------------------------------------- #
   * Lista de States
   */
  const [item, setItem] = useState(null);
  const [estados, setEstados] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cencos, setCencos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const dispatch = useDispatch();
  /**
   * # ---------------------------------------------------------------------------- #
   * #                               CONSULTA DE DATOS                              #
   * # ---------------------------------------------------------------------------- #
   * Consulta a base de datos de la lista
   */
  // Obtener los datos del crud
  // const obtenerDatos = useCallback(async () => {
  //   id === "new"
  //     ? null
  //     : await api
  //         .get("api/appweb/lista-tratamiento", { params: { tratamiento_id: id } })
  //         .then(({ data }) => {
  //           // setItem(data.data[0])
  //         })
  //         .catch((e) => console.error(e));
  // }, [id]);
  // // Realizar la consulta
  // const hacerConsultas = useCallback(async () => {
  //   await Promise.all([obtenerDatos()]).then(() => dispatch(apagarCarga()));
  // }, [obtenerDatos, dispatch]);
  // useEffect(() => {
  //   hacerConsultas();
  // }, [hacerConsultas]);
  // useEffect(() => {
  //   dispatch(encenderCarga());
  // }, [dispatch]);

  // const obtenerDatos = useCallback(async () => {
  //   await api
  //     .get("api/appweb/lista-configuracion-actividad")
  //     .then(({ data }) => setDatos(data.data))
  //     .catch((e) => console.error(e));
  // }, []);

  const obtenerDatos = useCallback(async () => {

    id === "new"
    ? null
    : await api
      .get("api/appweb/lista-configuracion-actividad", { params: { cod_configuracion_actividad: id } })
      .then(({ data }) => setItem(data.data[0]))
      .catch((e) => console.error(e));
  }, [id]);

  const obtenerEstados = useCallback(async () => {
    await api
      .get("api/appweb/listaestados")
      .then(({ data }) => setEstados(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerEmpresas = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresas(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerCencos = useCallback(async () => {
    await api
      .get("api/appweb/listacentrocosto")
      .then(({ data }) => setCencos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerTipos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo")
      .then(({ data }) => setTipos(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Obtener los datos del crud
 
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEstados(), obtenerTipos(), obtenerDatos(), obtenerEmpresas(), obtenerCencos()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerEstados, obtenerTipos, obtenerEmpresas, obtenerCencos, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);


  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* Boton para regresar a la lista */}
      <Button color="primary" onClick={() => navigate("/configuracion/crud/config-actividades")}>
        <Icon className="c-derecha-arriba-izquierda" sx={{mr: 2}}/>
        Regresar a la lista
      </Button>
      {/* Nombre del elemento */}
      <Typography variant="h4">
        {id !== "new" ? `Configuración de Actividad ${id}` : "Nueva configuración de actividad"}
      </Typography>
      <Box sx={{ p: 1, m: 0 }}>
        <FormularioConfiguracionActividad id={id} configuracion={item} catalogos={{ estados, tipos, empresas, cencos }} />
      </Box>
    </Box>
  );
};
export default VistaConfiguracionActividades;
