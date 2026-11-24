import React, { useCallback, useEffect, useMemo, useState } from "react";
import TablaEntidadDirecciones from "../../../views/Entidad/EntidadDirecciones/TablaEntidadDirecciones";
import { Box, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../../api";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../../store/slices/status/statusSlice";
import PropTypes from "prop-types";
import useObtenerOpcionesAcciones from "../../../hooks/useObtenerOpcionesAcciones";
import TabComponent from "../../../components/Tabs/TabComponent";
// import tablaKb from "../../../views/Entidad/"
import TablaEntidadDireccionesKb from "@/views/Entidad/EntidadDirecciones/TablaEntidadDireccionesKb";
import TablaEditableComponent from "@/components/Tabla/TablaEditableComponent";

const ListaEntidadDirecciones = (props) => {
  /**
   * PROPIEDADES DE COMPONENTE
   */
  let { tipo, entidad_id, entidad, obtenerFilaSeleccionada, mostrarKb = false } = props;
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const dispatch = useDispatch();
  const [datos, setDatos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [paises, setPaises] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
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
  const obtenerTipos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo")
      .then(({ data }) => setTipos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerEmpresas = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresas(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerCC = useCallback(async () => {
    await api
      .get("api/appweb/listacentrocosto")
      .then(({ data }) => setCentrosCosto(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerPaises = useCallback(async () => {
    await api
      .get("api/appweb/listapaises")
      .then(({ data }) => setPaises(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerDepartamentos = useCallback(async () => {
    await api
      .get("api/appweb/lista-depto-x-pais")
      .then(({ data }) => setDepartamentos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerMunicipios = useCallback(async () => {
    await api
      .get("api/appweb/lista-municipios")
      .then(({ data }) => setMunicipios(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    await api
      .get("api/appweb/lista-entidad-direccion", { params: { cod_tipo: tipo, entidad_id } })
      .then(({ data }) => setDatos(data.data.data.filter((d) => d.cod_estado === 1)))
      .catch((e) => console.error(e));
  }, [entidad_id, tipo]);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerPaises(), obtenerDepartamentos(), obtenerMunicipios(), obtenerEmpresas(), obtenerCC(), obtenerTipos(), obtenerEstados(), obtenerDatos()]).then(() =>
      dispatch(apagarCarga())
    );
  }, [obtenerPaises, obtenerDepartamentos, obtenerMunicipios, obtenerEmpresas, obtenerCC, obtenerTipos, obtenerDatos, obtenerEstados, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* TITULO DE CRUD */}
      <Typography variant="h4">Direcciones de Entidad</Typography>
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
      <TablaEntidadDirecciones
        lista={lista}
        reConsultar={obtenerDatos}
        obtenerFilaSeleccionada={obtenerFilaSeleccionada}
        tipo={tipo}
        entidad_id={entidad_id}
        catalogos={{
          estados,
          tipos: tipos.filter((i) => i.tipo_tabla === "ENTIDAD_DIRECCION"),
          paises,
          empresas,
          centrosCosto,
          departamentos,
          municipios,
        }}
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
      {/* <TablaEntidadDirecciones lista={lista} reConsultar={obtenerDatos} /> */}
        
      {mostrarKb && (<Box  sx={{ p: 1, m: 0 }}>
      <Typography variant="h4">Direcciones de Entidad KB</Typography>
      <TablaEntidadDireccionesKb entidad_id={entidad_id} />

      </Box>)}

    </Box>
  );
};
ListaEntidadDirecciones.propTypes = {
  // ELEMENTO
  tipo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  entidad: PropTypes.object,
  obtenerFilaSeleccionada: PropTypes.func,
  mostrarKb:PropTypes.bool,
};
export default ListaEntidadDirecciones;
