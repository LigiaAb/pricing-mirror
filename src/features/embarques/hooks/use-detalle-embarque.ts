"use client";

import { useEffect, useRef, useState } from "react";
import { useCoordinacion, useCoordinacionCargas } from "@/features/coordinaciones";
import { useFetchGuiasCoordinacion } from "@/features/correlativos";
import {
  useListarCoordinacionGastos,
  useObtenerUltimaVersionCoordinacionGastos,
} from "@/features/gastos";
import { asText } from "@/shared/lib/text";
import {
  DEFAULT_DESTINO_OPTIONS,
  selectExistingGuia,
} from "../components/modales/seleccionar-destino/destino-model";
import { COD_RUBRO_DOCS_CROPA } from "../lib/constantes";
import { usePdfEmbarque } from "./use-pdf-embarque";

/** Pasos del detalle de gestión de embarques (paridad legacy). */
export const DETALLE_EMBARQUE_STEPS: string[] = [
  "Shipper",
  "Consignatario",
  "Producto",
  "Facturacion",
  "Detalles",
  "Gastos",
  "Documentos",
  "Rutas",
  "Fechas",
  "CCA",
];

/** Pasos que no bloquean la botonera (CCA y Fechas). */
const PASOS_NO_BLOQUEANTES = new Set(["Fechas", "CCA"]);

type StepValidityValue = true | "valid" | "warning" | "pending" | "incomplete" | "pre-cliente";

/** null = la sección aún no reporta su validez (está cargando). */
export type StepValidityState = Record<number, StepValidityValue | null>;

export function buildStepValidityInicial(steps: readonly string[]): StepValidityState {
  const obj: StepValidityState = {};
  steps.forEach((label, idx) => {
    obj[idx] = PASOS_NO_BLOQUEANTES.has(label) ? true : null;
  });
  return obj;
}

export function selectDestinoOptions<T extends { id: string }>(
  servicio: string,
  opciones: ReadonlyArray<T>,
): T[] {
  if (servicio === "COURIER") return opciones.filter((o) => o.id === "bodega");
  if (servicio === "CONSOLIDADO" || servicio === "DIRECTO") {
    return opciones.filter((o) => o.id !== "bodega");
  }
  return [...opciones];
}

export function getPdfButtonLabel(
  isGeneratingPdf: boolean,
  correlativoGuiaMaster: string | null,
): string {
  if (isGeneratingPdf) return "Generando PDF...";
  return correlativoGuiaMaster ? "Descargar PDF" : "Descargar Draft House";
}

