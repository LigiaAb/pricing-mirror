"use client";

import { Loader2 } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { SeccionHeader } from "../seccion-header";
import { getModifiedFields } from "./validation";

interface FechasPublicasData {
  fechaRecoleccion?: string;
  fecha_recoleccion?: string;
}

interface FechasPublicasProps {
  readonly data?: FechasPublicasData;
  readonly isLoading?: boolean;
  readonly onValidityChange?: (valid: boolean | "pending") => void;
  readonly onValuesChange?: (values: Record<string, unknown>) => void;
  readonly onSave?: (values: Record<string, unknown>) => void;
  readonly isSaving?: boolean;
}

function normalizeToDate(value: unknown): string {
  if (!value) return "";
  const str = String(value).trim();
  if (!str) return "";
  if (str.includes("T")) return str.split("T")[0] ?? "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  return "";
}

/**
 * Sección pública "Fechas": captura la fecha de recolección como borrador de
 * la carta (`carta_fechas`). Reporta solo su propio campo en `_modificados`
 * (heredar los del shipper reconstruía carta_shipper con campos sin valor).
 */
function FechasPublicas({
  data,
  isLoading = false,
  onValidityChange,
  onValuesChange,
  onSave,
  isSaving = false,
}: FechasPublicasProps) {
  const initialDate = normalizeToDate(data?.fechaRecoleccion || data?.fecha_recoleccion || "");
  const [values, setValues] = useState({ fecha_recoleccion: initialDate });

  const lastDataSig = useRef<string | null>(null);
  useEffect(() => {
    if (lastDataSig.current === initialDate) return;
    lastDataSig.current = initialDate;
    setValues({ fecha_recoleccion: initialDate });
  }, [initialDate]);

  const isValid = Boolean(values.fecha_recoleccion);
  const hasChanges = values.fecha_recoleccion !== initialDate;

  const lastValiditySig = useRef<string | null>(null);
  useEffect(() => {
    if (typeof onValidityChange !== "function") return;
    const next = isValid && !hasChanges ? true : isValid ? ("pending" as const) : false;
    const sig = `${next}|${hasChanges}`;
    if (lastValiditySig.current === sig) return;
    lastValiditySig.current = sig;
    onValidityChange(next);
  }, [isValid, hasChanges, onValidityChange]);

  const initValues = useMemo(() => ({ fecha_recoleccion: initialDate }), [initialDate]);
  const lastReportedSig = useRef<string | null>(null);
  useEffect(() => {
    if (typeof onValuesChange !== "function") return;
    const modificados = getModifiedFields(initValues, values);
    const sig = JSON.stringify({ v: values, m: modificados });
    if (lastReportedSig.current === sig) return;
    lastReportedSig.current = sig;
    onValuesChange({ ...values, _modificados: modificados });
  }, [values, initValues, onValuesChange]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BannerInformativo
        titulo="Aún no se ha guardado"
        mensaje="Complete los datos obligatorios para guardar."
        severidad="info"
        ocultar={isValid && !hasChanges}
      />
      <SeccionHeader titulo="Fechas" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6">
          <label htmlFor="fecha_recoleccion" className="mb-1 block text-sm font-medium">
            Fecha de Recolección
            <span className="text-destructive ml-1">*</span>
          </label>
          <input
            id="fecha_recoleccion"
            type="date"
            value={values.fecha_recoleccion}
            onChange={(e) => setValues({ fecha_recoleccion: e.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>
      {typeof onSave === "function" && (
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            onClick={() => onSave(values)}
            disabled={isSaving || !isValid}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(FechasPublicas);
