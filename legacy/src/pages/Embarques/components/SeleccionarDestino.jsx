import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Stack,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Icon,
  IconButton,
  Paper,
  Zoom,
  Dialog,
  DialogContent,
  Stepper,
  Step,
  StepLabel,
  TextField,
  InputAdornment,
  Chip,
  useTheme,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import {
  useUpdateCoordinacionEstado,
  useCreateCoordinacionFechaMov,
  useUpdateCoordinacionFechaMov,
  useFetchCoordinacionFechaMov,
  useListarMasterDisponiblesCoordinacion,
  useAsignarMasterCoordinacion,
  useFetchDetalleCorrelativoGuias,
  useFetchGuiasCoordinacion,
} from '../../../hooks/Bpm';

// id_tipo_fecha de "Fecha de entrega COMBEX" en coordinacion-fecha-mov
const FECHA_ENTREGA_COMBEX_TIPO_ID = 324;

export const OpcionDestinoCard = ({
  titulo,
  subtitulo,
  descripcion,
  icono,
  iconoColor,
  gradiente,
  seleccionado,
  onClick,
  children
}) => (
  <Paper
    elevation={seleccionado ? 6 : 1}
    onClick={onClick}
    sx={{
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 2.5,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: seleccionado ? '2px solid' : '1px solid',
      borderColor: seleccionado ? iconoColor : 'divider',
      '&:hover': {
        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
        borderColor: seleccionado ? iconoColor : 'action.selected',
      },
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '100%',
        background: gradiente,
        opacity: seleccionado ? 0.1 : 0.03,
      }}
    />
    {seleccionado && (
      <Zoom in={seleccionado}>
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: iconoColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            component="span"
            className="c-cheque"
            sx={{
              color: 'rgb(255, 255, 255)',
              fontSize: 14,
              lineHeight: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </Box>
      </Zoom>
    )}
    <Box sx={{ position: 'relative', p: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.5,
            background: `${iconoColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon
            baseClassName="cropa-icons"
            className={icono}
            sx={{ fontSize: 24, color: iconoColor }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle2"
            fontWeight={700}
            sx={{ color: seleccionado ? iconoColor : 'text.primary' }}
          >
            {titulo}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subtitulo}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontSize: '0.75rem', lineHeight: 1.4 }}
          >
            {descripcion}
          </Typography>
          {children && seleccionado && (
            <Box sx={{ mt: 1.5 }} onClick={(e) => e.stopPropagation()}>
              {children}
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  </Paper>
);

OpcionDestinoCard.propTypes = {
  titulo: PropTypes.string.isRequired,
  subtitulo: PropTypes.string.isRequired,
  descripcion: PropTypes.string.isRequired,
  icono: PropTypes.string.isRequired,
  iconoColor: PropTypes.string.isRequired,
  gradiente: PropTypes.string.isRequired,
  seleccionado: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node,
};

const getMasterCardStyleConfig = (seleccionado, isDarkMode) => {
  let iconBoxBg = 'rgba(11, 41, 103, 0.08)';
  if (seleccionado) {
    iconBoxBg = 'primary.main';
  } else if (isDarkMode) {
    iconBoxBg = 'rgba(255, 255, 255, 0.12)';
  }

  return {
    iconBoxBg,
    iconBoxColor: seleccionado ? 'common.white' : 'primary.main',
    infoCardBg: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(11, 41, 103, 0.04)',
    detailsBg: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.72)',
    detailsBorderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(11, 41, 103, 0.08)',
  };
};

const getTituloAsignacion = (esServicioCourier, esServicioDirecto) => {
  if (esServicioCourier) return 'Asignación para retiro en bodega';
  if (esServicioDirecto) return 'Asignación de Master';
  return 'Asignación previa a envío a COMBEX';
};

const getWizardSteps = (showStep1, esServicioDirecto) => {
  if (!showStep1) return ['Confirmar destino'];
  return [esServicioDirecto ? 'Seleccionar guía' : 'Asignar guía', 'Confirmar destino'];
};

const getResumenGuiasDescription = (showCorrelativoDetails, esServicioDirecto) => {
  if (showCorrelativoDetails) {
    return 'Se cargó el correlativo creado. Seleccione la guía que desea usar para enviar.';
  }
  if (esServicioDirecto) {
    return 'La guía se asignara automaticamente.';
  }
  return 'Se consultó listar master disponibles para esta coordinación. Puede asignar la guía para continuar sin seleccionar un número de master manualmente.';
};

const getAsignarCorrelativoLabel = (isPending, esServicioDirecto) => {
  if (isPending) return 'Asignando...';
  if (esServicioDirecto) return 'Asignar Master';
  return 'Asignar guía y continuar';
};

const getResumenGuiasLabel = (showCorrelativoDetails) =>
  showCorrelativoDetails ? 'GUÍAS DEL CORRELATIVO' : 'GUÍAS DISPONIBLES';

const renderResumenGuiasCount = (
  showCorrelativoDetails,
  isLoadingCorrelativoDetalles,
  isLoadingMasters,
  correlativoGuiasCount,
  mastersDisponiblesLength,
) => {
  if (showCorrelativoDetails) {
    if (isLoadingCorrelativoDetalles) {
      return <CircularProgress size={30} sx={{ color: 'common.white' }} />;
    }

    return (
      <Typography variant="h3" fontWeight={900} sx={{ lineHeight: 1 }}>
        {correlativoGuiasCount}
      </Typography>
    );
  }

  if (isLoadingMasters) {
    return <CircularProgress size={30} sx={{ color: 'common.white' }} />;
  }

  return (
    <Typography variant="h3" fontWeight={900} sx={{ lineHeight: 1 }}>
      {mastersDisponiblesLength}
    </Typography>
  );
};

export const MasterDisponibleCard = ({
  master,
  houses,
  paisDestino,
  cliente,
  lineaAerea,
  seleccionado,
  onClick,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const { iconBoxBg, iconBoxColor, infoCardBg, detailsBg, detailsBorderColor } =
    getMasterCardStyleConfig(seleccionado, isDarkMode);

  const baseBg = isDarkMode ? theme.palette.background.paper : 'linear-gradient(135deg, #ffffff 0%, #f8fbff 100%)';
  const hoverBg = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(11, 41, 103, 0.12)';
  const paperBackground = seleccionado
    ? 'linear-gradient(135deg, rgba(11, 41, 103, 0.08) 0%, rgba(21, 101, 192, 0.12) 100%)'
    : baseBg;
  const paperHoverBackground = seleccionado
    ? 'linear-gradient(135deg, rgba(11, 41, 103, 0.08) 0%, rgba(21, 101, 192, 0.12) 100%)'
    : hoverBg;

  return (
    <Paper
      elevation={seleccionado ? 6 : 0}
      onClick={onClick}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: seleccionado ? 'primary.main' : 'divider',
        background: paperBackground,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 10px 24px rgba(11, 41, 103, 0.12)',
          transform: 'translateY(-2px)',
          background: paperHoverBackground,
        },
      }}
    >

      {seleccionado && (
        <Zoom in={seleccionado}>
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(11, 41, 103, 0.24)',
            }}
          >
            <Box
              component="span"
              className="c-cheque"
              sx={{
                color: 'common.white',
                fontSize: 16,
                lineHeight: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Box>
        </Zoom>
      )}

      <Box sx={{ p: 1.25 }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: iconBoxBg,
                color: iconBoxColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon baseClassName="cropa-icons" className="c-avion" sx={{ fontSize: 20 }} />
            </Box>

            <Box sx={{ minWidth: 0, pr: 3 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                {master ? `Master: ${master}` : 'Master sin referencia'}
              </Typography>
              {houses?.length > 0 ? (
                <Box sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                    House:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {houses.map((h) => (
                      <Chip key={h} label={h} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                    ))}
                  </Box>
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.4 }}>
                  House sin referencia
                </Typography>
              )}
            </Box>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
              gap: 1,
            }}
          >
            <Box sx={{ p: 1, borderRadius: 2, bgcolor: infoCardBg }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                País destino
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {paisDestino || 'No definido'}
              </Typography>
            </Box>

            <Box sx={{ p: 1, borderRadius: 2, bgcolor: infoCardBg }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25 }}>
                Línea aérea
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {lineaAerea || 'Pendiente'}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: detailsBg,
              border: '1px solid',
              borderColor: detailsBorderColor,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Cliente coordinación
            </Typography>
            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>
              {cliente || 'No definido'}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
};

MasterDisponibleCard.propTypes = {
  master: PropTypes.string,
  houses: PropTypes.arrayOf(PropTypes.string),
  paisDestino: PropTypes.string,
  cliente: PropTypes.string,
  lineaAerea: PropTypes.string,
  seleccionado: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

export const DEFAULT_DESTINO_OPTIONS = [
  {
    id: 'bodega',
    titulo: 'Enviar a Bodega',
    subtitulo: 'Para retiro por COURIER',
    descripcion: 'La guía se envía a bodega. Un COURIER del cliente la recogerá.',
    icono: 'c-bodega',
    iconoColor: 'primary.main',
    gradiente: 'linear-gradient(135deg, #0B2967 0%, #1565C0 100%)',
    requiresDate: false,
  },
  {
    id: 'combex_con_etiquetas',
    titulo: 'Enviar a COMBEX con Etiquetas',
    subtitulo: 'Crear etiquetas y programar entrega',
    descripcion: 'Se crean etiquetas y se programa fecha de entrega. Redirige a pestaña de etiquetas.',
    icono: 'c-camion',
    iconoColor: 'secondary.main',
    gradiente: 'linear-gradient(135deg,rgb(255, 255, 255) 0%,rgb(248, 248, 248) 100%)',
    requiresDate: true,
  },
  {
    id: 'combex_sin_etiquetas',
    titulo: 'Enviar a COMBEX sin Etiquetas',
    subtitulo: 'Solo cambio de estado',
    descripcion: 'Envío directo a COMBEX sin generar etiquetas.',
    icono: 'c-camion',
    iconoColor: 'info.main',
    gradiente: 'linear-gradient(135deg, #0288d1 0%, #03a9f4 100%)',
    requiresDate: false,
  },
];

const DESTINO_BUTTON_CONFIG = {
  combex_con_etiquetas: { text: 'Enviar a COMBEX', icon: 'c-camion' },
  combex: { text: 'Enviar a COMBEX', icon: 'c-camion' },
  bodega: { text: 'Enviar a Bodega', icon: 'c-bodega' },
  etiquetas: { text: 'Ir a Imprimir Etiquetas', icon: 'c-impresora' },
};

const getButtonText = (selectedOption) => {
  if (!selectedOption) return 'Selecciona opción';
  return DESTINO_BUTTON_CONFIG[selectedOption.id]?.text || selectedOption.titulo;
};

const getButtonIcon = (selectedOption) => {
  if (!selectedOption) return 'c-caja';
  return DESTINO_BUTTON_CONFIG[selectedOption.id]?.icon || selectedOption.icono;
};

const getButtonColor = (selectedOption) => {
  if (!selectedOption) return 'grey.500';
  return selectedOption.iconoColor || 'grey.500';
};

const SeleccionarDestinoModal = ({
  open,
  onClose,
  options = [],
  initialSelection = null,
  title = 'Destino de Coordinación',
  subtitle = '',
  embarqueId = null,
  codFile = '',
  servicioNombre = '',
  codEstadoActual = 65,
  navigate,
  existingGuia = '',
  existingGuiaMaster = '',
  onConfirm,
  onSuccess,
  currentFile = '',
  modo = 'completo',
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const mostrarSoloPaso1 = modo === 'asignar_master';
  const mostrarSoloPaso2 = modo === 'seleccionar_destino';
  const [activeStep, setActiveStep] = useState(0);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(initialSelection);
  const [fechaEntrega, setFechaEntrega] = useState(dayjs().add(1, 'day'));
  const [error, setError] = useState(null);
  const [selectedMaster, setSelectedMaster] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [createdCorrelativoId, setCreatedCorrelativoId] = useState(null);
  const [createdCorrelativoSerie, setCreatedCorrelativoSerie] = useState('');
  const [pendingAutoAssign, setPendingAutoAssign] = useState(false);
  const servicioNormalizado = String(servicioNombre || '').trim().toUpperCase();
  const esServicioDirecto = servicioNormalizado === 'DIRECTO';
  const esServicioCourier = servicioNormalizado === 'COURIER';
  const esServicioConsolidado = servicioNormalizado === 'CONSOLIDADO';
  const usaResumenGuias = esServicioCourier || esServicioDirecto;
  const showStep1 = !esServicioCourier;
  const existingMasterGuia = String(existingGuiaMaster || existingGuia || '').trim();

  const tituloAsignacion = getTituloAsignacion(esServicioCourier, esServicioDirecto);

  const [step1Completed, setStep1Completed] = useState(() => {
    if (esServicioCourier) return !!existingMasterGuia;
    return !!existingGuia;
  });

  const getWizardStepsValue = () => {
    if (mostrarSoloPaso1) {
      return ['Asignar Guía de: Destino de Coordinación'];
    }
    if (mostrarSoloPaso2) {
      return ['Confirmar destino'];
    }
    return getWizardSteps(showStep1, esServicioDirecto);
  };

  const wizardSteps = getWizardStepsValue();

  // Hooks para mutations
  const updateCoordinacionEstado = useUpdateCoordinacionEstado();
  const createCoordinacionFechaMov = useCreateCoordinacionFechaMov();
  const updateCoordinacionFechaMov = useUpdateCoordinacionFechaMov();
  const assignCorrelativo = useAsignarMasterCoordinacion();
  const processing =
    updateCoordinacionEstado.isPending ||
    createCoordinacionFechaMov.isPending ||
    updateCoordinacionFechaMov.isPending;

  // Fecha de entrega COMBEX ya registrada para este embarque (si existe, se debe
  // actualizar en vez de insertar una nueva al confirmar el destino).
  const { data: fechasMovEmbarque = [] } = useFetchCoordinacionFechaMov(
    { embarque_id: embarqueId },
    { enabled: !!embarqueId && open },
  );
  const fechaEntregaCombexExistente = fechasMovEmbarque.find(
    (f) => Number(f.ID_FECHA_TIPO) === FECHA_ENTREGA_COMBEX_TIPO_ID,
  );

  // Hook para listar masters disponibles (paso 1)
  const { data: mastersDisponibles = [], isLoading: isLoadingMasters } =
    useListarMasterDisponiblesCoordinacion(
      { embarque_id: embarqueId, cod_file: codFile, enabled: !!embarqueId && open && showStep1 },
    );

  // Hook para verificar que correlativo_guia_master fue asignado antes de avanzar al paso 2
  const { refetch: refetchGuiasCoordinacion } = useFetchGuiasCoordinacion(
    { embarque_id: Number(embarqueId) },
    { enabled: false },
  );

  // Hook para obtener detalles de un correlativo creado (cuando se crea una Master manualmente)
  const {
    data: correlativoDetalles = [],
    isLoading: isLoadingCorrelativoDetalles,
  } = useFetchDetalleCorrelativoGuias(
    { correlativo_id: createdCorrelativoId },
    { enabled: !!createdCorrelativoId },
  );

  // Se usa para asignar correlativo (y mostrar la primera guía disponible)
  const primeraGuiaCorrelativo = correlativoDetalles[0]?.correlativoGuia;

  const mastersFiltrados = React.useMemo(() => {
    const query = String(searchQuery || '').trim().toLowerCase();
    if (!query) return mastersDisponibles;

    return mastersDisponibles.filter((master) => {
      const masterGuia = master.CORRELATIVO_GUIA_MASTER ?? master.correlativo_guia_master ?? '';
      const houseGuia = master.GUIA_COORDINACION ?? master.guia_coordinacion ?? '';
      const file = master.ID_FILE ?? master.id_file ?? '';
      const paisDestino = master.PAIS_DESTINO ?? master.pais_destino ?? '';
      const cliente = master.CLIENTE_COORDINACION ?? master.cliente_coordinacion ?? '';
      const lineaAerea = master.LINEA_AEREA ?? master.linea_aerea ?? '';

      const hayCoincidencia = `${masterGuia} ${houseGuia} ${file} ${paisDestino} ${cliente} ${lineaAerea}`
        .toLowerCase()
        .includes(query);

      return hayCoincidencia;
    });
  }, [mastersDisponibles, searchQuery]);

  const mastersAgrupados = React.useMemo(() => {
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
      if (houseGuia) {
        map.get(masterGuia).houses.push(houseGuia);
      }
    });
    return Array.from(map.values());
  }, [mastersFiltrados]);

  const primerMaster = mastersFiltrados[0];
  const primerMasterMaster = primerMaster?.CORRELATIVO_GUIA_MASTER ?? primerMaster?.correlativo_guia_master;
  const primerMasterDestino = primerMaster?.PAIS_DESTINO ?? primerMaster?.pais_destino;
  const primerMasterLineaAerea = primerMaster?.LINEA_AEREA ?? primerMaster?.linea_aerea;

  useEffect(() => {
    if (open) {

      if (existingGuia) {
        setStep1Completed(true);
        setActiveStep(showStep1 ? 1 : 0);
      } else if (esServicioCourier) {
        setStep1Completed(!!existingMasterGuia);
        setActiveStep(0);
      }
    } else {
      setActiveStep(0);
      setOpcionSeleccionada(initialSelection);
      setFechaEntrega(dayjs().add(1, 'day'));
      setError(null);
      setSelectedMaster('');
      setCreatedCorrelativoId(null);
      setCreatedCorrelativoSerie('');
      setPendingAutoAssign(false);
      setSearchQuery('');
      setStep1Completed(esServicioCourier ? !!existingMasterGuia : !!existingGuia);
    }
  }, [open, initialSelection, existingGuia, existingMasterGuia, esServicioCourier, showStep1]);

  useEffect(() => {
    // Cuando llegan los detalles del correlativo creado, usar la primera guía real
    if (!createdCorrelativoId || correlativoDetalles.length === 0) return;
    const primeraGuia = correlativoDetalles[0]?.correlativoGuia;
    if (!primeraGuia) return;

    setSelectedMaster(primeraGuia);

    // CONSOLIDADO: asignar master automáticamente con la guía real del servidor
    if (pendingAutoAssign) {
      setPendingAutoAssign(false);
      setError(null);
      const numGuiaMaster = createdCorrelativoSerie
        ? `${createdCorrelativoSerie}-${primeraGuia}`
        : primeraGuia;
      assignCorrelativo.mutateAsync({
        embarque_id: Number(embarqueId),
        cod_file: codFile || '',
        num_guia_master: numGuiaMaster,
      }).then(async () => {
        const { data: guiasActualizadas } = await refetchGuiasCoordinacion();
        const guiaMasterAsignada = guiasActualizadas?.[0]?.correlativoGuiaMaster;
        if (!guiaMasterAsignada) {
          setError('La guía master no pudo confirmarse. Por favor seleccione una guía válida.');
          return;
        }
        setStep1Completed(true);
        setActiveStep(1);
      }).catch((err) => {
        console.error('[SeleccionarDestino] auto-asignar master error', err);
        setError(err?.message || 'Error al asignar master');
      });
    }
  }, [createdCorrelativoId, correlativoDetalles]);

  const handleClose = () => {
    if (processing || assignCorrelativo.isPending) return;
    onClose();
  };

  const handleNuevaMasterConsolidado = async () => {
    setError(null);

    try {
      await assignCorrelativo.mutateAsync({
        embarque_id: Number(embarqueId),
        cod_file: codFile || '',
      });

      const { data: guiasActualizadas } = await refetchGuiasCoordinacion();
      const guiaMasterAsignada = guiasActualizadas?.[0]?.correlativoGuiaMaster;

      if (!guiaMasterAsignada) {
        setError('La guía master no pudo confirmarse. Por favor seleccione una guía válida.');
        return;
      }

      setSelectedMaster(guiaMasterAsignada);
      setStep1Completed(true);
      if (mostrarSoloPaso1) {
        onClose();
      } else {
        setActiveStep(1);
      }
    } catch (err) {
      console.error('[SeleccionarDestino] asignar nueva master consolidado error', err);
      setError(err?.message || 'Error al asignar nueva master');
    }
  };

  const handleAsignarCorrelativo = async () => {
    if (esServicioConsolidado && mastersDisponibles.length === 0 && !createdCorrelativoId) return;
    const guiaEfectiva = selectedMaster || primeraGuiaCorrelativo;
    if (esServicioConsolidado && !guiaEfectiva) {
      setError('No hay guía disponible para asignar.');
      return;
    }

    setError(null);
    try {
      const payload = {
        embarque_id: Number(embarqueId),
        cod_file: codFile || '',
      };

      // Solo enviar num_guia_master para CONSOLIDADO, no para DIRECTO
      if (esServicioConsolidado) {
        const firstMaster = mastersDisponibles[0] || {};
        const firstMasterGuia = firstMaster.CORRELATIVO_GUIA_MASTER ?? firstMaster.correlativo_guia_master;
        const guiaSeleccionada = selectedMaster || guiaEfectiva || firstMasterGuia;

        if (guiaSeleccionada) {
          payload.num_guia_master = guiaSeleccionada;
        }
      }

      await assignCorrelativo.mutateAsync(payload);

      // Verificar que correlativo_guia_master quedó asignado antes de avanzar al paso 2
      const { data: guiasActualizadas } = await refetchGuiasCoordinacion();
      const guiaMasterAsignada = guiasActualizadas?.[0]?.correlativoGuiaMaster;
      if (!guiaMasterAsignada) {
        setError('La guía master no pudo confirmarse. Por favor seleccione una guía válida.');
        return;
      }

      setStep1Completed(true);
      if (mostrarSoloPaso1) {
        onClose();
      } else {
        setActiveStep(1);
      }
    } catch (err) {
      console.error('[SeleccionarDestino] asignar correlativo error', err);
      setError(err?.message || 'Error al asignar correlativo de guía');
    }
  };

  const selectedOption = options.find((o) => o.id === opcionSeleccionada);
  const mostrarPaso2 = mostrarSoloPaso2 || (!mostrarSoloPaso1 && (showStep1 ? activeStep === 1 : !!existingMasterGuia));
  const showCorrelativoDetails = !!createdCorrelativoId;
  const correlativoGuiasCount = correlativoDetalles.length;
  const primeraGuiaEstado = correlativoDetalles[0]?.estadoDescripcion;

  const renderStepOneSection = () => (
    <Box>
      {usaResumenGuias && (showCorrelativoDetails || mastersDisponibles.length > 0) ? (
        <Paper
          elevation={0}
          sx={{
            mb: 2.5,
            overflow: 'hidden',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'rgba(11, 41, 103, 0.12)',
            background: 'linear-gradient(135deg, rgba(11, 41, 103, 0.06) 0%, rgba(21, 101, 192, 0.1) 100%)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '168px 1fr' },
              gap: 2,
              alignItems: 'center',
              p: 2.5,
            }}
          >
            <Box
              sx={{
                minHeight: 140,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #0B2967 0%, #1565C0 100%)',
                color: 'common.white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 14px 28px rgba(11, 41, 103, 0.18)',
              }}
            >
              {renderResumenGuiasCount(
                showCorrelativoDetails,
                isLoadingCorrelativoDetalles,
                isLoadingMasters,
                correlativoGuiasCount,
                mastersDisponibles.length,
              )}
              <Typography variant="caption" sx={{ mt: 1, letterSpacing: 1.2, opacity: 0.88 }}>
                {getResumenGuiasLabel(showCorrelativoDetails)}
              </Typography>
            </Box>

            <Stack spacing={1.25}>
              <Typography variant="h6" fontWeight={800}>
                {tituloAsignacion}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getResumenGuiasDescription(showCorrelativoDetails, esServicioDirecto)}
              </Typography>

              {showCorrelativoDetails && !isLoadingCorrelativoDetalles && (
                <Box
                  sx={{
                    px: 1.5,
                    py: 1.25,
                    borderRadius: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.78)',
                    border: '1px solid',
                    borderColor: 'rgba(11, 41, 103, 0.08)',
                  }}
                >
                  <Typography variant="body2" fontWeight={700} noWrap>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Correlativo ID:
                    </Box>{' '}
                    {createdCorrelativoId}
                  </Typography>

                  <Typography variant="body2" fontWeight={700} noWrap sx={{ mt: 1 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Guía:
                    </Box>{' '}
                    {selectedMaster || primeraGuiaCorrelativo || 'Guía disponible'}
                  </Typography>

                  <Typography variant="body2" fontWeight={700} noWrap sx={{ mt: 1 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Estado:
                    </Box>{' '}
                    {primeraGuiaEstado || 'Pendiente'}
                  </Typography>

                  <Typography variant="body2" fontWeight={700} noWrap sx={{ mt: 1 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Fecha registro:
                    </Box>{' '}
                    {correlativoDetalles[0]?.fechaRegistro || '—'}
                  </Typography>

                  {correlativoDetalles.length > 1 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Seleccione otra guía si desea cambiar la asignación:
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {correlativoDetalles.map((item) => (
                          <Chip
                            key={item.correlativoGuia}
                            label={item.correlativoGuia}
                            size="small"
                            variant={selectedMaster === item.correlativoGuia ? 'filled' : 'outlined'}
                            color={selectedMaster === item.correlativoGuia ? 'primary' : 'default'}
                            onClick={() => setSelectedMaster(item.correlativoGuia)}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {!showCorrelativoDetails && !isLoadingMasters && mastersFiltrados.length > 0 && (
                <Box
                  sx={{
                    px: 1.5,
                    py: 1.25,
                    borderRadius: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.78)',
                    border: '1px solid',
                    borderColor: 'rgba(11, 41, 103, 0.08)',
                  }}
                >
                  <Typography variant="body2" fontWeight={700} noWrap>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Guía:
                    </Box>{' '}
                    {primerMasterMaster || 'Guía disponible'}
                  </Typography>

                  <Typography variant="body2" fontWeight={700} noWrap sx={{ mt: 1 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      País destino:
                    </Box>{' '}
                    {primerMasterDestino || 'Destino pendiente'}
                  </Typography>

                  <Typography variant="body2" fontWeight={700} noWrap sx={{ mt: 1 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Línea aérea:
                    </Box>{' '}
                    {primerMasterLineaAerea || 'Pendiente'}
                  </Typography>
                </Box>
              )}

              {!showCorrelativoDetails && !isLoadingMasters && mastersFiltrados.length === 0 && mastersDisponibles.length > 0 && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No se encontraron guías para la búsqueda.
                </Alert>
              )}
            </Stack>
          </Box>
        </Paper>
      ) : (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            seleccione la Master
          </Typography>
        </Box>
      )}

      {isLoadingMasters && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {!isLoadingMasters && mastersDisponibles.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {(esServicioDirecto || esServicioConsolidado)
            ? 'No hay Masters disponibles para esta coordinación. Se creará una nueva Master.'
            : 'No hay guías disponibles para esta coordinación.'}
        </Alert>
      )}

      {!usaResumenGuias && !isLoadingMasters && !createdCorrelativoId && (
        <Box sx={{ mb: 2 }}>
          {servicioNombre === 'CONSOLIDADO' && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button
                variant="outlined"
                onClick={handleNuevaMasterConsolidado}
                disabled={assignCorrelativo.isPending}
                sx={{ px: 2.5, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
              >
                Nueva Master
              </Button>
            </Box>
          )}

          {mastersDisponibles.length > 0 && (
            <>
              <TextField
                size="small"
                fullWidth
                placeholder="Buscar guía, file, destino o cliente"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box
                          component="span"
                          className="c-lupa"
                          sx={{
                            color: 'text.secondary',
                            fontSize: 18,
                            lineHeight: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ mb: 2 }}
              />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 1,
                  maxHeight: 360,
                  overflowY: 'auto',
                  pr: 0.5,
                }}
              >
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

              {mastersAgrupados.length === 0 && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No se encontraron guías para la búsqueda.
                </Alert>
              )}
            </>
          )}
        </Box>
      )}

      {!usaResumenGuias && !!createdCorrelativoId && (
        <Paper
          elevation={0}
          sx={{
            mb: 2.5,
            overflow: 'hidden',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'rgba(11, 41, 103, 0.12)',
            background: 'linear-gradient(135deg, rgba(11, 41, 103, 0.06) 0%, rgba(21, 101, 192, 0.1) 100%)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '168px 1fr' },
              gap: 2,
              alignItems: 'center',
              p: 2.5,
            }}
          >
            <Box
              sx={{
                minHeight: 140,
                borderRadius: 2.5,
                background: 'linear-gradient(135deg, #0B2967 0%, #1565C0 100%)',
                color: 'common.white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 14px 28px rgba(11, 41, 103, 0.18)',
              }}
            >
              {isLoadingCorrelativoDetalles ? (
                <CircularProgress size={30} sx={{ color: 'common.white' }} />
              ) : (
                <Typography variant="h3" fontWeight={900} sx={{ lineHeight: 1 }}>
                  {correlativoGuiasCount}
                </Typography>
              )}
              <Typography variant="caption" sx={{ mt: 1, letterSpacing: 1.2, opacity: 0.88 }}>
                GUÍAS DEL CORRELATIVO
              </Typography>
            </Box>

            <Stack spacing={1.25}>
              <Typography variant="h6" fontWeight={800}>
                {tituloAsignacion}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isLoadingCorrelativoDetalles
                  ? 'Cargando detalles del correlativo...'
                  : 'Master creada correctamente. Se asignará la primera guía disponible del correlativo.'}
              </Typography>

              {!isLoadingCorrelativoDetalles && correlativoDetalles.length > 0 && (
                <Box
                  sx={{
                    px: 1.5,
                    py: 1.25,
                    borderRadius: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.78)',
                    border: '1px solid',
                    borderColor: 'rgba(11, 41, 103, 0.08)',
                  }}
                >
                  <Typography variant="body2" fontWeight={700} noWrap>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Guía:
                    </Box>{' '}
                    {selectedMaster || primeraGuiaCorrelativo || 'Guía disponible'}
                  </Typography>

                  <Typography variant="body2" fontWeight={700} noWrap sx={{ mt: 1 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Estado:
                    </Box>{' '}
                    {primeraGuiaEstado || 'Pendiente'}
                  </Typography>

                  <Typography variant="body2" fontWeight={700} noWrap sx={{ mt: 1 }}>
                    <Box component="span" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      Fecha registro:
                    </Box>{' '}
                    {correlativoDetalles[0]?.fechaRegistro || '—'}
                  </Typography>

                  {correlativoDetalles.length > 1 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Seleccione otra guía si desea cambiar la asignación:
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {correlativoDetalles.map((item) => (
                          <Chip
                            key={item.correlativoGuia}
                            label={item.correlativoGuia}
                            size="small"
                            variant={selectedMaster === item.correlativoGuia ? 'filled' : 'outlined'}
                            color={selectedMaster === item.correlativoGuia ? 'primary' : 'default'}
                            onClick={() => setSelectedMaster(item.correlativoGuia)}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Stack>
          </Box>
        </Paper>
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
          onClick={handleAsignarCorrelativo}
          disabled={
            assignCorrelativo.isPending ||
            (!createdCorrelativoId && isLoadingMasters) ||
            (esServicioConsolidado && !createdCorrelativoId && mastersDisponibles.length === 0) ||
            (createdCorrelativoId && isLoadingCorrelativoDetalles) ||
            (esServicioConsolidado && !createdCorrelativoId && !selectedMaster) ||
            (esServicioConsolidado && createdCorrelativoId && !selectedMaster && !primeraGuiaCorrelativo)
          }
          startIcon={
            assignCorrelativo.isPending
              ? <CircularProgress size={16} color="inherit" />
              : <Icon baseClassName="cropa-icons" className="c-flecha-derecha" />
          }
          sx={{ px: 2.5, borderRadius: 1.5, textTransform: 'none', fontWeight: 600 }}
        >
          {getAsignarCorrelativoLabel(assignCorrelativo.isPending, esServicioDirecto)}
        </Button>
      </Stack>
    </Box>
  );

  const handleConfirm = async () => {
    if (!opcionSeleccionada) return;
    const data = { opcion: opcionSeleccionada };
    if (selectedOption?.requiresDate) {
      data.fechaEntrega = fechaEntrega?.format('YYYY-MM-DD');
    }
    setError(null);

    try {
      if (embarqueId) {
        const ESTADOS_DESTINO = {
          combex_con_etiquetas: 70,
          combex_sin_etiquetas: 71,
          bodega: 72,
        };
        const codEstadoSiguiente = ESTADOS_DESTINO[opcionSeleccionada];

        if (codEstadoSiguiente) {
          await updateCoordinacionEstado.mutateAsync({
            embarque_id: embarqueId,
            cod_file: codFile || '',
            cod_estado_actual: codEstadoActual,
            cod_estado_siguiente: codEstadoSiguiente,
          });
        }

        if (opcionSeleccionada === 'combex_con_etiquetas' && data.fechaEntrega) {
          if (fechaEntregaCombexExistente) {
            await updateCoordinacionFechaMov.mutateAsync({
              id_fecha_reg_embarque: fechaEntregaCombexExistente.ID_FECHA_REG_EMBARQUE,
              embarque_id: Number(embarqueId) || 0,
              estado_cod: 1,
              fecha: data.fechaEntrega,
              id_tipo_fecha: FECHA_ENTREGA_COMBEX_TIPO_ID,
              observacion: 'Fecha de entrega COMBEX',
            });
          } else {
            await createCoordinacionFechaMov.mutateAsync({
              embarque_id: Number(embarqueId) || 0,
              estado_cod: 1,
              fecha: data.fechaEntrega,
              id_tipo_fecha: FECHA_ENTREGA_COMBEX_TIPO_ID,
              observacion: 'Fecha de entrega COMBEX',
            });
          }
        }
      }

      if (typeof onConfirm === 'function') {
        await onConfirm(data);
      }

      if (typeof onSuccess === 'function') {
        onSuccess(data);
      }

      onClose();
    } catch (err) {
      console.error('[SeleccionarDestinoModal] confirm error', err);
      setError(err?.message || 'Ocurrió un error al procesar la acción');
    }
  };

  const renderContent = () => {
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
        <Box sx={{ p: 2 }}>
          {/* header */}
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
                    {subtitle || currentFile}
                  </Typography>
                )}
              </Box>
              <IconButton
                onClick={handleClose}
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.12)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                  p: 1,
                }}
                size="small"
              >
                <Icon baseClassName="cropa-icons" className="c-cerrar-sesion" sx={{ fontSize: 18 }} />
              </IconButton>
            </Stack>
          </Box>

          {/* Stepper del wizard */}
          {!mostrarSoloPaso1 && (
            <Stepper activeStep={mostrarSoloPaso2 ? 0 : activeStep} sx={{ mb: 3 }}>
              {wizardSteps.map((label, index) => (
                <Step key={label} completed={showStep1 && index === 0 ? step1Completed : false}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {!showStep1 && !existingMasterGuia && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No se puede avanzar al destino porque la guía de coordinación no tiene correlativo de guía master.
            </Alert>
          )}

          {/* Paso 1 */}
          {(mostrarSoloPaso1 || (!mostrarSoloPaso2 && showStep1 && activeStep === 0)) && renderStepOneSection()}

          {/* Paso 2: COMBEX */}
          {!showStep1 && !existingMasterGuia && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              No se puede avanzar al destino porque la guía de coordinación no tiene correlativo de guía master.
            </Alert>
          )}

          {mostrarPaso2 && !mostrarSoloPaso1 && (
            <Box>
              {existingGuia && (
                <Paper
                  elevation={0}
                  sx={{
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    background: isDarkMode ? '#000000' : 'rgba(232, 244, 253, 0.9)',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                    Guía Master asignada
                  </Typography>
                  <Typography variant="body2" color={isDarkMode ? 'common.white' : 'text.primary'}>
                    {existingGuia}
                  </Typography>
                </Paper>
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
                            sx: {
                              '& .MuiOutlinedInput-root': {
                                bgcolor: 'white',
                                borderRadius: 1,
                              },
                            },
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
                  variant="contained"
                  onClick={handleConfirm}
                  disabled={!opcionSeleccionada || (selectedOption?.requiresDate && !fechaEntrega) || processing}
                  startIcon={
                    processing ? <CircularProgress size={16} color="inherit" /> : <Icon baseClassName="cropa-icons" className={getButtonIcon()} />
                  }
                  sx={{
                    px: 2.5,
                    borderRadius: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: getButtonColor(),
                    '&:hover': { filter: 'brightness(0.9)' },
                  }}
                >
                  {processing ? 'Procesando...' : getButtonText()}
                </Button>
              </Stack>
            </Box>
          )}
        </Box>
      </LocalizationProvider>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 600, md: 720 } } } }}
    >
      <DialogContent sx={{ p: 0 }}>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

SeleccionarDestinoModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      titulo: PropTypes.string.isRequired,
      subtitulo: PropTypes.string.isRequired,
      descripcion: PropTypes.string.isRequired,
      icono: PropTypes.string.isRequired,
      iconoColor: PropTypes.string.isRequired,
      gradiente: PropTypes.string.isRequired,
      requiresDate: PropTypes.bool,
    })
  ),
  initialSelection: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  embarqueId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  codFile: PropTypes.string,
  servicioNombre: PropTypes.string,
  codEstadoActual: PropTypes.number,
  navigate: PropTypes.func,
  existingGuia: PropTypes.string,
  existingGuiaMaster: PropTypes.string,
  onConfirm: PropTypes.func,
  onSuccess: PropTypes.func,
  currentFile: PropTypes.string,
  modo: PropTypes.oneOf(['completo', 'asignar_master', 'seleccionar_destino']),
};

export default SeleccionarDestinoModal;
