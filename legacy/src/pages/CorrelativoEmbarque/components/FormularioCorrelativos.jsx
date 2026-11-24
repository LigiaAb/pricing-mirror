import { useState, useMemo, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useQueryClient } from "@tanstack/react-query";
import { Box, Typography, Button, Paper, Chip, Icon, Stack } from "@mui/material";
import FormularioAlternativo from "../../../components/bpm/Formularios/FormularioAlternativo";
import LoaderComponent from "../../../components/Loader/LoaderComponent";
import { useFetchCentrosCosto, useFetchEntidadConfiguracion, useFetchEmpresas, useCreateCorrelativoGuiasXCriterio } from "../../../hooks/Bpm";
import { useFetchCodCcEmpresa } from "../../../hooks/Fetch/useFetchEmbarques";
import { getRefTipoSecuenciaMaster } from "../utils/getRefTipoSecuencia";
import { toIsoDate } from "../utils/date";
import { TIPO_OPTIONS, filterEntidadesByTipo } from "../utils/filterEntidadesByTipo";
import ListaGuiasComponent from "./ListaGuiasComponent";
import PreviewCorrelativos from "./FormularioCorrelativos/previewCorrelativos";

const MAX_SERIE_LENGTH = 5;
const NUMERO_PAD_LENGTH = 6;

const formatGuiaLabel = (serie, numeroGuia) => {
  const serieTrim = String(serie ?? "").trim();
  const guiaTrim = String(numeroGuia ?? "").trim();
  return serieTrim ? `${serieTrim}-${guiaTrim}` : guiaTrim;
};

const PreviewGuias = ({ serie, listaGuias = [], pendingGuia, onEliminarGuia }) => {
  const hasGuias = Array.isArray(listaGuias) && listaGuias.length > 0;
  const pendingGuiaTrim = String(pendingGuia ?? "").trim();
  const hasPendingGuia = pendingGuiaTrim.length > 0;
  const pendingDuplicate = listaGuias.some((guia) => String(guia.no_guia ?? "") === pendingGuiaTrim);

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 2,
        mb: 2,
        p: 2.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: (theme) => theme.palette.divider,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} mb={2}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 700,
            color: (theme) => (theme.palette.mode === "dark" ? theme.palette.primary.light : theme.palette.primary.main),
          }}
        >
          Vista Previa
        </Typography>
      </Stack>

      {hasGuias || hasPendingGuia ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {listaGuias.map((guia) => (
            <Chip
              key={guia.no_guia}
              label={formatGuiaLabel(serie, guia.no_guia)}
              onDelete={() => onEliminarGuia?.(guia.no_guia)}
              deleteIcon={<Icon className="c-eliminar" sx={{ color: (theme) => theme.palette.error.main, fontSize: "16px !important" }} />}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ borderRadius: 1 }}
            />
          ))}
          {hasPendingGuia && !pendingDuplicate && (
            <Chip key="pending" label={formatGuiaLabel(serie, pendingGuiaTrim)} color="secondary" variant="outlined" size="small" sx={{ borderRadius: 1, opacity: 0.75 }} />
          )}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No hay guías agregadas. Ingrese al menos una guía para continuar.
        </Typography>
      )}
    </Paper>
  );
};

PreviewGuias.propTypes = {
  serie: PropTypes.string,
  listaGuias: PropTypes.arrayOf(PropTypes.shape({ no_guia: PropTypes.string })),
  pendingGuia: PropTypes.string,
  onEliminarGuia: PropTypes.func,
};

const toNumber = (v) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const normalizeFecha = (raw) => {
  const iso = toIsoDate(raw);
  if (iso) return iso;
  const alt = raw?.toDate?.() ?? raw?.$d ?? raw;
  return toIsoDate(alt) ?? null;
};

const DEFAULT_REQUIRED_FIELDS = [
  { id: "cod_empresa", label: "Empresa" },
  { id: "cod_cc", label: "Centro de Costo" },
  { id: "cod_entidad", label: "Entidad" },
  { id: "titulo_guia", label: "Título Guía" },
  { id: "correlativo_serie", label: "Serie" },
  { id: "correlativo_inicial", label: "Correlativo Inicial" },
  { id: "correlativo_final", label: "Correlativo Final" },
  { id: "cantidad_saltos", label: "Cantidad Saltos" },
];

