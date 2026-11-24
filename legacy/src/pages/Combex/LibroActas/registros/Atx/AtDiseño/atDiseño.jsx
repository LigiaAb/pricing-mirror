import { useState, useMemo, useCallback } from "react";
import { Box, Card } from "@mui/material";
import PropTypes from "prop-types";
import AtFecha from "./atFecha";
import AtFechaDone from "./atFechaDone";

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Normaliza una fecha para envío a la API
 * @param {Date|string|null} val - Valor de fecha
 * @returns {string|null} Fecha en formato ISO o null
 */
const formatDateToApi = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    return Number.isNaN(val.getTime()) ? null : val.toISOString();
  }
  if (typeof val === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return `${val}T00:00:00.000Z`;
    const parsed = new Date(val);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  return null;
};

/**
 * Extrae el valor de una propiedad que puede estar en mayúsculas o minúsculas
 */
const getProperty = (obj, prop) => {
  if (!obj) return null;
  return obj[prop] || obj[prop.toUpperCase()] || obj[prop.toLowerCase()] || null;
};

const ATDiseño = ({ coordinacion, nomenclatura, idTipoFecha, titulo, onCreateAtd, fechaRegistrada, insertarFecha, actualizarFecha, eliminarFecha, invalidateFechas, showActions = true, showEdit, showDelete, allowCreate = true }) => {
  const embarqueId = coordinacion?.embarqueId;
  const codFile = getProperty(coordinacion, "cod_file") || "";

  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [comentarios, setComentarios] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewFechaRegistrada, setPreviewFechaRegistrada] = useState(null);

  const headerHint = useMemo(() => {
    const upN = (nomenclatura || "").toString().toUpperCase();
    const upT = (titulo || "").toString().toUpperCase();
    if (upN.includes("ATD") || upT.includes("ATD"))
      return "Hora Real de Salida";
    if (
      upN.includes("ATA") ||
      upT.includes("ATA")
    )
      return "Hora Real de Llegada";
    return "Hora Real de Salida o Hora Real de Llegada";
  }, [nomenclatura, titulo]);

  const isAtd = useMemo(() => {
    const upN = (nomenclatura || "").toString().toUpperCase();
    const upT = (titulo || "").toString().toUpperCase();
    return upN.includes("ATD") || upT.includes("ATD");
  }, [nomenclatura, titulo]);

  const resetForm = useCallback(() => {
    setFechaSeleccionada(null);
    setComentarios("");
    setIsEditing(false);
    setEditingId(null);
    setPreviewFechaRegistrada(null);
  }, []);

  const crearPreview = useCallback((fecha, obs) => {
    try {
      setPreviewFechaRegistrada({
        fecha: formatDateToApi(fecha),
        observacion: obs || "",
        nomenclatura,
        estadoDescripcion: "Activo",
        idFechaRegEmbarque: editingId || null,
      });
    } catch (e) {
      console.warn("No se pudo crear preview de fecha guardada:", e);
    }
  }, [nomenclatura, editingId]);

  const handleGuardar = useCallback(async () => {
    if (!fechaSeleccionada) {
      console.warn("No se puede guardar sin fecha seleccionada");
      return;
    }

    const fechaFormateada = formatDateToApi(fechaSeleccionada);
    if (!fechaFormateada) {
      console.error("Fecha inválida");
      return;
    }

    const buildPayload = (fecha) => ({
      embarque_id: embarqueId,
      id_tipo_fecha: idTipoFecha,
      observacion: comentarios || "",
      fecha,
      estado_cod: 1,
    });

    const doUpdate = async () => {
      if (typeof actualizarFecha === "function") {
        const payload = {
          embarque_id: embarqueId,
          id_fecha_reg_embarque: editingId,
          id_tipo_fecha: idTipoFecha,
          observacion: comentarios || "",
          fecha: fechaFormateada,
          estado_cod: 1,
        };
        await actualizarFecha(payload);
      } else {
        console.error("Actualizar no disponible");
      }
    };

    const doInsert = async () => {
      if (typeof insertarFecha === "function") {
        await insertarFecha(buildPayload(fechaFormateada));
      } else {
        console.error("Insertar no disponible");
      }
    };

    const doAtdCreateOrInsert = async () => {
      if (typeof onCreateAtd === "function") {
        const payloadAtd = {
          embarque_id: embarqueId,
          cod_file: codFile,
          fecha_atd: fechaFormateada,
        };
        await onCreateAtd(payloadAtd);
        // si la actualización ATD fue exitosa, insertamos la fecha de coordinacion
        try {
          await doInsert();
        } catch (e) {
          console.warn("Creación de registro de fecha tras ATD falló:", e);
        }
      } else {
        await doInsert();
      }
    };

    try {
      if (isEditing && editingId) {
        await doUpdate();
      } else if (isAtd) {
        await doAtdCreateOrInsert();
      } else {
        await doInsert();
      }

      await invalidateFechas();
      crearPreview(fechaSeleccionada, comentarios);
      resetForm();
    } catch (err) {
      console.error(`Error al guardar ${nomenclatura}:`, err);
    }
  }, [
    fechaSeleccionada,
    isEditing,
    editingId,
    embarqueId,
    idTipoFecha,
    comentarios,
    actualizarFecha,
    isAtd,
    codFile,
    onCreateAtd,
    insertarFecha,
    invalidateFechas,
    crearPreview,
    resetForm,
    nomenclatura,
  ]);

  const handleEditar = useCallback(() => {
    if (!fechaRegistrada) return;

    setPreviewFechaRegistrada(null);

    const fechaVal = getProperty(fechaRegistrada, "fecha") ||
      getProperty(fechaRegistrada, "fecha_format");
    const dateObj = fechaVal ? new Date(fechaVal) : null;

    setFechaSeleccionada(dateObj && !Number.isNaN(dateObj.getTime()) ? dateObj : null);
    setComentarios(getProperty(fechaRegistrada, "observacion") || "");
    setIsEditing(true);
    setEditingId(
      getProperty(fechaRegistrada, "idFechaRegEmbarque") ||
      getProperty(fechaRegistrada, "id_fecha_reg_embarque")
    );
  }, [fechaRegistrada]);

  const handleEliminar = useCallback(async () => {
    if (!fechaRegistrada) return;

    const idToDelete = getProperty(fechaRegistrada, "idFechaRegEmbarque") ||
      getProperty(fechaRegistrada, "id_fecha_reg_embarque");

    if (!idToDelete) {
      console.error("No se encontró ID para eliminar");
      return;
    }

    try {
      if (typeof eliminarFecha === "function") {
        await eliminarFecha({ id_fecha_reg_embarque: idToDelete });
      } else {
        console.error('Eliminar no disponible');
      }
      await invalidateFechas();
      setPreviewFechaRegistrada(null);
    } catch (err) {
      console.error(`Error al eliminar ${nomenclatura}:`, err);
    }
  }, [fechaRegistrada, eliminarFecha, invalidateFechas, nomenclatura]);

  const handleFormularioInput = useCallback(({ id, val }) => {
    if (id === "fecha") setFechaSeleccionada(val);
    if (id === "comentarios") setComentarios(val);
  }, []);

  return (

    <Box sx={{ flex: "1 1 420px", minWidth: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card
        elevation={3}
        sx={{
          height: "auto",
          width: "100%",
          maxWidth: 640,
          display: "flex",
          flexDirection: "column",
          borderColor: fechaRegistrada ? `primary.main` : "divider",
          transition: "all 0.3s ease",
          "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 600, p: 3 }}>
          <AtFechaDone
            fechaRegistrada={previewFechaRegistrada || fechaRegistrada}
            titulo={titulo}
            nomenclatura={nomenclatura}
            headerHint={headerHint}
            onEdit={handleEditar}
            onDelete={handleEliminar}
            showActions={showActions}
            showEdit={showEdit}
            showDelete={showDelete}
          />

          {((allowCreate && !fechaRegistrada) || isEditing) && (
            <AtFecha
              headerHint={headerHint}
              showHeader={!fechaRegistrada}
              fechaSeleccionada={fechaSeleccionada}
              comentarios={comentarios}
              onInput={handleFormularioInput}
              onGuardar={handleGuardar}
            />
          )}
        </Box>
      </Card>
    </Box>
  );
};

ATDiseño.propTypes = {
  coordinacion: PropTypes.object.isRequired,
  nomenclatura: PropTypes.string.isRequired,
  idTipoFecha: PropTypes.number.isRequired,
  titulo: PropTypes.string,
  onCreateAtd: PropTypes.func,
  fechaRegistrada: PropTypes.object,
  insertarFecha: PropTypes.func,
  actualizarFecha: PropTypes.func,
  eliminarFecha: PropTypes.func,
  invalidateFechas: PropTypes.func,
  showActions: PropTypes.bool,
  showEdit: PropTypes.bool,
  showDelete: PropTypes.bool,
  allowCreate: PropTypes.bool,
};

ATDiseño.defaultProps = {
  showActions: true,
  showEdit: undefined,
  showDelete: undefined,
  allowCreate: true,
};

export default ATDiseño;
