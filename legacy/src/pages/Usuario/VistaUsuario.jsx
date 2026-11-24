import React, { useCallback, useEffect, useState } from "react";
import FormularioCompletoUsuario from "../../views/Usuario/FormularioCompletoUsuario";
import TabComponent from "../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
// import ModalUsuario from "./ModalUsuario";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
const VistaUsuario = () => {
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
  const [jsonModify, setJsonModify] = useState(JSON.stringify({}, null, 2));
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
          .get("api/appweb/listausuario", { params: { cod_usuario: id } })
          .then(({ data }) => {
            setItem(data.data[0]);
            setJsonModify(JSON.stringify(JSON.parse(data.data[0].json), null, 2));
          })
          .catch((e) => console.error(e));
  }, [id]);
  //  Obtener el catalogo de estados
  const obtenerEstados = useCallback(async () => {
    await api
      .get("api/appweb/listaestados")
      .then(({ data }) => setEstados(data.data))
      .catch((e) => console.error(e));
  }, []);
  const guardarJson = useCallback(async () => {
    console.log({ jsonModify });
    await api.post("api/appweb/actualizar-json-rol", {
      cod_rol: Number(id),
      json_rol: JSON.stringify(JSON.parse(jsonModify)),
    });
  }, []);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEstados(), obtenerDatos()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerEstados, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(dispatch(encenderCarga()));
  }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* Boton para regresar a la lista */}
      <Button color="primary" onClick={() => navigate("../..")}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button>
      {/* Nombre del elemento */}
      <Typography variant="h4">Usuario {id}</Typography>
      {/* Tabs para la pantalla */}
      <TabComponent
        opciones={[
          // Tab principal con el formulario completo relacionado al CRUD
          {
            id: 1,
            label: "Informacion",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <FormularioCompletoUsuario id={id} usu={item} catalogos={{ estados }} />
              </Box>
            ),
          },
          {
            id: 3,
            label: "Json",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <FormularioComponent
                  inputs={[{ id: "json", val: jsonModify, tipo: "textarea", height: "50vh" }]}
                  botones={{ agregar: { texto: "Guardar", onClick: guardarJson } }}
                  onInput={({ id, val }) => setJsonModify(val)}
                  unaColumna
                />
                {/* <pre>{JSON.stringify(jsonModify, null, 2)}</pre> */}
              </Box>
            ),
          },
          // // [ TEMPORAL ] Tab que contiene el modal para maquetacion
          // {
          //   id: 2,
          //   label: "Vista de formulario Modal",
          //   content: (
          //     <Box sx={{ p: 1, m: 0 }}>
          //       <ModalUsuario />
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
export default VistaUsuario;
