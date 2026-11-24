import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Stack,
  Stepper,
  Step,
  StepLabel,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Icon,
  IconButton,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
  useUpdateCoordinacionEstado,
  useCreateCoordinacionFechaMov,
  useListarMasterDisponiblesCoordinacion,
  useAsignarMasterCoordinacion,
  useFetchGuiasCoordinacion,
} from '../../../hooks/Bpm';
import {
  MasterDisponibleCard,
  OpcionDestinoCard,
  DEFAULT_DESTINO_OPTIONS,
} from '../../Embarques/components/SeleccionarDestino';

const WIZARD_STEPS = ['Seleccionar Master', 'Confirmar destino'];

const ESTADOS_DESTINO = {
  combex_con_etiquetas: 70,
  combex_sin_etiquetas: 71,
  bodega: 72,
};

export default function CambiarDestino({
  open,
  onClose,
  embarqueId,
  codFile,
  codEstadoActual,
  title = 'Cambiar Destino',
  subtitle = '',
  options = DEFAULT_DESTINO_OPTIONS,
  onSuccess,
  navigate,
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedMaster, setSelectedMaster] = useState('');
  const [asignadaGuiaMaster, setAsignadaGuiaMaster] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState(dayjs().add(1, 'day'));
  const [error, setError] = useState(null);

  const updateEstado = useUpdateCoordinacionEstado();
  const createFechaMov = useCreateCoordinacionFechaMov();
  const assignCorrelativo = useAsignarMasterCoordinacion();
  const processing = updateEstado.isPending || createFechaMov.isPending;

  const { data: mastersDisponibles = [], isLoading: isLoadingMasters } =
    useListarMasterDisponiblesCoordinacion({
      embarque_id: embarqueId,
      cod_file: codFile,
      enabled: !!embarqueId && open,
    });

  const { refetch: refetchGuias } = useFetchGuiasCoordinacion(
    { embarque_id: Number(embarqueId) },
    { enabled: false }
  );

  const mastersFiltrados = useMemo(() => {
    const q = String(searchQuery || '').trim().toLowerCase();
    if (!q) return mastersDisponibles;
    return mastersDisponibles.filter((m) => {
      const master = m.CORRELATIVO_GUIA_MASTER ?? m.correlativo_guia_master ?? '';
      const house = m.GUIA_COORDINACION ?? m.guia_coordinacion ?? '';
      const file = m.ID_FILE ?? m.id_file ?? '';
      const pais = m.PAIS_DESTINO ?? m.pais_destino ?? '';
      const cliente = m.CLIENTE_COORDINACION ?? m.cliente_coordinacion ?? '';
      const linea = m.LINEA_AEREA ?? m.linea_aerea ?? '';
      return `${master} ${house} ${file} ${pais} ${cliente} ${linea}`.toLowerCase().includes(q);
    });
  }, [mastersDisponibles, searchQuery]);

  const mastersAgrupados = useMemo(() => {
    const map = new Map();
    mastersFiltrados.forEach((item) => {
      const masterGuia = item.CORRELATIVO_GUIA_MASTER ?? item.correlativo_guia_master ?? '';
      const houseGuia = item.GUIA_COORDINACION ?? item.guia_coordinacion ?? '';
      const paisDestino = item.PAIS_DESTINO ?? item.pais_destino ?? '';
      const cliente = item.CLIENTE_COORDINACION ?? item.cliente_coordinacion ?? '';
      const lineaAerea = item.LINEA_AEREA ?? item.linea_aerea ?? '';
      if (!map.has(masterGuia)) {
        map.set(masterGuia, { masterGuia, houses: [], paisDestino, cliente, lineaAerea });
      }
      if (houseGuia) map.get(masterGuia).houses.push(houseGuia);
    });
    return Array.from(map.values());
  }, [mastersFiltrados]);

  const handleClose = () => {
    if (assignCorrelativo.isPending || processing) return;
    onClose();
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedMaster('');
    setAsignadaGuiaMaster('');
    setSearchQuery('');
    setOpcionSeleccionada(null);
    setFechaEntrega(dayjs().add(1, 'day'));
    setError(null);
  };

  const handleNuevaMaster = async () => {
    setError(null);
    try {
      await assignCorrelativo.mutateAsync({
        embarque_id: Number(embarqueId),
        cod_file: codFile || '',
      });
      const { data: guiasActualizadas } = await refetchGuias();
      const guiaMasterAsignada = guiasActualizadas?.[0]?.correlativoGuiaMaster;
      if (!guiaMasterAsignada) {
        setError('La guía master no pudo confirmarse.');
        return;
      }
      setAsignadaGuiaMaster(guiaMasterAsignada);
      setActiveStep(1);
    } catch (err) {
      setError(err?.message || 'Error al crear nueva master');
    }
  };

  const handleAsignar = async () => {
    if (!selectedMaster) {
      setError('Seleccione una guía master para continuar.');
      return;
    }
    setError(null);
    try {
      await assignCorrelativo.mutateAsync({
        embarque_id: Number(embarqueId),
        cod_file: codFile || '',
        num_guia_master: selectedMaster,
      });
      const { data: guiasActualizadas } = await refetchGuias();
      const guiaMasterAsignada = guiasActualizadas?.[0]?.correlativoGuiaMaster;
      if (!guiaMasterAsignada) {
        setError('La guía master no pudo confirmarse. Seleccione una guía válida.');
        return;
      }
      setAsignadaGuiaMaster(guiaMasterAsignada);
      setActiveStep(1);
    } catch (err) {
      setError(err?.message || 'Error al asignar master');
    }
  };

  const handleConfirm = async () => {
    if (!opcionSeleccionada) return;
    setError(null);
    try {
      const codEstadoSiguiente = ESTADOS_DESTINO[opcionSeleccionada];
      if (codEstadoSiguiente) {
        await updateEstado.mutateAsync({
          embarque_id: embarqueId,
          cod_file: codFile || '',
          cod_estado_actual: codEstadoActual,
          cod_estado_siguiente: codEstadoSiguiente,
        });
      }
      const selectedOption = options.find((o) => o.id === opcionSeleccionada);
      if (opcionSeleccionada === 'combex_con_etiquetas' && selectedOption?.requiresDate && fechaEntrega) {
        await createFechaMov.mutateAsync({
          embarque_id: Number(embarqueId) || 0,
          estado_cod: 1,
          fecha: fechaEntrega.format('YYYY-MM-DD'),
          id_fecha_reg_embarque: '62',
          id_tipo_fecha: '324',
          observacion: 'Fecha de entrega COMBEX',
        });
      }
      if (typeof onSuccess === 'function') onSuccess();
      if (navigate && embarqueId && opcionSeleccionada === 'combex_con_etiquetas') {
        navigate('/embarques/embarques/');
      }
      handleReset();
      onClose();
    } catch (err) {
      setError(err?.message || 'Error al procesar la acción');
    }
  };

  const selectedOption = options.find((o) => o.id === opcionSeleccionada);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 600, md: 720 } } } }}
      transitionProps={{ onExited: handleReset }}
    >
      <DialogContent sx={{ p: 0 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
          <Box sx={{ p: 2 }}>
            {/* Encabezado */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #0B2967 0%, #1565C0 100%)',
                py: 2,
                px: 2.5,
                mx: -2,
                mt: -2,
                mb: 2,
                borderRadius: '4px 4px 0 0',
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={900} color="white">
                    {title}
                  </Typography>
                  {subtitle && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {subtitle}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  onClick={handleClose}
                  size="small"
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.12)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                    p: 1,
                  }}
                >
                  <Icon baseClassName="cropa-icons" className="c-cerrar-sesion" sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
            </Box>

            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              {WIZARD_STEPS.map((label, index) => (
                <Step key={label} completed={index === 0 && activeStep > 0}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Paso 1: Seleccionar Master */}
            {activeStep === 0 && (
              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Seleccione la guía master para esta coordinación
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleNuevaMaster}
                    disabled={assignCorrelativo.isPending}
                    sx={{ px: 2, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                  >
                    {assignCorrelativo.isPending ? <CircularProgress size={14} /> : 'Nueva Master'}
                  </Button>
                </Stack>

                {isLoadingMasters && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={32} />
                  </Box>
                )}

                {!isLoadingMasters && mastersDisponibles.length === 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    No hay Masters disponibles. Use &ldquo;Nueva Master&rdquo; para crear una.
                  </Alert>
                )}

                {!isLoadingMasters && mastersDisponibles.length > 0 && (
                  <>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Buscar guía, file, destino o cliente"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Box
                                component="span"
                                className="c-lupa"
                                sx={{ color: 'text.secondary', fontSize: 18, lineHeight: 0, display: 'inline-flex', alignItems: 'center' }}
                              />
                            </InputAdornment>
                          ),
                        },
                      }}
                      sx={{ mb: 2 }}
                    />

                    {mastersAgrupados.length === 0 && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        No se encontraron guías para la búsqueda.
                      </Alert>
                    )}

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1, maxHeight: 360, overflowY: 'auto', pr: 0.5 }}>
                      {mastersAgrupados.map((group, idx) => (
                        <MasterDisponibleCard
                          key={group.masterGuia || idx}
                          master={group.masterGuia}
                          houses={group.houses}
                          paisDestino={group.paisDestino}
                          cliente={group.cliente}
                          lineaAerea={group.lineaAerea}
                          seleccionado={selectedMaster === group.masterGuia}
                          onClick={() => setSelectedMaster(group.masterGuia)}
                        />
                      ))}
                    </Box>
                  </>
                )}

                <Stack
                  direction="row"
                  spacing={1.5}
                  justifyContent="flex-end"
                  sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
                >
                  <Button
                    variant="outlined"
                    onClick={handleClose}
                    disabled={assignCorrelativo.isPending}
                    sx={{ px: 2.5, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleAsignar}
                    disabled={
                      assignCorrelativo.isPending ||
                      isLoadingMasters ||
                      (!selectedMaster && mastersDisponibles.length > 0)
                    }
                    startIcon={
                      assignCorrelativo.isPending
                        ? <CircularProgress size={16} color="inherit" />
                        : <Icon baseClassName="cropa-icons" className="c-flecha-derecha" />
                    }
                    sx={{ px: 2.5, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                  >
                    {assignCorrelativo.isPending ? 'Asignando...' : 'Asignar y continuar'}
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Paso 2: Confirmar destino */}
            {activeStep === 1 && (
              <Box>
                {asignadaGuiaMaster && (
                  <Box
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      background: 'rgba(232, 244, 253, 0.9)',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                      Guía Master asignada
                    </Typography>
                    <Typography variant="body2">{asignadaGuiaMaster}</Typography>
                  </Box>
                )}

                <Stack spacing={1.5}>
                  {options.map((opt) => (
                    <OpcionDestinoCard
                      key={opt.id}
                      titulo={opt.titulo}
                      subtitulo={opt.subtitulo}
                      descripcion={opt.descripcion}
                      icono={opt.icono}
                      iconoColor={opt.iconoColor}
                      gradiente={opt.gradiente}
                      seleccionado={opcionSeleccionada === opt.id}
                      onClick={() => setOpcionSeleccionada(opt.id)}
                    >
                      {opt.requiresDate && opcionSeleccionada === opt.id && (
                        <DatePicker
                          label="Fecha de entrega"
                          value={fechaEntrega}
                          onChange={(v) => setFechaEntrega(v)}
                          minDate={dayjs()}
                          format="DD/MM/YYYY"
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                              sx: { '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 1 } },
                            },
                          }}
                        />
                      )}
                    </OpcionDestinoCard>
                  ))}
                </Stack>

                <Stack
                  direction="row"
                  spacing={1.5}
                  justifyContent="flex-end"
                  sx={{ mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => setActiveStep(0)}
                    disabled={processing}
                    sx={{ px: 2.5, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                  >
                    Atrás
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleConfirm}
                    disabled={!opcionSeleccionada || (selectedOption?.requiresDate && !fechaEntrega) || processing}
                    startIcon={
                      processing
                        ? <CircularProgress size={16} color="inherit" />
                        : <Icon baseClassName="cropa-icons" className={selectedOption?.icono || 'c-caja'} />
                    }
                    sx={{ px: 2.5, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
                  >
                    {processing ? 'Procesando...' : (selectedOption?.titulo || 'Confirmar')}
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        </LocalizationProvider>
      </DialogContent>
    </Dialog>
  );
}

CambiarDestino.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  embarqueId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  codFile: PropTypes.string,
  codEstadoActual: PropTypes.number,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  options: PropTypes.array,
  onSuccess: PropTypes.func,
  navigate: PropTypes.func,
};
