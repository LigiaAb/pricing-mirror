import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Icon, CircularProgress, Typography, Grid } from "@mui/material";
import { TablaPaises } from "../../views/Paises/TablaPaises";
import { api } from "../../api";
import { useSelector } from "react-redux";
import { TablaEmbarques } from "../../views/ConsultaEmbarques/TablaEmbarques";
import { mockData, clientes } from "./mockData";
import FormularioComponent from "../../components/Formulario/FormularioComponent";

export const ListaReporteInventario = () => {
  const { currentPais, currentEmpresa, currentMenu, currentCategoria } = useSelector((state) => state.menu);
  const { json } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const blackPage = () => navigate("/configuracion/organizacion/pais");

  const [valores, setValores] = useState({ value: 0, label: "" });
  const [data, setData] = useState(null);
  const [paises, setPaises] = useState([]);
  const [accionesDeTabla, setAccionesDeTabla] = useState({
    add: false,
    view: false,
    go: false,
    copy: false,
    paste: false,
    auth: false,
    edit: false,
    excel: false,
    pdf: false,
    download: false,
    delete: true,
  });
  const [newBtn, setNewBtn] = useState(false);

  const checkPermisos = () => {};

  const getDataApi = async () => {
    const dataApi = await api.get("/api/appweb/lista-moneda");
    if (dataApi.status !== 200) throw new Error();
    const dataSetProperties = dataAddProperty(dataApi.data.data);
    editProperties(dataSetProperties, 1001, { add: false, go: false, excel: false, pdf: false, download: false }, "COD_PAIS");
  };

  const getPaisesApi = async () => {
    const dataApi = await api.get("/api/appweb/listapaises");
    if (dataApi.status !== 200) throw new Error();
    setPaises(dataApi.data.data);
  };

  useEffect(() => {
    getDataApi();
    getPaisesApi();
    checkPermisos();
  }, []);

  const editProperties = (arr, id, newProperties, code) => {
    const array = arr.map((item) => {
      if (item[code] == id) {
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
        <TablaEmbarques reDirect={true} dataApi={dataAddProperty(mockData)} paises={paises} viewBtn={false} />
      </Grid>
    </Grid>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
