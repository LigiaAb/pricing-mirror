import { useState } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Chip,
  Checkbox,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  Icon,
  IconButton,
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
} from "../../../hooks/Bpm";
import { useQueryClient } from "@tanstack/react-query";
import LegsDisplay from "../components/LegsDisplay";
import SeleccionarCopiasModal from "../../../components/bpm/coordinaciones/modals/SeleccionarCopiasModal";
import { useManifiestoConsolidadoPdf } from "./hooks/useManifiestoConsolidadoPdf";

export default function ManifiestoConsolidado({ mawb, coordinaciones = [], onClose }) {
  const [seleccionadas, setSeleccionadas] = useState(
    () => new Set(coordinaciones.map((c) => c.embarqueId ?? c.embarque_id))
  );
  const [consolidado, setConsolidado] = useState(false);
  const [mostrarAtd, setMostrarAtd] = useState(false);
  const [fechaAtd, setFechaAtd] = useState(dayjs());
  const [comentarioAtd, setComentarioAtd] = useState("");
  const [procesandoAtd, setProcesandoAtd] = useState(false);
  const [atdError, setAtdError] = useState(null);
  const [atdExito, setAtdExito] = useState(false);
  const primeraCoord = coordinaciones[0];
  const codCc = primeraCoord?.centroId ?? primeraCoord?.cencos_id ?? 16;
  const codEmpresa = primeraCoord?.empresaId ?? primeraCoord?.empresa_id ?? 1;

  const { data: legs = [], isLoading: legsLoading } = useCoordinacionLegs(
    primeraCoord?.embarqueId ?? primeraCoord?.embarque_id,
    codCc,
    codEmpresa
  );

  const coordinacionesSeleccionadas = coordinaciones.filter((c) =>
    seleccionadas.has(c.embarqueId ?? c.embarque_id)
  );

  const { isGeneratingPdf: generandoPdf, handleDownloadPdf, handleDownloadManifestoPdf } = useManifiestoConsolidadoPdf(
    coordinacionesSeleccionadas,
    mawb,
    legs,
    { includeDueAgent: false }
  );
  const [isCopiasModalOpen, setIsCopiasModalOpen] = useState(false);
  const { mutateAsync: createFechaMov } = useCreateCoordinacionFechaMov();
  const { mutateAsync: updateAtd } = useUpdateAtdCoordinacionAsignada();
  const { mutateAsync: updateEstado } = useUpdateCoordinacionEstado();
  const queryClient = useQueryClient();
  const { themeMode } = useSelector((state) => state.theme);

  const handleRefreshCoordinaciones = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["coordinaciones"], refetchActive: true });
    } catch (err) {
      console.warn("Error invalidando cache de coordinaciones:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleToggle = (embarqueId) => {
    if (consolidado) return;
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(embarqueId)) {
        next.delete(embarqueId);
      } else {
        next.add(embarqueId);
      }
      return next;
    });
  };

  const handleConsolidar = () => setConsolidado(true);

  const handleOpenCopiasModal = () => setIsCopiasModalOpen(true);

  const handleGenerarManifiesto = async (copias) => {
    setIsCopiasModalOpen(false);
    await handleDownloadPdf({ copias });
  };

  const handleConfirmarSalida = async () => {
    setProcesandoAtd(true);
    setAtdError(null);
    try {
      const fechaIso = fechaAtd.toISOString();
      const observacionAtd = comentarioAtd?.trim() || "ATD Confirmado";
      const selArray = coordinaciones.filter((c) =>
        seleccionadas.has(c.embarqueId ?? c.embarque_id)
      );
      const noSelArray = coordinaciones.filter(
        (c) => !seleccionadas.has(c.embarqueId ?? c.embarque_id)
      );

      for (const coord of selArray) {
        const embarque_id = coord.embarqueId ?? coord.embarque_id;
        const cod_file = coord.cod_file ?? coord.codFile ?? "";
        try {
          await createFechaMov({
            embarque_id,
            id_tipo_fecha: 158,
            fecha: fechaIso,
            observacion: observacionAtd,
            estado_cod: 1,
          });

          await updateAtd({ embarque_id, cod_file, fecha_atd: fechaIso });
          await updateEstado({
            embarque_id,
            cod_file,
            cod_estado_actual: coord.estadoId ?? coord.estado_id,
            cod_estado_siguiente: 67,
          });
        } catch (err) {
          console.warn(`ATD error embarque ${embarque_id}:`, err);
        }
      }

      for (const coord of noSelArray) {
        const embarque_id = coord.embarqueId ?? coord.embarque_id;
        const cod_file = coord.cod_file ?? coord.codFile ?? "";
        try {
          await updateEstado({
            embarque_id,
            cod_file,
            cod_estado_actual: coord.estadoId ?? coord.estado_id,
            cod_estado_siguiente: 5,
          });
        } catch (err) {
          console.warn(`Estado pendiente error embarque ${embarque_id}:`, err);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["coordinaciones"] });
      await queryClient.invalidateQueries({ queryKey: ["coordinacion-fecha-mov"] });
      setAtdExito(true);
      setMostrarAtd(false);
      setComentarioAtd("");
    } catch (err) {
      setAtdError(err?.message || "Error al confirmar salida");
    } finally {
      setProcesandoAtd(false);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const totalSeleccionadas = seleccionadas.size;

  const camposTabla = [
    { key: "correlativoGuia", label: "House" },
    { key: "cod_file", label: "File" },
    { key: "cliente", label: "Cliente" },
    { key: "entidadShipperNombre", label: "Shipper" },
    { key: "entidadConsignatarioNombre", label: "Consignatario" },
    { key: "servicio", label: "Servicio" },
    { key: "tipoCarga", label: "Tipo Carga" },
    { key: "incoterm", label: "Incoterm" },
    { key: "responsable", label: "Responsable" },
    { key: "observaciones", label: "Observaciones" },
  ];

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
        <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
          Manifiesto Consolidado
        </Typography>
      </Stack>

      {/* Tarjeta de informacion de vuelo (antes MAWB) */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: "action.hover",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Master: {mawb || "—"}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              size="small"
              aria-label="Recargar coordinaciones"
              onClick={handleRefreshCoordinaciones}
              disabled={isRefreshing}
              sx={{ borderRadius: 1, border: "1px solid", borderColor: "divider" }}
            >
              {isRefreshing ? <CircularProgress size={16} /> : <Icon className="c-actualizar" />}
            </IconButton>
            <Chip
              label={`${coordinaciones.length} ${coordinaciones.length === 1 ? "coordinación" : "coordinaciones"}`}
              sx={{ bgcolor: "rgba(0,0,0,0.05)", fontWeight: 700 }}
            />
          </Stack>
        </Box>
        <Box sx={{ p: 2.5 }}>
          <LegsDisplay legs={legs} isLoading={legsLoading} />
        </Box>
      </Paper>

      {atdExito && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAtdExito(false)}>
          Salida confirmada correctamente.
        </Alert>
      )}

      {/* Tabla checklist */}
      <Paper
        elevation={0}
        sx={{ mb: 3, borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}
      >
        <Box
          sx={{
            p: 2,
            bgcolor: "action.hover",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Coordinaciones incluidasx
          </Typography>
          {consolidado && <Chip label="Consolidado" color="success" size="small" />}
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                {camposTabla.map((col) => (
                  <TableCell key={col.key} sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {coordinaciones.map((coord) => {
                const eid = coord.embarqueId ?? coord.embarque_id;
                const checked = seleccionadas.has(eid);
                return (
                  <TableRow
                    key={eid}
                    hover={!consolidado}
                    sx={{
                      cursor: consolidado ? "default" : "pointer",
                      opacity: consolidado && !checked ? 0.45 : 1,
                      transition: "opacity 0.2s",
                    }}
                    onClick={() => handleToggle(eid)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={checked}
                        disabled={consolidado}
                        onChange={() => handleToggle(eid)}
                        onClick={(e) => e.stopPropagation()}
                        size="small"
                        color="primary"
                      />
                    </TableCell>
                    {camposTabla.map((col) => (
                      <TableCell key={col.key} sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="body2">{coord[col.key] ?? "—"}</Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Información de vuelo ahora está en la tarjeta superior (reemplazo de MAWB) */}
      <Divider sx={{ mb: 3 }} />

      {/* Botones de acción */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="flex-end">
        {!consolidado && (
          <Button
            variant="contained"
            color="primary"
            disabled={totalSeleccionadas === 0}
            onClick={handleConsolidar}
          >
            Consolidar ({totalSeleccionadas} seleccionadas)
          </Button>
        )}

        {consolidado && (
          <>
            {!atdExito && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => setConsolidado(false)}
              >
                Cancelar
              </Button>
            )}

            <Button
              variant="contained"
              color="info"
              disabled={generandoPdf}
              onClick={handleDownloadManifestoPdf}
              startIcon={
                generandoPdf ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Box component="span" className="c-pdf" sx={{ lineHeight: 0, fontSize: 16 }} />
                )
              }
            >
              Generar Manifiesto
            </Button>

            <Button
              variant="contained"
              color="success"
              disabled={generandoPdf}
              onClick={handleOpenCopiasModal}
              startIcon={
                generandoPdf ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Box component="span" className="c-pdf" sx={{ lineHeight: 0, fontSize: 16 }} />
                )
              }
            >
              Generar Master
            </Button>

            <Button
              variant="outlined"
              color="warning"
              onClick={() => setMostrarAtd(true)}
              disabled={atdExito}
              startIcon={<Box component="span" className="c-calendario" sx={{ lineHeight: 0, fontSize: 16 }} />}
              sx={{ color: themeMode === "light" ? "black.main" : "warning.main" }}
            >
              Confirmar Salida (ATD)
            </Button>
          </>
        )}
      </Stack>

      {/* Dialog Confirmar Salida ATD */}
      <Dialog
        open={mostrarAtd}
        onClose={() => !procesandoAtd && setMostrarAtd(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmar Salida — ATD</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ fontSize: "0.82rem" }}>
              <strong>{totalSeleccionadas}</strong>{" "}
              {totalSeleccionadas === 1 ? "coordinación recibirá" : "coordinaciones recibirán"} la fecha
              ATD.
              {coordinaciones.length - totalSeleccionadas > 0 && (
                <>
                  {" "}Las{" "}
                  <strong>{coordinaciones.length - totalSeleccionadas}</strong> restantes cambiarán a
                  estado <strong>Pendiente</strong>.
                </>
              )}
            </Alert>
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
            color="warning"
            onClick={handleConfirmarSalida}
            disabled={procesandoAtd || !fechaAtd}
          >
            {procesandoAtd ? <CircularProgress size={18} color="inherit" /> : "Confirmar"}
          </Button>
        </DialogActions>
      </Dialog>

      <SeleccionarCopiasModal
        open={isCopiasModalOpen}
        onClose={() => setIsCopiasModalOpen(false)}
        onGenerate={handleGenerarManifiesto}
        isGenerating={generandoPdf}
      />
    </Box>
  );
}

ManifiestoConsolidado.propTypes = {
  mawb: PropTypes.string,
  coordinaciones: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
};
