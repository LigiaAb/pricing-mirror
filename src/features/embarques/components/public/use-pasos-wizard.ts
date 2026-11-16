"use client";

/**
 * Pasos visibles y validez del wizard público: "Documentos" solo con
 * clasificación peligrosa y/o cobertura de seguro; "Fechas" solo con gasto
 * cod_rubro=12. Si el paso activo deja de existir, se retrocede al último
 * visible (clamp). El render y la validez van indexados sobre los pasos
 * VISIBLES (igual que el detalle CTS privado).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Validez } from "./secciones-wizard";

const STEPS = [
  "Shipper",
  "Consignatario",
  "Notificacion",
  "Producto",
  "Facturacion",
  "Detalles",
  "Documentos",
  "Fechas",
];

export function usePasosWizard({
  showFechas,
  showDocumentosPeligrosidad,
  showDocumentosCoberturaSeguro,
}: {
  showFechas: boolean;
  showDocumentosPeligrosidad: boolean;
  showDocumentosCoberturaSeguro: boolean;
}) {
  const [estado, setEstado] = useState(0);
  const [stepValidity, setStepValidity] = useState<Record<number, Validez>>({});

  const filteredSteps = useMemo(
    () =>
      STEPS.filter((s) => {
        if (s === "Documentos") {
          return showDocumentosPeligrosidad || showDocumentosCoberturaSeguro;
        }
        if (s === "Fechas") return showFechas;
        return true;
      }),
    [showFechas, showDocumentosPeligrosidad, showDocumentosCoberturaSeguro],
  );
  useEffect(() => {
    if (estado >= filteredSteps.length) setEstado(Math.max(0, filteredSteps.length - 1));
  }, [filteredSteps, estado]);

  const handleValidityChange = useCallback((stepIndex: number, valid: Validez) => {
    setStepValidity((prev) => (prev[stepIndex] === valid ? prev : { ...prev, [stepIndex]: valid }));
  }, []);
  // Un handler por paso VISIBLE.
  const validityHandlers = useMemo(
    () => filteredSteps.map((_, idx) => (valid: Validez) => handleValidityChange(idx, valid)),
    [filteredSteps, handleValidityChange],
  );

  // El stepper no modela `false` (usa null para "sin validar/ inválido").
  const stepValidityParaStepper = useMemo(
    () =>
      Object.fromEntries(Object.entries(stepValidity).map(([k, v]) => [k, v === false ? null : v])),
    [stepValidity],
  );

  // Iterar sobre los pasos VISIBLES: un paso oculto nunca reporta validez y
  // dejaría el conjunto permanentemente inválido.
  const allStepsValid = filteredSteps.every((_, idx) => {
    const v = stepValidity[idx];
    return v === true || v === "pending";
  });
  // "Completar" exige todos los pasos guardados (no basta válido sin guardar).
  const allStepsSaved = filteredSteps.every((_, idx) => stepValidity[idx] === true);

  return {
    estado,
    setEstado,
    filteredSteps,
    validityHandlers,
    stepValidityParaStepper,
    allStepsValid,
    allStepsSaved,
  };
}
