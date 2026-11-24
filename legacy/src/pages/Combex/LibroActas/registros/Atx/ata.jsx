import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import ATDiseño from "./AtDiseño/atDiseño";
import { useUpdateCoordinacionEstado } from "../../../../../hooks/Bpm";
import { useQueryClient } from "@tanstack/react-query";
import useRegistroFecha from './useRegistroFecha';

const ATARegistro = ({ coordinacion }) => {
  const { getFechaRegistrada, insertarFecha, actualizarFecha, eliminarFecha, invalidateFechas } = useRegistroFecha(coordinacion);
  const { mutateAsync: updateEstado } = useUpdateCoordinacionEstado();
  const queryClient = useQueryClient();

  // Buscar por id del tipo de fecha (mejor precisión que por nomenclatura que a veces es nula)
  const fechaRegistrada = getFechaRegistrada(160);
  const fechaAtdRegistrada = getFechaRegistrada(158);

  // Mostrar mensaje cuando no se ha registrado ATD aún
  if (!fechaAtdRegistrada) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          ATA - Hora Real de Llegada
        </Typography>
        <Typography variant="h4" color="text.secondary" fontWeight={700}>
          Primero ingrese la fecha ATD
        </Typography>
      </Box>
    );
  }

  const handleInsertarFecha = async (payload) => {
    const res = await insertarFecha(payload);

    // verificar rechazo del backend
    if (res?.data?.success === false) {
      const errorMessage = res?.data?.mensaje || "Error al insertar ATA: operación rechazada por el backend";
      console.error("ATA insert rejected by backend:", errorMessage, res?.data);
      throw new Error(errorMessage);
    }

    // actualizar a estado ATA
    try {
      const estadoPayload = {
        embarque_id: coordinacion?.embarqueId,
        cod_file: coordinacion?.codFile ?? coordinacion?.cod_file,
        cod_estado_actual: coordinacion?.estadoId ?? coordinacion?.estado_id,
        cod_estado_siguiente: 68,
      };
      await updateEstado(estadoPayload);
      try {
        if (coordinacion?.embarqueId !== undefined) {
          await queryClient.invalidateQueries({ queryKey: ["coordinacion-cargas", coordinacion?.embarqueId] });
          await queryClient.invalidateQueries({ queryKey: ["coordinacion-fecha-mov", { embarque_id: coordinacion?.embarqueId }] });
        }
      } catch (err) {
        console.warn("Failed to invalidate queries after updating coordination state:", err);
      }
    } catch (err) {
      console.error("Error updating coordination state after ATA insert:", err);
    }

    return res;
  };

  const handleActualizarFecha = async (payload) => {
    const res = await actualizarFecha(payload);

    // verificar rechazo del backend
    if (res?.data?.success === false) {
      const errorMessage = res?.data?.mensaje || "Error al actualizar ATA: operación rechazada por el backend";
      console.error("ATA update rejected by backend:", errorMessage, res?.data);
      throw new Error(errorMessage);
    }

    // actualizar estado ATA
    try {
      const estadoPayload = {
        embarque_id: coordinacion?.embarqueId,
        cod_file: coordinacion?.codFile ?? coordinacion?.cod_file,
        cod_estado_actual: coordinacion?.estadoId ?? coordinacion?.estado_id,
        cod_estado_siguiente: 68,
      };
      await updateEstado(estadoPayload);
      try {
        if (coordinacion?.embarqueId !== undefined) {
          await queryClient.invalidateQueries({ queryKey: ["coordinacion-cargas", coordinacion?.embarqueId] });
          await queryClient.invalidateQueries({ queryKey: ["coordinacion-fecha-mov", { embarque_id: coordinacion?.embarqueId }] });
        }
      } catch (err) {
        console.warn("Failed to invalidate queries after updating coordination state:", err);
      }
    } catch (err) {
      console.error("Error updating coordination state after ATA update:", err);
    }

    return res;
  };

  return (
    <ATDiseño
      coordinacion={coordinacion}
      nomenclatura="ATA"
      idTipoFecha={160}
      titulo="ATA - Hora Real de Llegada"
      fechaRegistrada={fechaRegistrada}
      insertarFecha={handleInsertarFecha}
      actualizarFecha={handleActualizarFecha}
      eliminarFecha={eliminarFecha}
      invalidateFechas={invalidateFechas}
      showEdit={true}
      showDelete={false}
    />
  );
};

ATARegistro.propTypes = {
  coordinacion: PropTypes.object.isRequired,
};

export default ATARegistro;
