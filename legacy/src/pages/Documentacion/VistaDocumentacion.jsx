import React, { useCallback, useEffect, useState } from "react";
import FormularioCompletoDocumentacion from "../../views/Documentacion/FormularioCompletoDocumentacion";
import TabComponent from "../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
// import ModalDocumentacion from "./ModalDocumentacion";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import CrearDocumentacion from "../../documentacion/CrearDocumentacion/CrearDocumentacion";
import renderItem from "../../documentacion/renderDocumentacion";
import DocumentacionTest from "../Test/DocumentacionTest";

const VistaDocumentacion = () => {
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
  const [tipoDocumentacion, setTipoDocumentacion] = useState([]);
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
          .get("api/appweb/lista-det-tipo-documentacion", { params: { cod_det_tip_docu: id } })
          .then(({ data }) => setItem(data.data[0]))
          .catch((e) => console.error(e));
  }, [id]);
  //  Obtener el catalogo de estados
  const obtenerTipos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo-documentacion")
      .then(({ data }) => setTipoDocumentacion(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerEstados = useCallback(async () => {
    await api
      .get("api/appweb/listaestados")
      .then(({ data }) => setEstados(data.data))
      .catch((e) => console.error(e));
  }, []);
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEstados(), obtenerDatos(), obtenerTipos()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerEstados, obtenerTipos, dispatch]);

  const actualizarDocumentacion = useCallback(
    async (datos) => {
      let { cod_det_tip_docu, det_desc_docu, cod_tip_docu } = item;
      await api
        .post("api/appweb/actualizar-det-tipo-documentacion", {
          cod_det_tip_docu: cod_det_tip_docu,
          det_desc_docu: det_desc_docu,
          cod_tip_docu: cod_tip_docu,
          det_docu_json: datos,
        })
        .then(({ data }) => hacerConsultas())
        .catch((e) => console.error(e));
    },
    [hacerConsultas, item]
  );

  // Realizar la consulta
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  return (
    <Box sx={{ p: 1, m: 0 }} width="100%">
      {/* Boton para regresar a la lista */}
      <Button color="primary" onClick={() => navigate(`/configuracion/crud/documentacion`)}>
        <Icon fontSize="1rem" className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button>
      {/* Nombre del elemento */}
      <Typography variant="h4">Documentacion {item ? item.det_desc_docu : ""}</Typography>
      {/* Tabs para la pantalla */}
      <TabComponent
        opciones={[
          // Tab principal con el formulario completo relacionado al CRUD
          {
            id: 1,
            label: "Informacion de componente",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <FormularioCompletoDocumentacion id={id} documentacion={item} catalogos={{ estados, tipoDocumentacion }} />
              </Box>
            ),
          },
          {
            id: 2,
            label: "Generación de Documentación",
            content: (
              <Box sx={{ p: 1, m: 0, pb: 2 }}>
                {/* <CrearDocumentacion
                  guardarJSON={actualizarDocumentacion}
                  jsonDocumentacion={
                    item.det_docu_json === "" ? [] : typeof item.det_docu_json === "string" ? JSON.parse(item.det_docu_json) : item.det_docu_json
                  }
                /> */}
                <DocumentacionTest guardar={actualizarDocumentacion} datos={item.det_docu_json}/>
              </Box>
            ),
          },
          // // [ TEMPORAL ] Tab que contiene el modal para maquetacion
          // {
          //   id: 2,
          //   label: "Vista de formulario Modal",
          //   content: (
          //     <Box sx={{ p: 1, m: 0 }}>
          //       <ModalDocumentacion />
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

export default VistaDocumentacion;
