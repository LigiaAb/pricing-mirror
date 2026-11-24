import PropTypes from "prop-types";
import ATDiseño from "./AtDiseño/atDiseño";
import { useUpdateAtdCoordinacionAsignada, useUpdateCoordinacionEstado, useGenerarDocumentosSolicitudFacturacion, validateUpdateAtdCoordinacionAsignada, toIsoDate } from "../../../../../hooks/Bpm";
import { useQueryClient } from "@tanstack/react-query";
import useRegistroFecha from './useRegistroFecha';

const ATDRegistro = ({ coordinacion }) => {
  // Temporalmente deshabilitado el envío de actualizaciones ATD a la coordinación
  // Para reactivar, establecer en false o eliminar esta bandera.
  const disableAtdUpdate = true;
  // temporalmente también deshabilitamos la generación de documentos
  const disableGenerarDocumentos = true;
  const enableGenerarDocumentos = !disableGenerarDocumentos;

  const { mutateAsync: updateAtd } = useUpdateAtdCoordinacionAsignada();
  const { mutateAsync: updateEstado } = useUpdateCoordinacionEstado();
  const { mutateAsync: generarSolicitudFacturacion } = useGenerarDocumentosSolicitudFacturacion();
  const queryClient = useQueryClient();

  const handleCreateAtd = async (payload) => {
    if (disableAtdUpdate) {
      console.info("ATD update is currently disabled (temporary flag)");
      return { data: { success: true, mensaje: "ATD update skipped" } };
    }

    // El orden al ingresar una fecha es:
    // 1. actualizar la fecha de movimiento en la coordinación
    // 2. actualizar el estado de la coordinación
    // 3. generar los documentos de solicitud de facturación
    // de esta forma cualquier fallo en los pasos previos evita generar docs innecesarios

    try {
      validateUpdateAtdCoordinacionAsignada(payload);

      const normalized = { ...payload, fecha_atd: toIsoDate(payload?.fecha_atd) };
      const result = await updateAtd(normalized);

      if (result?.data?.success === false) {
        const errorMessage = result?.data?.mensaje || "Error al actualizar ATD: operación rechazada por el backend";
        console.error("ATD update rejected by backend:", errorMessage, result?.data);
        throw new Error(errorMessage);
      }

      try {
        if (normalized?.embarque_id !== undefined) {
          await queryClient.invalidateQueries({ queryKey: ["coordinacion-fecha-mov", { embarque_id: normalized?.embarque_id }] });
        }
      } catch (err) {
        console.warn("error al invalidar el cache de coordinacion-fecha-mov:", err);
      }

      // Si la actualización de ATD fue exitosa, actualizar el estado
      try {
        const estadoPayload = {
          embarque_id: normalized?.embarque_id,
          cod_file: coordinacion?.codFile ?? coordinacion?.cod_file,
          cod_estado_actual: coordinacion?.estadoId ?? coordinacion?.estado_id,
          cod_estado_siguiente: 67,
        };
        await updateEstado(estadoPayload);
        // Invalidar queries relacionadas para reflejar el nuevo estado
        try {
          if (normalized?.embarque_id !== undefined) {
            await queryClient.invalidateQueries({ queryKey: ["coordinacion-cargas", normalized?.embarque_id] });
            await queryClient.invalidateQueries({ queryKey: ["coordinacion-fecha-mov", { embarque_id: normalized?.embarque_id }] });
          }
        } catch (err) {
          console.warn("Failed to invalidate queries after updating coordination state:", err);
        }
      } catch (err) {
        console.error("Error updating coordination state after ATD:", err);
      }

      // finalmente generamos los documentos, después de tener fecha y estado correctos
      if (enableGenerarDocumentos) {
        const genPayload = payload?.embarque_id ? { embarque_id: payload.embarque_id } : {};
        try {
          const genResult = await generarSolicitudFacturacion(genPayload);
          if (genResult?.data?.success === false) {
            const msg = genResult.data.mensaje || "Error generando documentos de solicitud facturación";
            console.error("generarSolicitudFacturacion returned failure:", genResult);
            throw new Error(msg);
          }
        } catch (err) {
          console.error("Error generando documentos de solicitud facturación después de ATD y estado:", err);
          throw err;
        }
      } else {
        console.info("Generación de documentos deshabilitada temporalmente");
      }

      return result;
    } catch (e) {
      console.error("Error updating ATD via specialized endpoint:", e);
      throw e;
    }
  };

  const { getFechaRegistrada, insertarFecha, actualizarFecha, eliminarFecha, invalidateFechas } = useRegistroFecha(coordinacion);

  const handleInsertarFecha = async (payload) => {
    // el orden correcto al ingresar una fecha genérica es:
    // 1. crear / actualizar la fecha en la coordinación
    // 2. actualizar el estado de la coordinación (si aplica)
    // 3. generar documentos de solicitud de facturación

    // primero intentamos crear la fecha en la coordinación
    const res = await insertarFecha(payload);

    // después de insertar, intentamos avanzar el estado de la coordinación
    try {
      const estadoPayload = {
        embarque_id: payload?.embarque_id,
        cod_file: coordinacion?.codFile ?? coordinacion?.cod_file,
        cod_estado_actual: coordinacion?.estadoId ?? coordinacion?.estado_id,
        cod_estado_siguiente: 67, // valor por defecto, ajustar según tipo de fecha si es necesario
      };
      await updateEstado(estadoPayload);
      if (payload?.embarque_id !== undefined) {
        await queryClient.invalidateQueries({ queryKey: ["coordinacion-cargas", payload.embarque_id] });
        await queryClient.invalidateQueries({ queryKey: ["coordinacion-fecha-mov", { embarque_id: payload.embarque_id }] });
      }
    } catch (err) {
      console.warn("Error actualizando estado de coordinación tras insertar fecha:", err);
    }

    // si la creación se completó sin errores, generamos los documentos
    if (enableGenerarDocumentos) {
      const genPayload = payload?.embarque_id ? { embarque_id: payload.embarque_id } : {};
      try {
        const genResult = await generarSolicitudFacturacion(genPayload);
        if (genResult?.data?.success === false) {
          const msg = genResult.data.mensaje || "Error generando documentos de solicitud facturación";
          console.warn("generarSolicitudFacturacion returned failure:", genResult);
          throw new Error(msg);
        }
      } catch (err) {
        console.warn("Error generando documentos de solicitud facturación después de insertar fecha:", err);
        // propagamos el error para que el llamador sepa que la generación falló
        throw err;
      }
    } else {
      console.info("Generación de documentos deshabilitada temporalmente");
    }

    return res;
  };

  const handleActualizarFecha = async (payload) => {
    // actualizamos la fecha primero
    const res = await actualizarFecha(payload);

    // después de modificar, avanzamos el estado de coordinación si procede
    try {
      const estadoPayload = {
        embarque_id: payload?.embarque_id,
        cod_file: coordinacion?.codFile ?? coordinacion?.cod_file,
        cod_estado_actual: coordinacion?.estadoId ?? coordinacion?.estado_id,
        cod_estado_siguiente: 67,
      };
      await updateEstado(estadoPayload);
      if (payload?.embarque_id !== undefined) {
        await queryClient.invalidateQueries({ queryKey: ["coordinacion-cargas", payload.embarque_id] });
        await queryClient.invalidateQueries({ queryKey: ["coordinacion-fecha-mov", { embarque_id: payload.embarque_id }] });
      }
    } catch (err) {
      console.warn("Error actualizando estado de coordinación tras modificar fecha:", err);
    }

    // sólo si la actualización fue exitosa intentamos generar los docs
    if (enableGenerarDocumentos) {
      const genPayload = payload?.embarque_id ? { embarque_id: payload.embarque_id } : {};
      try {
        const genResult = await generarSolicitudFacturacion(genPayload);
        if (genResult?.data?.success === false) {
          const msg = genResult.data.mensaje || "Error generando documentos de solicitud facturación";
          console.warn("generarSolicitudFacturacion returned failure:", genResult);
          throw new Error(msg);
        }
      } catch (err) {
        console.warn("Error generando documentos de solicitud facturación después de actualizar fecha:", err);
        throw err;
      }
    } else {
      console.info("Generación de documentos deshabilitada temporalmente");
    }

    return res;
  };

  // Buscar por id del tipo de fecha (mejor precisión que por nomenclatura que a veces es nula)
  const fechaRegistrada = getFechaRegistrada(158);

  return (
    <ATDiseño
      coordinacion={coordinacion}
      nomenclatura="ATD"
      idTipoFecha={158}
      titulo="ATD - Hora Real de Salida"
      onCreateAtd={handleCreateAtd}
      fechaRegistrada={fechaRegistrada}
      insertarFecha={handleInsertarFecha}
      actualizarFecha={handleActualizarFecha}
      eliminarFecha={eliminarFecha}
      invalidateFechas={invalidateFechas}
      showEdit={!disableAtdUpdate}
      showDelete={false}
      allowCreate={false}
    />
  );
};

ATDRegistro.propTypes = {
  coordinacion: PropTypes.object.isRequired,
};

export default ATDRegistro;