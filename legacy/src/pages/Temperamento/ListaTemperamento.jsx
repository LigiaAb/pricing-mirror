import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../api";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import TablaTratamiento from "../../views/Tratamiento/TablaTratamiento";
import TablaTemperamento from "../../views/Temperamento/TablaTemperamento";
const ListaTemperamento = () => {
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const dispatch = useDispatch();
  const [datos, setDatos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [valores, setValores] = useState({ tipo_tabla: null });
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(
    () =>
      datos
        .map((i) => ({ ...i, estado: estados.find((e) => i.cod_estado === e.cod_estado) }))
        .filter((i) => (valores["tipo_tabla"] ? i.tipo_tabla === valores["tipo_tabla"].value : true)),
    [datos, estados, valores]
  );
  /**
   * FILTROS PARA DATOS
   * Lista de filtros para la lista de datos
   */
  // const inputs = useMemo(() => {
  //   let options = [...new Set(datos.map((i) => i.tipo_tabla))].map((i) => ({ label: i, value: i }));
  //   return [{ tipo: "select", label: "tabla", id: "tipo_tabla", val: valores["tipo_tabla"], options, labelOption: "label", valueOption: "value" }];
  // }, [datos, valores]);
  /**
   * CONSULTA DE DATOS
   * Consulta a base de datos de la lista
   */
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    await api
      .get("api/appweb/lista-temperamento")
      .then(({ data }) => setDatos(data.data))
      .catch((e) => console.error(e));
  }, []);
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
      <Typography variant="h3">Temperamento</Typography>
      {/* FILTRO DE DATOS */}

      {/* <Box sx={{ p: 1, m: 0, my: 1 }}>
        <FormularioComponent inputs={inputs} onInput={({ id, val }) => setValores({ [id]: val })} botones={{ agregar: { visible: false } }} />
      </Box> */}

        <TablaTemperamento lista={lista} reConsultar={obtenerDatos} />
    </Box>
  );
};
export default ListaTemperamento;
