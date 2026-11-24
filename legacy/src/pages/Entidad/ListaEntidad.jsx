import React, { useCallback, useEffect, useMemo, useState } from "react";
import TablaEntidad from "../../views/Entidad/TablaEntidad";
import { Box, Grid, Icon, IconButton, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../api";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useDispatch, useSelector } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import TabComponent from "../../components/Tabs/TabComponent";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { decryptId, encryptId } from "../../api/encryptDecrypt";
import PropTypes from "prop-types";
import useObtenerOpcionesAcciones, { useObtenerPermisosDeOpcion } from "../../hooks/useObtenerOpcionesAcciones";
import LoaderComponent from "../../components/Loader/LoaderComponent";
import { useFetchAllEntidadesSimple } from "../../hooks/Fetch/useFetchEntidades";

const ListaEntidad = (props) => {
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const { tipoStr } = props;
  const dispatch = useDispatch();
  let { encryptedTipo } = useParams();
  let tipo = decryptId(encryptedTipo);
  const [datos, setDatos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [codTipo, setCodTipo] = useState(null);
  const [permiteCrear, setPermiteCrear] = useState(false);
  const { currentCategoria } = useSelector((slice) => slice.menu);
  const { json } = useSelector((slice) => slice.auth);
  const { permisosArray, catalogoArray } = useObtenerOpcionesAcciones();
  const { mensaje, cargando } = useSelector((state) => state.status);
  const [mostrarLoader, setMostrarLoader] = useState(true);
  const [contador, setContador] = useState(0);
  const navigate = useNavigate();

  const listaEntidades = useFetchAllEntidadesSimple([tipoStr], { cod_estado: ["CLIENTE", "PROVEEDOR"].includes(tipoStr) ? undefined : 1, tipo_entidad: tipoStr }, {});
  // const [valores, setValores] = useState({ filtro1: ""  , filtro2: ""   });
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(
    () => datos.map((i) => ({ ...i, estado: estados.find((e) => i.cod_estado === e.cod_estado) })),
    // .filter(i => {})
    [datos, estados /*, valores */],
  );
  const opciones = useMemo(() => currentCategoria?.opciones || [], [currentCategoria]);
  const numberToArray = (num) => Array.from({ length: num }, (_, i) => i);
  /**
   * FILTROS PARA DATOS
   * Lista de filtros para la lista de datos
   */
  // const inputs = useMemo(
  //   () => [
  //     { tipo: "text"  , id: "filtro1"  , val: valores["filtro1"  ] },
  //     { tipo: "text"  , id: "filtro2"  , var: valores["filtro2"  ] },
  //   ],
  //   [valores]
  // );
  /**
   * CONSULTA DE DATOS
   * Consulta a base de datos de la lista
   */
  //  Obtener el catalogo de estados
  const obtenerEstados = useCallback(async () => {
    await api
      .get("api/appweb/listaestados")
      .then(({ data }) => {
        setEstados(data.data);
        // console.log({ estados_: data.data });
      })
      .catch((e) => console.error(e));
  }, []);
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    if (tipoStr && !listaEntidades.isLoading && !listaEntidades.isError) {
      setDatos(listaEntidades.data?.data || []);

      setCodTipo(listaEntidades.data.cod_tipo);
      setPermiteCrear(listaEntidades.data.permite_crear);
    }
  }, [tipoStr, listaEntidades.data]);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEstados(), obtenerDatos()]).then(() => {
      dispatch(apagarCarga());
      setMostrarLoader(false);
    });
  }, [obtenerEstados, obtenerDatos, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  // useEffect(() => {
  //   listaEntidades.refetch();
  // }, []);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0, flex: 1 }}>
      {/* TITULO DE CRUD */}
      <Grid width="100%" container>
        <Grid size="grow">
          <Typography variant="h4">{tipoStr?.toLowerCase().replace(/(^\w|-\w)/g, (match) => match.toUpperCase())}</Typography>
        </Grid>
        <Grid size="auto">
          <IconButton onClick={() => listaEntidades.refetch()}>
            <Icon className="c-actualizar" />
          </IconButton>
        </Grid>
      </Grid>
      {/* FILTRO DE DATOS */}
      <TabComponent
        tabInicial={currentCategoria?.opciones.filter((o) => o.nivel_opcion === "E")[0]?.cod_opcion || false}
        opciones={currentCategoria?.opciones
          .filter((i) => i.nivel_opcion === "E")
          .map((o) => ({
            ...o,
            id: o.cod_opcion,
            label: o.nom_opcion,
            icono: o.ico_opcion,
            disable: !permisosArray.find((pa) => pa.cod_opcion === o.cod_opcion),
            content: o.nom_opcion.includes("Lista") ? (
              <TablaEntidad loading={listaEntidades.isLoading} permiteCrear={permiteCrear} codTipo={codTipo} lista={lista} catalogos={{ estados }} reConsultar={obtenerDatos} />
            ) : (
              <></>
            ),
          }))}
      />
      {/* 
      <Box sx={{ p: 1, m: 0, my: 1 }}>
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => setValores((v) => ({ ...v, [id]: val }))}
          botones={{
            agregar: { visible: false },
            // filtrar: { visible: false },
          }}
        />
      </Box>
      */}
      <Grid container>
        {/* <pre>{JSON.stringify(catalogoArray, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(currentCategoria, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(lista, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify( currentCategoria?.opciones.filter((o) => o.nivel_opcion === "E").map((o) => ({ id: o.cod_opcion, label: o.nom_opcion, })), null,2)}</pre> */}
        {/* <pre>{JSON.stringify( currentCategoria?.opciones.filter((o) => o.nivel_opcion === "E"), null, 2 )}</pre> */}
        {/* <pre>{JSON.stringify( currentCategoria?.opciones.filter((o) => o.nivel_opcion === "I"), null, 2 )}</pre> */}
        {/* <pre>{JSON.stringify(listaEntidades, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify({ ...listaEntidades, data: undefined }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify( json.permisos.paises["1001"].empresas["1"].centrosCosto["2"].modulos["7"].menus["8"].categorias["22"].opciones["57"], null, 2 )}</pre> */}
        <LoaderComponent open={listaEntidades.fetchStatus === "fetching" || listaEntidades.isLoading} texto={`Estamos obteniendo todos los ${tipoStr}`} />
        {listaEntidades.isError && <Typography>{listaEntidades.error.message}</Typography>}
      </Grid>
    </Box>
  );
};
ListaEntidad.propTypes = {
  // ELEMENTO
  tipoStr: PropTypes.string,
};
export default ListaEntidad;
