import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Grid, Typography } from "@mui/material";
import { api } from "../../api";
import { decryptId } from "../../api/encryptDecrypt";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";
import PropTypes from "prop-types";
import TablaEditableActividades from "../../views/Actividades/TablaEditableActividades";
import TablaEditableCampanas from "../../views/Campanas/TablaEditableCampanas";

const ListaEditableCampanas = (props) => {
  let { campana, fecha, obtenerFilaSeleccionada, currentDate, catalogos, updateData, setUpdateData } = props;
  const { nombre, cod_usuario, json } = useSelector((state) => state.auth);
  /**
   * USE STATE
   * Lista de States
   */
  //lista de datos consultados a base de datos
  const dispatch = useDispatch();
  const [datos, setDatos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [actividadesSinGuardar, setActividadesSinGuardar] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [tipos, setTipos] = useState();
  // const [valores, setValores] = useState({ filtro1: ""  , filtro2: ""   });
  /**
   * USE MEMO
   * Estados manejados con ahorro de memoria
   */
  // LISTA FILTRADA
  const lista = useMemo(
    // () => actividades.map((i) => ({ ...i, estado: estados.find((e) => i.cod_estado === e.cod_estado) })),
    () =>
      actividades[
        // .filter(i => {})
        (actividades, estados) /*, valores */
      ]
  );
  const convertKeysToLowerCase = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map((v) => convertKeysToLowerCase(v));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((acc, key) => {
        acc[key.toLowerCase()] = convertKeysToLowerCase(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  };

  /**
   * CONSULTA DE DATOS
   * Consulta a base de datos de la lista
   */
  const obtenerTipos = useCallback(async () => {
    await api
      .get("api/appweb/lista-tipo")
      .then(({ data }) => setTipos(data.data))
      .catch((e) => console.error(e));
  }, []);
  const obtenerConfiguraciones = useCallback(async () => {
    await api
      .get("api/appweb/lista-configuracion-actividad", {
        params: { cod_cc: JSON.parse(decryptId(sessionStorage.getItem("currentCentroCosto"))).cod_cc || null, cod_estado: 1 },
      })
      .then(({ data }) => {
        setConfigs(data.data.filter((config) => !config.solo_resultado));
      })
      .catch((e) => console.error(e));
  }, []);

  const obtenerClientes = useCallback(async () => {
    let lista_clientes = [];
    console.log();
    console.log(JSON.parse(campana.pais_destino || []));

    const paises_origen = campana.pais_origen ? JSON.parse(campana.pais_origen) : [];
    const paises_destino = campana.pais_destino ? JSON.parse(campana.pais_destino) : [];

    if (campana?.tipo_transporte_desc && campana?.cod_cc && campana?.tipo_asignacion) {
      for await (let pais of [...paises_origen, ...paises_destino]) {
        await api
          .get("api/appweb/lista-clientes-campanas", {
            params: {
              tipo_entidad: "CLIENTE",
              tipo_asignacion: campana.tipo_asignacion,
              cod_cc: campana.cod_cc,
              tipo_embarque: campana.tipo_transporte_desc,
              cod_pais_2: pais.PAIS_CODIGO_2,
            },
          })
          .then(({ data }) => {
            if (Array.isArray(data.data)) {
              lista_clientes = [...lista_clientes, ...data.data];
            }
          })
          .catch((e) => console.error(e));
      }
    }
    // console.log(lista_clientes)
    setEntidades(
      lista_clientes.map((cliente) => ({
        ...cliente,
        unique_id: `${cliente.entidad_id}_${cliente.pais_codigo}`,
      }))
    );
  }, [fecha, campana]);

  const obtenerEmpleados = useCallback(async () => {
    const cod_cc = JSON.parse(decryptId(sessionStorage.getItem("currentCentroCosto")))?.cod_cc;
    await api
      .get("api/appweb/listaemp-usu-puesto", { params: { cod_cc } })
      .then(({ data }) => setEmpleados(data.data))
      .catch((e) => console.error(e));
  }, []);

  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerConfiguraciones(), obtenerEmpleados(), obtenerClientes(), obtenerTipos()]).then(() => dispatch(apagarCarga()));
  }, [obtenerConfiguraciones, obtenerClientes, obtenerEmpleados, obtenerTipos, dispatch]);
  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);
  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  const actividades_ = useMemo(() => {
    return entidades
      ?.map((entidad, i) => ({
        ...entidad,
        unique_id: i,
        seleccionar: false,
      }))
      .filter((entidad) => entidad.entidad_id != null);
  }, [entidades, configs]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* <pre>{JSON.stringify(entidades, null, 2)}</pre> */}
      <TablaEditableCampanas
        campana={campana}
        lista={actividades_}
        catalogos={{ ...catalogos, entidades, empleados, configs, estados, tipos }}
        currentDate={currentDate}
        updateData={updateData}
        setUpdateData={setUpdateData}
      />
    </Box>
  );
};
ListaEditableCampanas.propTypes = {
  // ELEMENTO
  //   tipo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  //   entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  //   entidad: PropTypes.object,
  //   obtenerFilaSeleccionada: PropTypes.func,
};
export default ListaEditableCampanas;
