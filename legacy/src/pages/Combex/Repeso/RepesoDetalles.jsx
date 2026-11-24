import {
  Box,
  Typography,
  Button,
  Icon,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import PropTypes from "prop-types";
import EditCargasTabla from "../components/editCargasTabla";
import TarjetaCoordinacion from "../components/tarjetaCoordinacion";
import { useCoordinacionCargas, useRecalcularEmbarqueConRepeso } from "../../../hooks/Bpm";

export default function RepesoDetalles({ registro, onClose }) {
  const { data: cargas = [], refetch: refetchCargas } = useCoordinacionCargas(
    registro?.embarqueId || null
  );

  const { handleRepesoBilladoSuccess, snackbar, cerrarSnackbar } = useRecalcularEmbarqueConRepeso({
    registro,
    cargas,
    refetchCargas,
  });

  const originalTotal = (Array.isArray(cargas) ? cargas : []).reduce(
    (sum, c) => sum + (Number(c?.peso) || 0),
    0
  );

  const adjustedTotal = (Array.isArray(cargas) ? cargas : []).reduce(
    (sum, c) => {
      const hasRepeso = c?.repeso != null;
      const value = hasRepeso ? Number(c.repeso || 0) : Number(c.peso || 0);
      return sum + (Number.isNaN(value) ? 0 : value);
    },
    0
  );

  const fmt = (n) =>
    n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const difference = adjustedTotal - originalTotal;

  const fmtDiff = (d) =>
    `${d >= 0 ? "+" : ""}${d.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <Box sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" sx={{ mb: 1, gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<Icon className="c-derecha-abajo-izquierda" />}
          onClick={onClose}
          size="small"
          sx={{
            borderColor: "info.light",
            color: "info.light",
            "&:hover": {
              bgcolor: "info.light",
              color: "background.paper",
            },
          }}
        >
          Regresar
        </Button>
        <Typography
          variant="h5"
          sx={{ color: "text.primary", fontWeight: 600 }}
        >
          Coordinación: {registro?.cod_file}
        </Typography>
      </Box>

      <TarjetaCoordinacion coordinacion={registro} />
      <Box sx={{ mb: 2 }}>
        <Paper elevation={1} sx={{ p: 2, maxWidth: "600px", mx: "auto" }}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Peso Original
              </Typography>
              <Typography variant="body1">{fmt(originalTotal)}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Diferencia
              </Typography>
              <Typography variant="body1">{fmtDiff(difference)}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Peso Ajustado
              </Typography>
              <Typography variant="body1">{fmt(adjustedTotal)}</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      <EditCargasTabla embarque_id={registro?.embarqueId} onRepesoSuccess={handleRepesoBilladoSuccess} />

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={cerrarSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={cerrarSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

RepesoDetalles.propTypes = {
  registro: PropTypes.object,
  onClose: PropTypes.func,
};
