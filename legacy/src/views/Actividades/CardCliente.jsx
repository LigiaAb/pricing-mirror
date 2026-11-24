import React, { useEffect, useState, useMemo } from "react";
import propTypes from "prop-types";
import { Box, Typography, Grid, Button, Icon, CircularProgress } from "@mui/material";
import { useSelector } from "react-redux";

export const CardCliente = (props) => {
  const { themeMode } = useSelector((state) => state.theme);
  const { cliente, onClick } = props;

  return (
    <Grid
      container
      onClick={onClick}
      sx={{
        display: "flex",
        justifyContent: "left",
        alignItems: "center",
        bgcolor: themeMode === "dark" ? "background.50" : "background.900",
        borderRadius: 2,
        borderColor: themeMode === "dark" ? "background.100" : "background.700",
        borderWidth: 1,
        boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
      }}
    >
      <Grid
        item
        size={{ xs: 12, md: 2 }}
        sx={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          component="img"
          alt="entidad_logo"
          // src="https://st2.depositphotos.com/5205783/7801/v/450/depositphotos_78017774-stock-illustration-logo-abstract-triangle-vector.jpg"
          src="https://camacoes.org.gt/wp-content/uploads/2022/12/logo-grupo-cropa-dsv.jpg"
          sx={{
            width: "100%",
            height: "auto",
            maxWidth: "200px",
            borderRadius: "10%",
            p: 1,
          }}
        />
      </Grid>
      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 10 }}>
        <Typography fontSize="2rem" fontWeight="bold">
          {cliente.entidad_nombre}
        </Typography>
        <Box sx={{ display: "inline-flex", pt: 1 }}>
          <Box sx={{ pr: 2, display: "inline-flex", flexDirection: "row", flexWrap: "wrap", gap: "16px 32px" }}>
            <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
              <Icon className="c-mapa" sx={{ mr: 1 }} /> Pais: {cliente.pais}
            </Box>
            <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
              <Icon className="c-mapa-ubicacion" sx={{ mr: 1 }} /> Ciudad: {cliente.ciudad}
            </Box>
            <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
              <Icon className="c-bodega" sx={{ mr: 1 }} /> Industria: {cliente.industria}
            </Box>
            <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
              <Icon className="c-puesto" sx={{ mr: 1 }} /> Tipo: {cliente.tipo}
            </Box>
            <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
              <Icon className="c-informacion" sx={{ mr: 1 }} /> Estado: {cliente.estado}
            </Box>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

CardCliente.propTypes = {
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
