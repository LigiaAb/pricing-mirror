import { useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import FormularioAlternativo from "../../../../../components/bpm/Formularios/FormularioAlternativo";
import { useFetchPaises, useFetchTipos, useFetchDepartamentos, useFetchMunicipios, useFetchEntidadesDireccion, useInsertarEntidadDireccion, useActualizarEntidadDireccion } from "@/hooks/Bpm";
import { useDispatch } from "react-redux";
import { encenderCarga, apagarCarga } from "@/store/slices/status/statusSlice";

const NuevaDireccionEntidad = ({
  entidad_id,
  tipo,
  fixedTipoLabel = null,
  reConsultar,
  editMode = false,
  direccionId = null,
  initialValues: providedInitial = null,
}) => {
  const dispatch = useDispatch();

  const isFixedFiscal = useMemo(() => {
    if (!fixedTipoLabel) return false;
    return String(fixedTipoLabel)
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim() === "fiscal";
  }, [fixedTipoLabel]);

  const defaultValues = useMemo(() => ({
    cod_tipo: isFixedFiscal ? 1 : tipo || "",
    cod_estado: 1,
    entidaddireccion_direccion: "",
    entidaddireccion_zona: "",
    entidaddireccion_km: "",
    cod_pais: "",
    cod_depto: "",
    cod_muni: "",
  }), [isFixedFiscal, tipo]);

  const initialValues = useMemo(() => {
    if (editMode && providedInitial) {
      return {
        // fallback a la dirección original cuando no es fiscal.
        cod_tipo: isFixedFiscal
          ? 1
          : (providedInitial.cod_tipo || providedInitial.COD_TIPO || tipo || ""),
        cod_estado: providedInitial.cod_estado ?? providedInitial.COD_ESTADO ?? 1,
        entidaddireccion_direccion: providedInitial.direccion || "",
        entidaddireccion_zona: providedInitial.entidaddireccion_zona || "",
        entidaddireccion_km: providedInitial.entidaddireccion_km || "",
        cod_pais: providedInitial.cod_pais || "",
        cod_depto: providedInitial.cod_depto || "",
        cod_muni: providedInitial.cod_muni || "",
      };
    }
    return defaultValues;
  }, [editMode, providedInitial, defaultValues, tipo, isFixedFiscal]);

  const [valores, setValores] = useState(initialValues);
  const [existingId, setExistingId] = useState(null);

  useEffect(() => {
    setValores(initialValues);
  }, [initialValues]);

  const codTipoParaFetch = isFixedFiscal ? 1 : tipo;
  const { data: direccionesByTipo = [] } = useFetchEntidadesDireccion(
    { cod_tipo: codTipoParaFetch, cod_estado: 1, entidad_id },
    { enabled: Boolean(codTipoParaFetch && entidad_id) }
  );

  const direccionesFiltradas = useMemo(() => {
    if (!direccionesByTipo || direccionesByTipo.length === 0) return [];

    if (isFixedFiscal) {
      const directByCod = direccionesByTipo.filter((d) => String(d.cod_tipo) === String(codTipoParaFetch));
      if (directByCod.length > 0) return directByCod;
      return direccionesByTipo.filter((d) => {
        const desc = String(d.tipo_descripcion || d.TIPO_DESCRIPCION || "").toLowerCase().trim();
        return desc === "fiscal";
      });
    }

    if (!valores.cod_tipo) return [];

    return (direccionesByTipo || []).filter(
      (d) => String(d.cod_tipo) === String(valores.cod_tipo)
    );
  }, [direccionesByTipo, valores.cod_tipo, isFixedFiscal, codTipoParaFetch]);

  useEffect(() => {
    if (direccionesFiltradas.length > 0) {
      let d = null;
      if (direccionId != null && direccionId !== "") {
        d = direccionesFiltradas.find(
          (item) => String(item.entidaddireccion_id) === String(direccionId),
        );
      }
      // si no encontramos un registro específico, nos conformamos con el
      // primero (este es el comportamiento original para nuevos registros o
      // cuando no se provee `direccionId`).
      if (!d) {
        d = direccionesFiltradas[0];
      }

      setExistingId(d.entidaddireccion_id);
      setValores((prev) => ({
        ...prev,
        entidaddireccion_direccion: d.direccion ?? "",
        entidaddireccion_zona: d.entidaddireccion_zona ?? "",
        entidaddireccion_km: d.entidaddireccion_km ?? "",
        cod_pais: d.cod_pais ?? "",
        cod_depto: d.cod_depto ?? "",
        cod_muni: d.cod_muni ?? "",
      }));
    } else {
      setExistingId(null);
    }
  }, [direccionesFiltradas, direccionId]);

  const { data: paisesData = [] } = useFetchPaises();
  const { data: tiposData = [] } = useFetchTipos();

  const paisesOptions = useMemo(() => {
    return paisesData.map((p) => ({
      value: p.cod_pais,
      label: p.nombre_pais,
    }));
  }, [paisesData]);

  const tiposOptions = useMemo(() => {
    return tiposData
      .filter((t) => t.tipoTabla === "ENTIDAD_DIRECCION")
      .map((t) => ({
        value: t.value,
        label: t.label,
      }));
  }, [tiposData]);

  const fixedTipoOption = useMemo(() => {
    if (!fixedTipoLabel || tiposOptions.length === 0) return null;

    const wanted = String(fixedTipoLabel)
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    return tiposOptions.find((opt) => {
      const actual = String(opt?.label || "")
        .normalize("NFD")
        .replaceAll(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
      return actual === wanted;
    });
  }, [tiposOptions, fixedTipoLabel]);

  useEffect(() => {
    if (fixedTipoOption && !editMode) {
      setValores((prev) => ({ ...prev, cod_tipo: fixedTipoOption.value }));
    }
  }, [fixedTipoOption, editMode]);

  const isFiscalLabel = (label) => {
    return String(label || "")
      .normalize("NFD")
      .replaceAll("-", "")
      .toLowerCase()
      .trim() === "fiscal";
  };

  const fiscalOption = useMemo(() => {
    return tiposOptions.find((opt) => isFiscalLabel(opt.label));
  }, [tiposOptions]);

  useEffect(() => {
    if (editMode && providedInitial) {
      const tipoDesc =
        providedInitial.tipo_descripcion || providedInitial.TIPO_DESCRIPCION || "";
      if (isFiscalLabel(tipoDesc) && fiscalOption) {
        setValores((prev) => ({ ...prev, cod_tipo: fiscalOption.value }));
      }
    }
  }, [editMode, providedInitial, fiscalOption]);

  const tipoSeleccionado = useMemo(() => {
    if (!valores.cod_tipo) return null;
    return tiposOptions.find((opt) => String(opt.value) === String(valores.cod_tipo)) || null;
  }, [tiposOptions, valores.cod_tipo]);

  const isTipoEntregaYRecoleccion = useMemo(() => {
    if (!tipoSeleccionado?.label) return false;

    const tipoLabel = String(tipoSeleccionado.label)
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    return tipoLabel === "entrega y recoleccion";
  }, [tipoSeleccionado]);

  const { data: departamentosData = [] } = useFetchDepartamentos(
    { cod_pais: valores.cod_pais },
    { enabled: !!valores.cod_pais }
  );

  const departamentosOptions = useMemo(() => {
    return departamentosData.map((d) => ({
      value: d.cod_depto,
      label: d.nombre_depto,
    }));
  }, [departamentosData]);

  const { data: municipiosData = [] } = useFetchMunicipios(
    { cod_depto: valores.cod_depto },
    { enabled: !!valores.cod_depto }
  );

  const municipiosOptions = useMemo(() => {
    return municipiosData.map((m) => ({
      value: m.cod_muni,
      label: m.nombre_muni,
    }));
  }, [municipiosData]);

  const fields = [
    {
      key: "cod_tipo",
      label: "Tipo",
      type: "select",
      options: tiposOptions,
      required: true,
      colSpan: "span 12",
      readOnly: editMode || isTipoEntregaYRecoleccion || Boolean(fixedTipoOption),
    },
    {
      key: "entidaddireccion_direccion",
      label: "Dirección",
      type: "text",
      required: true,
      colSpan: "span 12",
    },
    {
      key: "entidaddireccion_zona",
      label: "Zona",
      type: "text",
      colSpan: "span 6",
    },
    {
      key: "entidaddireccion_km",
      label: "KM",
      type: "text",
      colSpan: "span 6",
    },
    {
      key: "cod_pais",
      label: "País",
      type: "select",
      options: paisesOptions,
      required: true,
      colSpan: "span 4",
    },
    {
      key: "cod_depto",
      label: "Departamento",
      type: "select",
      options: departamentosOptions,
      required: true,
      colSpan: "span 4",
    },
    {
      key: "cod_muni",
      label: "Municipio",
      type: "select",
      options: municipiosOptions,
      colSpan: "span 4",
    },
  ];

  const validate = (vals) => {
    // municipio no es obligatorio
    return (
      !!vals.cod_tipo &&
      !!vals.entidaddireccion_direccion &&
      !!vals.cod_pais &&
      !!vals.cod_depto
    );
  };

  const onFieldChange = (id, val, next) => {
    if (id === "cod_tipo") {
      return {
        entidaddireccion_direccion: "",
        entidaddireccion_zona: "",
        entidaddireccion_km: "",
        cod_pais: "",
        cod_depto: "",
        cod_muni: "",
      };
    }
    if (id === "cod_pais") {
      return { cod_depto: "", cod_muni: "" };
    }
    if (id === "cod_depto") {
      return { cod_muni: "" };
    }
    return null;
  };

  const { mutateAsync: insertarDireccion } = useInsertarEntidadDireccion();
  const { mutateAsync: actualizarDireccion } = useActualizarEntidadDireccion();

  const parseNumber = (value) =>
    value != null && value !== "" ? Number(value) : null;

  const isCodTipoUnchanged = (finalCodTipo) => {
    const originalCodTipo = providedInitial?.cod_tipo ?? providedInitial?.COD_TIPO;
    return (
      originalCodTipo != null &&
      String(finalCodTipo) === String(originalCodTipo)
    );
  };

  const getIdToUpdate = (finalVals) => {
    if (editMode) {
      const existing = parseNumber(existingId);
      if (existing != null) return existing;
      return isCodTipoUnchanged(finalVals.cod_tipo)
        ? parseNumber(direccionId)
        : null;
    }
    return parseNumber(existingId);
  };

  const onSubmit = async (vals) => {
    try {
      dispatch(encenderCarga());
      const finalVals = {
        ...providedInitial,
        ...vals,
      };

      const basePayload = {
        entidad_id: Number(entidad_id),
        cod_tipo: Number(finalVals.cod_tipo),
        cod_pais: Number(finalVals.cod_pais),
        cod_depto: Number(finalVals.cod_depto),
        cod_muni:
          finalVals.cod_muni !== "" && finalVals.cod_muni != null
            ? Number(finalVals.cod_muni)
            : null,
        cod_estado: 1,
        entidaddireccion_direccion: finalVals.entidaddireccion_direccion,
        entidaddireccion_zona: finalVals.entidaddireccion_zona
          ? `${finalVals.entidaddireccion_zona}`
          : null,
        entidaddireccion_km: finalVals.entidaddireccion_km
          ? `${finalVals.entidaddireccion_km}`
          : null,
      };

      const idToUpdate = getIdToUpdate(finalVals);

      const response = idToUpdate
        ? await actualizarDireccion({
          ...basePayload,
          entidaddireccion_id: idToUpdate,
        })
        : await insertarDireccion(basePayload);

      if (typeof reConsultar === "function") {
        reConsultar(
          vals.entidaddireccion_direccion || (response?.data?.direccion || "")
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(apagarCarga());
    }
  };

  const originalTipo = (editMode && providedInitial) ? (providedInitial.cod_tipo || tipo) : tipo;
  const isUpdating = Boolean(existingId) || (editMode && String(valores.cod_tipo) === String(originalTipo));
  const titleText = isUpdating ? "Editar Dirección" : "Nueva Dirección";
  const submitLabel = isUpdating ? "Guardar Cambios" : "Guardar Dirección";

  return (
    <FormularioAlternativo
      hideHeader
      title={titleText}
      initialValues={valores}
      fields={fields}
      validate={validate}
      onFieldChange={onFieldChange}
      onValuesChange={setValores}
      onSubmit={onSubmit}
      labels={{ submit: submitLabel }}
    />
  );
};

NuevaDireccionEntidad.propTypes = {
  entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  tipo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  fixedTipoLabel: PropTypes.string,
  reConsultar: PropTypes.func,
  editMode: PropTypes.bool,
  direccionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  initialValues: PropTypes.object,
};

export default NuevaDireccionEntidad;
