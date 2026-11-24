import React, { useCallback, useEffect, useState } from "react";
import FormularioCompletoOpcion from "../../views/Opcion/FormularioCompletoOpcion";
import TabComponent from "../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
// import ModalOpcion from "./ModalOpcion";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import OpcionAccion from "../../views/RolCategoriaOpcionAccion/OpcionAccion";
const VistaOpcion = () => {
  /**
   * PARAMETROS DE URL
   * Obtener la lista de paramentros de la url (id)
   */
  let { encryptedId } = useParams();
  const id = decryptId(encryptedId);
  /**
   * USE NAVIGATE
   * Navegacion para regresar a la lista anterior y cualquier ruta necesaria en el futuro
   */
  const navigate = useNavigate();
  /**
   * USE STATE
   * Lista de States
   */
  const [item, setItem] = useState({});
  const [estados, setEstados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const dispatch = useDispatch();
  /**
   * CONSULTA DE DATOS
   * Consulta a base de datos de la lista
   */
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    id === "new"
      ? null
      : await api
          .get("api/appweb/lista-opcion", { params: { cod_opcion: id } })
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
  //  Obtener el catalogo de categorias
  const obtenerCategorias = useCallback(async () => {
    await api
      .get("api/appweb/lista-categoria")
      .then(({ data }) => setCategorias(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEstados(), obtenerDatos(), obtenerCategorias()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerEstados, obtenerCategorias, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* Boton para regresar a la lista */}
      <Button color="primary" onClick={() => navigate(`/configuracion/accesos/opcion`)}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button>
      {/* Nombre del elemento */}
      <Typography variant="h6">Opcion {id}</Typography>
      {/* Tabs para la pantalla */}
      <TabComponent
        opciones={[
          // Tab principal con el formulario completo relacionado al CRUD
          {
            id: 1,
            label: "Informacion",
            icono: "c-documento",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <FormularioCompletoOpcion id={id} opcion={item} catalogos={{ estados, categorias }} />
              </Box>
            ),
          },
          {
            id: 2,
            label: "Acciones Asignadas",
            icono: "c-transferir",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <OpcionAccion id={id} opcion={item} />
              </Box>
            ),
          },
          // // [ TEMPORAL ] Tab que contiene el modal para maquetacion
          // {
          //   id: 2,
          //   label: "Vista de formulario Modal",
          //   content: (
          //     <Box sx={{ p: 1, m: 0 }}>
          //       <ModalOpcion />
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
export default VistaOpcion;