const FormularioCorrelativos = ({
  onCancel = () => {},
  onSuccess = () => {},
  onCorrelativoCreado,
  onMostrarSecuencias,
  showFields = {
    cod_empresa: true,
    cod_cc: true,
    tipo: true,
    cod_entidad: true,
    titulo_guia: true,
    correlativo_serie: true,
    correlativo_inicial: true,
    correlativo_final: true,
    cantidad_saltos: true,
    fecha_vence: true,
  },
  defaultValues = {},
  enableListaGuias = false,
  maxGuias = undefined,
  readonlyFields = [],
  refTipoSecuencia = undefined,
  getRefTipoSecuenciaFn = getRefTipoSecuenciaMaster,
  submitButtonText = "Guardar",
  cancelButtonText = "Cancelar",
  cancelButtonDisabled = true,
  hideCancel = false,
  createOnServer = true,
  submitButtonPosition = "form",
  title,
  wrapperComponent: WrapperComponent = Box,
  wrapperProps = { sx: { p: 2 } },
  listaGuiasWrapperProps = {},
  showPreview = true,
  requiredFields = DEFAULT_REQUIRED_FIELDS.map((f) => f.id),
}) => {
  const { mutateAsync: crearCorrelativo, isLoading: isCreating } = useCreateCorrelativoGuiasXCriterio();
  const { data: centrosCosto = [] } = useFetchCentrosCosto();
  const { data: empresas = [] } = useFetchEmpresas();
  const { data: entidadesConfiguracion = [] } = useFetchEntidadConfiguracion();

  const queryClient = useQueryClient();
  const { cod_cc: currentCodCc, cod_empresa: currentCodEmpresa } = useFetchCodCcEmpresa();

  const initialFormState = {
    cod_cc: defaultValues.cod_cc ?? currentCodCc ?? null,
    cod_empresa: defaultValues.cod_empresa ?? currentCodEmpresa ?? null,
    tipo: null,
    titulo_guia: "",
    correlativo_inicial: "",
    correlativo_final: "",
    correlativo_serie: "",
    cantidad_saltos: 1,
    fecha_vence: null,
    cod_entidad: null,
    aplicaReplicaAnual: false,
    ...defaultValues,
  };

  const [formState, setFormState] = useState(initialFormState);

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      cod_empresa: prev.cod_empresa ?? currentCodEmpresa ?? null,
      cod_cc: prev.cod_cc ?? currentCodCc ?? null,
    }));
  }, [currentCodEmpresa, currentCodCc]);

  const [listaGuias, setListaGuias] = useState([]);
  const [pendingNumeroGuia, setPendingNumeroGuia] = useState("");
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);

  const handleAgregarGuia = (numero) => {
    const numeroLimpio = String(numero ?? "").trim();
    if (!numeroLimpio) {
      setError("Ingrese un número de guía válido");
      return;
    }
    if (typeof maxGuias === "number" && listaGuias.length >= maxGuias) {
      setError(`Se alcanzó el máximo de ${maxGuias} guía${maxGuias === 1 ? "" : "s"}`);
      return;
    }
    if (listaGuias.some((g) => g.no_guia === numeroLimpio)) {
      setError("Esta guía ya fue agregada");
      return;
    }
    setListaGuias((prev) => [...prev, { no_guia: numeroLimpio }]);
    setError(null);
  };

  const handleLimpiarGuias = () => {
    setListaGuias([]);
    setError(null);
  };

  const handleEliminarGuia = (noGuia) => setListaGuias((prev) => prev.filter((g) => g.no_guia !== noGuia));

  const getMissingRequiredFields = useCallback(
    (state) => {
      const requiredFieldsList = DEFAULT_REQUIRED_FIELDS.filter((f) => requiredFields.includes(f.id)).map((f) => ({ ...f, visible: showFields[f.id] }));

      const requiredFieldsToCheck = requiredFieldsList.filter((f) => f.visible !== false);

      const missingFields = requiredFieldsToCheck.filter(({ id }) => {
        const value = state[id];
        if (value == null) return true;
        if (typeof value === "string" && value.trim() === "") return true;
        return false;
      });

      if (enableListaGuias && listaGuias.length === 0) {
        missingFields.push({ id: "lista_guias", label: "Guías", visible: true });
      }

      return missingFields;
    },
    [requiredFields, showFields, enableListaGuias, listaGuias],
  );

  const missingRequiredFields = useMemo(() => getMissingRequiredFields(formState), [formState, getMissingRequiredFields]);
  const hasMissingRequiredFields = missingRequiredFields.length > 0;

  const validateTipo = (state) => {
    if (showFields.tipo === false || !state.tipo) return;
    const tipoValue = String(state.tipo?.value ?? state.tipo).toUpperCase();
    const allowedTipos = TIPO_OPTIONS.map((t) => t.value.toUpperCase());
    if (!allowedTipos.includes(tipoValue)) {
      throw new Error("Tipo inválido. Seleccione AEREO, TERRESTRE o MARITIMO.");
    }
  };

  const parseAndValidateNumbers = (state) => {
    const correlativoInicial = toNumber(state.correlativo_inicial);
    const correlativoFinal = toNumber(state.correlativo_final);
    const cantidadSaltos = toNumber(state.cantidad_saltos);

    if (showFields.correlativo_inicial && showFields.correlativo_final && showFields.cantidad_saltos) {
      if (correlativoInicial == null || correlativoFinal == null || cantidadSaltos == null) {
        throw new Error("Asegúrese de ingresar valores numéricos válidos en correlativos y cantidad de saltos.");
      }
      if (correlativoFinal < correlativoInicial) {
        throw new Error("El correlativo final debe ser mayor o igual que el inicial.");
      }
      if (!Number.isInteger(cantidadSaltos) || cantidadSaltos <= 0) {
        throw new Error("La cantidad de saltos debe ser un entero mayor que 0.");
      }
    }

    if (enableListaGuias && listaGuias.length === 0) {
      throw new Error("Debe agregar al menos una guía.");
    }
    return { correlativoInicial, correlativoFinal, cantidadSaltos };
  };

  const validateSerieLength = (state) => {
    if (state.correlativo_serie && String(state.correlativo_serie).trim().length > MAX_SERIE_LENGTH) {
      throw new Error(`La serie debe tener máximo ${MAX_SERIE_LENGTH} caracteres.`);
    }
  };

  const buildSecuencia = (inicio, final, salto, serie) => {
    const secuencia = [];
    for (let i = inicio; i <= final; i += salto) {
      secuencia.push({
        numeroGuia: `${serie}-${String(i).padStart(NUMERO_PAD_LENGTH, "0")}`,
        numero: i,
        estado: "Disponible",
        estadoDesc: "Disponible",
      });
    }
    return secuencia;
  };

  const buildCorrelativoLocal = (state, numbers, secuencia) => {
    const empresaLabel = empresasOptions.find((e) => e.value === (state.cod_empresa?.value ?? state.cod_empresa))?.label || "";
    const ccLabel = centrosCostoOptions.find((c) => c.value === (state.cod_cc?.value ?? state.cod_cc))?.label || "";
    const tipoVal = state.tipo?.value ?? state.tipo ?? getRefTipoSecuenciaFn(state.tipo);
    const tipoDescripcion = String(tipoVal ?? "").toUpperCase();
    const correlativoCodigo = `${String(state.correlativo_serie ?? "")
      .trim()
      .slice(0, MAX_SERIE_LENGTH)}-${String(numbers.correlativoInicial).padStart(NUMERO_PAD_LENGTH, "0")}`;
    return {
      correlativoId: Date.now(),
      correlativoCodigo,
      correlativoTabla: correlativoCodigo,
      correlativoSerie: String(state.correlativo_serie ?? "")
        .trim()
        .slice(0, MAX_SERIE_LENGTH),
      entidadNombre: state.cod_entidad?.label || state.cod_entidad || "",
      empresaNombre: empresaLabel,
      cencodNombre: ccLabel,
      tipo: tipoVal,
      tipoDescripcion,
      correlativoInicial: numbers.correlativoInicial,
      correlativoActual: numbers.correlativoInicial,
      correlativoFinal: numbers.correlativoFinal,
      correlativoSalto: numbers.cantidadSaltos,
      correlativoFechaVencimiento: normalizeFecha(state.fecha_vence),
      estadoDescripcion: "Activo",
      disponibles: secuencia.length,
      detalles: secuencia,
    };
  };

  const buildPayload = (state, numbers) => {
    const listaGuiasPayload = enableListaGuias ? listaGuias.map((g) => ({ no_guia: String(g.no_guia ?? "").trim() })).filter((g) => g.no_guia) : [];

    return {
      ref_tipo_secuencia: refTipoSecuencia ?? getRefTipoSecuenciaFn(state.tipo) ?? "MAWB",
      cod_cc: toNumber(state.cod_cc?.value ?? state.cod_cc),
      cod_empresa: toNumber(state.cod_empresa?.value ?? state.cod_empresa),
      titulo_guia: String(state.titulo_guia ?? "").trim(),
      tipo: state.tipo?.value ?? state.tipo,
      correlativo_serie: String(state.correlativo_serie ?? "")
        .trim()
        .slice(0, MAX_SERIE_LENGTH),
      correlativo_inicial: numbers.correlativoInicial,
      correlativo_final: numbers.correlativoFinal,
      cantidad_saltos: numbers.cantidadSaltos,
      fecha_vence: normalizeFecha(state.fecha_vence),
      cod_entidad: toNumber(state.cod_entidad?.value ?? state.cod_entidad),
      aplica_replica_anual: state.aplicaReplicaAnual ? "S" : "N",
      ...(listaGuiasPayload.length > 0 ? { lista_guias: listaGuiasPayload } : {}),
    };
  };

  const handleSubmit = async () => {
    // Pre-check required fields so the button can be safely disabled and avoid throwing errors.
    if (hasMissingRequiredFields) {
      const [firstMissing] = missingRequiredFields;
      setError(`El campo ${firstMissing.label} es obligatorio.`);
      setErrorDetail(null);
      return;
    }

    try {
      setError(null);
      setErrorDetail(null);

      validateTipo(formState);
      validateSerieLength(formState);
      const { correlativoInicial, correlativoFinal, cantidadSaltos } = parseAndValidateNumbers(formState);
      const serie = String(formState.correlativo_serie ?? "")
        .trim()
        .slice(0, MAX_SERIE_LENGTH);

      let correlativoLocal = null;
      let secuencia = null;

      if (onCorrelativoCreado || onMostrarSecuencias) {
        secuencia = buildSecuencia(correlativoInicial, correlativoFinal, cantidadSaltos, serie);
        correlativoLocal = buildCorrelativoLocal(formState, { correlativoInicial, correlativoFinal, cantidadSaltos }, secuencia);
      }

      if (createOnServer) {
        const payload = buildPayload(formState, { correlativoInicial, correlativoFinal, cantidadSaltos });
        const serverResponse = await crearCorrelativo(payload);
        const responseData = serverResponse?.data ?? serverResponse;
        const correlativoIdFromServer = responseData?.correlativo_id ?? responseData?.correlativoId ?? responseData?.data?.correlativo_id ?? responseData?.data?.correlativoId;

        // Si el servidor devuelve el correlativo creado, usarlo; sino usar el local
        if (correlativoIdFromServer && correlativoLocal) {
          correlativoLocal = {
            ...correlativoLocal,
            ...responseData,
            correlativoId: correlativoIdFromServer,
          };
        }
      }

      // Llamar callbacks DESPUÉS de éxito en servidor
      if (correlativoLocal) {
        onCorrelativoCreado?.(correlativoLocal);
        try {
          globalThis?.dispatchEvent?.(new CustomEvent("correlativo:created", { detail: correlativoLocal }));
        } catch (e) {
          console.warn("Could not dispatch correlativo:created event", e);
        }
      }
      if (secuencia) onMostrarSecuencias?.(secuencia);

      if (enableListaGuias) setListaGuias([]);

      setFormState(initialFormState);
      onSuccess(correlativoLocal);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al crear correlativo");
      const detail = err?.response?.data ?? err?.stack ?? JSON.stringify(err, Object.getOwnPropertyNames(err));
      setErrorDetail(detail);
    }
  };

  const centrosCostoOptions = useMemo(() => {
    const selectedEmpresaValue = formState.cod_empresa?.value ?? formState.cod_empresa;
    if (!selectedEmpresaValue) return [];
    const selectedEmpresaValueStr = String(selectedEmpresaValue);
    return centrosCosto
      .filter((cc) => String(cc.cod_empresa_cc ?? cc.codEmpresaCc ?? cc.cod_empresa) === selectedEmpresaValueStr)
      .map((cc) => ({
        value: cc.cod_cc ?? cc.codCc ?? cc.value,
        label: String(cc.nombre_cc ?? cc.nombreCc ?? cc.label ?? cc.cod_cc ?? cc.codCc ?? cc.value ?? "").trim(),
        empresa: cc.cod_empresa_cc ?? cc.codEmpresaCc ?? cc.cod_empresa,
      }))
      .filter((option) => option.value !== undefined && option.value !== null && String(option.value).trim() !== "" && option.label !== "");
  }, [centrosCosto, formState.cod_empresa]);

  const empresasOptions = useMemo(() => empresas.map((e) => ({ value: e.cod_empresa, label: e.nombre_emp })), [empresas]);

  const aerolineasOptions = useMemo(() => filterEntidadesByTipo(entidadesConfiguracion, formState.tipo), [entidadesConfiguracion, formState.tipo]);

  // Limpiar centro de costo cuando cambia la empresa
  useEffect(() => {
    const selectedEmpresaValue = formState.cod_empresa?.value ?? formState.cod_empresa;
    if (!selectedEmpresaValue) {
      if (formState.cod_cc) setFormState((s) => ({ ...s, cod_cc: null }));
      return;
    }

    const selectedEmpresaValueStr = String(selectedEmpresaValue);
    const currentCenterValue = formState.cod_cc?.value ?? formState.cod_cc;
    if (currentCenterValue) {
      const center = centrosCosto.find((c) => String(c.cod_cc ?? c.value ?? c.codCc) === String(currentCenterValue));
      if (center && String(center.cod_empresa_cc ?? center.codEmpresaCc ?? center.cod_empresa) !== selectedEmpresaValueStr) {
        setFormState((s) => ({ ...s, cod_cc: null }));
      }
    }
  }, [formState.cod_empresa, formState.cod_cc, centrosCosto]);

  const handleRefreshForm = async () => {
    try {
      setError(null);
      setErrorDetail(null);
      if (enableListaGuias) {
        setListaGuias([]);
        setPendingNumeroGuia("");
      }
      setFormState(initialFormState);
      await queryClient.invalidateQueries({ queryKey: ["empresas"], exact: true, refetchActive: true });
      await queryClient.invalidateQueries({ queryKey: ["centros-costo"], exact: true, refetchActive: true });
      await queryClient.invalidateQueries({ queryKey: ["entidad-configuracion"], exact: true, refetchActive: true });
    } catch (err) {
      console.warn("Error al invalidar queries del formulario:", err);
    }
  };

  // Limpiar la línea (entidad) cuando cambia el tipo y la seleccionada no aplica
  useEffect(() => {
    const selectedValue = formState.cod_entidad?.value ?? formState.cod_entidad;
    if (!selectedValue) return;
    const isValid = aerolineasOptions.some((opt) => String(opt.value) === String(selectedValue));
    if (!isValid) setFormState((s) => ({ ...s, cod_entidad: null }));
  }, [formState.tipo, aerolineasOptions, formState.cod_entidad]);

  if (isCreating && createOnServer) return <LoaderComponent texto="Guardando..." />;

  const allInputs = [
    {
      tipo: "select",
      id: "cod_empresa",
      label: "Empresa",
      val: formState.cod_empresa,
      requerido: requiredFields.includes("cod_empresa"),
      options: empresasOptions,
      readonly: readonlyFields.includes("cod_empresa"),
      size: 6,
      colSpan: "span 6",
    },
    {
      tipo: "select",
      id: "cod_cc",
      label: "Centro de Costo",
      val: formState.cod_cc,
      requerido: requiredFields.includes("cod_cc"),
      options: centrosCostoOptions,
      readonly: readonlyFields.includes("cod_cc"),
      disabled: !formState.cod_empresa,
      size: 6,
      colSpan: "span 6",
    },
    { tipo: "select", id: "tipo", label: "Tipo", val: formState.tipo, options: TIPO_OPTIONS, requerido: requiredFields.includes("tipo"), readonly: readonlyFields.includes("tipo") },
    { tipo: "select", id: "cod_entidad", label: "Transporte", val: formState.cod_entidad, options: aerolineasOptions, requerido: requiredFields.includes("cod_entidad"), disabled: !formState.tipo },
    { tipo: "text", id: "titulo_guia", label: "Título Guía", val: formState.titulo_guia, requerido: requiredFields.includes("titulo_guia"), max: 25, size: 6, colSpan: "span 6" },
    {
      tipo: "text",
      id: "correlativo_serie",
      label: "Serie",
      val: formState.correlativo_serie,
      requerido: requiredFields.includes("correlativo_serie"),
      max: MAX_SERIE_LENGTH,
      size: 6,
      colSpan: "span 6",
    },
    {
      tipo: "number",
      id: "correlativo_inicial",
      label: "Correlativo Inicial",
      val: formState.correlativo_inicial,
      requerido: requiredFields.includes("correlativo_inicial"),
      size: 6,
      colSpan: "span 6",
    },
    { tipo: "number", id: "correlativo_final", label: "Correlativo Final", val: formState.correlativo_final, requerido: requiredFields.includes("correlativo_final"), size: 6, colSpan: "span 6" },
    { tipo: "number", id: "cantidad_saltos", label: "Cantidad Saltos", val: formState.cantidad_saltos, requerido: requiredFields.includes("cantidad_saltos") },
    { tipo: "date", id: "fecha_vence", label: "Fecha de Vencimiento (opcional)", val: formState.fecha_vence },
    { tipo: "toggle", id: "aplicaReplicaAnual", label: "Aplica Replica Anual", val: formState.aplicaReplicaAnual, requerido: false, size: 12, options: [{ value: "S", label: "" }] },
  ];

  const inputs = allInputs.filter((input) => showFields[input.id] !== false);

  const shouldShowPreview = Boolean(showPreview);

  return (
    <WrapperComponent {...wrapperProps}>
      {title && (
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>
      )}
      {error && (
        <>
          <Typography color="error" sx={{ mb: 1 }}>
            {error}
          </Typography>
          {errorDetail && (
            <Typography
              component="pre"
              color="error"
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "#fff6f6",
                p: 1,
                borderRadius: 1,
                border: "1px solid #f9dcdc",
                mb: 2,
              }}
            >
              {typeof errorDetail === "string" ? errorDetail : JSON.stringify(errorDetail, null, 2)}
            </Typography>
          )}
        </>
      )}
      {shouldShowPreview && (
        <PreviewCorrelativos
          serie={formState.correlativo_serie}
          correlativoInicial={formState.correlativo_inicial}
          correlativoFinal={formState.correlativo_final}
          cantidadSaltos={formState.cantidad_saltos}
        />
      )}

      {enableListaGuias && <PreviewGuias serie={formState.correlativo_serie} listaGuias={listaGuias} pendingGuia={pendingNumeroGuia} onEliminarGuia={handleEliminarGuia} />}

      <FormularioAlternativo
        title={title}
        fields={inputs.map((input) => {
          if (input.tipo === "select") {
            return {
              key: input.id,
              label: input.label,
              type: "select",
              required: Boolean(input.requerido),
              readOnly: Boolean(input.readonly || input.disabled),
              options: input.options || [],
              colSpan: input.size ? `span ${input.size}` : "span 12",
            };
          }

          if (input.tipo === "date") {
            return {
              key: input.id,
              label: input.label,
              type: "date",
              required: Boolean(input.requerido),
              readOnly: Boolean(input.readonly || input.disabled),
              colSpan: input.size ? `span ${input.size}` : "span 12",
            };
          }

          if (input.tipo === "toggle") {
            return {
              key: input.id,
              label: "",
              type: "checkboxes",
              options: [{ value: "S", label: input.label }],
              required: false,
              readOnly: Boolean(input.readonly || input.disabled),
              colSpan: input.size ? `span ${input.size}` : "span 12",
            };
          }

          return {
            key: input.id,
            label: input.label,
            type: "text",
            required: Boolean(input.requerido),
            readOnly: Boolean(input.readonly || input.disabled),
            colSpan: input.size ? `span ${input.size}` : "span 12",
          };
        })}
        initialValues={{
          ...formState,
          aplicaReplicaAnual: formState.aplicaReplicaAnual ? ["S"] : [],
        }}
        onFieldChange={(id, val) => {
          if (id === "aplicaReplicaAnual") {
            return { aplicaReplicaAnual: Array.isArray(val) && val.includes("S") };
          }
          return null;
        }}
        onValuesChange={(nextValues) => {
          setFormState({
            ...nextValues,
            aplicaReplicaAnual: Array.isArray(nextValues.aplicaReplicaAnual) ? nextValues.aplicaReplicaAnual.includes("S") : Boolean(nextValues.aplicaReplicaAnual),
          });
        }}
        onRefresh={handleRefreshForm}
        validate={() => !hasMissingRequiredFields}
        showSubmitButton={false}
      />

      {submitButtonPosition === "form" && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
          {onCancel && !hideCancel && !cancelButtonDisabled && (
            <Button size="small" variant="outlined" color="primary" onClick={onCancel} disabled={isCreating && createOnServer} sx={{ textTransform: "none" }}>
              {cancelButtonText}
            </Button>
          )}
          <Button size="small" variant="contained" color="primary" onClick={handleSubmit} disabled={hasMissingRequiredFields || (isCreating && createOnServer)}>
            {submitButtonText}
          </Button>
        </Box>
      )}

      {enableListaGuias && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mt: 3,
            mb: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            background: (theme) =>
              theme.palette.mode === "dark" ? "linear-gradient(145deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.05) 100%)" : "linear-gradient(145deg, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0.03) 100%)",
            ...listaGuiasWrapperProps.sx,
          }}
          {...(listaGuiasWrapperProps || {})}
        >
          <ListaGuiasComponent
            listaGuias={listaGuias}
            onAddGuia={handleAgregarGuia}
            onEliminarGuia={handleEliminarGuia}
            onLimpiarGuias={handleLimpiarGuias}
            onNumeroGuiaChange={setPendingNumeroGuia}
            maxGuias={maxGuias}
          />
        </Paper>
      )}
      {submitButtonPosition === "bottom" && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
          {onCancel && !hideCancel && !cancelButtonDisabled && (
            <Button size="small" variant="outlined" color="primary" onClick={onCancel} disabled={isCreating && createOnServer} sx={{ textTransform: "none" }}>
              {cancelButtonText}
            </Button>
          )}
          <Button size="small" variant="contained" color="primary" onClick={handleSubmit} disabled={hasMissingRequiredFields || (isCreating && createOnServer)}>
            {submitButtonText}
          </Button>
        </Box>
      )}
    </WrapperComponent>
  );
};

