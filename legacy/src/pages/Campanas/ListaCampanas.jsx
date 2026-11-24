import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Icon, CircularProgress, Typography, Grid } from "@mui/material";
import { TablaPaises } from "../../views/Paises/TablaPaises";
import { api } from "../../api";
import { useSelector } from "react-redux";
// import { campanas } from "../../database_dummy/campanas";
import { actividades } from "../../database_dummy/actividades";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";

// import { TablaOportunidades } from "../../views/campanas/TablaOportunidades";
import { TablaCampanas } from "../../views/Campanas/TablaCampanas";

export const ListaCampanas = () => {
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
  const [campanas, setCampanas] = useState();

  const obtenerEntidades = useCallback(async () => {
    let lista_entidades = [];
    let tipos_entidades = ["CLIENTE", "PRE-CLIENTE", "DSV"];

    for (let tipo in tipos_entidades) {
      await api
        .get("api/appweb/lista-entidad-simplificada", { params: { tipo_entidad: tipos_entidades[tipo] } })
        .then(({ data }) => {
          lista_entidades = lista_entidades.concat(data.data.data);
        })
        .catch((e) => console.error(e));
    }
    setEntidades(lista_entidades);
  }, []);

  const obtenerCampanas = useCallback(async () => {
    await api
      .get("api/appweb/lista-campanas")
      .then(({ data }) => setCampanas(data.data))
      .catch((e) => console.error(e));
  }, []);
  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerCampanas()]).then(() => dispatch(apagarCarga()));
  }, [obtenerCampanas, dispatch]);

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
    const dataApi = arrData.map((campana) => {
      let propiedades = {};
      Object.keys(campana).forEach((key) => {
        propiedades[key] = {
          color: key === "estado_desc" ? (campana.estado_desc === "EN PROCESO" ? "green.main" : "ESPERANDO RESPUESTA" ? "yellow.800" : "error.main") : undefined,
          bold: key === "estado_desc" ? true : undefined,
        };
      });

      return {
        ...campana,
        fecha_inicio_locale: campana.fecha_inicio ? new Date(campana.fecha_inicio).toLocaleDateString() : null,
        fecha_fin_locale: campana.fecha_fin ? new Date(campana.fecha_fin).toLocaleDateString() : null,
        accionesDeTabla: accionesDeTabla,
        deleted: false,
        propiedadesDeTabla: propiedades,
      };
    });
    return dataApi;
  };

  return campanas ? (
    <Grid sx={{ px: 2, m: 0 }}>
      <Grid sx={{ py: 2 }}>
        <Typography variant="h4">Lista de Campañas de Ventas</Typography>
      </Grid>
      <Grid>
        <TablaCampanas datos={dataAddProperty(campanas || [])} newBtn={true} />
      </Grid>
    </Grid>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
