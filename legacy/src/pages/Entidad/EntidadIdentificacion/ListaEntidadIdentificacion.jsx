import React, { useCallback, useEffect, useMemo, useState } from "react";
import TablaEntidadIdentificacion from "../../../views/Entidad/EntidadIdentificacion/TablaEntidadIdentificacion";
import { Box, Grid, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../../api";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import { useDispatch, useSelector } from "react-redux";
import { apagarCarga, encenderCarga } from "../../../store/slices/status/statusSlice";
import AcordeonComponent from "../../../components/AcordeonComponent/AcordeonComponent";
import PropTypes from "prop-types";
import { useCreateEntidadIdentificaciones, useFetchEntidadIdentificaciones, useUpdateEntidadIdentificaciones } from "../../../hooks/Fetch/useFetchEntidades";
import LoaderComponent from "../../../components/Loader/LoaderComponent";

const ListaEntidadIdentificacion = (props) => {
  let { tipo, entidad_id, entidad, obtenerFilaSeleccionada } = props;
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const dispatch = useDispatch();
  // const [datos, setDatos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [identificaciones, setIdentificaciones] = useState([]);
  const [listaTiposSV, setListaTiposSV] = useState({});

  const datos = useFetchEntidadIdentificaciones({ cod_tipo: tipo, entidad_id });

  // const [valores, setValores] = useState({ filtro1: ""  , filtro2: ""   });
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(
    () =>
      datos.data?.data
        ?.map((i) => ({
          ...i,
          entidadidentificacio_numero_tipo: [40, 41, 42].includes(Number(i.cod_identificacion)) ? listaTiposSV[i.cod_identificacion]?.find((t) => t.cod_tipo === i.entidadidentificacio_numero) : null,
          entidadidentificacio_numero: ![40, 41, 42].includes(Number(i.cod_identificacion)) ? i.entidadidentificacio_numero : null,
          estado: estados.find((e) => i.cod_estado === e.cod_estado),
        }))
        .filter((i) => i.cod_estado === 1) || [],
    [datos, estados, listaTiposSV /*, valores */]
  );
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
      .then(({ data }) => setEstados(data.data))
      .catch((e) => console.error(e));
  }, []);
  //  Obtener el catalogo de estados
  const obtenerIdentificaciones = useCallback(async () => {
    await api
      .get("api/appweb/lista-identificacion", {
        /* params: { cod_tipo: tipo } */
      })
      .then(({ data }) => setIdentificaciones(data.data))
      .catch((e) => console.error(e));
  }, [tipo]);
  const obtenerListaIdentificacionPorCredito = useCallback(
    async () =>
      await Promise.all([
        api.get(`/api/appweb/listar-identificacion-x-criterio`, { params: { cod_identificacion: 40 } }).then(({ data }) => data?.data?.data),
        api.get(`/api/appweb/listar-identificacion-x-criterio`, { params: { cod_identificacion: 41 } }).then(({ data }) => data?.data),
        api.get(`/api/appweb/listar-identificacion-x-criterio`, { params: { cod_identificacion: 42 } }).then(({ data }) => data?.data),
      ]),
    []
  );
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    await datos.refetch();
    // await api
    //   .get("api/appweb/lista-entidad-identificacion", { params: { cod_tipo: tipo, entidad_id } })
    //   .then(({ data }) => setDatos(data.data.data))
    //   .catch((e) => console.error(e));
  }, []);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEstados(), obtenerIdentificaciones(), obtenerDatos(), obtenerListaIdentificacionPorCredito().then((d) => setListaTiposSV({ 40: d[0], 41: d[1], 42: d[2] }))]).then(() =>
      dispatch(apagarCarga())
    );
  }, [obtenerListaIdentificacionPorCredito, obtenerDatos, obtenerIdentificaciones, obtenerEstados, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  useEffect(() => {
    datos.refetch();
  }, []);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* TITULO DE CRUD */}
      <Typography variant="h4"></Typography>
      {/* FILTRO DE DATOS */}
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
      {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
      {datos.isLoading ? (
        <LoaderComponent open />
      ) : datos.isError ? (
        <p>Hubo un error al cargar los datos</p>
      ) : (
        <TablaEntidadIdentificacion entidad_id={entidad_id} tipo={tipo} lista={lista} catalogos={{ identificaciones, estados, listaTiposSV }} reConsultar={obtenerDatos} />
      )}
    </Box>
  );
};
ListaEntidadIdentificacion.propTypes = {
  // ELEMENTO
  tipo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  entidad: PropTypes.object,
  obtenerFilaSeleccionada: PropTypes.func,
};
export default ListaEntidadIdentificacion;
