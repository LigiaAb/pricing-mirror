import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Grid, Button, Icon, CircularProgress, Typography } from "@mui/material";
import { api } from "../../api";
import { TablaEstados } from "../../views/Estados/TablaEstados";

export const ListaEstados = () => {
  const [data, setData] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const navigate = useNavigate();
  const blackPage = () => navigate("/configuracion/crud/estado");

  const getDataApi = async () => {
    const dataApi = await api.get("/api/appweb/listaestados");
    if (dataApi.status !== 200) throw new Error();
    const dataSetProperties = dataAddProperty(dataApi.data.data);
    editProperties(dataSetProperties, 1001, { add: false, go: false, excel: false, pdf: false, download: false }, "COD_PAIS");
  };

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
        accionesDeTabla: {
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
          delete: true,
        },
        deleted: false,
      };
    });
    return dataApi;
  };
  useEffect(() => {
    getDataApi();
  }, []);

  return data ? (
    <Box sx={{ p: 1, m: 0 }}>
      <Box sx={{ paddingLeft: 2, paddingTop: 2 }}>
        <Typography variant="h6">ESTADOS</Typography>
      </Box>
      <Box sx={{ p: 1, m: 0, my: 1 }}>
        <TablaEstados reDirect={true} dataApi={data} setOpenModal={setOpenModal} openModal={openModal} setData={setData} viewBtn={true} />
      </Box>
    </Box>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
