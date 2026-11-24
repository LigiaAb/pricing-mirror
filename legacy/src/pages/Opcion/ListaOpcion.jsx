import React, { useCallback, useEffect, useMemo, useState } from "react";
import TablaOpcion from "../../views/Opcion/TablaOpcion";
import { Box, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../api";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { useFetchCategorias, useFetchOpciones } from "../../hooks/Fetch/useFetchConfiguracion";
const ListaOpcion = () => {
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const dispatch = useDispatch();
  const [datos, setDatos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [valores, setValores] = useState({ cod_categoria: null });

  /**
   * FETCH DATA
   * Consulta los datos de la lista
   */
  const liataOpciones = useFetchOpciones();
  const listaCategorias = useFetchCategorias();
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(
    () =>
      (liataOpciones.data || [])
        .map((i) => ({ ...i, estado: estados.find((e) => i.cod_estado === e.cod_estado) }))
        .filter((i) => (valores["cod_categoria"] ? valores["cod_categoria"].cod_categoria === i.cod_categoria : true)),
    [liataOpciones, estados, valores]
  );
  /**
   * FILTROS PARA DATOS
   * Lista de filtros para la lista de datos
   */
  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        id: "cod_categoria",
        label: "categoria",
        val: valores["cod_categoria"],
        options: listaCategorias.data || [],
        valueOption: "cod_categoria",
        labelOption: "nom_cat",
      },
    ],
    [valores, listaCategorias]
  );
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
  const obtenerCategorias = useCallback(async () => {
    // await api
    //   .get("api/appweb/lista-categoria")
    //   .then(({ data }) => setCategorias(data.data))
    //   .catch((e) => console.error(e));
  }, []);
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    // await api
    //   .get("api/appweb/lista-opcion")
    //   .then(({ data }) => setDatos(data.data))
    //   .catch((e) => console.error(e));
  }, []);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEstados(), obtenerDatos(), obtenerCategorias()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerEstados, obtenerCategorias, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* TITULO DE CRUD */}
      <Typography variant="h6">Opcion</Typography>
      {/* FILTRO DE DATOS */}

      <Box sx={{ p: 1, m: 0, my: 1 }}>
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => setValores((v) => ({ ...v, [id]: val }))}
          botones={{
            agregar: { visible: false },
            // ...(true ? { filtrar: { visible: false } } : {}),
          }}
        />
      </Box>

      <TablaOpcion lista={lista} reConsultar={obtenerDatos} catalogos={{ categorias: listaCategorias.data || [] }} />
      {/* <pre>{liataOpciones.error?.message}</pre> */}
      {/* <pre>{JSON.stringify(liataOpciones.data, null, 2)}</pre> */}
    </Box>
  );
};
export default ListaOpcion;
