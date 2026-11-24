import { useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Divider,
  Alert,
  Icon,
  Chip,
} from "@mui/material";
import { useCoordinacionLegs, useFetchGuiasCoordinacion } from "../../../hooks/Bpm";
import { useQueryClient } from "@tanstack/react-query";
import TarjetaCoordinaciones from "../components/tarjetaCoordinacion";
import LegsDisplay from "../components/LegsDisplay";
import SeleccionarDestino from "../../Embarques/components/SeleccionarDestino";

export default function ManifiestoPendiente({ coordinacion, onClose }) {
  const [mostrarDestino, setMostrarDestino] = useState(false);
  const [exito, setExito] = useState(false);

  const codCc = coordinacion?.centroId ?? coordinacion?.cencos_id ?? 16;
  const codEmpresa = coordinacion?.empresaId ?? coordinacion?.empresa_id ?? 1;
  const embarqueId = coordinacion?.embarqueId ?? coordinacion?.embarque_id;
  const codFile = coordinacion?.cod_file ?? coordinacion?.codFile ?? "";

  const { data: legs = [], isLoading: legsLoading } = useCoordinacionLegs(
    embarqueId,
    codCc,
    codEmpresa
  );

  const { data: guias = [] } = useFetchGuiasCoordinacion(
    { embarqueId },
    { enabled: !!embarqueId }
  );

  const correlativoGuia = guias[0]?.correlativoGuia || "";
  const correlativoGuiaMaster = guias[0]?.correlativoGuiaMaster || "";

  const queryClient = useQueryClient();

  const handleDestinoSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["coordinaciones"] });
    setExito(true);
    setMostrarDestino(false);
  };

  return (
    <Box sx={{ width: "95%", mx: "auto", mt: 2 }}>
      {/* Encabezado */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Icon className="c-derecha-abajo-izquierda" />}
          onClick={onClose}
          sx={{ borderColor: "info.light", color: "info.light" }}
        >
          Regresar
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            Coordinación Pendiente
          </Typography>
          {correlativoGuia && (
            <Typography variant="body2" color="text.secondary">
              House: <strong>{correlativoGuia}</strong>
              {correlativoGuiaMaster && (
                <> &nbsp;|&nbsp; Master: <strong>{correlativoGuiaMaster}</strong></>
              )}
            </Typography>
          )}
        </Box>
        <Chip label="PENDIENTE" color="warning" variant="outlined" size="small" sx={{ fontWeight: 700 }} />
      </Stack>

      {exito && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setExito(false)}>
          Destino asignado correctamente.
        </Alert>
      )}

      {/* Tarjeta coordinación */}
      <TarjetaCoordinaciones coordinacion={coordinacion} />

      {/* Legs */}
      <Paper
        elevation={0}
        sx={{ mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: "action.hover",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Información de Vuelo
          </Typography>
        </Box>
        <Box sx={{ p: 2.5 }}>
          <LegsDisplay legs={legs} isLoading={legsLoading} />
        </Box>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      {/* Acción */}
      <Stack direction="row" justifyContent="flex-end">
        <Button
          variant="contained"
          color="primary"
          onClick={() => setMostrarDestino(true)}
          startIcon={<Box component="span" className="c-avion" sx={{ lineHeight: 0, fontSize: 16 }} />}
        >
          Seleccionar Destino
        </Button>
      </Stack>

      {/* SeleccionarDestino */}
      <SeleccionarDestino
        open={mostrarDestino}
        onClose={() => setMostrarDestino(false)}
        embarqueId={embarqueId}
        codFile={codFile}
        servicioNombre={coordinacion?.servicio || ""}
        codEstadoActual={coordinacion?.estadoId ?? coordinacion?.estado_id ?? 5}
        title="Seleccionar Destino"
        subtitle={`File: ${codFile}`}
        navigate={null}
        onSuccess={handleDestinoSuccess}
      />
    </Box>
  );
}

ManifiestoPendiente.propTypes = {
  coordinacion: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};
