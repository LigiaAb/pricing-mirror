import React, { useEffect, useState, useMemo } from "react";
import { Box, Typography, Grid, Button, Icon, CircularProgress, Divider } from "@mui/material";
import propTypes from "prop-types";
import { useSelector } from "react-redux";

export const CardOportunidad = (props) => {
  const { themeMode } = useSelector((state) => state.theme);
  const { oportunidad, onClick } = props;
  return (
    <Grid
      container
      onClick={onClick}
      sx={{
        display: "flex",
        justifyContent: "left",
        alignItems: "center",
        pb: 1,
        pt: 3,
        px: 1,
        my: 1,
        bgcolor: themeMode === "dark" ? "background.50" : "background.900",
        borderRadius: 2,
        borderColor: themeMode === "dark" ? "background.100" : "background.700",
        borderWidth: 1,
        boxShadow: "2px 2px 5px 2px rgba(0,0,0,0.1)",
      }}
    >
      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 12 }}>
        <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          {/* <Icon className="c-exclamacion" sx={{mr: 2}}/> */}
          {oportunidad?.descripcion || ""}
        </Box>
      </Grid>

      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
        <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          <Icon className="c-usuario" sx={{ mr: 2 }} /> Creado por: {oportunidad?.usuario || ""}
        </Box>
      </Grid>
      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
        <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          <Icon className="c-cliente" sx={{ mr: 2 }} /> Cliente: {oportunidad?.cliente || ""}
        </Box>
      </Grid>
      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
        <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          <Icon className="c-asignacion" sx={{ mr: 2 }} /> Centro de Costo: {oportunidad?.cenco || ""}
        </Box>
      </Grid>
      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
        <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          <Icon className="c-empresa" sx={{ mr: 2 }} /> Empresa: {oportunidad?.empresa || ""}
        </Box>
      </Grid>
      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
        <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          <Icon className="c-capas" sx={{ mr: 2 }} /> Tipo: {oportunidad?.tipo_desc || ""}
        </Box>
      </Grid>
      <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
        <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
          <Icon className="c-calendario-reloj" sx={{ mr: 2 }} /> Fecha de entrega: {oportunidad?.fecha_entrega ? new Date(oportunidad?.fecha_entrega).toLocaleDateString() : ""}
        </Box>
      </Grid>
      {oportunidad.objetivo_importe ? (
        <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
          <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
            <Icon className="c-bolsa-dinero" sx={{ mr: 2 }} /> Cantidad de Importe: Q.{oportunidad?.objetivo_importe || ""}
          </Box>
        </Grid>
      ) : null}
      {oportunidad.objetivo_movimientos ? (
        <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 6 }}>
          <Box fontSize="1.2rem" sx={{ display: "inline-flex", alignItems: "center" }}>
            <Icon className="c-barco" sx={{ mr: 2 }} /> Cantidad de Movimientos: {oportunidad?.objetivo_movimientos || ""}
          </Box>
        </Grid>
      ) : null}
      {oportunidad.cod_estado == 31 ? (
        <Grid item sx={{ pl: 2, pb: 2 }} size={{ xs: 12, md: 12 }}>
          <Divider />
          <Typography mt={2} fontSize="1.3rem" fontWeight="bold">
            Resultado:
          </Typography>
          <Typography fontSize="1.2rem">{oportunidad?.resultado || ""}</Typography>
        </Grid>
      ) : null}
    </Grid>
  );
};

CardOportunidad.propTypes = {
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
