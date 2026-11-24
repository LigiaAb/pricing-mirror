import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Icon, CircularProgress, Typography, Grid } from "@mui/material";
import { TablaPaises } from "../../views/Paises/TablaPaises";
import { api } from "../../api";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";

export const ListaPaises = () => {
  const { currentPais, currentEmpresa, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const { json } = useSelector((state) => state.auth);

  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const blackPage = () => navigate("/configuracion/organizacion/pais");

  // const [acciones, setAcciones] = useState(null);
  const [newBtn, setNewBtn] = useState(false);
  const [accionesDeTabla, setAccionesDeTabla] = useState({
    add: false,
    view: true,
    go: false,
    copy: false,
    paste: false,
    auth: false,
    edit: false,
    excel: false,
    pdf: false,
    download: false,
    delete: false,
  });

  const obtenerPaises = useCallback(async () => {
    await api
      // .get("api/appweb/lista-entidad", { params: { tipo_entidad: tipos_entidades[tipo].nom_tipo } })
      .get("api/appweb/listapaises")
      .then(({ data }) => setData(data.data))
      .catch((e) => console.error(e));
  }, []);

  // Realizar la consulta
  const hacerConsultas = useCallback(async () => {
    await Promise.all([obtenerPaises()]).then(() => dispatch(apagarCarga()));
  }, [obtenerPaises, dispatch]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  useEffect(() => {
    dispatch(encenderCarga());
  }, [dispatch]);

  const editProperties = (arr, id, newProperties, code) => {
    const array = arr.map((item) => {
      if (true) {
        return {
          ...item,
          accionesDeTabla: {
            ...item.accionesDeTabla,
            ...newProperties,
          },
        };
      }
      return item;
    });
    setData(array);
  };

  const dataAddProperty = (arrData) => {
    const dataApi = arrData.map((item) => {
      return {
        ...item,
        accionesDeTabla: accionesDeTabla,
        deleted: false,
      };
    });
    return dataApi;
  };

  return data ? (
    <Grid sx={{ px: 2, m: 0 }}>
      <Grid>
        <TablaPaises reDirect={true} dataApi={dataAddProperty(data)} newBtn={newBtn} />
      </Grid>
    </Grid>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
