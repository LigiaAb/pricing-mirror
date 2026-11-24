import React, { useCallback, useEffect, useMemo, useState } from "react";
import TablaEntidadNombres from "../../../views/Entidad/EntidadNombres/TablaEntidadNombres";
import { Box, Grid, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../../api";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../../store/slices/status/statusSlice";
import PropTypes from "prop-types";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import TabComponent from "../../../components/Tabs/TabComponent";
import AcordeonComponent from "../../../components/AcordeonComponent/AcordeonComponent";

const ListaEntidadNombres = (props) => {
  /**
   * PROPIEDADES DE COMPONENTE
   */
  let { tipo, entidad_id, entidad, obtenerFilaSeleccionada } = props;

  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const dispatch = useDispatch();
  const [datos, setDatos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [paises, setPaises] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const { permisosArray, catalogoArray } = useObtenerOpcionesAcciones();
  // const [valores, setValores] = useState({ filtro1: ""  , filtro2: ""   });
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(
    () => datos.map((i) => ({ ...i, estado: estados.find((e) => i.cod_estado === e.cod_estado) })),
    // .filter(i => {})
    [datos, estados /*, valores */]
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
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    await api
      .get("api/appweb/lista-entidad-nombres", { params: { cod_tipo: tipo, entidad_id } })
      .then(({ data }) => setDatos(data.data.data))
      .catch((e) => console.error(e));
  }, [tipo, entidad_id]);
  const obtenerTipos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo", { params: { tipo_tabla: "ENTIDAD_NOMBRE" } })
      .then(({ data }) => setTipos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerPais = useCallback(async () => {
    await api
      .get("api/appweb/listapaises")
      .then(({ data }) => setPaises(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerEmpresas = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresas(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerTipos(), obtenerPais(), obtenerEmpresas(), obtenerEstados(), obtenerDatos()]).then(() => dispatch(apagarCarga()));
  }, [obtenerTipos, obtenerPais, obtenerEmpresas, obtenerDatos, obtenerEstados, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* TITULO DE CRUD */}
      <Typography variant="h4">Nombres de Entidad</Typography>
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

      <TablaEntidadNombres
        lista={lista}
        reConsultar={obtenerDatos}
        obtenerFilaSeleccionada={obtenerFilaSeleccionada}
        tipo={tipo}
        entidad_id={entidad_id}
        catalogos={{ estados, tipos: tipos.filter((i) => i.tipo_tabla === "ENTIDAD_NOMBRE"), paises, empresas }}
      />
      {/* <TabComponent
        tabInicial={catalogoArray.filter((o) => o.nivel_opcion === "E")[0]?.cod_opcion}
        opciones={catalogoArray
          .filter((i) => i.nivel_opcion === "E")
          .map((o) => ({
            ...o,
            id: o.cod_opcion,
            label: o.nom_opcion,
            icono: o.ico_opcion,
            disable: !permisosArray.find((pa) => pa.cod_opcion === o.cod_opcion),
            content: o.nom_opcion === "Lista" ? <></> : <></>,
          }))}
      /> */}
      {/* <TablaEntidadNombres lista={lista} reConsultar={obtenerDatos} obtenerFilaSeleccionada={obtenerFilaSeleccionada} catalogos={{ estados }} /> */}
    </Box>
  );
};
ListaEntidadNombres.propTypes = {
  // ELEMENTO
  tipo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  entidad: PropTypes.object,
  obtenerFilaSeleccionada: PropTypes.func,
};
export default ListaEntidadNombres;
