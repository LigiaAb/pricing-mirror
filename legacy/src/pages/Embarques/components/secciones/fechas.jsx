import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Select,
  TextField, Tooltip,
} from "@mui/material";
import FormularioAlternativo, { ModernFormHeader } from "@/components/bpm/Formularios/FormularioAlternativo";
import FormularioConGuardar from "./formularioConGuardar";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import TablaDue from "@/components/bpm/tablas/tablaDue";
import { useFetchTiposFecha } from "@/hooks/Fetch/useFetchEmbarques";
import {
  useFetchCoordinacionFechaMov,
  useCreateCoordinacionFechaMov,
  useUpdateCoordinacionFechaMov,
  useDeleteCoordinacionFechaMov,
} from "@/hooks/Bpm/coordinaciones";
import { useCoordinacionData } from "@/hooks/Bpm";
import BannerInformativo from "../banner";

const FORM_EMPTY = {
  idFechaRegEmbarque: null,
  id_tipo_fecha: "",
  fecha: "",
  observacion: "",
};

const formatDate = (valor) => {
  if (!valor) return "";
  const rawValue = typeof valor === "string" ? valor : String(valor);
  const fechaSinHora = rawValue.includes("T") ? rawValue.split("T")[0] : rawValue;
  const fechaObj = new Date(fechaSinHora);
  if (Number.isNaN(fechaObj.getTime())) return rawValue;
  return fechaObj.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const EXCLUDED_TIPOS_FECHA = new Set([158, 160, 324]);
const DEFAULT_EXCLUDED = new Set();

const FechaDialog = React.memo(({ open, initialData, onClose, onSave, tiposFecha, isLoadingTipos, excludedTipoFechaIds = DEFAULT_EXCLUDED }) => {
  const [formData, setFormData] = useState(initialData ?? FORM_EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFormData(initialData ?? FORM_EMPTY);
  }, [open, initialData]);

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const tipoFechaOptions = useMemo(() => {
    const selectedValue = Number(formData.id_tipo_fecha);
    const filtered = (tiposFecha ?? []).filter((t) => {
      const numericValue = Number(t.value);
      const isExcludedTipo = EXCLUDED_TIPOS_FECHA.has(numericValue);
      const isAlreadyUsed = excludedTipoFechaIds.has(numericValue);
      return !isExcludedTipo && (!isAlreadyUsed || numericValue === selectedValue);
    });

    const selectedOption = (tiposFecha ?? []).find(
      (t) => Number(t.value) === selectedValue,
    );

    if (selectedOption && EXCLUDED_TIPOS_FECHA.has(selectedValue)) {
      return [...filtered, selectedOption];
    }

    return filtered;
  }, [formData.id_tipo_fecha, tiposFecha, excludedTipoFechaIds]);

  const handleSave = useCallback(async () => {
    if (!formData.id_tipo_fecha || !formData.fecha) return;
    setSaving(true);
    try {
      await onSave(formData);
    } catch (err) {
      console.error("Error al guardar fecha:", err);
    } finally {
      setSaving(false);
    }
  }, [formData, onSave]);

  const isValid = formData.id_tipo_fecha && formData.fecha;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{formData.idFechaRegEmbarque ? "Editar Fecha" : "Agregar Fecha"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        <FormControl fullWidth size="small" disabled={isLoadingTipos} required>
          <InputLabel>Tipo de Fecha</InputLabel>
          <Select
            value={formData.id_tipo_fecha}
            label="Tipo de Fecha"
            onChange={(e) => handleChange("id_tipo_fecha", e.target.value)}
          >
            {tipoFechaOptions.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Fecha"
          type="date"
          size="small"
          fullWidth
          required
          slotProps={{ inputLabel: { shrink: true } }}
          value={formData.fecha || ""}
          onChange={(e) => handleChange("fecha", e.target.value)}
        />

        <TextField
          label="Observación"
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={formData.observacion || ""}
          onChange={(e) => handleChange("observacion", e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !isValid}>
          {saving ? <CircularProgress size={18} /> : "Guardar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

FechaDialog.displayName = "FechaDialog";
FechaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  initialData: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  tiposFecha: PropTypes.array,
  isLoadingTipos: PropTypes.bool,
  excludedTipoFechaIds: PropTypes.instanceOf(Set),
};

const FechasSection = ({ embarque_id = null, onValidityChange = null, onValuesChange = null }) => {
  const { data: embarqueData = null } = useCoordinacionData(embarque_id);
  const embarqueId = embarqueData?.embarqueId ?? embarqueData?.EMBARQUE_ID ?? embarque_id ?? null;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFecha, setEditingFecha] = useState(null);

  const { data: fechas = [], isLoading: isLoadingFechas, refetch: refetchFechas } = useFetchCoordinacionFechaMov(
    embarqueId ? { embarque_id: embarqueId } : {},
    { enabled: !!embarqueId },
  );

  const { data: tiposFecha = [], isLoading: isLoadingTipos } = useFetchTiposFecha();

  const { mutateAsync: crearFecha } = useCreateCoordinacionFechaMov();
  const { mutateAsync: actualizarFecha } = useUpdateCoordinacionFechaMov();
  const { mutateAsync: eliminarFecha } = useDeleteCoordinacionFechaMov();

  const RECOLECCION_TIPO_ID = 266;

  const hasRecoleccionFecha = useMemo(() => {
    return fechas.some((f) => {
      const idTipo = f.ID_FECHA_TIPO ?? f.id_fecha_tipo ?? null;
      return Number(idTipo) === RECOLECCION_TIPO_ID;
    });
  }, [fechas]);

  useEffect(() => {
    if (!isLoadingFechas && embarqueId) {
      onValidityChange?.(hasRecoleccionFecha);
    }
  }, [onValidityChange, hasRecoleccionFecha, isLoadingFechas, embarqueId]);

  useEffect(() => {
    onValuesChange?.(fechas);
  }, [fechas, onValuesChange]);

  const handleOpenAdd = useCallback(() => {
    setEditingFecha(FORM_EMPTY);
    setDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((fecha) => {
    const rawFecha = fecha.FECHA ?? fecha.fecha ?? "";
    const fechaSinHora = typeof rawFecha === "string" && rawFecha.includes("T") ? rawFecha.split("T")[0] : rawFecha;

    setEditingFecha({
      idFechaRegEmbarque: fecha.ID_FECHA_REG_EMBARQUE ?? fecha.idFechaRegEmbarque ?? null,
      id_tipo_fecha: fecha.ID_FECHA_TIPO ?? fecha.id_fecha_tipo ?? "",
      fecha: fechaSinHora,
      observacion: fecha.OBSERVACION ?? fecha.observacion ?? "",
    });
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleSave = useCallback(async (formData) => {
    if (formData.idFechaRegEmbarque) {
      await actualizarFecha({
        id_fecha_reg_embarque: formData.idFechaRegEmbarque,
        embarque_id: embarqueId,
        id_tipo_fecha: formData.id_tipo_fecha,
        fecha: formData.fecha,
        observacion: formData.observacion,
        estado_cod: "1",
      });
    } else {
      await crearFecha({
        embarque_id: embarqueId,
        id_tipo_fecha: formData.id_tipo_fecha,
        fecha: formData.fecha,
        observacion: formData.observacion,
        estado_cod: "1",
      });
    }
    await refetchFechas();
    setDialogOpen(false);
  }, [embarqueId, crearFecha, actualizarFecha, refetchFechas]);

  const handleDelete = useCallback(async (fecha) => {
    const id = fecha.ID_FECHA_REG_EMBARQUE ?? fecha.idFechaRegEmbarque;
    if (!id) return;
    try {
      await eliminarFecha({ id_fecha_reg_embarque: id });
      await refetchFechas();
    } catch (err) {
      console.error("Error al eliminar fecha:", err);
    }
  }, [eliminarFecha, refetchFechas]);

  const fechasItems = useMemo(
    () => fechas.map((fecha, index) => {
      const tipoDesc = fecha.TIPO_DESCRIPCION ?? fecha.tipo_descripcion ?? fecha.NOMENCLATURA ?? fecha.nomenclatura ?? `Fecha ${index + 1}`;
      const fechaVal = fecha.FECHA ?? fecha.fecha ?? "";
      const observacion = fecha.OBSERVACION ?? fecha.observacion ?? "";
      const id = fecha.ID_FECHA_REG_EMBARQUE ?? fecha.idFechaRegEmbarque ?? `temp_${index}`;
      return {
        key: id,
        nombre: tipoDesc,
        nombreProveedor: "",
        monedaSimbolo: "",
        valor: null,
        detallesColumns: true,
        _fecha: fecha,
        detalles: [
          { tarifadetalle_id: `fecha-${index}`, tipo_desc: "Fecha", tarifadetalle_descripcion: formatDate(fechaVal) },
          { tarifadetalle_id: `obs-${index}`, tipo_desc: "Observación", tarifadetalle_descripcion: observacion },
        ],
      };
    }),
    [fechas],
  );

  const excludedTipoFechaIds = useMemo(() => {
    const ids = new Set();
    fechas.forEach((fecha) => {
      const idTipo = fecha.ID_FECHA_TIPO ?? fecha.id_fecha_tipo ?? fecha.idTipoFecha ?? fecha.id_tipo_fecha;
      if (idTipo != null && idTipo !== "") {
        ids.add(Number(idTipo));
      }
    });
    return ids;
  }, [fechas]);

  const renderAccionFila = useCallback((item) => (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      <Tooltip title="Editar">
        <IconButton size="small" onClick={() => handleOpenEdit(item._fecha)}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Eliminar">
        <IconButton size="small" color="error" onClick={() => handleDelete(item._fecha)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  ), [handleOpenEdit, handleDelete]);

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
    <Box sx={{ width: "70%", mx: "auto" }}>
      <BannerInformativo
        ocultar={isLoadingFechas || hasRecoleccionFecha}
        severidad="warning"
        titulo="Ingrese la Fecha de Recolección"
        mensaje="De click en Agregar y añada la fecha de recolección"
      />

      {isLoadingFechas ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <TablaDue
          titulo="Fechas"
          subtituloParte=""
          subtituloTexto=""
          entidadNombre=""
          items={fechasItems}
          mostrarCodTipoPago={false}
          mostrarValor={false}
          usarEtiquetasDetalleComoCabecera
          renderAccionFila={renderAccionFila}
          columnaAccionAncho="1%"
          onRefresh={refetchFechas}
          refreshDisabled={isLoadingFechas}
          accionesHeader={(
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenAdd}
            >
              Agregar
            </Button>
          )}
        />
      )}

      <FechaDialog
        open={dialogOpen}
        initialData={editingFecha}
        onClose={handleCloseDialog}
        onSave={handleSave}
        tiposFecha={tiposFecha}
        isLoadingTipos={isLoadingTipos}
        excludedTipoFechaIds={excludedTipoFechaIds}
      />
    </Box>
  );
};

FechasSection.propTypes = {
  embarque_id: PropTypes.number,
  onValidityChange: PropTypes.func,
  onValuesChange: PropTypes.func,
};

export const FechasForm = ({ fields, initialValues, onValuesChange, onSave, isSaving, saveDisabled }) => (
  <FormularioConGuardar disabled={saveDisabled} guardando={isSaving} onGuardar={onSave} variant="modern">
    <ModernFormHeader icon="c-calendario" title="Fechas" subtitle="Fecha de recolección de la mercadería." />
    <FormularioAlternativo
      title="Fechas"
      fields={fields}
      initialValues={initialValues}
      onValuesChange={onValuesChange}
      showSubmitButton={false}
      hideHeader
      variant="modern"
    />
  </FormularioConGuardar>
);

FechasForm.propTypes = {
  fields: PropTypes.arrayOf(PropTypes.object),
  initialValues: PropTypes.object,
  onValuesChange: PropTypes.func,
  onSave: PropTypes.func,
  isSaving: PropTypes.bool,
  saveDisabled: PropTypes.bool,
};

export default FechasSection;
