import React, { useCallback, useEffect, useMemo, useState } from "react";
import TablaMenu from "../../views/Menu/TablaMenu";
import { Box, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../api";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
const ListaMenu = () => {
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const [datos, setDatos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const dispatch = useDispatch();
  // const [valores, setValores] = useState({ filtro1: ""  , filtro2: ""   });
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(
    () =>
      datos.map((i) => ({
        ...i,
        empresa: empresas.find((e) => e.cod_emp === i.cod_emp),
        centroCosto: centrosCosto.find((c) => c.cod_cc === i.cod_cc),
      })),
    // .filter(i => {})
    [datos, empresas, centrosCosto /*, valores */]
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
  const obtenerEmpresas = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresas(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerCentrosCosto = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresas(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerDatos = useCallback(async () => {
    await api
      .get("api/appweb/lista-menu")
      .then(({ data }) => setDatos(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEmpresas(), obtenerDatos(), obtenerCentrosCosto()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerEmpresas, obtenerCentrosCosto, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* TITULO DE CRUD */}
      <Typography variant="h6">Menu</Typography>
      {/* FILTRO DE DATOS */}
      {/* 
      <Box sx={{ p: 1, m: 0, my: 1 }}>
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => setValores((v) => ({ ...v, [id]: val }))}
          botones={{
            agregar: { visible: false },
            ...(true ? { filtrar: { visible: false } } : {}),
          }}
        />
      </Box>
      */}
      <TablaMenu lista={lista} reConsultar={obtenerDatos} />
    </Box>
  );
};
export default ListaMenu;
