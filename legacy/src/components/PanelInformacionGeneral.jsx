import React from "react";
import { Typography, Grid as Grid, CircularProgress } from "@mui/material";
import { obtenerNombreCampo } from "../constants/mapeoCampos";

const normalizarDatos = (datos = {}) => Object.fromEntries(Object.entries(datos).map(([k, v]) => [k.toUpperCase(), v]));

const obtenerValorFormateado = ({ key, value, datos, emptyValue, formatter }) => {
  if (value === undefined || value === null || value === "") return emptyValue;

  if (typeof formatter === "function") {
    return formatter(value, { key, datos });
  }

  return value.toString();
};

const PanelInformacionGeneral = ({
  titulo = "Detalle",
  campos = [],
  datos = null,
  loading = false,
  error = null,
  noDataText = "No hay información disponible.",
  categoriaMapeo = "embarque",
  formatters = {},
  labelMapper,
  emptyValue = "-",
  containerProps = {},
}) => {
  const { sx: containerSx = {}, ...restContainerProps } = containerProps;
  const datosNormalizados = datos ? normalizarDatos(datos) : null;
  const tituloNormalizado = String(titulo || "Detalle").toUpperCase();

  const obtenerEtiqueta = (key) => {
    const llaveNormalizada = key.toUpperCase();

    if (typeof labelMapper === "function") {
      const etiquetaPersonalizada = labelMapper(llaveNormalizada, datosNormalizados);
      if (etiquetaPersonalizada) return etiquetaPersonalizada;
    }

    const etiquetaMapeo = obtenerNombreCampo(llaveNormalizada, categoriaMapeo);
    return etiquetaMapeo || llaveNormalizada;
  };

  const renderContenido = () => {
    if (loading) {
      return (
        <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} />
        </Grid>
      );
    }

    if (error) {
      return (
        <Grid item xs={12}>
          <Typography color="error">{error}</Typography>
        </Grid>
      );
    }

    if (!datosNormalizados) {
      return (
        <Grid item xs={12}>
          <Typography>{noDataText}</Typography>
        </Grid>
      );
    }

    return campos.map((campo) => {
      const campoConfig = typeof campo === "string" ? { key: campo } : campo;
      const key = campoConfig.key || "";
      const llaveNormalizada = key.toUpperCase();
      const valorOriginal = datosNormalizados[llaveNormalizada];
      const formatter = campoConfig.formatter || formatters[llaveNormalizada] || formatters[key] || null;

      const valorFormateado = obtenerValorFormateado({
        key: llaveNormalizada,
        value: valorOriginal,
        datos: datosNormalizados,
        emptyValue,
        formatter,
      });

      const etiqueta = campoConfig.label || obtenerEtiqueta(llaveNormalizada);

      return (
        <Grid
          container
          item
          xs={12}
          key={llaveNormalizada}
          sx={{
            borderBottom: "1px solid #eee",
            py: 0.5,
            alignItems: "center",
            transition: "all 0.2s ease-in-out",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "#e0e0e0",
              borderRadius: "4px",
              padding: "2px 4px",
            },
          }}
        >
          <Grid item xs={6} sx={{ textAlign: "left", pr: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1976d2" }}>
              {etiqueta}:
            </Typography>
          </Grid>
          <Grid item xs={6} sx={{ width: "100%", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            <Typography
              variant="body2"
              sx={{
                wordBreak: "break-all",
                textAlign: "right",
                width: "100%",
                fontWeight: 700,
                color: "#002664 !important",
              }}
            >
              {valorFormateado}
            </Typography>
          </Grid>
        </Grid>
      );
    });
  };

  return (
    <Grid
      container
      sx={{
        width: { xs: "100%", md: 380 },
        maxWidth: { xs: "100%", md: 380 },
        minWidth: { xs: "100%", md: 380 },
        height: "auto",
        maxHeight: "none",
        padding: { xs: 0.5, md: 1.5 },
        mt: 0,
        border: "0.5px solid #e0e0e0",
        borderRadius: 2,
        boxShadow: "0 2px 8px 0 rgba(25, 118, 210, 0.08)",
        background: "rgb(245, 245, 245)",
        overflow: "visible",
        flexShrink: 0,
        ...containerSx,
      }}
      {...restContainerProps}
    >
      <Grid item xs={12} sx={{ textAlign: "center", mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          {`${tituloNormalizado}:`}
        </Typography>
      </Grid>
      {renderContenido()}
    </Grid>
  );
};

export default PanelInformacionGeneral;
