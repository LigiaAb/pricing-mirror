import { Box, Typography, Paper, Stack, CircularProgress, Chip } from "@mui/material";
import PropTypes from "prop-types";

export default function LegsDisplay({ legs = [], isLoading }) {
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!legs || legs.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
        Sin información de vuelo registrada
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5}>
      {legs.slice(0, 3).map((leg, idx) => (
        <Paper
          key={leg.embLegsId ?? idx}
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            borderColor: "primary.light",
            background: "linear-gradient(135deg, rgba(21,101,192,0.04) 0%, rgba(11,41,103,0.02) 100%)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
            flexWrap="wrap"
          >
            {/* Vuelo */}
            <Box sx={{ minWidth: 90 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                Vuelo
              </Typography>
              <Chip
                label={leg.flightNumber || leg.masterNumber || "—"}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  color: (theme) => (theme.palette.mode === "dark" ? "#fff" : "inherit"),
                  borderColor: (theme) => (theme.palette.mode === "dark" ? theme.palette.grey[600] : ""),
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "",
                }}
              />
            </Box>

            {/* Ruta */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                Ruta
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" fontWeight={600}>
                  {leg.puntoenlaceNombreOrigen || leg.nombrePaisOrigen || "—"}
                </Typography>
                <Box
                  component="span"
                  className="c-derecha"
                  sx={{ fontSize: 14, color: "text.secondary", lineHeight: 0 }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {leg.puntoenlaceNombreDestino || leg.nombrePaisDestino || "—"}
                </Typography>
              </Stack>
            </Box>

            {/* Aerolínea */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                Aerolínea
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {leg.entidadNombreProv || "—"}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

LegsDisplay.propTypes = {
  legs: PropTypes.array,
  isLoading: PropTypes.bool,
};
