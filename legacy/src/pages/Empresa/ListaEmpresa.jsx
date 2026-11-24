import React, { useCallback, useEffect, useMemo, useState } from "react";
import TablaEmpresa from "../../views/Empresa1/TablaEmpresa";
import { Box, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../api";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { useDispatch } from "react-redux";
import useCustomQuery from "../../hooks/Fetch/useCustomQuery";
const ListaEmpresa = () => {
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  // const [datos, setDatos] = useState([]);
  const [carga, setCarga] = useState(0);
  const [estados, setEstados] = useState([]);
  const [paises, setPaises] = useState([]);
  const [valores, setValores] = useState({ pais: null });
  const dispatch = useDispatch();
  const {
    data: datos = [],
    isLoading,
    isError,
    isPending,
    error,
    invalidate,
    refetchData,
  } = useCustomQuery(
    ["empresas"], // Query key
    async () => {
      console.log(":D");
      return await api.get(`/api/appweb/listaempresas`).then(({ data }) => data.data);
    },
    {
      refetchOnWindowFocus: false,
    }
  );
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(() => {
    const { pais } = valores;
    return datos.map((i) => ({ ...i, estado: estados.find((e) => i.COD_ESTADO === e.COD_ESTADO) })).filter((i) => (pais ? i.pais_emp === pais.value : true));
  }, [datos, estados, valores]);
  /**
   * FILTROS PARA DATOS
   * Lista de filtros para la lista de datos
   */
  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        options: paises.filter((p) => datos.map((i) => i.pais_emp).includes(p.cod_pais)).map((i) => ({ ...i, value: i.cod_pais, label: i.nombre_pais })),
        id: "pais",
        val: valores["pais"],
      },
    ],
    [datos, paises, valores]
  );
  /**
   * CONSULTA DE DATOS
   * Consulta a base de datos de la lista
   */
  //  Obtener el catalogo de paices
  const obtenerPais = useCallback(async () => {
    await api
      .get("api/appweb/listapaises")
      .then(({ data }) => setPaises(data.data))
      .catch((e) => console.error(e));
  }, []);
  //  Obtener el catalogo de estados
  const obtenerEstados = useCallback(async () => {
    await api
      .get("api/appweb/listaestados")
      .then(({ data }) => setEstados(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    // await api
    //   .get("api/appweb/listaempresas")
    //   .then(({ data }) => setDatos(data.data))
    //   .catch((e) => console.error(e));
  }, []);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEstados(), obtenerDatos(), obtenerPais()]); /* .then(() => dispatch(apagarCarga())); */
  }, [dispatch, obtenerDatos, obtenerEstados, obtenerPais]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  // useEffect(() => {
  //   dispatch(encenderCarga("Cargando informacion"));
  // }, [dispatch]);

  useEffect(() => {
    isLoading ? dispatch(encenderCarga("Cargando informacion")) : dispatch(apagarCarga());
  }, [isLoading]);

  if (isPending) return <div>Cargando usuario...</div>;
  if (isLoading) return <div>Cargando usuario...</div>;
  if (isError) return <div>Error: {error.message}</div>;
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <button onClick={refetchData}>Recargar Datos</button>
      {/* TITULO DE CRUD */}
      <Typography variant="h6">Empresa</Typography>
      {/* FILTRO DE DATOS */}

      <Box sx={{ p: 1, m: 0, my: 1 }}>
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => setValores((v) => ({ ...v, [id]: val }))}
          botones={{
            agregar: { visible: false },
            filtrar: { visible: false },
          }}
        />
      </Box>

      <TablaEmpresa lista={lista} reConsultar={obtenerDatos} catalogos={{ paises, estados }} />
    </Box>
  );
};
export default ListaEmpresa;
