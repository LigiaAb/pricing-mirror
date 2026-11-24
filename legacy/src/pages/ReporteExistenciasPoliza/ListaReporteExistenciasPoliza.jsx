import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Icon, CircularProgress, Typography, Grid } from "@mui/material";
import { api } from "../../api";
import { useSelector } from "react-redux";
import { TablaReporteExistenciasGenerales } from "../../views/ReporteExistenciasGenerales/TablaReporteExistenciasGenerales";
import { TablaReporteExistenciasPoliza } from "../../views/ReporteExistenciasPoliza/TablaReporteExistenciasPoliza";
import FormularioComponent from "../../components/Formulario/FormularioComponent";

export const ListaReporteExistenciasPoliza = () => {
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

  const estados = [
    { id: 1, label: "Inventario" },
    { id: 2, label: "Dañado" },
    { id: 3, label: "Vencido" },
    { id: 4, label: "Muestra" },
    { id: 5, label: "Promocional" },
    { id: 6, label: "Comiso" },
    { id: 7, label: "Beneficio" },
    { id: 8, label: "Donacion" },
    { id: 9, label: "Bloqueado" },
    { id: 10, label: "Quality" },
    { id: 11, label: "Sobrante" },
  ];

  const tipos = [
    { id: 1, label: "Reales" },
    { id: 2, label: "Disponibles" },
  ];

  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        label: "Tipo de Existencias",
        id: "tipo",
        val: valores.tipo || null,
        options: tipos,
      },
      {
        tipo: "date",
        label: "Hasta Fecha",
        id: "estado",
        val: valores.estado || null,
        options: estados,
      },
    ],
    [valores]
  );

  return data ? (
    <Grid sx={{ px: 0, m: 0 }}>
      <Box sx={{ px: 1, mb: 2 }} align="right">
        <Button size="small" variant="contained" color="error" sx={{ ml: 1 }}>
          <Icon className="c-pdf" sx={{ mr: 0.5, fontSize: 15 }} />
          Generar PDF
        </Button>

        <Button size="small" variant="contained" color="success" sx={{ ml: 1 }}>
          <Icon className="c-excel" sx={{ mr: 0.5, fontSize: 15 }} />
          Generar Excel
        </Button>
      </Box>

      <Grid>
        <TablaReporteExistenciasPoliza reDirect={true} dataApi={[]} paises={paises} viewBtn={false} />
      </Grid>
    </Grid>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
