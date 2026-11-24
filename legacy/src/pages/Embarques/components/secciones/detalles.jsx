import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import {
  Box,
  Button,
  Typography,
} from "@mui/material";
import FormularioAlternativo, { ModernFormHeader } from "@/components/bpm/Formularios/FormularioAlternativo";
import FormularioConGuardar from "./formularioConGuardar";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUpdateCoordinacion,
  useFetchTipos,
  useFetchIncoterms,
  useFetchRelacionTipo,
  useFetchEntidades,
  useCoordinacionData,
} from "@/hooks/Bpm";
import {
  buildCoordPayload,
  getEmbarqueId,
  refreshCoordinationSharedData,
  toNullableNumber,
} from "./payloadUtils";
import BannerInformativo from "../banner";

const CROPA_DOCS = [
  { key: "deprex", label: "Deprex", tipoDocumentoId: 219 },
  { key: "duca_complementaria", label: "DUCA Complementaria", tipoDocumentoId: 263 },
  { key: "duca_definitiva", label: "DUCA Definitiva", tipoDocumentoId: 265 },
  { key: "duca_simplificada", label: "DUCA Simplificada", tipoDocumentoId: 264 },
  { key: "otros", label: "Otros", tipoDocumentoId: 157 },
];

const CropaCheckboxes = ({ checks, onChange, onSave, isSaving }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
      seleccione los documentos que elaborará CROPA
    </Typography>
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
      {CROPA_DOCS.map(({ key, label }) => (
        <Box key={key} sx={{ display: "flex", alignItems: "center", minWidth: 180 }}>
          <input
            type="checkbox"
            id={`cropa-${key}`}
            checked={!!checks[key]}
            onChange={(e) => onChange(key, e.target.checked)}
            style={{ marginRight: 8 }}
          />
          <label htmlFor={`cropa-${key}`}>{label}</label>
        </Box>
      ))}
    </Box>
    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
      <Button variant="contained" size="small" disabled={isSaving} onClick={onSave}>
        {isSaving ? "Guardando..." : "Guardar"}
      </Button>
    </Box>
  </Box>
);

CropaCheckboxes.propTypes = {
  checks: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  isSaving: PropTypes.bool,
};

export const DetallesForm = ({
  fields,
  initialValues,
  onValuesChange,
  onValidityChange,
  validate,
  onSave,
  isSaving,
  saveDisabled,
  mensaje,
  onRefresh,
}) => (
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
    <Box sx={{ flex: 1, minWidth: 300 }}>
      <FormularioConGuardar disabled={saveDisabled} guardando={isSaving} onGuardar={onSave} variant="modern">
        <ModernFormHeader icon="c-informacion" title="Detalles" subtitle="Condiciones y detalles de la carga." />
        <FormularioAlternativo
          mensaje={mensaje}
          initialValues={initialValues}
          fields={fields}
          title="Detalles"
          validate={validate}
          onValidityChange={onValidityChange}
          onValuesChange={onValuesChange}
          onRefresh={onRefresh}
          showSubmitButton={false}
          hideHeader
          variant="modern"
        />
      </FormularioConGuardar>
    </Box>
  </Box>
);

DetallesForm.propTypes = {
  fields: PropTypes.array.isRequired,
  initialValues: PropTypes.object,
  onValuesChange: PropTypes.func,
  onValidityChange: PropTypes.func,
  validate: PropTypes.func,
  onSave: PropTypes.func,
  isSaving: PropTypes.bool,
  saveDisabled: PropTypes.bool,
  mensaje: PropTypes.string,
  onRefresh: PropTypes.func,
};

