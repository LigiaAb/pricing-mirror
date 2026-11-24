import PropTypes from "prop-types";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
} from "@mui/material";

/**
 * Componente que muestra un resumen simple de las cargas asociadas a
 * una coordinación. Se utiliza principalmente en la vista de detalles de CTS
 * para que el usuario pueda ver rápidamente qué items forman parte de la
 * coordinación y algunos datos básicos.
 *
 * @param {Array} cargas - arreglo de objetos con información de cada carga.
 * @param {boolean} isLoading - indicador de carga.
 */
const InfoCoordinacion = ({ isLoading = false, coordinacion = {}, showGuia = true, showId = true }) => {
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  // si se pasó información de coordinación, preparemos un arreglo de pares
  const detallesCoordinacion = coordinacion && Object.keys(coordinacion).length > 0 ? [
    // { label: "Empresa", value: coordinacion.empresa_nombre ?? coordinacion.empresa ?? "" },
    // { label: "Centro de costo", value: coordinacion.cencod_nombre ?? coordinacion.centroCosto ?? "" },
    {
      label: "Cod File",
      value: {
        codFile: coordinacion.cod_file ?? coordinacion.codFile ?? "",
        id:
          coordinacion.id ?? coordinacion.ID ?? coordinacion.embarque_id ?? coordinacion.EMBARQUE_ID ?? coordinacion.embarqueId ?? coordinacion.embarqueID ?? "",
      },
    },
    ...(showGuia
      ? [
          {
            label: "Guía",
            value: {
              house: coordinacion.correlativoGuia ?? coordinacion.correlativo_guia ?? "",
              master:
                coordinacion.correlativoGuiaMaster ?? coordinacion.correlativo_guia_master ?? "",
            },
          },
        ]
      : []),
    {
      label: "País",
      value: {
        origen: coordinacion.nombre_pais_origen ?? coordinacion.pais_origen ?? coordinacion.paisOrigen ?? "",
        destino: coordinacion.nombre_pais_destino ?? coordinacion.pais_destino ?? coordinacion.paisDestino ?? "",
      },
    },
    { label: "Cliente", value: coordinacion.entidad_nombre ?? coordinacion.cliente ?? "" },
    //{ label: "Punto enlace origen", value: coordinacion.puntoenlace_nombre_origen ?? coordinacion.puntoEnlaceOrigen ?? "" },
    //{ label: "Punto enlace destino", value: coordinacion.puntoenlace_nombree_destino ?? coordinacion.puntoEnlaceDestino ?? "" },
    //{ label: "Observaciones", value: coordinacion.observaciones ?? "" },
  ] : [];

  // cargas data no longer se utiliza, la tarjeta solo muestra detalles de la coordinación

  const renderDetalleValor = (item) => {
    if (item.label === "Guía") {
      return (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mt: 0.5 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: "bold", color: "text.secondary" }}>
              House:
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
              {item.value.house || "-"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: "bold", color: "text.secondary" }}>
              Master:
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
              {item.value.master || "-"}
            </Typography>
          </Box>
        </Box>
      );
    }

    if (item.label === "País") {
      return (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mt: 0.5 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: "bold", color: "text.secondary" }}>
              Origen:
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
              {item.value.origen || "-"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: "bold", color: "text.secondary" }}>
              Destino:
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
              {item.value.destino || "-"}
            </Typography>
          </Box>
        </Box>
      );
    }

    if (item.label === "Cod File") {
      return (
        <Box sx={{ mt: 0.5, wordBreak: "break-word" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: showId ? { xs: "1fr", sm: "1fr 1fr" } : "1fr", gap: 1 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: "bold", color: "text.secondary", display: "block" }}>
                Cod File
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                {item.value.codFile || "-"}
              </Typography>
            </Box>
            {showId && (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: "bold", color: "text.secondary", display: "block" }}>
                  ID
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                  {item.value.id || "-"}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      );
    }

    return (
      <Typography
        variant="body2"
        sx={{
          mt: 0.5,
          wordBreak: "break-word",
          fontWeight: item.label === "Cod File" ? "bold" : "normal",
        }}
      >
        {item.value || "-"}
      </Typography>
    );
  };

  return (
    <Box sx={{ mt: 0 }}>
      {detallesCoordinacion.length > 0 && (
        <Box sx={{ mb: 0 }}>
          <Box
            sx={{
              display: "grid",
              gap: 0.5,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
                lg: "repeat(5, minmax(0, 1fr))",
              },
            }}
          >
            {detallesCoordinacion.map((item) => (
              <Paper
                key={item.label}
                elevation={0}
                sx={{
                  p: 1.5,
                  height: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                {item.label !== "Guía" && item.label !== "Cod File" && item.label !== "País" && (
                  <Typography variant="caption" sx={{ fontWeight: "bold", color: "text.secondary" }}>
                    {item.label}
                  </Typography>
                )}
                {renderDetalleValor(item)}
              </Paper>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

InfoCoordinacion.propTypes = {
  isLoading: PropTypes.bool,
  coordinacion: PropTypes.object,
  showGuia: PropTypes.bool,
  showId: PropTypes.bool,
};

export default InfoCoordinacion;
