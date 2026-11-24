import React, { useCallback, useEffect, useState } from "react";
import FormularioCompletoCorrelativo from "../../views/Correlativo/FormularioCompletoCorrelativo";
import TabComponent from "../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
// import ModalCorrelativo from "./ModalCorrelativo";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
const VistaCorrelativo = () => {
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
  const [item, setItem] = useState({});
  const [estados, setEstados] = useState([]);
  const [tipo, setTipo] = useState([]);
  const [empresa, setEmpresa] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const dispatch = useDispatch();
  /**
   * # ---------------------------------------------------------------------------- #
   * #                               CONSULTA DE DATOS                              #
   * # ---------------------------------------------------------------------------- #
   * Consulta a base de datos de la lista
   */
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    id === "new"
      ? null
      : await api
          .get("api/appweb/lista-correlativos", { params: { correlativo_id: id } })
          .then(({ data }) => setItem(data.data[0]))
          .catch((e) => console.error(e));
  }, [id]);
  //  Obtener el catalogo de estados
  const obtenerEstados = useCallback(async () => {
    await api
      .get("api/appweb/listaestados")
      .then(({ data }) => setEstados(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerTipos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo")
      .then(({ data }) => setTipo(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerCentrosCosto = useCallback(async () => {
    await api
      .get("api/appweb/listacentrocosto")
      .then(({ data }) => setCentrosCosto(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerEmpresas = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresa(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEstados(), obtenerDatos(), obtenerTipos(), obtenerCentrosCosto(), obtenerEmpresas()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerEstados, obtenerTipos, obtenerCentrosCosto, obtenerEmpresas, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* Boton para regresar a la lista */}
      <Button color="primary" onClick={() => navigate(`/configuracion/crud/correlativo`)}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button>
      {/* Nombre del elemento */}
      <Typography variant="h4">Correlativo {id}</Typography>
      {/* Tabs para la pantalla */}
      <TabComponent
        opciones={[
          // Tab principal con el formulario completo relacionado al CRUD
          {
            id: 1,
            label: "Informacion de componente",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <FormularioCompletoCorrelativo id={id} correlativo={item} catalogos={{ estados, tipo, empresa, centrosCosto }} />
              </Box>
            ),
          },
          // // [ TEMPORAL ] Tab que contiene el modal para maquetacion
          // {
          //   id: 2,
          //   label: "Vista de formulario Modal",
          //   content: (
          //     <Box sx={{ p: 1, m: 0 }}>
          //       <ModalCorrelativo />
          //     </Box>
          //   ),
          // },
          // Opcion adicional referente a alguna información de apoyo
          // { id: 3, label: "Informacion de opcion", content: <Box sx={{ p: 1, m: 0 }}></Box> },
        ]}
      />
    </Box>
  );
};
export default VistaCorrelativo;
