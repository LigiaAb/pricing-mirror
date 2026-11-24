import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useQueryClient } from "@tanstack/react-query";
import { useInsertarEntidadIdentificacion, useActualizarEntidadIdentificacion } from "@/hooks/Bpm";
import FormularioAlternativo from "../../../../../components/bpm/Formularios/FormularioAlternativo";

const NuevaIdentificacionEntidad = ({
  identificacion = "NIT",
  valorInicial = "",
  entidadidentificacionId = null,
  codIdentificacion = null,
  entidadId = null,        // entidad selected in parent form
  codTipo = null,          // used for query invalidation
  onSubmit = () => {},     // invoked after save succeeds
  readOnly = true,
}) => {
  const queryClient = useQueryClient();
  const crearIdentificacion = useInsertarEntidadIdentificacion();
  const actualizarIdentificacion = useActualizarEntidadIdentificacion();

  const [formData, setFormData] = useState({
    identificacion,
    valor: valorInicial,
    id: entidadidentificacionId,
    codIdentificacion,
  });

  useEffect(() => {
    setFormData({ identificacion, valor: valorInicial, id: entidadidentificacionId, codIdentificacion });
  }, [identificacion, valorInicial, entidadidentificacionId, codIdentificacion]);

  // derived flag used by submit handler to choose the proper mutation
  const isEditing = Boolean(entidadidentificacionId);


  const fields = useMemo(
    () => [
      {
        key: "identificacion",
        label: "Identificación",
        type: "text",
        readOnly,
        colSpan: "span 12",
      },
      {
        key: "valor",
        label: "Valor",
        type: "text",
        colSpan: "span 12",
      },
    ],
    [readOnly],
  );

  const handleFieldChange = (id, val) => {
    setFormData((prev) => ({ ...prev, [id]: val }));
  };

  const handleAgregar = async () => {
    if (!entidadId || !codIdentificacion) {
      console.error("Missing entidadId or codIdentificacion for identificación");
      return;
    }

    try {
      let result;
      if (isEditing) {
        // editing an existing identificacion; use the update mutation
        result = await actualizarIdentificacion.mutateAsync({
          entidadidentificacion_id: Number(formData.id),
          entidad_id: Number(entidadId),
          cod_identificacion: codIdentificacion,
          entidadidentificacio_numero: formData.valor,
          cod_estado: 1,
          entidadidentificacion_fecha_inicio: null,
          entidadidentificacion_fecha_fin: null,
          entidadidentificacion_ruta: null,
        });
      } else {
        // creating a new identificacion
        result = await crearIdentificacion.mutateAsync({
          entidad_id: Number(entidadId),
          cod_identificacion: codIdentificacion,
          entidadidentificacio_numero: formData.valor,
          cod_estado: 1,
          entidadidentificacion_fecha_inicio: null,
          entidadidentificacion_fecha_fin: null,
          entidadidentificacion_ruta: null,
        });
      }

      if (codTipo && entidadId) {
        queryClient.invalidateQueries({
          queryKey: ["entidad-identificacion", { cod_tipo: codTipo, entidad_id: entidadId }],
        });
      }

      if (onSubmit) {
        onSubmit({
          identificacion: formData.identificacion,
          valor: formData.valor,
          id: result?.entidadidentificacion_id,
          cod_identificacion: codIdentificacion,
        });
      }
    } catch (err) {
      console.error("Error al crear/actualizar identificación:", err);
    }
  };

  return (
    <FormularioAlternativo
      hideHeader
      title="Identificación"
      fields={fields}
      initialValues={formData}
      onFieldChange={handleFieldChange}
      onSubmit={handleAgregar}
      validate={() => true}
      labels={{ submit: "Aceptar" }}
      showSubmitButton={true}
    />
  );
};

NuevaIdentificacionEntidad.propTypes = {
  identificacion: PropTypes.string,
  valorInicial: PropTypes.string,
  entidadidentificacionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  entidadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  codTipo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  codIdentificacion: PropTypes.number,
  onSubmit: PropTypes.func,
  readOnly: PropTypes.bool,
};

export default NuevaIdentificacionEntidad;
