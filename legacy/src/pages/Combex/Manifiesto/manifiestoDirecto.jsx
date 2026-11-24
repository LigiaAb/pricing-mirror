import { useState, useRef } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  Icon,
  Chip,
  TextField,
} from "@mui/material";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import {
  useCoordinacionLegs,
  useCreateCoordinacionFechaMov,
  useUpdateAtdCoordinacionAsignada,
  useUpdateCoordinacionEstado,
  useUpdateCoordinacion,
  useFetchGuiasCoordinacion,
} from "../../../hooks/Bpm";
import { useQueryClient } from "@tanstack/react-query";
import TarjetaCoordinaciones from "../components/tarjetaCoordinacion";
import LegsDisplay from "../components/LegsDisplay";
import { useManifiestoConsolidadoPdf } from "./hooks/useManifiestoConsolidadoPdf";
import SeleccionarCopiasModal from "../../../components/bpm/coordinaciones/modals/SeleccionarCopiasModal";
import SeleccionarDestino from "../../Embarques/components/SeleccionarDestino";
import CambiarDestino from "./cambiarrDestino";

export default function ManifiestoDirecto({ coordinacion, onClose }) {
  const procesandoAtdRef = useRef(false);
  const [mostrarAtd, setMostrarAtd] = useState(false);
  const [fechaAtd, setFechaAtd] = useState(dayjs());
  const [comentarioAtd, setComentarioAtd] = useState("");
  const [procesandoAtd, setProcesandoAtd] = useState(false);
  const [atdError, setAtdError] = useState(null);
  const [atdExito, setAtdExito] = useState(false);
  const [mostrarConsolidar, setMostrarConsolidar] = useState(false);
  const [isCopiasModalOpen, setIsCopiasModalOpen] = useState(false);

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

  const {
    isGeneratingPdf: generandoPdf,
    handleDownloadPdf,
    allCargasLoaded,
  } = useManifiestoConsolidadoPdf(
    coordinacion ? [coordinacion] : [],
    correlativoGuiaMaster || correlativoGuia,
    legs,
    { consolidar: false, includeDueAgent: false }
  );

  const { mutateAsync: createFechaMov } = useCreateCoordinacionFechaMov();
  const { mutateAsync: updateAtd } = useUpdateAtdCoordinacionAsignada();
  const { mutateAsync: updateEstado } = useUpdateCoordinacionEstado();
  const { mutateAsync: updateCoordinacion } = useUpdateCoordinacion();
  const queryClient = useQueryClient();

  const handleOpenCopiasModal = () => {
    setIsCopiasModalOpen(true);
  };

  const handleGenerarGuiaMaster = async (copias) => {
    setIsCopiasModalOpen(false);
    try {
      await handleDownloadPdf({ copias });
    } catch (err) {
      console.error("Error al generar guía master:", err);
    }
  };

  const handleConfirmarSalida = async () => {
    if (procesandoAtdRef.current) return;
    procesandoAtdRef.current = true;
    setProcesandoAtd(true);
    setAtdError(null);
    try {
      const fechaIso = fechaAtd.toISOString();
      const observacionAtd = comentarioAtd?.trim() || "ATD Confirmado";
      await createFechaMov({
        embarque_id: embarqueId,
        id_tipo_fecha: 158,
        fecha: fechaIso,
        observacion: observacionAtd,
        estado_cod: 1,
      });

      await updateAtd({ embarque_id: embarqueId, cod_file: codFile, fecha_atd: fechaIso });
      await updateEstado({
        embarque_id: embarqueId,
        cod_file: codFile,
        cod_estado_actual: coordinacion?.estadoId ?? coordinacion?.estado_id,
        cod_estado_siguiente: 67,
      });
      await queryClient.invalidateQueries({ queryKey: ["coordinaciones"] });
      setAtdExito(true);
      setMostrarAtd(false);
      setComentarioAtd("");
    } catch (err) {
      setAtdError(err?.message || "Error al confirmar salida");
    } finally {
      procesandoAtdRef.current = false;
      setProcesandoAtd(false);
    }
  };

  const handleConsolidarSuccess = async () => {
    try {
      await updateCoordinacion({
        embarque_id: embarqueId,
        cod_file: codFile,
        cod_empresa: codEmpresa,
        cod_cc: codCc,
        cod_tipo_embarque: coordinacion?.tipoIdEmbarque ?? coordinacion?.tipo_id_embarque,
        cod_entidad_cli: coordinacion?.entidadIdCli ?? coordinacion?.entidad_id_cli,
        cod_pais_origen: coordinacion?.cod_pais_origen,
        cod_pais_destino: coordinacion?.cod_pais_destino,
        puerto_id_origen: coordinacion?.puerto_id_origen,
        puerto_id_destino: coordinacion?.puerto_id_destino,
        cod_servicio: 10,
        cod_tipo_carga: coordinacion?.tipoIdCarga ?? coordinacion?.tipo_id_carga,
        cod_cotizacion_cabecera: coordinacion?.cotizacionCabeceraId ?? coordinacion?.cotizacioncabecera_id,
        char_w: coordinacion?.repeso ?? 0,
        incoterm_id: coordinacion?.incotermId ?? coordinacion?.incoterm_id,
        cod_tipo_pago: coordinacion?.tipoPago ?? coordinacion?.tipo_id_pago,
        cod_asesor: coordinacion?.usuarioIdAsesor ?? coordinacion?.usuario_id_asesor,
        observacion: coordinacion?.observaciones ?? "",
        cod_embarque_padre: coordinacion?.embarqueIdPadre ?? coordinacion?.embarque_id_padre,
      });
      await queryClient.invalidateQueries({ queryKey: ["coordinaciones"] });
      setMostrarConsolidar(false);
      onClose();
    } catch (err) {
      console.error("Error al cambiar servicio a CONSOLIDADO:", err);
    }
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
            Manifiesto Directo
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
        <Chip
          label="DIRECTO"
          color="info"
          variant="outlined"
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </Stack>

      {atdExito && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAtdExito(false)}>
          Salida confirmada correctamente.
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

      {/* Acciones */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          disabled={!allCargasLoaded || generandoPdf}
          onClick={handleOpenCopiasModal}
          title={allCargasLoaded ? undefined : "Cargando datos del manifiesto..."}
          startIcon={
            generandoPdf ? (
              <CircularProgress size={16} />
            ) : (
              <Box component="span" className="c-pdf" sx={{ lineHeight: 0, fontSize: 16 }} />
            )
          }
        >
          Guía Master
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={() => setMostrarAtd(true)}
          startIcon={<Box component="span" className="c-calendario" sx={{ lineHeight: 0, fontSize: 16 }} />}
          disabled={atdExito}
        >
          Confirmar Salida (ATD)
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={() => setMostrarConsolidar(true)}
          startIcon={<Box component="span" className="c-avion" sx={{ lineHeight: 0, fontSize: 16 }} />}
          disabled={atdExito}
          sx={{ display: "none" }}
        >
          Consolidar
        </Button>
      </Stack>

      {/* Dialog ATD */}
      <Dialog
        open={mostrarAtd}
        onClose={() => !procesandoAtd && setMostrarAtd(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmar Salida — ATD</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {atdError && (
              <Alert severity="error" onClose={() => setAtdError(null)}>
                {atdError}
              </Alert>
            )}
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
              <DateTimePicker
                label="Fecha y Hora de Salida (ATD)"
                value={fechaAtd}
                onChange={(val) => val && setFechaAtd(val)}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </LocalizationProvider>
            <TextField
              label="Comentario para coordinación fecha"
              value={comentarioAtd}
              onChange={(event) => setComentarioAtd(event.target.value)}
              fullWidth
              size="small"
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setMostrarAtd(false)} disabled={procesandoAtd}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConfirmarSalida}
            disabled={procesandoAtd || !fechaAtd || atdExito}
          >
            {procesandoAtd ? <CircularProgress size={18} color="inherit" /> : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>

      <SeleccionarCopiasModal
        open={isCopiasModalOpen}
        onClose={() => setIsCopiasModalOpen(false)}
        onGenerate={handleGenerarGuiaMaster}
        isGenerating={generandoPdf}
      />

      {/* CambiarDestino — Consolidar */}
      <CambiarDestino
        open={mostrarConsolidar}
        onClose={() => setMostrarConsolidar(false)}
        embarqueId={embarqueId}
        codFile={codFile}
        codEstadoActual={coordinacion?.estadoId ?? coordinacion?.estado_id ?? 65}
        title="Consolidar Coordinación"
        subtitle={`File: ${codFile}`}
        onSuccess={handleConsolidarSuccess}
      />
    </Box>
  );
}

ManifiestoDirecto.propTypes = {
  coordinacion: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};