const DetallesSection = ({ mensaje = "", embarque_id = null, onValidityChange = null, onValuesChange = null, showCropaDocs = true }) => {
  const { cod_usuario } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const { data: embarqueData = null } = useCoordinacionData(embarque_id);

  const { data: tiposPago = [] } = useFetchTipos({ tipo_tabla: "PAGO" });
  const { data: tiposCarga = [] } = useFetchTipos({ tipo_tabla: "TIPO_CARGA" });
  const { data: incotermOptions = [] } = useFetchIncoterms();

  const tipoIdEmbarque = useMemo(
    () =>
      embarqueData?.tipo_id_embarque ??
      embarqueData?.TIPO_ID_EMBARQUE ??
      embarqueData?.tipo_id ??
      null,
    [embarqueData],
  );

  const paisIdDestino = useMemo(
    () =>
      embarqueData?.cod_pais_destino ??
      embarqueData?.pais_id_destino ??
      null,
    [embarqueData],
  );

  const paisIdOrigen = useMemo(
    () =>
      embarqueData?.cod_pais_origen ??
      embarqueData?.pais_id_origen ??
      null,
    [embarqueData],
  );

  const { data: estacionesDsv = [] } = useFetchEntidades(
    { tipo_entidad: "DSV", cod_pais: paisIdDestino, cod_estado: 1 },
    { enabled: Boolean(paisIdDestino) },
  );

  const estacionesDsvOptions = useMemo(
    () => estacionesDsv.map((e) => ({ value: e.entidad_id, label: e.entidad_nombre })),
    [estacionesDsv],
  );

  const { data: tiposServicio = [] } = useFetchRelacionTipo(
    { tipo_tabla: "SERVICIO", cod_tipo_padre: tipoIdEmbarque },
    { enabled: Boolean(tipoIdEmbarque) },
  );

  const cropaInitialChecks = useMemo(() => {
    const existingRaw =
      embarqueData?.json_documentos ??
      embarqueData?.jsonDocumentos ??
      null;

    if (!existingRaw) return {};

    try {
      const parsed = typeof existingRaw === "string" ? JSON.parse(existingRaw) : existingRaw;
      return parsed ?? {};
    } catch {
      return {};
    }
  }, [embarqueData]);

  const cropaInitialValues = useMemo(
    () => CROPA_DOCS.filter(({ key }) => Boolean(cropaInitialChecks?.[key])).map(({ key }) => String(key)),
    [cropaInitialChecks],
  );

  const detalleInitialValues = useMemo(() => {
    const normalize = (v) => {
      if (v === undefined || v === null || v === "") return null;
      return String(v);
    };

    let rawServicio =
      embarqueData?.cod_relacion_tipo ||
      embarqueData?.COD_RELACION_TIPO ||
      embarqueData?.ID_SERVICIO ||
      embarqueData?.id_servicio ||
      embarqueData?.servicio_id ||
      embarqueData?.cod_servicio ||
      embarqueData?.codServicio ||
      null;

    if (
      rawServicio != null &&
      tiposServicio.length > 0 &&
      !tiposServicio.some((opt) => String(opt.value) === String(rawServicio))
    ) {
      const found = tiposServicio.find(
        (opt) =>
          String(opt.cod_tipo) === String(rawServicio) ||
          String(opt.cod_relacion_tipo) === String(rawServicio) ||
          String(opt.value) === String(rawServicio),
      );
      if (found) {
        rawServicio = found.value;
      }
    }

    const peligrosidadOrig =
      embarqueData?.peligrosidad ??
      embarqueData?.PELIGROSIDAD ??
      embarqueData?.cargaPeligrosa ??
      embarqueData?.dangerous ??
      null;

    const cargaValiosaOrig =
      embarqueData?.cargaValiosa ??
      embarqueData?.CARGA_VALIOSA ??
      null;

    const coberturaSeguroOrig =
      embarqueData?.coberturaSeguro ??
      embarqueData?.COBERTURA_SEGURO ??
      embarqueData?.cobertura_seguro ??
      embarqueData?.COBERTURA_SEGURO ??
      null;

    const isPeligroso = /^(s|si|true|1|y|yes)$/i.test(String(peligrosidadOrig ?? "").trim());
    const isValiosa = /^(s|si|true|1|y|yes)$/i.test(String(cargaValiosaOrig ?? "").trim());
    const isCoberturaSeguro = /^(s|si|true|1|y|yes)$/i.test(String(coberturaSeguroOrig ?? "").trim());

    const peligrosidadInicial = [];
    if (isPeligroso) peligrosidadInicial.push("S");
    if (isValiosa) peligrosidadInicial.push("V");
    if (isCoberturaSeguro) peligrosidadInicial.push("C");

    return {
      tipoPago: normalize(embarqueData?.tipo_id_pago ?? null),
      tipoCarga: normalize(
        embarqueData?.cod_tipo_carga ||
        embarqueData?.COD_TIPO_CARGA ||
        embarqueData?.tipo_id_carga ||
        embarqueData?.TIPO_ID_CARGA ||
        embarqueData?.tipoCarga ||
        embarqueData?.tipoIdCarga ||
        null,
      ),
      servicio: normalize(rawServicio),
      incoterm: normalize(
        embarqueData?.cod_incoterm ||
        embarqueData?.COD_INCOTERM ||
        embarqueData?.incoterm_id ||
        embarqueData?.INCOTERM_ID ||
        embarqueData?.incoterm ||
        embarqueData?.INCOTERM ||
        null,
      ),
      peligrosidad: peligrosidadInicial,
      instruccionesManejo: normalize(embarqueData?.observaciones ?? embarqueData?.observacion ?? ""),
      estacionDsv: normalize(
        embarqueData?.entidad_id_estacion ??
        embarqueData?.ENTIDAD_ID_ESTACION ??
        embarqueData?.estacion_dsv_id ??
        embarqueData?.ESTACION_DSV_ID ??
        embarqueData?.estacion_dsv ??
        embarqueData?.ESTACION_DSV ??
        null,
      ),
      documentosCropa: cropaInitialValues,
    };
  }, [embarqueData, tiposServicio, cropaInitialValues]);

  const detalleFields = useMemo(
    () => [
      { key: "secGenerales", label: "Generales", type: "section" },
      { key: "tipoPago", label: "Tipo de pago", type: "select", options: tiposPago, colSpan: "span 4", required: true },
      { key: "tipoCarga", label: "Tipo de carga", type: "select", options: tiposCarga, colSpan: "span 4", required: true },
      { key: "incoterm", label: "Incoterm", type: "select", options: incotermOptions, colSpan: "span 4", required: true },
      { key: "servicio", label: "Tipo de servicio", type: "select", options: tiposServicio, colSpan: "span 4", required: true },
      { key: "estacionDsv", label: "Estacion DSV", type: "select", options: estacionesDsvOptions, colSpan: "span 4", required: true },
      ...(showCropaDocs ? [
        { key: "secDocumentosCropa", label: "seleccione los documentos que elaborará CROPA", type: "section" },
        { key: "documentosCropa", label: "", type: "checkboxes", options: CROPA_DOCS.map(({ key, label }) => ({ value: key, label })), colSpan: "span 12", itemsPerRow: 3 },
      ] : []),
      { key: "secDetalles", label: "Detalles", type: "section" },
      { key: "peligrosidad", label: "", type: "checkboxes", options: [{ value: "S", label: "Carga Peligrosa" }, { value: "V", label: "Carga Valiosa" }, { value: "C", label: "Cobertura de Seguro" }], colSpan: "span 12", itemsPerRow: 3 },
      { key: "instruccionesManejo", label: "Instrucciones especiales de manejo (fragil / refrigerado(grados) / perecedero, otros)", type: "textarea", rows: 3, colSpan: "span 12" },
    ],
    [tiposPago, tiposCarga, incotermOptions, tiposServicio, estacionesDsvOptions, showCropaDocs],
  );

  const detallesFormValuesRef = useRef(detalleInitialValues);
  const [parentNotifyValues, setParentNotifyValues] = useState(detalleInitialValues);
  const notifyTimerRef = useRef(null);

  const handleFormValuesChange = useCallback((vals) => {
    detallesFormValuesRef.current = vals;
    clearTimeout(notifyTimerRef.current);
    notifyTimerRef.current = setTimeout(() => setParentNotifyValues(vals), 300);
  }, []);

  const [detallesValid, setDetallesValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [generalMessage, setGeneralMessage] = useState(null);

  useEffect(() => {
    detallesFormValuesRef.current = detalleInitialValues;
    setParentNotifyValues(detalleInitialValues);
  }, [detalleInitialValues]);

  const lastReportedDetSig = useRef(null);
  useEffect(() => {
    if (typeof onValuesChange !== "function") return;

    const withLabels = { ...parentNotifyValues };

    const lookup = (opts, val) => {
      const normalizedOpts = opts || [];
      if (val === undefined || val === null || val === "") return val;
      const found = normalizedOpts.find((o) => String(o.value) === String(val));
      return found ? found.label : val;
    };

    withLabels.tipoPagoLabel = lookup(tiposPago, parentNotifyValues.tipoPago);
    withLabels.tipoCargaLabel = lookup(tiposCarga, parentNotifyValues.tipoCarga);
    withLabels.incotermLabel = lookup(incotermOptions, parentNotifyValues.incoterm);
    withLabels.servicioLabel = lookup(tiposServicio, parentNotifyValues.servicio);
    withLabels.estacionDsvLabel = lookup(estacionesDsvOptions, parentNotifyValues.estacionDsv);

    const peligrosidadBool =
      Array.isArray(parentNotifyValues.peligrosidad) &&
      parentNotifyValues.peligrosidad.includes("S");
    const cargaValiosaBool =
      Array.isArray(parentNotifyValues.peligrosidad) &&
      parentNotifyValues.peligrosidad.includes("V");
    const coberturaSeguroBool =
      Array.isArray(parentNotifyValues.peligrosidad) &&
      parentNotifyValues.peligrosidad.includes("C");

    withLabels.peligrosidad = peligrosidadBool;
    withLabels.peligrosidadLabel = peligrosidadBool ? "Sí" : "No";
    withLabels.cargaValiosa = cargaValiosaBool;
    withLabels.cargaValiosaLabel = cargaValiosaBool ? "Sí" : "No";
    withLabels.coberturaSeguro = coberturaSeguroBool;
    withLabels.coberturaSeguroLabel = coberturaSeguroBool ? "Sí" : "No";

    const documentosCropaSeleccionados = Array.isArray(parentNotifyValues.documentosCropa)
      ? parentNotifyValues.documentosCropa
      : [];
    withLabels.documentosCropa = CROPA_DOCS.reduce((acc, { key }) => {
      acc[key] = documentosCropaSeleccionados.includes(String(key));
      return acc;
    }, {});
    withLabels.documentosCropaLabel = CROPA_DOCS
      .filter(({ key }) => documentosCropaSeleccionados.includes(String(key)))
      .map(({ label }) => label)
      .join(", ");

    const sig = JSON.stringify(withLabels);
    if (lastReportedDetSig.current === sig) return;
    lastReportedDetSig.current = sig;
    onValuesChange({ detalles: withLabels });
  }, [parentNotifyValues, onValuesChange, tiposPago, tiposCarga, incotermOptions, tiposServicio, estacionesDsvOptions]);

  // Saved validity: check that required fields exist in embarqueData (the persisted source)
  const savedDetallesValid = Boolean(
    detalleInitialValues.tipoPago != null && detalleInitialValues.tipoPago !== "" &&
    detalleInitialValues.tipoCarga != null && detalleInitialValues.tipoCarga !== "" &&
    detalleInitialValues.incoterm != null && detalleInitialValues.incoterm !== "" &&
    detalleInitialValues.servicio != null && detalleInitialValues.servicio !== "" &&
    detalleInitialValues.estacionDsv != null && detalleInitialValues.estacionDsv !== "",
  );

  useEffect(() => {
    if (typeof onValidityChange === "function") {
      if (savedDetallesValid) {
        onValidityChange(true);
      } else if (detallesValid) {
        // Local form is complete but not yet saved
        onValidityChange("pending");
      } else {
        onValidityChange(false);
      }
    }
  }, [savedDetallesValid, detallesValid, onValidityChange]);

  const handleRefresh = () => {
    setGeneralMessage("Recargando datos...");
    detallesFormValuesRef.current = detalleInitialValues;
    setParentNotifyValues(detalleInitialValues);

    // Opciones de los selectores del formulario
    queryClient.invalidateQueries({ queryKey: ["lista-tipo", { tipo_tabla: "PAGO" }] });
    queryClient.invalidateQueries({ queryKey: ["lista-tipo", { tipo_tabla: "TIPO_CARGA" }] });
    queryClient.invalidateQueries({ queryKey: ["incoterms", {}] });
    if (tipoIdEmbarque) {
      queryClient.invalidateQueries({
        queryKey: ["relacion-tipo", { tipo_tabla: "SERVICIO", cod_tipo_padre: tipoIdEmbarque }],
      });
    }
    if (paisIdDestino) {
      queryClient.invalidateQueries({
        queryKey: ["entidades", { tipo_entidad: "DSV", cod_pais: paisIdDestino, cod_estado: 1 }],
      });
    }

    // Datos del embarque que alimentan los valores actuales del formulario
    const embarqueId = getEmbarqueId(embarqueData);
    if (embarqueId) {
      queryClient.invalidateQueries({ queryKey: ["embarque-info", String(embarqueId)] });
    }
    // Invalidar y reforzar refetch de coordinaciones (prefijo parcial para hacer match
    // independientemente de los parámetros que usó el padre al llamar al hook)
    queryClient.invalidateQueries({ queryKey: ["coordinaciones"] });
    queryClient.refetchQueries({ queryKey: ["coordinaciones"] });
  };

  const validateDetalles = useCallback((vals) =>
    vals?.tipoPago != null && vals?.tipoPago !== "" &&
    vals?.tipoCarga != null && vals?.tipoCarga !== "" &&
    vals?.incoterm != null && vals?.incoterm !== "" &&
    vals?.servicio != null && vals?.servicio !== "" &&
    vals?.estacionDsv != null && vals?.estacionDsv !== "",
    []);

  const { mutateAsync: actualizarCoordinacion } = useUpdateCoordinacion();

  const estadoFormulario = useMemo(() => {
    if (savedDetallesValid) return null;
    if (detallesValid) {
      return {
        severidad: "info",
        titulo: "Pendiente de guardar",
        mensaje: "Los detalles estan completos, pero aun no se han guardado.",
      };
    }
    return {
      severidad: "warning",
      titulo: "Faltan completar campos",
      mensaje: "Complete los campos obligatorios de detalles para continuar.",
    };
  }, [detallesValid, savedDetallesValid]);

  const handleGuardar = async () => {
    setGeneralMessage(null);
    if (saving) return;

    if (!detallesValid) {
      setGeneralMessage("Complete el formulario de detalles antes de guardar.");
      return;
    }

    if (!embarqueData) {
      setGeneralMessage("Datos de embarque aún no cargados");
      return;
    }

    const embarqueId = getEmbarqueId(embarqueData);
    if (!embarqueId) return;

    const vals = detallesFormValuesRef.current;
    const peligrosidadBoolean =
      Array.isArray(vals.peligrosidad) &&
      vals.peligrosidad.includes("S");
    const cargaValiosaBoolean =
      Array.isArray(vals.peligrosidad) &&
      vals.peligrosidad.includes("V");
    const coberturaSeguroBoolean =
      Array.isArray(vals.peligrosidad) &&
      vals.peligrosidad.includes("C");

    let jsonOpcionales = null;
    const existingJsonRaw =
      embarqueData?.json_datos_opcionales ??
      embarqueData?.jsonDatosOpcionales ??
      embarqueData?.json_atributos_opcionales ??
      embarqueData?.jsonAtributosOpcionales ??
      null;

    if (existingJsonRaw) {
      try {
        jsonOpcionales = typeof existingJsonRaw === "string" ? JSON.parse(existingJsonRaw) : existingJsonRaw;
      } catch (e) {
        console.warn("No se pudo parsear json_datos_opcionales existente", e);
        jsonOpcionales = null;
      }
    }

    const mergedJsonOpcionales = jsonOpcionales
      ? {
        ...jsonOpcionales,
        cargaValiosa: cargaValiosaBoolean,
        coberturaSeguro: coberturaSeguroBoolean,
      }
      : {
        cargaValiosa: cargaValiosaBoolean,
        coberturaSeguro: coberturaSeguroBoolean,
      };

    const documentosCropaMap = CROPA_DOCS.reduce((acc, { key }) => {
      acc[key] = Array.isArray(vals.documentosCropa) && vals.documentosCropa.includes(String(key));
      return acc;
    }, {});

    const combinedVals = {
      cod_tipo_pago: toNullableNumber(vals.tipoPago),
      cod_tipo_carga: toNullableNumber(vals.tipoCarga),
      incoterm_id: toNullableNumber(vals.incoterm),
      cod_servicio: toNullableNumber(vals.servicio),
      peligrosidad: peligrosidadBoolean,
      observacion: vals.instruccionesManejo ?? "",
      estacion_dsv_id: toNullableNumber(vals.estacionDsv),
      cod_entidad_estacion: toNullableNumber(vals.estacionDsv),
      entidad_id_estacion: toNullableNumber(vals.estacionDsv),
      json_datos_opcionales: mergedJsonOpcionales,
      json_documentos: JSON.stringify(documentosCropaMap),
    };

    const finalPayload = buildCoordPayload(embarqueData, combinedVals, cod_usuario);

    try {
      setSaving(true);
      setSaveMessage(null);
      await actualizarCoordinacion(finalPayload);

      await refreshCoordinationSharedData(queryClient, embarqueId, combinedVals);
      setSaveMessage("Datos guardados correctamente");
    } catch (err) {
      console.error("Error al actualizar detalles:", err);
      setSaveMessage("Error guardando información");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ position: "relative", minHeight: "80%" }}>
      {estadoFormulario && (
        <BannerInformativo
          severidad={estadoFormulario.severidad}
          titulo={estadoFormulario.titulo}
          mensaje={estadoFormulario.mensaje}
        />
      )}

      <FormularioConGuardar disabled={!detallesValid} guardando={saving} onGuardar={handleGuardar} variant="modern">
        <ModernFormHeader icon="c-informacion" title="Detalles" subtitle="Condiciones y detalles de la carga." />
        <FormularioAlternativo
          mensaje={mensaje}
          initialValues={detalleInitialValues}
          fields={detalleFields}
          title="Detalles"
          validate={validateDetalles}
          onValidityChange={setDetallesValid}
          hideHeader
          onValuesChange={handleFormValuesChange}
          onRefresh={handleRefresh}
          showSubmitButton={false}
          variant="modern"
        />
      </FormularioConGuardar>

      <BannerInformativo
        ocultar={!saveMessage}
        severidad={saveMessage?.includes("Error") ? "error" : "success"}
        mensaje={saveMessage}
        sx={{ mt: 1, mb: 0 }}
      />
      <BannerInformativo
        ocultar={!generalMessage}
        severidad="warning"
        mensaje={generalMessage}
        sx={{ mt: 1, mb: 0 }}
      />
    </Box>
  );
};

DetallesSection.propTypes = {
  mensaje: PropTypes.string,
  embarque_id: PropTypes.number,
  onValidityChange: PropTypes.func,
  onValuesChange: PropTypes.func,
  showCropaDocs: PropTypes.bool,
};

export { CROPA_DOCS, CropaCheckboxes };
export default DetallesSection;
