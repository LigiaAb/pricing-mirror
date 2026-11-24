import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioCompletoCentroCosto_ from "../../views/CentroCosto_/FormularioCompletoCentroCosto_";
import TabComponent from "../../components/Tabs/TabComponent";
import { Box, Button, Grid, Icon, Typography } from "@mui/material";
// import ModalCentroCosto_ from "./ModalCentroCosto_";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import TablaModulo from "../../views/Modulo/TablaModulo";

import { useSearchParams } from "react-router-dom";
import TransferListsComponent from "../../components/Lists/TransferListsComponent";

function not(a, b, key) {
  return a.filter((value) => b.findIndex((item) => item[key] === value[key]) === -1);
}

const VistaCentroCosto_ = () => {
  /**
   * PARAMETROS DE URL
   * Obtener la lista de paramentros de la url (id)
   */
  let { encryptedId } = useParams();
  let id = decryptId(encryptedId);

  const [searchParams] = useSearchParams();
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
  const [empresas, setEmpresas] = useState([]);
  const [modulosRelacionados, setModulosRelacionados] = useState([]);
  const [modulos, setModulos] = useState([]);
  const dispatch = useDispatch();
  const listaNo = useMemo(
    () =>
      modulos
        .filter((i) => !modulosRelacionados.map((i) => i.cod_modulo).includes(i.cod_modulo))
        .map((i) => ({
          ...i,
          label: () => (
            <Grid container direction="row" sx={{ m: 0, p: 0 }}>
              <Grid size="auto" sx={{ m: 0, p: 0, mr: 1 }}>
                <Icon className={i.ico_modulo} fontSize="0.5rem" sx={{ m: "auto", p: 0 }} />
              </Grid>
              <Grid size="grow" sx={{ m: 0, p: 0, mr: 1, pl: 1 }}>
                {i.cod_modulo} - {i.nom_modulo}
              </Grid>
            </Grid>
          ),
        })),
    [modulos, modulosRelacionados]
  );
  const listaSi = useMemo(
    () =>
      modulos
        .filter((i) => modulosRelacionados.map((i) => i.cod_modulo).includes(i.cod_modulo))
        .map((i) => ({
          ...i,
          label: () => (
            <Grid container direction="row" sx={{ m: 0, p: 0 }}>
              <Grid size="auto" sx={{ m: 0, p: 0, mr: 1 }}>
                <Icon className={i.ico_modulo} fontSize="0.5rem" sx={{ m: "auto", p: 0 }} />
              </Grid>
              <Grid size="grow" sx={{ m: 0, p: 0, mr: 1, pl: 1 }}>
                {i.cod_modulo} - {i.nom_modulo}
              </Grid>
            </Grid>
          ),
        })),
    [modulos, modulosRelacionados]
  );
  /**
   * CONSULTA DE DATOS
   * Consulta a base de datos de la lista
   */
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    id === "new"
      ? null
      : await api
          .get("api/appweb/listacentrocosto", { params: { cod_cc: id } })
          .then(({ data }) => setItem(data.data[0]))
          .catch((e) => console.error(e));
  }, [id]);
  //  Obtener el catalogo de estados
  const obtenerEmpresas = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresas(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerModdulosCC = useCallback(async () => {
    await api
      .get("api/appweb/listaccxmodulo", { params: { cod_cc: id } })
      .then(({ data }) => setModulosRelacionados(data.data))
      .catch((e) => console.error(e));
  }, [id]);
  const obtenerModdulos = useCallback(async () => {
    await api
      .get("api/appweb/listamodulo")
      .then(({ data }) => setModulos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerMenus = useCallback(async () => {
    await api
      .get("api/appweb/lista-menu")
      .then(({ data }) => setModulos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const guardarTodo = async (left, lista) => {
    const listaAAgregar = not(lista, listaSi, "cod_modulo");
    const listaAQuitar = not(listaSi, lista, "cod_modulo");
    console.log(listaAAgregar, listaAQuitar);
    // AGREGAR LISTA
    await Promise.all(listaAAgregar.map((i) => api.post("api/appweb/insertarccxmodulo", { cod_modulo: i.cod_modulo, cod_cc: id, cod_empresa: item.cod_empresa_cc })));
    // // ELIMINAR DE LISTA LISTA eliminarccxmodulo
    await Promise.all(listaAQuitar.map((i) => api.post("api/appweb/eliminarccxmodulo", { cod_modulo: i.cod_modulo, cod_cc: id, cod_empresa: item.cod_empresa_cc })));

    if (listaAAgregar.length > 0 || listaAQuitar.length > 0) await obtenerModdulosCC();
  };
  const guardarUnMovimiento = async (lista) => {
    const listaAAgregar = not(lista, listaSi, "cod_modulo");
    const listaAQuitar = not(listaSi, lista, "cod_modulo");
    console.log(listaAAgregar, listaAQuitar);
    // AGREGAR LISTA
    await Promise.all(listaAAgregar.map((i) => api.post("api/appweb/insertarccxmodulo", { cod_modulo: i.cod_modulo, cod_cc: id, cod_empresa: item.cod_empresa_cc })));
    // // ELIMINAR DE LISTA LISTA eliminarccxmodulo
    await Promise.all(listaAQuitar.map((i) => api.post("api/appweb/eliminarccxmodulo", { cod_modulo: i.cod_modulo, cod_cc: id, cod_empresa: item.cod_empresa_cc })));

    if (listaAAgregar.length > 0 || listaAQuitar.length > 0) await obtenerModdulosCC();
  };
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEmpresas(), obtenerDatos(), obtenerModdulosCC(), obtenerModdulos()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerEmpresas, obtenerModdulosCC, obtenerModdulos, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* Boton para regresar a la lista */}
      <Button color="primary" onClick={() => navigate(`/configuracion/organizacion/centro_costo`)}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar a la lista
      </Button>
      {/* Nombre del elemento */}
      <Typography variant="h6">Centro de Costo: {item?.nombre_cc}</Typography>
      {/* Tabs para la pantalla */}
      <TabComponent
        tabInicial={searchParams.get("tab") || "1"}
        opciones={[
          // Tab principal con el formulario completo relacionado al CRUD
          {
            id: "1",
            label: "Informacion",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <FormularioCompletoCentroCosto_ id={id} centro_costo={item} catalogos={{ empresas }} />
              </Box>
            ),
          },
          // // [ TEMPORAL ] Tab que contiene el modal para maquetacion
          // {
          //   id: 2,
          //   label: "Vista de formulario Modal",
          //   content: (
          //     <Box sx={{ p: 1, m: 0 }}>
          //       <ModalCentroCosto_ />
          //     </Box>
          //   ),
          // },
          // Opcion adicional referente a alguna información de apoyo
          {
            id: "modulos_relacionados",
            label: "Módulo relacionados",
            content: (
              <Box sx={{ p: 1, m: 0 }}>
                <Typography variant="h6">Asignación de Módulos</Typography>
                <Grid container width="100%">
                  <Grid pt={1} size={12}>
                    <Typography variant="h6">Módulos</Typography>
                  </Grid>
                  <Grid pt={1} size={12} container>
                    <Grid pt={1} size={12}>
                      <TransferListsComponent
                        // cambioEnLista={guardarUnMovimiento}
                        guardarListas={guardarTodo}
                        listaPrincipal={listaNo}
                        listaSecundaria={listaSi}
                        objectLabel="label"
                        objectValue="cod_modulo"
                        propFiltro={["nom_modulo"]}
                        tituloListaPrincipal="Módulos no Asignados"
                        tituloListaSecundaria="Módulos Asignados"
                        // readonly
                        permitirPasarTodos
                        // size={6}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                {/* <Grid container>
                  <Grid>
                    <pre>{JSON.stringify({ modulos }, null, 2)}</pre>
                  </Grid>
                  <Grid>
                    <pre>{JSON.stringify({ modulosRelacionados }, null, 2)}</pre>
                  </Grid>
                </Grid> */}
              </Box>
            ),
          },
        ]}
      />
    </Box>
  );
};
export default VistaCentroCosto_;
