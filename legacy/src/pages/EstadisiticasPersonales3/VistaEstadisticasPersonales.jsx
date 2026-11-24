import React from "react";
import PropTypes from "prop-types";
import { Box, Grid } from "@mui/material";
import TabComponent from "../../components/Tabs/TabComponent";
// import GraficasEstadisticasPersonales from "../../views/CRM/EstadisiticasPersonales/GraficasEstadisticasPersonales";
import GraficasEstadisticasPersonales from "../../views/EstadisiticasPersonales3/GraficasEstadisticasPersonales";

const VistaEstadisticasPersonales = () => {
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {/* <pre>{JSON.stringify(permisosArray, null, 2)}</pre> */}
      <GraficasEstadisticasPersonales />
    </Box>
  );
};

VistaEstadisticasPersonales.propTypes = {};

export default VistaEstadisticasPersonales;
