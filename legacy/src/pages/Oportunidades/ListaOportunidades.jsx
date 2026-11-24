import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Icon, CircularProgress, Typography, Grid } from "@mui/material";
import { TablaPaises } from "../../views/Paises/TablaPaises";
import { decryptId } from "../../api/encryptDecrypt";
import { api } from "../../api";
import { useSelector } from "react-redux";
// import { oportunidades } from "../../database_dummy/oportunidades";
import { actividades } from "../../database_dummy/actividades";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";

import { TablaOportunidades } from "../../views/Oportunidades/TablaOportunidades";

export const ListaOportunidades = ({ retrasadas = false }) => {
  const { json, cod_usuario } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [accionesDeTabla, setAccionesDeTabla] = useState({
    add: false,
    view: true,
    go: false,
    copy: false,
    paste: false,
    auth: false,
    edit: true,
    excel: false,
    pdf: false,
    download: false,
    delete: false,
  });

  const [state, setState] = useState(0);
  const [actividades, setActividades] = useState([]);
  const [oportunidades, setOportunidades] = useState();
  const [estados, setEstados] = useState();
  const [empresas, setEmpresas] = useState();
  const [cencos, setCencos] = useState();
  const [entidades, setEntidades] = useState([]);
  const [empleados, setEmpleados] = useState();
  // const [ inputsActivos, setInputsActivos ] = useState();

  const obtenerEntidades = useCallback(async () => {
    let lista_entidades = [];
    let tipos_entidades = ["CLIENTE", "PRE-CLIENTE", "DSV"];

    for (let tipo in tipos_entidades) {
      await api
        .get("api/appweb/lista-entidad", { params: { tipo_entidad: tipos_entidades[tipo] } })
        .then(({ data }) => {
          lista_entidades = lista_entidades.concat(data.data.data);
        })
        .catch((e) => console.error(e));
    }
    setEntidades(lista_entidades);
  }, []);

  const obtenerOportunidades = useCallback(async () => {
    const cod_cc = JSON.parse(decryptId(sessionStorage.getItem("currentCentroCosto")))?.cod_cc;
    if (cod_cc) {
      await api
        .get("api/appweb/lista-oportunidades", {
          params: { cod_cc },
        })
        .then(({ data }) => setOportunidades(data.data))
        .catch((e) => console.error(e));
    }
  }, []);

  const obtenerEstados = useCallback(async () => {
    await api
      .get("api/appweb/listaestados")
      .then(({ data }) => setEstados(data.data.filter((estado) => estado.nom_tipo === "ACTIVIDAD")))
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

  const obtenerEmpleados = useCallback(async () => {
    await api
      .get("api/appweb/listaemp-usu-puesto")
      .then(({ data }) => setEmpleados(data.data))
      .catch((e) => console.error(e));
  }, []);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerOportunidades(), obtenerEntidades(), obtenerEmpleados(), obtenerCencos(), obtenerEmpresas(), obtenerEstados()]).then(() => dispatch(apagarCarga()));
  }, [obtenerOportunidades, obtenerEmpleados, obtenerEntidades, obtenerEstados, obtenerEmpresas, dispatch]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  // "EN PROCESO": "green.main",
  // "FINALIZADO": "error.main",
  // "EN SEGUIMIENTO": "accent.main",
  // "ANULADO": "warning.main"

  const dataAddProperty = (arrData) => {
    const dataApi = arrData.map((oportunidad) => {
      let propiedades = {};
      Object.keys(oportunidad).forEach((key) => {
        propiedades[key] = {
          color:
            key === "estado_desc"
              ? oportunidad.estado_desc === "EN PROCESO"
                ? "green.main"
                : oportunidad.estado_desc === "FINALIZADO"
                  ? "error.main"
                  : oportunidad.estado_desc === "ESPERANDO RESPUESTA"
                    ? "accent.main"
                    : undefined
              : undefined,
          bold: key === "estado_desc" ? true : undefined,
        };
      });
      return {
        ...oportunidad,
        cliente: oportunidad.nombre_cliente,
        accionesDeTabla: accionesDeTabla,
        deleted: false,
        propiedadesDeTabla: propiedades,
      };
    });
    return dataApi;
  };

  return oportunidades ? (
    <Grid sx={{ px: 2, m: 0 }}>
      <Grid sx={{ py: 2 }}>
        <Typography variant="h4">Lista Proyectos y Licitaciones</Typography>
      </Grid>
      <Grid>
        <TablaOportunidades datos={dataAddProperty(oportunidades || [])} newBtn={true} />
      </Grid>
    </Grid>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
