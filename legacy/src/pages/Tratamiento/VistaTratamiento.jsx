import React, { useCallback, useEffect, useState, useMemo } from "react";
import FormularioCompletoTipo from "../../views/Tipo/FormularioCompletoTipo";
import TabComponent from "../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
import FormularioTratamiento from "../../views/Tratamiento/FormularioTratamiento";
// import ModalTipo from "./ModalTipo";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
const VistaTratamiento = () => {
  /**
   * # ---------------------------------------------------------------------------- #
   * #                               PARAMETROS DE URL                              #
   * # ---------------------------------------------------------------------------- #
   * Obtener la lista de paramentros de la url (id)
   */
  let { encryptedId } = useParams();
  let id = useMemo(()=>decryptId(encryptedId),[encryptedId]);
  //let id = decryptId(encryptedId);
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
          .get("api/appweb/lista-tratamiento", { params: { cod_tratamiento: id } })
          .then(({ data }) => setItem(data.data[0]))
          .catch((e) => console.error(e));
  }, [id]);

  //  Obtener el catalogo de estados
  const obtenerEstados = useCallback(async () => {
    await 
    api.get("api/appweb/listaestados")
      .then(({ data }) => setEstados(data.data))
      .catch((e) => console.error(e));  
  }, []);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEstados(),obtenerDatos()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerEstados, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* Boton para regresar a la lista */}
      <Button color="primary" onClick={() => navigate(`/configuracion/crud/tratamiento`)}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button>
      {/* Nombre del elemento */}
      <Typography variant="h4">Tratamiento {id}</Typography>
      {/* Tabs para la pantalla */}
      <TabComponent
        opciones={[
          // Tab principal con el formulario completo relacionado al CRUD
          {
            id: 1,
            label: "Informacion de componente",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                {/* <FormularioCompletoTipo id={id} tipo={item} catalogos={{ estados }} /> */}
                <FormularioTratamiento id={id} tratamiento={item} catalogos ={{estados}} />
                {/*<span>{JSON.stringify(item)}</span>*/}
              </Box>
            ),
          },
        ]}
      />
    </Box>
  );
};
export default VistaTratamiento;
