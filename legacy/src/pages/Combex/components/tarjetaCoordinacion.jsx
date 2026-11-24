import { Box, Paper, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import PropTypes from "prop-types";

export default function tarjetaCoordinacion({ coordinacion, sx }) {
  return (
    <Box sx={{ width: "90%", mx: "auto", mb: 2, ...(sx || {}) }}>
      <Paper elevation={1} sx={{ p: 2, mb: 2, maxWidth: "600px", mx: "auto" }}>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              País Origen
            </Typography>
            <Typography variant="body2">
              {coordinacion?.paisOrigen || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              País Destino
            </Typography>
            <Typography variant="body2">
              {coordinacion?.paisDestino || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Entidad
            </Typography>
            <Typography variant="body2">
              {coordinacion?.cliente || coordinacion?.entidad_nombre || "-"}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Observaciones
            </Typography>
            <Typography variant="body2">
              {coordinacion?.observaciones || "-"}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

tarjetaCoordinacion.propTypes = {
  coordinacion: PropTypes.object,
  sx: PropTypes.object,
};
