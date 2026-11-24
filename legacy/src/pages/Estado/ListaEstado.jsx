import React, { useCallback, useEffect, useMemo, useState } from "react";
import TablaEstado from "../../views/Estado/TablaEstado";
import { Box, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../api";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
const ListaEstado = () => {
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const dispatch = useDispatch();
  const [datos, setDatos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [valores, setValores] = useState({ tipo: null });
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(
    () => datos.map((i) => ({ ...i })).filter((i) => (valores["tipo"] ? i.cod_tipo === valores["tipo"].cod_tipo : true)),
    [datos, valores]
  );
  /**
   * FILTROS PARA DATOS
   * Lista de filtros para la lista de datos
   */
  const inputs = useMemo(
    () => [{ tipo: "select", labelOption: "nom_tipo", valueOption: "cod_tipo", options: tipos, id: "tipo", val: valores["tipo"] }],
    [valores, tipos]
  );
  /**
   * CONSULTA DE DATOS
   * Consulta a base de datos de la lista
   */
  //  Obtener el catalogo de estados
  const obtenerTipos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo", { params: { tipo_tabla: "ESTADO" } })
      .then(({ data }) => setTipos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerDatos = useCallback(async () => {
    await api
      .get("api/appweb/listaestados")
      .then(({ data }) => setDatos(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerDatos(), obtenerTipos()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerTipos, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* TITULO DE CRUD */}
      <Typography variant="h3">Estado</Typography>
      {/* FILTRO DE DATOS */}

      <Box sx={{ p: 1, m: 0, my: 1 }}>
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => setValores((v) => ({ ...v, [id]: val }))}
          botones={{ agregar: { visible: false } }}
        />
      </Box>

      <TablaEstado lista={lista} reConsultar={obtenerDatos} catalogos={{ tipos }} />
    </Box>
  );
};
export default ListaEstado;
