import { useMemo } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import TablaCoordinaciones from "../../../components/bpm/tablas/tablaCoordinaciones";
import RepesoDetalles from "./RepesoDetalles";
import { decryptId, encryptId } from "../../../api/encryptDecrypt";
import { useCoordinaciones } from "../../../hooks/Bpm";

export default function Repeso() {
  const navigate = useNavigate();
  const location = useLocation();
  const { encryptedId } = useParams();
  const registroDesdeEstado = location.state?.registro ?? null;
  const isDetailRoute = Boolean(encryptedId);

  const embarqueId = useMemo(
    () => (encryptedId ? decryptId(encryptedId) : null),
    [encryptedId]
  );

  const shouldFetchRegistro =
    isDetailRoute &&
    !!embarqueId &&
    String(registroDesdeEstado?.embarqueId ?? "") !== String(embarqueId);

  const { data: coordinaciones = [], isLoading: isRegistroLoading } = useCoordinaciones(
    {
      cod_empresa: 1,
      cod_cc: 16,
      embarque_id: embarqueId || undefined,
    },
    { enabled: shouldFetchRegistro }
  );

  const registroSeleccionado = useMemo(() => {
    if (!isDetailRoute) return null;

    if (
      registroDesdeEstado &&
      String(registroDesdeEstado?.embarqueId ?? "") === String(embarqueId ?? "")
    ) {
      return registroDesdeEstado;
    }

    return coordinaciones?.[0] ?? null;
  }, [coordinaciones, embarqueId, isDetailRoute, registroDesdeEstado]);

  const handleView = (registro) => {
    if (!registro?.embarqueId) return;

    navigate(`${encryptId(registro.embarqueId)}`, {
      state: { registro },
    });
  };

  const handleClose = () => {
    navigate("..");
  };

  return (
    <>
      {!isDetailRoute && (
        <Box sx={{ width: "95%", mx: "auto", mt: 2 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: 'text.primary' }}>
            Repeso
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Listado de coordinaciones. Use la acción Ver para abrir detalles y gestionar repesos.
          </Typography>
          <TablaCoordinaciones estadoFilter={["ETIQUETADO EN COMBEX", "ENVIO COMBEX CON ETIQUETAS", 70]} onView={handleView} />
        </Box>
      )}
      {isDetailRoute && isRegistroLoading && !registroSeleccionado && (
        <Box sx={{ width: "95%", mx: "auto", mt: 2 }}>
          <Typography variant="body1" color="text.secondary">
            Cargando detalle de repeso...
          </Typography>
        </Box>
      )}
      {isDetailRoute && !isRegistroLoading && !registroSeleccionado && (
        <Box sx={{ width: "95%", mx: "auto", mt: 2 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: "text.primary" }}>
            Repeso
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No se encontró coordinación para el detalle solicitado.
          </Typography>
          <Button variant="outlined" onClick={handleClose}>
            Regresar
          </Button>
        </Box>
      )}
      {registroSeleccionado && (
        <RepesoDetalles registro={registroSeleccionado} onClose={handleClose} />
      )}
    </>
  );
}
