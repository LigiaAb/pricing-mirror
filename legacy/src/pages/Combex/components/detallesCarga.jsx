import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import CargasTabla from "./cargasTabla";

function DetallesCarga({
  coordinacion,
  useCheck = false,
  useVer = true,
  onView,
  filasSeleccionadas = [],
  onFilasSeleccionadas = () => { },
  multipleCheck = true,
}) {
  return (
    <Box sx={{ p: 3, bgcolor: "background.paper", borderRadius: 2 }}>
      <Box
        mt={1}
        sx={{
          bgcolor: "background.default",
          p: 2,
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: "text.primary", mb: 1, fontWeight: 500 }}
        >
          Empresa:{" "}
          <span style={{ color: "var(--mui-palette-secondary-main)" }}>
            {coordinacion?.empresa}
          </span>
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.primary", mb: 1, fontWeight: 500 }}
        >
          Centro de Costo:{" "}
          <span style={{ color: "var(--mui-palette-secondary-main)" }}>
            {coordinacion?.centroCosto}
          </span>
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.primary", mb: 1, fontWeight: 500 }}
        >
          Estado:{" "}
          <span style={{ color: "var(--mui-palette-success-main)" }}>
            {coordinacion?.estado}
          </span>
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.primary", fontWeight: 500 }}
        >
          Cliente:{" "}
          <span style={{ color: "var(--mui-palette-secondary-main)" }}>
            {coordinacion?.cliente}
          </span>
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.primary", mb: 1, fontWeight: 500 }}
        >
          País Origen: {coordinacion.paisOrigen ?? ""}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.primary", mb: 1, fontWeight: 500 }}
        >
          País Destino: {coordinacion.paisDestino ?? ""}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.primary", mb: 1, fontWeight: 500 }}
        >
          Observaciones: {coordinacion.observaciones ?? ""}
        </Typography>
      </Box>

      <Box mt={3}>
        <CargasTabla
          embarqueId={coordinacion?.embarqueId}
          onView={onView}
          useVer={useVer}
          useCheck={useCheck}
          filasSeleccionadas={filasSeleccionadas}
          onFilasSeleccionadas={onFilasSeleccionadas}
          multipleCheck={multipleCheck}
        />
      </Box>
    </Box>
  );
}

DetallesCarga.propTypes = {
  coordinacion: PropTypes.object,
  useCheck: PropTypes.bool,
  useVer: PropTypes.bool,
  onView: PropTypes.func,
  filasSeleccionadas: PropTypes.array,
  onFilasSeleccionadas: PropTypes.func,
  multipleCheck: PropTypes.bool,
};

export default DetallesCarga;
