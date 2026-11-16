"use client";

/**
 * Sección Detalles del wizard (pública y CTS privado con apiMode="private" en
 * el caller). Delta 2026-07-16: opciones desde catálogos, "Clasificación de
 * carga" y checkboxes de documentos CROPA condicionados por gasto rubro 127
 * (el paso queda "pending" sin al menos un documento marcado). Reporta
 * `_modificados` para que el guardado por sección persista solo lo editado.
 */

import { Info } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { SeccionHeader } from "../seccion-header";
import {
  buildDetalleFields,
  buildInitValues,
  type CatalogosDetalles,
  cropaSinSeleccion,
  type DetallesData,
  type DetallesValues,
} from "./detalles-publica-model";
import type { CampoEntidadPublic } from "./entidad-public-form/fields";
import { FormFieldsRenderer } from "./entidad-public-form/form-fields-renderer";
import { areRequiredFieldsFilled, getModifiedFields, unionModificados } from "./validation";

type Validez = boolean | "pending";

interface DetallesPublicaProps {
  readonly data?: DetallesData;
  readonly isLoading?: boolean;
  readonly onValidityChange?: (valid: Validez) => void;
  readonly onValuesChange?: (values: { detalles: Record<string, unknown> }) => void;
  readonly onSave?: (values: { detalles: Record<string, unknown> }) => void;
  readonly isSaving?: boolean;
  readonly catalogos: CatalogosDetalles;
  readonly showCropaDocs?: boolean;
  /** G19: en CTS privado ("private") la sección es de solo lectura, igual que
   * el legacy — el asesor no edita tipo de pago/carga/incoterm/servicio/
   * clasificación/peligrosidad/instrucciones de manejo desde aquí. */
  readonly apiMode?: "public" | "private";
  /**
   * Override explícito de solo-lectura, independiente de `apiMode`: lo usa
   * gestion-embarques para reutilizar este mismo componente/campos en modo
   * "private" (mismos endpoints que CTS) pero editable, porque ahí Detalles
   * persiste directo a la coordinación en vez de a un borrador de carta.
   */
  readonly readOnly?: boolean;
}

const VALORES_VACIOS: DetallesValues = {
  tipoPago: "",
  tipoCarga: "",
  incoterm: "",
  servicio: "",
  clasificacionCarga: "",
  peligrosidad: [],
  documentosCropa: [],
  instruccionesManejo: "",
};

function DetallesPublica({
  data,
  isLoading = false,
  onValidityChange,
  onValuesChange,
  onSave,
  isSaving = false,
  catalogos,
  showCropaDocs = false,
  apiMode = "public",
  readOnly: readOnlyProp,
}: DetallesPublicaProps) {
  const readOnly = readOnlyProp ?? apiMode === "private";
  const [detalleValues, setDetalleValues] = useState<DetallesValues>(VALORES_VACIOS);

  const detalleFields = useMemo(
    () => buildDetalleFields(catalogos, showCropaDocs),
    [catalogos, showCropaDocs],
  );
  const formFields = useMemo<CampoEntidadPublic[]>(
    () => [
      {
        key: "__section_clasificacion__",
        label: "Clasificación",
        type: "section",
        icon: Info,
      },
      ...detalleFields.map((field) => ({
        ...field,
        type: field.type as CampoEntidadPublic["type"],
        colSpan: Number(field.colSpan?.replace("span ", "") ?? "12"),
        readOnly,
      })),
    ],
    [detalleFields, readOnly],
  );

  const initValues = useMemo(() => buildInitValues(data, catalogos), [data, catalogos]);

  // Re-sembrar solo cuando el snapshot resuelto cambia de verdad (los catálogos
  // llegan escalonados y regenerarían el estado en cada render).
  const lastInitSig = useRef<string | null>(null);
  useEffect(() => {
    const sig = JSON.stringify(initValues);
    if (lastInitSig.current === sig) return;
    lastInitSig.current = sig;
    setDetalleValues(initValues);
  }, [initValues]);

  const isValid = useMemo(
    () => areRequiredFieldsFilled(detalleFields, detalleValues),
    [detalleFields, detalleValues],
  );
  const cropaPendiente = cropaSinSeleccion(showCropaDocs, detalleValues);
  const hasChanges = useMemo(
    () => JSON.stringify(detalleValues) !== JSON.stringify(initValues),
    [detalleValues, initValues],
  );

  // true = válido y guardado; "pending" = válido con cambios sin guardar.
  const lastValiditySig = useRef<string | null>(null);
  useEffect(() => {
    if (typeof onValidityChange !== "function") return;
    const next: Validez = isValid && !hasChanges ? true : isValid ? "pending" : false;
    const sig = String(next);
    if (lastValiditySig.current === sig) return;
    lastValiditySig.current = sig;
    onValidityChange(next);
  }, [isValid, hasChanges, onValidityChange]);

  const lastReportedSig = useRef<string | null>(null);
  useEffect(() => {
    if (typeof onValuesChange !== "function") return;
    const modificados = unionModificados(
      data?._modificadosDetalles ?? [],
      getModifiedFields(initValues, detalleValues),
    );
    const sig = JSON.stringify({ v: detalleValues, m: modificados });
    if (lastReportedSig.current === sig) return;
    lastReportedSig.current = sig;
    onValuesChange({ detalles: { ...detalleValues, _modificados: modificados } });
  }, [detalleValues, initValues, data, onValuesChange]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
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
            ocultar={!cropaPendiente}
          />
        </>
      )}
      <SeccionHeader titulo="Detalles" />
      <FormFieldsRenderer
        idPrefix="Detalles"
        fields={formFields}
        values={detalleValues}
        onChange={(patch) => setDetalleValues((prev) => ({ ...prev, ...patch }))}
      />
      {!readOnly && typeof onSave === "function" && (
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            onClick={() => onSave({ detalles: detalleValues })}
            disabled={isSaving || cropaPendiente}
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(DetallesPublica);
