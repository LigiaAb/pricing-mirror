import React, { useEffect, useState, useMemo, useCallback } from "react";
import propTypes from "prop-types";
import { Box, Typography, Grid, Button, Icon, CircularProgress } from "@mui/material";
import { useSelector } from "react-redux";
import TabComponent from "../../components/Tabs/TabComponent";
import { useDispatch } from "react-redux";
import { api } from "../../api";
import { apagarCarga, encenderCarga } from "../../store/slices/status/statusSlice";

import { LineChart } from "@mui/x-charts/LineChart";
import { GraficasEmbarques } from "./GraficasEmbarques";
import { GraficasEmbarquesTropi } from "./GraficasEmbarquesTropi";

export const ReporteCliente = (props) => {
  const { cliente, onClick } = props;

  return (
    <TabComponent
      tabInicial={1}
      opciones={[
        {
          id: 1,
          icono: "c-e",
          label: "Exportaciones",
          content: <GraficasEmbarques cliente={cliente} cod_empresa={1} cod_cenco={16} />,
        },
        {
          id: 2,
          icono: "c-i",
          label: "Importaciones",
          content: <GraficasEmbarques cliente={cliente} cod_empresa={1} cod_cenco={4} />,
        },
        {
          id: 3,
          icono: "c-t",
          label: "Tropicargo",
          content: <GraficasEmbarquesTropi cliente={cliente} cod_empresa={1} cod_cenco={4} />,
        },
      ]}
    />
  );
};

ReporteCliente.propTypes = {
  cliente: propTypes.shape({
    entidad_nombre: propTypes.string,
    pais: propTypes.string,
    ciudad: propTypes.string,
    industria: propTypes.string,
    tipo: propTypes.string,
    estado: propTypes.string,
  }),
  onClick: propTypes.func,
};