FormularioCorrelativos.propTypes = {
  onCancel: PropTypes.func,
  onSuccess: PropTypes.func,
  onCorrelativoCreado: PropTypes.func,
  onMostrarSecuencias: PropTypes.func,
  showFields: PropTypes.shape({
    cod_empresa: PropTypes.bool,
    cod_cc: PropTypes.bool,
    tipo: PropTypes.bool,
    cod_entidad: PropTypes.bool,
    titulo_guia: PropTypes.bool,
    correlativo_serie: PropTypes.bool,
    correlativo_inicial: PropTypes.bool,
    correlativo_final: PropTypes.bool,
    cantidad_saltos: PropTypes.bool,
    fecha_vence: PropTypes.bool,
  }),
  defaultValues: PropTypes.object,
  submitButtonText: PropTypes.string,
  cancelButtonText: PropTypes.string,
  cancelButtonDisabled: PropTypes.bool,
  hideCancel: PropTypes.bool,
  readonlyFields: PropTypes.arrayOf(PropTypes.string),
  refTipoSecuencia: PropTypes.string,
  getRefTipoSecuenciaFn: PropTypes.func,
  enableListaGuias: PropTypes.bool,
  maxGuias: PropTypes.number,
  createOnServer: PropTypes.bool,
  submitButtonPosition: PropTypes.oneOf(["form", "bottom"]),
  title: PropTypes.string,
  wrapperComponent: PropTypes.elementType,
  wrapperProps: PropTypes.object,
  listaGuiasWrapperProps: PropTypes.object,
  showPreview: PropTypes.bool,
  requiredFields: PropTypes.arrayOf(PropTypes.string),
};

export default FormularioCorrelativos;
