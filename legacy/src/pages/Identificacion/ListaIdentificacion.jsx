import React, { useCallback, useEffect, useMemo, useState } from "react";
import TablaIdentificacion from "../../views/Identificacion/TablaIdentificacion";
import { Box, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../api";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
const ListaIdentificacion = () => {
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const dispatch = useDispatch();
  const [datos, setDatos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [tipoEntidad, setTipoEntidad] = useState([]);
  const [valores, setValores] = useState({ tipo: null, filtro2: "" });
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(() => datos.map((i) => ({ ...i, estado: estados.find((e) => i.cod_estado === e.cod_estado) })).filter((i) => i), [datos, estados /*, valores */]);
  /**
   * FILTROS PARA DATOS
   * Lista de filtros para la lista de datos
   */
  const inputs = useMemo(
    () => [
      { tipo: "select", options: tipoEntidad, valueOption: "cod_tipo", labelOption: "nom_tipo", id: "tipo", val: valores["tipo"] },
      { tipo: "text", id: "filtro2", var: valores["filtro2"] },
    ],
    [tipoEntidad, valores]
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
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    await api
      .get("api/appweb/lista-identificacion")
      .then(({ data }) => setDatos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerTipos = useCallback(async () => {
    await api.get("api/appweb/lista-tipo", { params: { tipo_tabla: "ENTIDAD" } }).then(({ data }) => setTipoEntidad(data.data));
  }, []);

  const listaFiltrada = useMemo(() => lista?.filter((i) => (valores.tipo ? i.cod_tipo === valores.tipo?.cod_tipo : true)), [lista, valores]);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEstados(), obtenerDatos(), obtenerTipos()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerEstados, obtenerTipos, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* TITULO DE CRUD */}
      <Typography variant="h3">Identificacion</Typography>
      {/* FILTRO DE DATOS */}
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

      <TablaIdentificacion lista={listaFiltrada} reConsultar={obtenerDatos} catalogos={{ estados }} />
    </Box>
  );
};
export default ListaIdentificacion;
