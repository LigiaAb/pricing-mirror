import { useEffect, useMemo, useState, useRef } from "react";
import PropTypes from "prop-types";
import { Box, CircularProgress } from "@mui/material";
import { areRequiredFieldsFilled, getModifiedFields, unionModificados } from "./validation";
import { DetallesForm, CROPA_DOCS } from "@/pages/Embarques/components/secciones/detalles";
import FormularioAlternativo, { ModernFormHeader } from "@/components/bpm/Formularios/FormularioAlternativo";
import BannerInformativo from "@/pages/Embarques/components/banner";
import { useFetchIncotermsPublicV2 } from "@/hooks/Fetch/useFetchPublic";
import { useFetchIncoterms } from "@/hooks/Bpm";

const buildCatalogOptions = (catalog) =>
  catalog.length > 0 ? catalog.map((t) => ({ value: t.label, label: t.label })) : [];

// Converts a raw value (numeric catalog ID or already a label string) to the label
// that buildCatalogOptions exposes as the option value. Needed because lista-coordinacion
// stores numeric IDs (tipo_id_pago, tipo_id_carga, id_servicio) while the selects use labels.
const resolveToLabel = (val, catalog) => {
  if (val === null || val === undefined || val === "") return "";
  const str = String(val);
  const item = catalog.find((t) => t.label === str || String(t.value) === str);
  return item ? item.label : str;
};

const resolveIncotermValue = (val, catalog) => {
  if (val === null || val === undefined || val === "") return "";
  const str = String(val);
  const byValue = catalog.find((t) => String(t.value) === str);
  if (byValue) return byValue.value;
  const byCodigo = catalog.find((t) => (t.codigo || "").toUpperCase() === str.toUpperCase());
  if (byCodigo) return byCodigo.value;
  const byLabel = catalog.find((t) => t.label === str);
  if (byLabel) return byLabel.value;
  return str;
};