export function useDetalleEmbarque(embarqueId: number | null) {
  const id = embarqueId;

  const { data: embarqueData, isLoading: loadingEmbarque } = useCoordinacion(id ?? undefined);
  const { data: cargas = [], isLoading: loadingCargas } = useCoordinacionCargas(
    id ? String(id) : undefined,
  );
  const { data: guiasData = [], isLoading: loadingGuias } = useFetchGuiasCoordinacion(
    { embarque_id: Number(id) },
    { enabled: !!id },
  );

  const rawEmbarque = embarqueData ?? null;
  const correlativoGuia = guiasData.length > 0 ? (guiasData[0]?.correlativoGuia ?? "") : "";
  const correlativoGuiaMaster =
    guiasData.length > 0 ? (guiasData[0]?.correlativoGuiaMaster ?? null) : null;

  const servicioNombre = asText(rawEmbarque?.servicio ?? rawEmbarque?.servicio_nombre)
    .trim()
    .toUpperCase();

  const codFile =
    asText((cargas[0] as Record<string, unknown> | undefined)?.codFile).trim() ||
    asText(rawEmbarque?.cod_file).trim();

  const opcionesDestino = selectDestinoOptions(servicioNombre, DEFAULT_DESTINO_OPTIONS);

  /** Guía que reciben los modales: master para CONSOLIDADO/DIRECTO, house para el resto. */
  const existingGuia = selectExistingGuia(servicioNombre, correlativoGuiaMaster, correlativoGuia);

  // Documentos CROPA en Detalles solo si algún gasto de la última versión
  // tiene rubro 127 (§7.D.3 del plan de paridad).
  const { data: versionData } = useObtenerUltimaVersionCoordinacionGastos(id ?? undefined);
  const embarqueVersion = versionData?.embarque_version ?? null;
  const { data: gastos = [] } = useListarCoordinacionGastos({
    embarque_id: Number(id) || 0,
    embarque_version: Number(embarqueVersion) || 0,
    enabled: Boolean(id && versionData),
  });
  const showCropaDocs = gastos.some((g) => Number(g.codRubro) === COD_RUBRO_DOCS_CROPA);

  const { handleDownloadPdf, isGeneratingPdf } = usePdfEmbarque({ embarque_id: id });

  const [activeStep, setActiveStep] = useState(0);
  const [stepValidity, setStepValidity] = useState<StepValidityState>(() =>
    buildStepValidityInicial(DETALLE_EMBARQUE_STEPS),
  );

  const [asignarMasterOpen, setAsignarMasterOpen] = useState(false);
  const [destinoOpen, setDestinoOpen] = useState(false);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState(false);
  const [copiasOpen, setCopiasOpen] = useState(false);
  // Solo se escribe (paridad con la señal que emiten las secciones); ninguna
  // lectura la necesita, así que vive en un ref y no re-renderiza el detalle.
  const sectionLoadingRef = useRef<Record<number, boolean>>({
    0: true,
    1: true,
    8: true,
  });

  const allStepsValid = Object.values(stepValidity).every(
    (v) => v === true || v === "valid" || v === "pending",
  );
  // Una sección reporta null mientras no ha disparado onValidityChange.
  const allInitialized = Object.values(stepValidity).every((v) => v !== null);

  const handleValidityChange = (stepIndex: number, isValid: boolean | string) => {
    setStepValidity((prev) => {
      let newVal: StepValidityValue;
      if (isValid === true) newVal = "valid";
      else if (isValid === false) newVal = "incomplete";
      else newVal = isValid as StepValidityValue;
      if (prev[stepIndex] === newVal) return prev;
      const next: StepValidityState = { ...prev };
      next[stepIndex] = newVal;
      return next;
    });
  };

  const handleValidityChangeRef = useRef(handleValidityChange);
  useEffect(() => {
    handleValidityChangeRef.current = handleValidityChange;
  });

  const validityHandlersRef = useRef<Array<(isValid: boolean | string) => void>>([]);
  const loadingHandlersRef = useRef<Array<(isLoading: boolean) => void>>([]);

  if (validityHandlersRef.current.length !== DETALLE_EMBARQUE_STEPS.length) {
    const handlers: Array<(isValid: boolean | string) => void> = [];
    for (let idx = 0; idx < DETALLE_EMBARQUE_STEPS.length; idx++) {
      handlers.push((isValid: boolean | string) => {
        handleValidityChangeRef.current?.(idx, isValid);
      });
    }
    validityHandlersRef.current = handlers;
  }

  if (loadingHandlersRef.current.length !== DETALLE_EMBARQUE_STEPS.length) {
    const handlers: Array<(isLoading: boolean) => void> = [];
    for (let idx = 0; idx < DETALLE_EMBARQUE_STEPS.length; idx++) {
      handlers.push((isLoading: boolean) => {
        sectionLoadingRef.current[idx] = isLoading;
      });
    }
    loadingHandlersRef.current = handlers;
  }

  const isLoading = loadingEmbarque || loadingCargas;
  const isLoadingPdfData = isLoading || loadingGuias;

  return {
    embarqueData,
    loadingEmbarque,
    isLoading,
    isLoadingPdfData,
    rawEmbarque,
    correlativoGuia,
    correlativoGuiaMaster,
    servicioNombre,
    codFile,
    existingGuia,
    showCropaDocs,
    opcionesDestino,
    activeStep,
    setActiveStep,
    stepValidity,
    allStepsValid,
    allInitialized,
    asignarMasterOpen,
    setAsignarMasterOpen,
    destinoOpen,
    setDestinoOpen,
    destinoSeleccionado,
    setDestinoSeleccionado,
    copiasOpen,
    setCopiasOpen,
    validityHandlers: validityHandlersRef.current,
    loadingHandlers: loadingHandlersRef.current,
    handleDownloadPdf,
    isGeneratingPdf,
    pdfButtonLabel: getPdfButtonLabel(isGeneratingPdf, correlativoGuiaMaster),
  };
}
