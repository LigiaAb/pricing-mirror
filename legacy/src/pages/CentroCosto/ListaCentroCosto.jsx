import React, { useCallback, useEffect, useMemo, useState } from "react";
import TablaCentroCosto from "../../views/CentroCosto/TablaCentroCosto";
import { Box, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../api";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
const ListaCentroCosto = () => {
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const dispatch = useDispatch();
  const [datos, setDatos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [paises, setPaises] = useState([]);
  const [valores, setValores] = useState({ empresa: null, pais: null });
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(
    () =>
      datos
        .map((i) => ({
          ...i,
          empresa: empresas.find((e) => e.cod_empresa === i.cod_empresa_cc),
          pais: paises.find((p) => p.cod_pais === empresas.find((e) => e.cod_empresa === i.cod_empresa_cc)?.pais_emp),
        }))
        .filter((i) => (valores["pais"] ? valores["pais"].value === i.pais?.cod_pais : true))
        .filter((i) => (valores["empresa"] ? valores["empresa"].value === i.cod_empresa_cc : true)),
    [datos, empresas, paises, valores]
  );
  /**
   * FILTROS PARA DATOS
   * Lista de filtros para la lista de datos
   */
  const empresasFiltradas = useMemo(() => empresas.filter((i) => datos.map((d) => d.cod_empresa_cc).includes(i.cod_empresa)), [datos, empresas]);
  const paisesFiltradas = useMemo(() => paises.filter((i) => empresasFiltradas.find((e) => e.pais_emp === i.cod_pais)), [empresasFiltradas, paises]);
  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        options: paisesFiltradas.map((i) => ({ ...i, value: i.cod_pais, label: i.nombre_pais })),
        id: "pais",
        val: valores["pais"],
      },
      {
        tipo: "select",
        options: empresasFiltradas
          .filter((e) => e.pais_emp === valores["pais"]?.cod_pais)
          .map((i) => ({ ...i, value: i.cod_empresa, label: i.nombre_emp })),
        id: "empresa",
        val: valores["empresa"],
        readonly: !valores["pais"],
      },
    ],
    [paisesFiltradas, valores, empresasFiltradas]
  );
  /**
   * CONSULTA DE DATOS
   * Consulta a base de datos de la lista
   */
  const obtenerPaises = useCallback(async () => {
    await api
      .get("api/appweb/listapaises")
      .then(({ data }) => setPaises(data.data))
      .catch((e) => console.error(e));
  }, []);
  //  Obtener el catalogo de estados
  const obtenerEmpresas = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresas(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    await api
      .get("api/appweb/listacentrocosto")
      .then(({ data }) => setDatos(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEmpresas(), obtenerDatos(), obtenerPaises()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerEmpresas, dispatch, obtenerPaises]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* TITULO DE CRUD */}
      <Typography variant="h6">Centros de Costo</Typography>
      {/* FILTRO DE DATOS */}

      <Box sx={{ p: 1, m: 0, my: 1 }}>
        <FormularioComponent
          inputs={inputs}
          onInput={({ id, val }) => {
            console.log(id, val);
            if (id === "pais") setValores({ pais: val, empresa: null });
            else setValores((v) => ({ ...v, empresa: val }));
          }}
          botones={{
            agregar: { visible: false },
            filtrar: { visible: false },
          }}
        />
      </Box>

      <TablaCentroCosto lista={lista} reConsultar={obtenerDatos} catalogos={{ empresas }} />

      {/* <pre>{JSON.stringify(valores, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(lista, null, 2)}</pre> */}
    </Box>
  );
};
export default ListaCentroCosto;
