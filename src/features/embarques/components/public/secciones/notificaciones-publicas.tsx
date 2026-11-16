"use client";

import { Bell, Building2, Copy, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { SubseccionHeader } from "@/shared/components/seccion-header";
import { asText } from "@/shared/lib/text";
import {
  areRequiredFieldsFilled,
  type CampoFormulario,
  getModifiedFields,
  unionModificados,
} from "./validation";

const NOTIFICACIONES_FIELDS: CampoFormulario[] = [
  { key: "nombre", label: "Nombre", type: "text", required: true },
  { key: "email", label: "Email", type: "text", required: true },
  { key: "telefono", label: "Teléfono", type: "text", required: true },
  { key: "telefonoEmergencia", label: "Teléfono de emergencia", type: "text" },
];

interface NotificacionesData {
  nombre?: string;
  email?: string;
  telefono?: string;
  telefonoEmergencia?: string;
  _modificados?: string[];
}

interface ConsignatarioData {
  contacto?: string;
  email?: string;
  telefonos?: string;
}

interface NotificacionesPublicasProps {
  readonly data?: NotificacionesData;
  readonly isLoading?: boolean;
  /** La vista privada de CTS consulta estos datos; solo el enlace público puede editarlos. */
  readonly readOnly?: boolean;
  readonly onValidityChange?: (valid: boolean | "pending") => void;
  readonly onValuesChange?: (values: Record<string, unknown>) => void;
  readonly onSave?: (values: Record<string, unknown>) => void;
  readonly isSaving?: boolean;
  readonly consignatarioData?: ConsignatarioData;
}

/**
 * Sección pública "Notificaciones": contacto a notificar, con atajo para
 * copiar los datos del consignatario. Guarda como borrador de la carta
 * (`carta_notificaciones`).
 */
export default function NotificacionesPublicas({
  data,
  isLoading = false,
  readOnly = false,
  onValidityChange,
  onValuesChange,
  onSave,
  isSaving = false,
  consignatarioData,
}: NotificacionesPublicasProps) {
  const initValues = useMemo(
    () => ({
      nombre: data?.nombre || "",
      email: data?.email || "",
      telefono: data?.telefono || "",
      telefonoEmergencia: data?.telefonoEmergencia || "",
    }),
    [data],
  );
  const [values, setValues] = useState<Record<string, string>>(initValues);

  const dataSig = useMemo(() => JSON.stringify(initValues), [initValues]);
  const lastDataSig = useRef<string | null>(null);
  useEffect(() => {
    if (lastDataSig.current === dataSig) return;
    lastDataSig.current = dataSig;
    setValues(initValues);
  }, [dataSig, initValues]);

  const isValid = useMemo(() => areRequiredFieldsFilled(NOTIFICACIONES_FIELDS, values), [values]);
  const hasChanges = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initValues),
    [values, initValues],
  );
  const validityState = isValid && !hasChanges ? true : isValid ? ("pending" as const) : false;

  const lastValiditySig = useRef<string | null>(null);
  useEffect(() => {
    if (typeof onValidityChange !== "function") return;
    const sig = `${validityState}|${hasChanges}`;
    if (lastValiditySig.current === sig) return;
    lastValiditySig.current = sig;
    onValidityChange(validityState);
  }, [validityState, hasChanges, onValidityChange]);

  const lastReportedSig = useRef<string | null>(null);
  useEffect(() => {
    if (readOnly || typeof onValuesChange !== "function") return;
    const modificados = unionModificados(data?._modificados, getModifiedFields(initValues, values));
    const sig = JSON.stringify({ v: values, m: modificados });
    if (lastReportedSig.current === sig) return;
    lastReportedSig.current = sig;
    onValuesChange({ ...values, _modificados: modificados });
  }, [values, initValues, data, onValuesChange, readOnly]);

  const handleCopiarConsignatario = () => {
    setValues((prev) => ({
      ...prev,
      nombre: consignatarioData?.contacto || prev.nombre || "",
      email: consignatarioData?.email || prev.email || "",
      telefono: consignatarioData?.telefonos || prev.telefono || "",
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <BannerInformativo
          titulo="Aún no se ha guardado"
          mensaje="Complete los datos obligatorios para guardar."
          severidad="info"
          ocultar={isValid && !hasChanges}
        />
      )}
      <SubseccionHeader titulo="Notificar a" icono={Bell} />
      {!readOnly && (
        <div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={handleCopiarConsignatario}
          >
            <Copy className="size-4" />
            Copiar de consignatario
          </button>
        </div>
      )}
      <div className="grid grid-cols-12 gap-4">
        {NOTIFICACIONES_FIELDS.filter((field) => field.key !== "telefonoEmergencia").map(
          (field) => (
            <div key={field.key} className="col-span-12 lg:col-span-4">
              <label htmlFor={`notif-${field.key}`} className="mb-1 block text-sm font-medium">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
              <input
                id={`notif-${field.key}`}
                type="text"
                value={asText(values[field.key])}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                readOnly={readOnly}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring read-only:cursor-default read-only:bg-muted/50"
              />
            </div>
          ),
        )}
      </div>

      <SubseccionHeader titulo="Shipper" icono={Building2} />
      <div className="grid grid-cols-12 gap-4">
        {NOTIFICACIONES_FIELDS.filter((field) => field.key === "telefonoEmergencia").map(
          (field) => (
            <div key={field.key} className="col-span-12">
              <label htmlFor={`notif-${field.key}`} className="mb-1 block text-sm font-medium">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
              <input
                id={`notif-${field.key}`}
                type="text"
                value={asText(values[field.key])}
                onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                readOnly={readOnly}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring read-only:cursor-default read-only:bg-muted/50"
              />
            </div>
          ),
        )}
      </div>
      {!readOnly && typeof onSave === "function" && (
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            onClick={() => onSave(values)}
            disabled={isSaving}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}
