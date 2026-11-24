import React from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";

const ReporteBasePage = (props) => {
  return (
    <Box>
      <Typography variant="h3">Reporte</Typography>
      <Outlet />
    </Box>
  );
};

ReporteBasePage.propTypes = {};

export default ReporteBasePage;
