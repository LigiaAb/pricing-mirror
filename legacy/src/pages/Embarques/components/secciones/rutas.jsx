import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Autocomplete, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, TextField, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import TablaDue from '@/components/bpm/tablas/tablaDue';
import { useFetchPuntoEnlace } from '@/hooks/Bpm/catalogos/usePuntoEnlace';
import { useFetchPaises } from '@/hooks/Bpm/catalogos';
import { useFetchEntidadConfiguracion } from '@/hooks/Bpm';
import {
  useCoordinacionLegs,
  useInsertarCoordinacionLegs,
  useActualizarCoordinacionLegs,
} from '@/hooks/Bpm/coordinaciones';
import { useCoordinacionData } from '@/hooks/Bpm';
import BannerInformativo from '../banner';

const FORM_EMPTY = {
  embLegsId: null,
  codEntidadProv: '',
  codPaisOrigen: '',
  puertoIdOrigen: '',
  codPaisDestino: '',
  puertoIdDestino: '',
  flightNumber: '',
  fechaSalida: '',
  fechaLlegada: '',
  costoEstimado: 0,
  costoReal: 0,
};

const parseDecimalValue = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(2));
};

const SELECT_MENU_PROPS = {
  PaperProps: {
    sx: {
      maxHeight: 300,
    },
  },
};

