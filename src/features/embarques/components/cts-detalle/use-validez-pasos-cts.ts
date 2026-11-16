"use client";

/**
 * Pasos visibles y validez del stepper del detalle CTS privado. "pending"
 * (sección con cambios sin guardar) NO habilita "Crear Coordinación": el motor
 * de commit aplica solo lo ya guardado en json_data_usuario (plan de paridad
 * §4.A.2.6). Los pasos Rutas/Fechas/Seguimiento no bloquean.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STEPS_CTS, STEPS_NO_BLOQUEANTES, type ValidezPrivada } from "./secciones-wizard-privado";

const INDEX_FACTURACION = STEPS_CTS.indexOf("Facturacion");
const INDEX_FECHAS = STEPS_CTS.indexOf("Fechas");

export function useValidezPasosCts({
  showFechas,
  estado,
  setEstado,
}: {
  showFechas: boolean;
  estado: number;
  setEstado: (paso: number) => void;
}) {
  const [stepValidity, setStepValidity] = useState<Record<number, ValidezPrivada | null>>({});

  // Pasos visibles: "Fechas" se omite sin gasto cod_rubro=12; en la transición
  // true→false con Fechas activo, retroceder al paso anterior.
  const filteredSteps = useMemo(
    () => (showFechas ? [...STEPS_CTS] : STEPS_CTS.filter((s) => s !== "Fechas")),
    [showFechas],
  );
  const prevShowFechasRef = useRef(showFechas);
  useEffect(() => {
    const prevShowFechas = prevShowFechasRef.current;
    prevShowFechasRef.current = showFechas;
    if (prevShowFechas && !showFechas && estado === INDEX_FECHAS) {
      setEstado(INDEX_FECHAS - 1);
    }
  }, [showFechas, estado, setEstado]);

  const handleValidityChange = useCallback((stepIndex: number, valid: ValidezPrivada) => {
    setStepValidity((prev) => (prev[stepIndex] === valid ? prev : { ...prev, [stepIndex]: valid }));
  }, []);
  const validityHandlers = useMemo(
    () => STEPS_CTS.map((_, idx) => (valid: ValidezPrivada) => handleValidityChange(idx, valid)),
    [handleValidityChange],
  );

  // Validez efectiva por paso visible: los no bloqueantes cuentan como válidos
  // aunque su sección no reporte.
  const validezDe = useCallback(
    (idx: number): ValidezPrivada | null => {
      const label = filteredSteps[idx] ?? "";
      if (STEPS_NO_BLOQUEANTES.has(label)) return true;
      return stepValidity[idx] ?? null;
    },
    [filteredSteps, stepValidity],
  );
  const indicesBloqueantes = useMemo(
    () =>
      filteredSteps
        .map((label, idx) => ({ label, idx }))
        .filter(({ label }) => !STEPS_NO_BLOQUEANTES.has(label))
        .map(({ idx }) => idx),
    [filteredSteps],
  );
  const allStepsValid = indicesBloqueantes.every((idx) => validezDe(idx) === true);
  const hasUnsavedSection = indicesBloqueantes.some((idx) => validezDe(idx) === "pending");
  const allSectionsInitialized = indicesBloqueantes.every((idx) => validezDe(idx) !== null);
  const isPreCliente = stepValidity[INDEX_FACTURACION] === "pre-cliente";

  // El stepper no modela `false` (usa null para "sin validar / inválido").
  const stepValidityParaStepper = useMemo(
    () =>
      Object.fromEntries(
        filteredSteps.map((label, idx) => {
          const v = STEPS_NO_BLOQUEANTES.has(label) ? true : (stepValidity[idx] ?? null);
          return [idx, v === false ? null : v];
        }),
      ),
    [filteredSteps, stepValidity],
  );

  return {
    filteredSteps,
    validityHandlers,
    allStepsValid,
    hasUnsavedSection,
    allSectionsInitialized,
    isPreCliente,
    stepValidityParaStepper,
  };
}

/** Tooltip del botón "Crear Coordinación" cuando está deshabilitado. */
export function tooltipCrearCoordinacion({
  disabled,
  hasUnsavedSection,
  isPreCliente,
}: {
  disabled: boolean;
  hasUnsavedSection: boolean;
  isPreCliente: boolean;
}): string {
  if (!disabled) return "";
  if (hasUnsavedSection) {
    return "Guarde los cambios pendientes en cada sección antes de crear la coordinación.";
  }
  const base = "Complete todos los pasos antes de crear la coordinación.";
  return isPreCliente ? `${base} El pre-cliente debe convertirse en Cliente para completar.` : base;
}
