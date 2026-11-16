import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioCompletoMetodo from "../../../views/Tarifas/Metodo/FormularioCompletoMetodo";
import TabComponent from "../../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
// import ModalMetodo from "./ModalMetodo";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../api";
import { decryptId } from "../../../api/encryptDecrypt";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../../store/slices/status/statusSlice";
import PropTypes from "prop-types";
import FormularioCalculoRango from "../../../views/Tarifas/Calculo/FormularioCalculoRango";

const VistaMetodo = (params) => {
  /**
   * # -------------------------------------------------------------------------- #
   * #                                PARAMENTROS                                #
   * # -------------------------------------------------------------------------- #
   * Obtener la lista de paramentros
   */
  const { item: paramItem, catalogos: paramCatalogos, nuevo, reConsultar = () => {} } = params;
  /**
   * # ---------------------------------------------------------------------------- #
   * #                               PARAMETROS DE URL                              #
   * # ---------------------------------------------------------------------------- #
   * Obtener la lista de paramentros de la url (id)
   */
  let { encryptedId } = useParams();
  let id = useMemo(() => (encryptedId ? decryptId(encryptedId) : ""), [encryptedId]);
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
  const [itemConsultado, setItemConsultado] = useState({});
  const [estados, setEstados] = useState([]);
  const dispatch = useDispatch();
  const item = useMemo(() => ({ ...paramItem, ...itemConsultado }), [paramItem, itemConsultado]);
  /**
   * # ---------------------------------------------------------------------------- #
   * #                                 USE CALLBACK                                 #
   * # ---------------------------------------------------------------------------- #
   * Funciones de uso general
   */
  /**
   * # ---------------------------------------------------------------------------- #
   * #                               CONSULTA DE DATOS                              #
   * # ---------------------------------------------------------------------------- #
   * Consulta a base de datos de la lista
   */
  // // Obtener los datos del crud
  // const obtenerDatos = useCallback(async () => {
  //   id === "new"
  //     ? null
  //     : await api
  //         .get("api/appweb/", { params: { cod_metodo: id } })
  //         .then(({ data }) => setItemConsultado(data.data[0]))
  //         .catch((e) => console.error(e));
  // }, [id]);
  // //  Obtener el catalogo de estados
  // const obtenerEstados = useCallback(async () => {
  //   await api
  //     .get("api/appweb/listaestados")
  //     .then(({ data }) => setEstados(data.data))
  //     .catch((e) => console.error(e));
  // }, []);
  // // Realizar la consulta
  // const hacerConsultas = useCallback(async () => {
  //   await Promise.all([obtenerEstados(), obtenerDatos()]).then(() => dispatch(apagarCarga()));
  // }, [obtenerDatos, obtenerEstados, dispatch]);
  // useEffect(() => {
  //   hacerConsultas();
  // }, [hacerConsultas]);
  // useEffect(() => {
  //   dispatch(encenderCarga());
  // }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* Boton para regresar a la lista */}
      {/* <Button color="primary" onClick={() => navigate(`/crud/metodo`)}>
            <Icon className="c-corner-down-left" />
            Regresar a la lista
          </Button> */}
      <FormularioCompletoMetodo id={id} metodo={item} catalogos={paramCatalogos} nuevo={nuevo} reConsultar={reConsultar} />

      {/* Nombre del elemento */}
      {/* <Typography variant="h4">Metodo {id}</Typography> */}
      {/* Tabs para la pantalla */}

      <Grid container>
        {/* <pre>{JSON.stringify({ paramItem }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ itemConsultado }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ item }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ paramCatalogos }, null, 2)}</pre> */}
      </Grid>
    </Box>
  );
};

VistaMetodo.propTypes = {
  item: PropTypes.object,
  catalogos: PropTypes.object,
  nuevo: PropTypes.bool,
  reConsultar: PropTypes.func,
};

export default VistaMetodo;
