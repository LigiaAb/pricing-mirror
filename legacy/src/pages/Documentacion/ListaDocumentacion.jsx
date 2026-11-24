import React, { useCallback, useEffect, useMemo, useState } from "react";
import TablaDocumentacion from "../../views/Documentacion/TablaDocumentacion";
import { Box, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../api";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";

const ListaDocumentacion = () => {
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const dispatch = useDispatch();
  const [datos, setDatos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [valores, setValores] = useState({ cod_tip_docu: null });

  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(
    () =>
      datos
        ?.map((i) => ({ ...i, estado: estados.find((e) => i.cod_estado === e.cod_estado) }))
        .filter((i) => (!valores["cod_tip_docu"] ? true : i["cod_tip_docu"] === valores["cod_tip_docu"]["cod_tip_docu"])),
    [datos, estados, valores]
  );

  /**
   * FILTROS PARA DATOS
   * Lista de filtros para la lista de datos
   */
  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        label: "Tipo de Documentación",
        id: "cod_tip_docu",
        val: valores["cod_tip_docu"],
        options: tipos,
        labelOption: "desc_tip_docu",
        optionValue: "cod_tip_docu",
      },
    ],
    [valores, tipos]
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
  const obtenerTiposDocumentacion = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo-documentacion")
      .then(({ data }) => setTipos(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    await api
      .get("api/appweb/lista-det-tipo-documentacion")
      .then(({ data }) => setDatos(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEstados(), obtenerDatos(), obtenerTiposDocumentacion()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerEstados, obtenerTiposDocumentacion, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* TITULO DE CRUD */}
      <Typography variant="h3">Documentacion</Typography>
      {/* FILTRO DE DATOS */}
      <Box sx={{ p: 1, m: 0, my: 1 }}>
        <FormularioComponent inputs={inputs} onInput={({ id, val }) => setValores((v) => ({ ...v, [id]: val }))} botones={{ agregar: { visible: false } }} />
      </Box>

      <TablaDocumentacion lista={lista} reConsultar={obtenerDatos} />
    </Box>
  );
};

export default ListaDocumentacion;