const RutaDialog = React.memo(({ open, initialData, onClose, onSave, aerolineasOptions, paisesOptions, filterPuntosEnlaceByPais, isLoadingAerolineas, isLoadingPaises, isLoadingPuntosEnlace }) => {
  const [formData, setFormData] = useState(initialData ?? FORM_EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFormData(initialData ?? FORM_EMPTY);
  }, [open, initialData]);

  const handleFormChange = useCallback((field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'codPaisOrigen') next.puertoIdOrigen = '';
      if (field === 'codPaisDestino') next.puertoIdDestino = '';
      return next;
    });
  }, []);

  const puntosOrigenFiltrados = useMemo(
    () => filterPuntosEnlaceByPais(formData.codPaisOrigen),
    [filterPuntosEnlaceByPais, formData.codPaisOrigen]
  );

  const puntosDestinoFiltrados = useMemo(
    () => filterPuntosEnlaceByPais(formData.codPaisDestino),
    [filterPuntosEnlaceByPais, formData.codPaisDestino]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error al guardar ruta:', error);
    } finally {
      setSaving(false);
    }
  }, [formData, onSave]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{formData.embLegsId ? 'Editar Ruta' : 'Agregar Ruta'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {/* Aerolínea */}
        <Autocomplete
          fullWidth
          size="small"
          disabled={isLoadingAerolineas}
          options={aerolineasOptions}
          value={aerolineasOptions.find((opt) => String(opt.value) === String(formData.codEntidadProv)) ?? null}
          onChange={(event, option) => handleFormChange('codEntidadProv', option?.value ?? '')}
          getOptionLabel={(option) => option?.label ?? ''}
          isOptionEqualToValue={(option, value) => String(option.value) === String(value?.value)}
          renderInput={(params) => <TextField {...params} label="Aerolínea" />}
        />

        {/* País Origen */}
        <Autocomplete
          fullWidth
          size="small"
          disabled={isLoadingPaises}
          options={paisesOptions}
          value={paisesOptions.find((opt) => String(opt.value) === String(formData.codPaisOrigen)) ?? null}
          onChange={(event, option) => handleFormChange('codPaisOrigen', option?.value ?? '')}
          getOptionLabel={(option) => option?.label ?? ''}
          isOptionEqualToValue={(option, value) => String(option.value) === String(value?.value)}
          renderInput={(params) => <TextField {...params} label="País Origen" required />}
        />

        {/* Aeropuerto Origen */}
        <Autocomplete
          fullWidth
          size="small"
          disabled={isLoadingPuntosEnlace}
          options={puntosOrigenFiltrados}
          value={puntosOrigenFiltrados.find((opt) => String(opt.value) === String(formData.puertoIdOrigen)) ?? null}
          onChange={(event, option) => handleFormChange('puertoIdOrigen', option?.value ?? '')}
          getOptionLabel={(option) => option?.label ?? ''}
          isOptionEqualToValue={(option, value) => String(option.value) === String(value?.value)}
          renderInput={(params) => <TextField {...params} label="Aeropuerto Origen" required />}
        />

        {/* País Destino */}
        <Autocomplete
          fullWidth
          size="small"
          disabled={isLoadingPaises}
          options={paisesOptions}
          value={paisesOptions.find((opt) => String(opt.value) === String(formData.codPaisDestino)) ?? null}
          onChange={(event, option) => handleFormChange('codPaisDestino', option?.value ?? '')}
          getOptionLabel={(option) => option?.label ?? ''}
          isOptionEqualToValue={(option, value) => String(option.value) === String(value?.value)}
          renderInput={(params) => <TextField {...params} label="País Destino" required />}
        />

        {/* Aeropuerto Destino */}
        <Autocomplete
          fullWidth
          size="small"
          disabled={isLoadingPuntosEnlace}
          options={puntosDestinoFiltrados}
          value={puntosDestinoFiltrados.find((opt) => String(opt.value) === String(formData.puertoIdDestino)) ?? null}
          onChange={(event, option) => handleFormChange('puertoIdDestino', option?.value ?? '')}
          getOptionLabel={(option) => option?.label ?? ''}
          isOptionEqualToValue={(option, value) => String(option.value) === String(value?.value)}
          renderInput={(params) => <TextField {...params} label="Aeropuerto Destino" required />}
        />

        {/* Nro. Vuelo */}
        <TextField
          label="Nro. Vuelo"
          size="small"
          fullWidth
          value={formData.flightNumber}
          onChange={(e) => handleFormChange('flightNumber', e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? <CircularProgress size={18} /> : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

RutaDialog.displayName = 'RutaDialog';

RutaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  initialData: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  aerolineasOptions: PropTypes.array,
  paisesOptions: PropTypes.array,
  filterPuntosEnlaceByPais: PropTypes.func.isRequired,
  isLoadingAerolineas: PropTypes.bool,
  isLoadingPaises: PropTypes.bool,
  isLoadingPuntosEnlace: PropTypes.bool,
};

const RutasSection = ({ embarque_id = null, onValidityChange, onLoadingChange, required = true, mostrarBotonAgregar = true }) => {
  const { data: embarqueData = null } = useCoordinacionData(embarque_id);
  const embarqueId = embarqueData?.embarqueId ?? embarqueData?.EMBARQUE_ID ?? embarque_id ?? null;
  const codEmpresa = embarqueData?.empresaId ?? embarqueData?.empresa_id ?? 1;
  const codCc = embarqueData?.centroId ?? embarqueData?.cencos_id ?? 16;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLeg, setEditingLeg] = useState(null);

  const { data: legs = [], isLoading: isLoadingLegs, refetch: refetchLegs } = useCoordinacionLegs(
    embarqueId, codCc, codEmpresa
  );
  const { mutateAsync: insertarLeg } = useInsertarCoordinacionLegs();
  const { mutateAsync: actualizarLeg } = useActualizarCoordinacionLegs();

  const { data: aerolineas = [], isLoading: isLoadingAerolineas } = useFetchEntidadConfiguracion({ configuracion_id: 8 });
  const { data: paises = [], isLoading: isLoadingPaises } = useFetchPaises();
  const { data: puntosEnlace = [], isLoading: isLoadingPuntosEnlace } = useFetchPuntoEnlace();

  const aerolineasOptions = useMemo(
    () => aerolineas.map((a) => ({
      value: String(a.entidadId ?? ''),
      label: a.entidadNombre ?? a.configuracionDescripcion,
    })),
    [aerolineas]
  );

  const paisesOptions = useMemo(
    () => paises.map((p) => ({ value: String(p.cod_pais ?? ''), label: p.nombre_pais })),
    [paises]
  );

  const puntosEnlaceOptions = useMemo(
    () => puntosEnlace.map((p) => ({
      value: String(p.cod_puntoenlace ?? ''),
      label: p.label || `${p.codigo} - ${p.nombre}`,
      cod_pais: String(p.cod_pais ?? ''),
    })),
    [puntosEnlace]
  );

  const legsRef = useRef(legs);
  useEffect(() => { legsRef.current = legs; }, [legs]);

  const filterPuntosEnlaceByPais = useCallback(
    (paisValue) => {
      if (!paisValue) return puntosEnlaceOptions;
      const codPais = (paisValue && typeof paisValue === 'object') ? paisValue.value : paisValue;
      const filtered = puntosEnlaceOptions.filter((p) => String(p.cod_pais) === String(codPais));
      return filtered.length > 0 ? filtered : puntosEnlaceOptions;
    },
    [puntosEnlaceOptions],
  );

  useEffect(() => {
    onValidityChange?.(!required || legs.length > 0);
  }, [legs, onValidityChange, required]);

  useEffect(() => {
    onLoadingChange?.(!embarqueData || isLoadingLegs || isLoadingAerolineas || isLoadingPaises || isLoadingPuntosEnlace);
  }, [embarqueData, isLoadingLegs, isLoadingAerolineas, isLoadingPaises, isLoadingPuntosEnlace, onLoadingChange]);

  const tipoIdEmbarque = useMemo(
    () => embarqueData?.tipo_id_embarque ?? embarqueData?.TIPO_ID_EMBARQUE ?? embarqueData?.tipo_id ?? null,
    [embarqueData],
  );

  const tipoIdCarga = useMemo(
    () => embarqueData?.tipo_id_carga ?? embarqueData?.TIPO_ID_CARGA ?? embarqueData?.cod_tipo_carga ?? embarqueData?.COD_TIPO_CARGA ?? embarqueData?.tipoCarga ?? embarqueData?.tipoIdCarga ?? null,
    [embarqueData],
  );

  const codServicioDefault = useMemo(
    () => embarqueData?.id_servicio ?? embarqueData?.ID_SERVICIO ?? embarqueData?.cod_servicio ?? embarqueData?.COD_SERVICIO ?? 1,
    [embarqueData],
  );

  const buildPayload = useCallback((row) => {
    const currentCodFile = row.cod_file ?? row.codFile ?? row.COD_FILE ??
      legsRef.current.find((leg) => String(leg.embLegsId) === String(row.embLegsId))?.codFile ??
      embarqueData?.cod_file ?? embarqueData?.COD_FILE ?? embarqueData?.codFile;

    return {
      embarque_id: embarqueId,
      emb_legs_id: row.embLegsId || undefined,
      cod_file: currentCodFile,
      cod_tipo_transporte: tipoIdEmbarque ?? row.codTipoTransporte,
      cod_entidad_prov: row.codEntidadProv ?? row.entidadIdProvTrans ?? 1,
      cod_pais_origen: (row.codPaisOrigen && typeof row.codPaisOrigen === 'object') ? (row.codPaisOrigen.value ?? row.codPaisOrigen) : row.codPaisOrigen ?? row.paisIdOrigen,
      cod_pais_destino: (row.codPaisDestino && typeof row.codPaisDestino === 'object') ? (row.codPaisDestino.value ?? row.codPaisDestino) : row.codPaisDestino ?? row.paisIdDestino,
      puerto_id_origen: row.puertoIdOrigen ?? row.puntoenlaceIdOrigen,
      puerto_id_destino: row.puertoIdDestino ?? row.puntoenlaceIdDestino,
      cod_servicio: row.codServicio ?? row.cod_servicio ?? row.COD_SERVICIO ?? codServicioDefault,
      cod_tipo_carga: tipoIdCarga ?? row.codTipoCarga,
      estado_cod: (row.estadoCod ?? row.estado_cod ?? 1).toString(),
      flight_number: row.flightNumber ?? '',
      url_documento_soporte: row.urlDocumentoSoporte ?? '',
      fecha_salida: row.fechaSalida || row.fecha_salida || null,
      fecha_llegada: row.fechaLlegada || row.fecha_llegada || null,
      costo_estimado: parseDecimalValue(row.costoEstimado ?? 0),
      costo_real: parseDecimalValue(row.costoReal ?? 0),
    };
  }, [embarqueId, embarqueData, tipoIdEmbarque, tipoIdCarga, codServicioDefault]);

  const handleOpenAdd = useCallback(() => {
    setEditingLeg(FORM_EMPTY);
    setDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((leg) => {
    setEditingLeg({
      embLegsId: leg.embLegsId ?? null,
      codEntidadProv: String(leg.codEntidadProv ?? leg.entidadIdProvTrans ?? ''),
      codPaisOrigen: String(leg.codPaisOrigen ?? leg.paisIdOrigen ?? ''),
      puertoIdOrigen: String(leg.puertoIdOrigen ?? leg.puntoenlaceIdOrigen ?? ''),
      codPaisDestino: String(leg.codPaisDestino ?? leg.paisIdDestino ?? ''),
      puertoIdDestino: String(leg.puertoIdDestino ?? leg.puntoenlaceIdDestino ?? ''),
      flightNumber: leg.flightNumber ?? leg.flight_number ?? '',
      fechaSalida: leg.fechaSalida ?? leg.fecha_salida ?? '',
      fechaLlegada: leg.fechaLlegada ?? leg.fecha_llegada ?? '',
      costoEstimado: leg.costoEstimado ?? 0,
      costoReal: leg.costoReal ?? 0,
    });
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleSaveDialog = useCallback(async (formData) => {
    const payload = buildPayload(formData);
    if (formData.embLegsId) {
      await actualizarLeg(payload);
    } else {
      await insertarLeg(payload);
    }
    await refetchLegs();
    setDialogOpen(false);
  }, [buildPayload, insertarLeg, actualizarLeg, refetchLegs]);

  const datosConId = useMemo(
    () => legs.map((leg, index) => {
      return {
        ...leg,
        _gridId: leg.embLegsId ?? `temp_${index}`,
        codPaisOrigen: leg.codPaisOrigen ?? leg.paisIdOrigen ?? '',
        codPaisDestino: leg.codPaisDestino ?? leg.paisIdDestino ?? '',
        puertoIdOrigen: leg.puntoenlaceIdOrigen ?? leg.puertoIdOrigen ?? '',
        puertoIdDestino: leg.puntoenlaceIdDestino ?? leg.puertoIdDestino ?? '',
        _nombrePuertoOrigen: leg.puntoenlaceNombreOrigen ?? '',
        _nombrePuertoDestino: leg.puntoenlaceNombreDestino ?? '',
        fechaSalida: leg.fechaSalida ?? leg.fecha_salida ?? leg.FECHA_SALIDA ?? '',
        fechaLlegada: leg.fechaLlegada ?? leg.fecha_llegada ?? leg.FECHA_LLEGADA ?? '',
        fecha_salida: leg.fecha_salida ?? leg.fechaSalida ?? '',
        fecha_llegada: leg.fecha_llegada ?? leg.fechaLlegada ?? '',
        costoEstimado: parseDecimalValue(leg.costoEstimado ?? leg.COSTO_ESTIMADO ?? 0),
        costoReal: parseDecimalValue(leg.costoReal ?? leg.COSTO_REAL ?? 0),
      };
    }),
    [legs]
  );

  const formatPaisLabel = useCallback((val, row, campo) => {
    const found = paisesOptions.find((p) => String(p.value) === String(val));
    return found ? found.label : (row?.[campo] ?? val ?? '');
  }, [paisesOptions]);

  const rutasItems = useMemo(
    () => datosConId.map((leg, index) => {
      const nombrePaisOrigen = formatPaisLabel(leg.codPaisOrigen, leg, 'nombrePaisOrigen');
      const nombrePaisDestino = formatPaisLabel(leg.codPaisDestino, leg, 'nombrePaisDestino');
      const nombreAerolinea = aerolineasOptions.find((a) => String(a.value) === String(leg.codEntidadProv ?? leg.entidadIdProvTrans))?.label
        ?? leg.entidadNombreProv ?? leg.entidad_nombre_prov ?? '';
      const nombrePuertoOrigen = leg._nombrePuertoOrigen || leg.puntoenlaceNombreOrigen || leg.puntoenlace_nombre_origen || '';
      const nombrePuertoDestino = leg._nombrePuertoDestino || leg.puntoenlaceNombreDestino || leg.puntoenlace_nombre_destino || '';
      return {
        key: leg._gridId,
        nombre: nombreAerolinea || leg.entidadNombreProv || leg.entidad_nombre || `Leg ${index + 1}`,
        nombreProveedor: '',
        monedaSimbolo: '',
        valor: 0,
        detallesColumns: true,
        _leg: leg,
        detalles: [
          { tarifadetalle_id: `pais-origen-${index}`, tipo_desc: 'País Origen', tarifadetalle_descripcion: nombrePaisOrigen },
          { tarifadetalle_id: `punto-origen-${index}`, tipo_desc: 'Aeropuerto Origen', tarifadetalle_descripcion: nombrePuertoOrigen },
          { tarifadetalle_id: `pais-destino-${index}`, tipo_desc: 'País Destino', tarifadetalle_descripcion: nombrePaisDestino },
          { tarifadetalle_id: `punto-destino-${index}`, tipo_desc: 'Aeropuerto Destino', tarifadetalle_descripcion: nombrePuertoDestino },
          { tarifadetalle_id: `vuelo-${index}`, tipo_desc: 'Vuelo', tarifadetalle_descripcion: leg.flightNumber ?? leg.flight_number ?? '' },
        ],
      };
    }),
    [datosConId, formatPaisLabel, aerolineasOptions]
  );

  const renderAccionFila = useCallback((item) => (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="Editar">
        <IconButton size="small" onClick={() => handleOpenEdit(item._leg)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  ), [handleOpenEdit]);

  if (!embarqueId) {
    return (
      <Box sx={{ p: 2 }}>
        <BannerInformativo
          severidad="warning"
          titulo="Faltan datos del embarque"
          mensaje="No hay datos del embarque disponibles."
        />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '80%', mx: 'auto' }}>
      <BannerInformativo
        ocultar={!required || isLoadingLegs || legs.length > 0}
        severidad="warning"
        titulo="Faltan rutas"
        mensaje="Agregue al menos una ruta para continuar."
      />

      {isLoadingLegs ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <TablaDue
          titulo="Rutas"
          subtituloParte=""
          subtituloTexto=""
          entidadNombre=""
          items={rutasItems}
          mostrarCodTipoPago={false}
          mostrarValor={false}
          usarEtiquetasDetalleComoCabecera
          renderAccionFila={renderAccionFila}
          columnaAccionAncho="1%"
          onRefresh={refetchLegs}
          accionesHeader={
            mostrarBotonAgregar ? (
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleOpenAdd}
              >
                Agregar
              </Button>
            ) : null
          }
        />
      )}

      <RutaDialog
        open={dialogOpen}
        initialData={editingLeg}
        onClose={handleCloseDialog}
        onSave={handleSaveDialog}
        aerolineasOptions={aerolineasOptions}
        paisesOptions={paisesOptions}
        filterPuntosEnlaceByPais={filterPuntosEnlaceByPais}
        isLoadingAerolineas={isLoadingAerolineas}
        isLoadingPaises={isLoadingPaises}
        isLoadingPuntosEnlace={isLoadingPuntosEnlace}
      />
    </Box>
  );
};

RutasSection.propTypes = {
  embarque_id: PropTypes.number,
  onValidityChange: PropTypes.func,
  onLoadingChange: PropTypes.func,
  required: PropTypes.bool,
  mostrarBotonAgregar: PropTypes.bool,
};

export default RutasSection;
