import React, { useCallback, useEffect, useMemo, useState } from "react";
import TablaEntidadPaises from "../../../views/Entidad/EntidadPaises/TablaEntidadPaises";
import { Box, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../../api";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../../store/slices/status/statusSlice";
import PropTypes from "prop-types";
import { useFetchEmpresas, useFetchEstados, useFetchPaises } from "../../../hooks/Fetch/useFetchCatalog";

const ListaEntidadPaises = (props) => {
  let { tipo, entidad_id, entidad, obtenerFilaSeleccionada } = props;

  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const dispatch = useDispatch();
  const [datos, setDatos] = useState([]);
  const estados = useFetchEstados();
  const paises = useFetchPaises();
  const empresas = useFetchEmpresas();
  // const [estados, setEstados] = useState([]);
  // const [paises, setPaises] = useState([]);
  // const [empresas, setEmpresas] = useState([]);
  // const [valores, setValores] = useState({ filtro1: ""  , filtro2: ""   });
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(
    () => (datos || []).map((i) => ({ ...i, estado: estados.data.find((e) => i.value === e.cod_estado) })),
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
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    await api
      .get("api/appweb/lista-entidad-paises", { params: { cod_tipo: tipo, entidad_id } })
      .then(({ data }) => setDatos(data.data.data || []))
      .catch((e) => console.error(e));
  }, [tipo, entidad_id]);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerDatos()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* TITULO DE CRUD */}
      {/* <Typography variant="h3">Entidad Paise</Typography> */}
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
      <TablaEntidadPaises
        entidad_id={entidad_id}
        catalogos={{ paises: paises.data, empresas: empresas.data }}
        lista={lista}
        obtenerFilaSeleccionada={obtenerFilaSeleccionada}
        reConsultar={obtenerDatos}
      />
    </Box>
  );
};
ListaEntidadPaises.propTypes = {
  // ELEMENTO
  tipo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  entidad: PropTypes.object,
  obtenerFilaSeleccionada: PropTypes.func,
};
export default ListaEntidadPaises;
