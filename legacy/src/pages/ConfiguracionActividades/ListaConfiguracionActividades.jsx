import React, { useCallback, useEffect, useMemo, useState } from "react";
// import TablaConfiguracion from "../../views/Configuracion/TablaConfiguracion";
import { Box, /* Grid, */ Typography } from "@mui/material";
import { api } from "../../api";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import { Value } from "sass";
import TablaConfiguracionActividad from "../../views/ConfiguracionActividad/TablaConfiguracionActividad";
const ListaConfiguracionActividades = () => {
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const dispatch = useDispatch();
  const [datos, setDatos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [cencos, setCencos] = useState([]);
  const [valores, setValores] = useState({ 
    empresa: null, 
    centro_costo: null,
    estado: null   
  });
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(
    () => datos.map(
      (i) => ({ 
        ...i, 
        // estado: estados.find((e) => i.cod_estado === e.cod_estado) 
        nombre_emp: empresas?.find((e) => i.cod_emp == e.cod_empresa)?.nombre_emp,
        nombre_cc: cencos?.find((e) => i.cod_cc == e.cod_cc)?.nombre_cc,
      })
    )
    .filter((i) => valores?.empresa ? (valores.empresa.value == i.cod_emp) : true)
    .filter((i) => valores?.cenco ? (valores.cenco.value == i.cod_cc) : true)
    .filter((i) => valores?.estado ? (valores.estado.value == i.cod_estado) : true)
    , [datos, empresas, cencos, valores?.empresa, valores?.cenco,  valores?.estado]
  );

  /**
   * FILTROS PARA DATOS
   * Lista de filtros para la lista de datos
   */

  const empresas_ = useMemo(
    () => empresas?.map((item) => (
      { ...item, 
        label: item.nombre_emp,
        value: item.cod_empresa
      }
    ) || []), [datos, empresas]
  );

  const cencos_ = useMemo(
    () => {
      if(valores?.empresa){
        return cencos?.filter((cenco) => (cenco.cod_empresa_cc == valores.empresa.value))
        .map((item) => ({
          ...item,
          value: item.cod_cc.toString(),
          label: item.nombre_cc,
        })) || []
      }
      return []
    },[valores?.empresa, cencos]
  );

  const estados_ = useMemo(
    () => estados
      ?.filter((item) => item.cod_tipo == 25)
      ?.map((item) => ({ 
        ...item, 
        label: item.estado_desc,
        value: item.cod_estado
      }) || []), [datos, estados]
  );

  const inputs = useMemo(() => {
    return [
     {
        id: "empresa",
        label: "Empresa",
        val: valores?.empresa || null,
        tipo: "select",
        readonly: false,
        options: empresas_,
      },
      {
        id: "cenco",
        label: "Centro de Costo",
        val: valores?.cenco || null,
        tipo: "select",
        readonly: !valores?.empresa,
        options: cencos_,
      },
      {
        id: "estado",
        label: "Estados",
        val: valores?.estado || null,
        tipo: "select",
        readonly: false,
        options: estados_,
      }
      
    ]
  }, [valores, empresas_, cencos_, estados_]);
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
  const obtenerEmpresas = useCallback(async () => {
    await api
      .get("api/appweb/listaempresas")
      .then(({ data }) => setEmpresas(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerCencos = useCallback(async () => {
    await api
      .get("api/appweb/listacentrocosto")
      .then(({ data }) => setCencos(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    await api
      .get("api/appweb/lista-configuracion-actividad")
      .then(({ data }) => setDatos(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerEstados(), obtenerDatos(), obtenerEmpresas(), obtenerCencos()]).then(() => dispatch(apagarCarga()));
  }, [obtenerDatos, obtenerEstados, obtenerEmpresas, obtenerCencos, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  


  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* TITULO DE CRUD */}
      <Typography variant="h4">Configuración de Actividades</Typography>
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
      
      {/* <TablaConfiguracion lista={lista} reConsultar={obtenerDatos} catalogos={{ estados }} /> */}
      
      <TablaConfiguracionActividad
        lista={lista} reConsultar={obtenerDatos} catalogos={{ estados, empresas, cencos }}
      />
    </Box>
  );
};
export default ListaConfiguracionActividades;
