import React, { useCallback, useEffect, useState } from "react";
import FormularioCompletoEmpresa from "../../views/Empresa1/FormularioCompletoEmpresa";
import TabComponent from "../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
// import ModalEmpresa from "./ModalEmpresa";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import TablaCentroCosto from "../../views/CentroCosto/TablaCentroCosto";
import { decryptId } from "../../api/encryptDecrypt";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { useDispatch } from "react-redux";
import FormularioCompletoCentroCosto from "../../views/CentroCosto/FormularioCompletoCentroCosto";
const VistaEmpresa = () => {
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
  const dispatch = useDispatch();
  const [item, setItem] = useState({});
  const [paises, setPaises] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [centroCostoSeleccionado, setCentroCostoSeleccionado] = useState(null);
  /**
   * CONSULTA DE DATOS
   * Consulta a base de datos de la lista
   */
  //  Obtener el catalogo de paices
  const obtenerCentrosCosto = useCallback(async () => {
    await api
      .get("api/appweb/listacentrocosto", { params: { cod_empresa: id } })
      .then(({ data }) => setCentrosCosto(data.data))
      .catch((e) => console.error(e));
  }, [id]);
  //  Obtener el catalogo de paices
  const obtenerPais = useCallback(async () => {
    await api
      .get("api/appweb/listapaises")
      .then(({ data }) => setPaises(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    id === "new"
      ? null
      : await api
          .get("api/appweb/listaempresas", { params: { cod_empresa: id } })
          .then(({ data }) => {
            setItem(data.data[0]);
            obtenerCentrosCosto();
          })
          .catch((e) => console.error(e));
  }, [id, obtenerCentrosCosto]);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerDatos(), obtenerPais()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerPais, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* Boton para regresar a la lista */}
      <Button color="primary" onClick={() => navigate("/configuracion/organizacion/empresa")}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button>
      {/* Nombre del elemento */}
      <Typography variant="h2">Empresa {id}</Typography>
      {/* Tabs para la pantalla */}
      <TabComponent
        opciones={[
          // Tab principal con el formulario completo relacionado al CRUD
          {
            id: 1,
            label: "Informacion",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <FormularioCompletoEmpresa id={id} empresa={item} catalogos={{ paises }} />
              </Box>
            ),
          },
          {
            id: 2,
            label: "Centros de Costo Asociados",
            content: (
              <Box>
                <TablaCentroCosto
                  esComponente
                  catalogos={{ empresas: [item] }}
                  lista={centrosCosto}
                  hijo
                  reConsultar={hacerConsultas}
                  obtenerFilaSeleccionada={(fila) => setCentroCostoSeleccionado(fila.content)}
                  acciones={{ ver: (fila) => setCentroCostoSeleccionado(fila.content) }}
                />
                {centroCostoSeleccionado && <FormularioCompletoCentroCosto reConsultar={hacerConsultas} centro_costo={centroCostoSeleccionado} catalogos={{ empresas: [item] }} />}
              </Box>
            ),
          },
          // // [ TEMPORAL ] Tab que contiene el modal para maquetacion
          // {
          //   id: 2,
          //   label: "Vista de formulario Modal",
          //   content: (
          //     <Box sx={{ p: 1, m: 0 }}>
          //       <ModalEmpresa />
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
export default VistaEmpresa;