const DetallesPublica = ({
  data = {},
  isLoading = false,
  onValidityChange = null,
  onValuesChange = null,
  onSave = null,
  isSaving = false,
  apiMode = "public",
  tipoPagoCatalog = [],
  tipoCargaCatalog = [],
  serviciosCatalog = [],
  clasificacionCargaCatalog = [],
  showCropaDocs = false,
}) => {
  const readOnly = apiMode === "private";

  const { data: incotermOptions = [] } = apiMode === "private"
    ? useFetchIncoterms()
    : useFetchIncotermsPublicV2();

  const detalleFields = useMemo(() => {
    const fields = [
      { key: "__section_generales__", type: "section", label: "Generales", colSpan: "span 12" },
      { key: "tipoPago", label: "Tipo de pago", type: "select", options: buildCatalogOptions(tipoPagoCatalog), colSpan: "span 4", required: true, readOnly },
      { key: "tipoCarga", label: "Tipo de carga", type: "select", options: buildCatalogOptions(tipoCargaCatalog), colSpan: "span 4", required: true, readOnly },
      { key: "incoterm", label: "Incoterm", type: "select", options: incotermOptions, colSpan: "span 4", required: false, readOnly },
      { key: "servicio", label: "Tipo de servicio", type: "select", options: buildCatalogOptions(serviciosCatalog), colSpan: "span 4", required: true, readOnly },
      { key: "clasificacionCarga", label: "Clasificación de carga", type: "select", options: clasificacionCargaCatalog, colSpan: "span 4", required: false, readOnly },
    ];
    if (showCropaDocs) {
      fields.push(
        { key: "__section_documentos_cropa__", type: "section", label: "seleccione los documentos que elaborará CROPA", colSpan: "span 12" },
        { key: "documentosCropa", label: "", type: "checkboxes", options: CROPA_DOCS.map(({ key, label }) => ({ value: key, label })), colSpan: "span 12", itemsPerRow: 3, required: true, readOnly },
      );
    }
    fields.push(
      { key: "__section_detalles__", type: "section", label: "Detalles", colSpan: "span 12" },
      { key: "peligrosidad", label: "", type: "checkboxes", options: [
        { value: "V", label: "Carga Valiosa" },
        { value: "C", label: "¿Desea le brindemos Cobertura de Seguro?" },
      ], colSpan: "span 12", itemsPerRow: 2, readOnly },
      { key: "instruccionesManejo", label: "Instrucciones especiales de manejo (fragil / refrigerado(grados) / perecedero, otros)", type: "textarea", rows: 3, colSpan: "span 12", readOnly },
    );
    return fields;
  }, [tipoPagoCatalog, tipoCargaCatalog, serviciosCatalog, clasificacionCargaCatalog, incotermOptions, showCropaDocs, readOnly]);

  const [detalleValues, setDetalleValues] = useState({
    tipoPago: "",
    tipoCarga: "",
    incoterm: "",
    servicio: "",
    clasificacionCarga: "",
    peligrosidad: [],
    documentosCropa: [],
    instruccionesManejo: "",
  });

  const buildDetalleFromData = (d) => {
    const rawPeligrosidad = d?.peligrosidad;
    let peligrosidadValue = [];
    if (Array.isArray(rawPeligrosidad)) {
      peligrosidadValue = rawPeligrosidad;
    } else if (rawPeligrosidad === "S" || rawPeligrosidad === true) {
      peligrosidadValue = ["S"];
    }
    if (d?.cargaValiosa === true && !peligrosidadValue.includes("V")) {
      peligrosidadValue = [...peligrosidadValue, "V"];
    }
    if (d?.coberturaSeguro === true && !peligrosidadValue.includes("C")) {
      peligrosidadValue = [...peligrosidadValue, "C"];
    }
    return {
      tipoPago: d?.tipoPago || "",
      tipoCarga: d?.tipoCarga || "",
      incoterm: d?.incoterm || "",
      servicio: d?.servicio || "",
      clasificacionCarga: d?.clasificacionCarga ?? "",
      peligrosidad: peligrosidadValue,
      documentosCropa: Array.isArray(d?.documentosCropa) ? d.documentosCropa : [],
      instruccionesManejo: d?.instruccionesManejo || "",
    };
  };

  const initValues = useMemo(() => {
    const built = buildDetalleFromData(data);
    return {
      ...built,
      tipoPago: resolveToLabel(built.tipoPago, tipoPagoCatalog),
      tipoCarga: resolveToLabel(built.tipoCarga, tipoCargaCatalog),
      incoterm: resolveIncotermValue(built.incoterm, incotermOptions),
      servicio: resolveToLabel(built.servicio, serviciosCatalog),
      clasificacionCarga: built.clasificacionCarga,
    };
  }, [data, tipoPagoCatalog, tipoCargaCatalog, serviciosCatalog, incotermOptions]);

  const lastInitSig = useRef(null);
  useEffect(() => {
    const sig = JSON.stringify(initValues);
    if (lastInitSig.current === sig) return;
    lastInitSig.current = sig;
    setDetalleValues(initValues);
  }, [initValues]);

  const isValid = useMemo(() => areRequiredFieldsFilled(detalleFields, detalleValues), [detalleValues, detalleFields]);

  const cropaSinSeleccion = useMemo(() => {
    return showCropaDocs && (!Array.isArray(detalleValues.documentosCropa) || detalleValues.documentosCropa.length === 0);
  }, [showCropaDocs, detalleValues.documentosCropa]);

  // Comparar campo a campo (no JSON.stringify(objeto completo)): un mismo valor
  // guardado como número (p.ej. clasificacionCarga=122) puede volver del backend
  // como string ("122"), y los checkboxes de `peligrosidad` pueden reordenarse al
  // des/re-marcarlos (["V","C"] vs ["C","V"]). JSON.stringify del objeto completo
  // trata ambos casos como "distinto" para siempre, dejando el indicador en
  // "Sin guardar" aunque el guardado sí haya sido exitoso (mismo bug ya visto y
  // corregido en entidadPublicFormSection.jsx).
  const hasChanges = useMemo(() => {
    return Object.keys(initValues).some((k) => {
      const a = detalleValues[k];
      const b = initValues[k];
      if (Array.isArray(a) || Array.isArray(b)) {
        const arrA = (Array.isArray(a) ? a : []).map(String).sort();
        const arrB = (Array.isArray(b) ? b : []).map(String).sort();
        return JSON.stringify(arrA) !== JSON.stringify(arrB);
      }
      return String(a ?? "") !== String(b ?? "");
    });
  }, [detalleValues, initValues]);

  const lastValiditySig = useRef(null);
  useEffect(() => {
    if (typeof onValidityChange !== "function") return;
    const next = isValid && !hasChanges ? true : isValid ? "pending" : false;
    const sig = `${next}|${hasChanges}`;
    if (lastValiditySig.current === sig) return;
    lastValiditySig.current = sig;
    onValidityChange(next);
  }, [isValid, hasChanges, onValidityChange]);

  const lastReportedDetSig = useRef(null);
  useEffect(() => {
    if (typeof onValuesChange !== "function") return;
    const modificados = unionModificados(data?._modificadosDetalles, getModifiedFields(initValues, detalleValues));
    const sig = JSON.stringify({ v: detalleValues, m: modificados });
    if (lastReportedDetSig.current === sig) return;
    lastReportedDetSig.current = sig;
    onValuesChange({
      detalles: {
        ...detalleValues,
        _modificados: modificados,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detalleValues, initValues, data, onValuesChange]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (readOnly) {
    return (
      <>
        <ModernFormHeader icon="c-informacion" title="Detalles" subtitle="Condiciones y detalles de la carga." />
        <FormularioAlternativo
          fields={detalleFields}
          initialValues={detalleValues}
          showSubmitButton={false}
          hideHeader
          variant="modern"
        />
      </>
    );
  }

  return (
    <>
      <BannerInformativo
        titulo="Aún no se ha guardado"
        mensaje="Complete los datos obligatorios para guardar."
        severidad="info"
        ocultar={isValid && !hasChanges}
      />
      <BannerInformativo
        titulo="Seleccione los documentos que elaborará CROPA"
        mensaje="Debe seleccionar al menos 1 documento."
        severidad="warning"
        ocultar={!cropaSinSeleccion}
      />
      <DetallesForm
        fields={detalleFields}
        initialValues={detalleValues}
        onValuesChange={setDetalleValues}
        onSave={onSave}
        isSaving={isSaving}
        saveDisabled={isSaving || cropaSinSeleccion}
      />
    </>
  );
};

DetallesPublica.propTypes = {
  data: PropTypes.object,
  isLoading: PropTypes.bool,
  onValidityChange: PropTypes.func,
  onValuesChange: PropTypes.func,
  onSave: PropTypes.func,
  isSaving: PropTypes.bool,
  apiMode: PropTypes.oneOf(["public", "private"]),
  tipoPagoCatalog: PropTypes.array,
  tipoCargaCatalog: PropTypes.array,
  serviciosCatalog: PropTypes.array,
  clasificacionCargaCatalog: PropTypes.array,
  showCropaDocs: PropTypes.bool,
};

export default DetallesPublica;
