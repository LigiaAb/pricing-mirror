"use client";

/**
 * Sección pública de entidad (Shipper/Consignatario): formulario alimentado
 * por la carta guardada + maestro de entidades relacionadas, con selector de
 * entidad/contacto, modos "nueva entidad"/"nuevo contacto" y guardado como
 * borrador de la carta. Reutilizable en privado (`apiMode="private"`, solo
 * lectura + panel de cambios del cliente) — Fase A.2 del plan de paridad.
 */

import { Loader2 } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { EntidadComparePanel } from "../../entidad-compare-panel";
import { SeccionHeader } from "../../seccion-header";
import { areRequiredFieldsFilled } from "../validation";
import { buildMaestroFormPatch, type CambioClienteRow } from "./cambios-cliente";
import { buildEntidadPublicFields, effectiveHiddenFields } from "./fields";
import { FormFieldsRenderer } from "./form-fields-renderer";
import {
  buildInitialValues,
  calcularModificados,
  type EntidadPublicConfig,
  type JsonRecord,
  pickEntidadIdFromData,
} from "./model";
import { NuevaEntidadCaptura } from "./nueva-entidad-captura";
import { useCambiosClientePanel } from "./use-cambios-cliente-panel";
import { useEntidadPublicForm } from "./use-entidad-public-form";
import { useEntidadPublicOpciones } from "./use-entidad-public-opciones";

export interface EntidadPublicFormSectionProps {
  readonly config: EntidadPublicConfig;
  readonly data?: JsonRecord;
  readonly isLoading?: boolean;
  readonly onValidityChange?: (valid: boolean | "pending") => void;
  readonly onValuesChange?: (values: JsonRecord) => void;
  readonly onSave?: () => void;
  readonly isSaving?: boolean;
  readonly cliInfo?: JsonRecord | null;
  readonly selectedEntidadId?: string | number | null;
  readonly apiMode?: "public" | "private";
  /** El token público se setea async en el padre; sin esto los fetch públicos disparan sin Authorization. */
  readonly tokenReady?: boolean;
  readonly disableEntitySelector?: boolean;
  /**
   * Cuando se provee, el panel "Historial de cambios" no se renderiza dentro
   * del formulario: se reporta al padre para que lo muestre como panel
   * independiente (a la derecha del formulario en el detalle CTS privado).
   */
  readonly onCompareRows?: (rows: CambioClienteRow[]) => void;
}

function EntidadPublicFormSectionBase({
  config,
  data = {},
  isLoading = false,
  onValidityChange,
  onValuesChange,
  onSave,
  isSaving = false,
  cliInfo = null,
  selectedEntidadId = null,
  apiMode = "public",
  disableEntitySelector = false,
  onCompareRows,
  tokenReady = true,
}: EntidadPublicFormSectionProps) {
  const readOnly = apiMode === "private";
  const form = useEntidadPublicForm({
    config,
    data,
    cliInfo,
    selectedEntidadId,
    apiMode,
    isSaving,
    tokenReady,
  });
  const {
    values,
    setValues,
    baselineRef,
    entidades,
    entidadesRelLoading,
    findEntidadById,
    rawEntidadActual,
    catalogos,
    resolvedData,
    handleFieldChange,
    handleEntidadCreada,
    limpiarCamposEntidad,
    modoNuevaEntidad,
    setModoNuevaEntidad,
    modoNuevoContacto,
    setModoNuevoContacto,
    openCrearEntidad,
    setOpenCrearEntidad,
  } = form;

  const {
    entityOptions,
    contactoOptions,
    sinEntidadesDisponibles,
    forzarNuevaEntidad,
    forzarNuevoContacto,
    nuevoEntityAction,
    nuevoContactoAction,
  } = useEntidadPublicOpciones({
    config,
    values,
    setValues,
    selectedEntidadId,
    entidades,
    entidadesRelLoading,
    findEntidadById,
    rawEntidadActual,
    modoNuevaEntidad,
    setModoNuevaEntidad,
    modoNuevoContacto,
    setModoNuevoContacto,
    limpiarCamposEntidad,
    setOpenCrearEntidad,
  });

  const formFields = useMemo(
    () =>
      buildEntidadPublicFields({
        config,
        entityOptions,
        paisOptions: catalogos.paisOptions,
        ciudadOptions: catalogos.ciudadOptions,
        departamentoOptions: catalogos.departamentoOptions,
        municipioOptions: catalogos.municipioOptions,
        industriaOptions: catalogos.industriaOptions,
        contactoOptions,
        tiposContactoOptions: catalogos.tiposContactoOptions,
        nuevoEntityAction,
        nuevoContactoAction,
        disableEntitySelector: disableEntitySelector || sinEntidadesDisponibles,
        modoNuevoContacto: forzarNuevoContacto,
        modoNuevaEntidad: forzarNuevaEntidad,
        selectedEntidadId: values.entidad_id,
        selectedContactoId: values.entidadcontacto_id,
        hiddenFields: effectiveHiddenFields(config.hiddenFields, forzarNuevaEntidad),
        readOnlyFields: config.readOnlyFields,
        readOnly,
      }),
    [
      config,
      entityOptions,
      catalogos,
      contactoOptions,
      nuevoEntityAction,
      nuevoContactoAction,
      disableEntitySelector,
      sinEntidadesDisponibles,
      forzarNuevoContacto,
      forzarNuevaEntidad,
      values.entidad_id,
      values.entidadcontacto_id,
      config.readOnlyFields,
      readOnly,
    ],
  );

  const initValues = useMemo(
    () =>
      buildInitialValues(
        {
          ...(resolvedData || {}),
          entidad_id: pickEntidadIdFromData(resolvedData, selectedEntidadId),
        },
        config,
      ),
    [resolvedData, config, selectedEntidadId],
  );

  // Comparar contra baselineRef (initValues + auto-rellenos aplicados), no
  // contra initValues a secas: los campos autocompletados quedarían marcados
  // como "cambio pendiente" para siempre.
  const hasChanges = useMemo(
    () =>
      Object.keys(initValues).some(
        (k) => String((values as JsonRecord)[k] ?? "") !== String(baselineRef.current[k] ?? ""),
      ),
    [values, initValues, baselineRef],
  );
  const isValid = useMemo(() => areRequiredFieldsFilled(formFields, values), [formFields, values]);

  const handleValuesPatch = useCallback(
    (patch: JsonRecord) => setValues((prev) => ({ ...prev, ...patch })),
    [setValues],
  );

  const onValidityChangeRef = useRef(onValidityChange);
  onValidityChangeRef.current = onValidityChange;
  const lastValiditySig = useRef<string | null>(null);
  useEffect(() => {
    if (typeof onValidityChangeRef.current !== "function") return;
    const next: boolean | "pending" = isValid && !hasChanges ? true : isValid ? "pending" : false;
    const sig = `${next}|${hasChanges}`;
    if (lastValiditySig.current === sig) return;
    lastValiditySig.current = sig;
    onValidityChangeRef.current(next);
  }, [isValid, hasChanges]);

  const lastReportedSig = useRef<string | null>(null);
  useEffect(() => {
    if (typeof onValuesChange !== "function") return;
    const modificados = calcularModificados(data?._modificados, baselineRef.current, values);
    const sig = JSON.stringify({ v: values, m: modificados });
    if (lastReportedSig.current === sig) return;
    lastReportedSig.current = sig;
    // _tipoEntidad viaja con los valores para que buildEntidadRelacionadaSlim
    // sepa el rol al construir el registro de una entidad nueva sin entidad_id.
    onValuesChange({ ...values, _modificados: modificados, _tipoEntidad: config.tipo });
  }, [values, data, onValuesChange, config.tipo, baselineRef]);

  const { cambiosClienteRows, maestroSeparado } = useCambiosClientePanel({
    apiMode,
    readOnly,
    config,
    data,
    rawEntidadActual,
    values,
    catalogos,
  });

  // En operador, dirección e identificación son de consulta y deben reflejar
  // el maestro de BD. Los endpoints puntuales son la fuente autoritativa
  // porque recuperar-datos-entidad-relacionada puede omitir subregistros.
  const maestroFormPatch = useMemo(() => buildMaestroFormPatch(maestroSeparado), [maestroSeparado]);
  useEffect(() => {
    if (!readOnly || !config.readOnlyFields?.size) return;
    const patch = Object.fromEntries(
      Object.entries(maestroFormPatch).filter(([key]) => config.readOnlyFields?.has(key)),
    );
    if (Object.keys(patch).length === 0) return;
    setValues((prev) => {
      const hasDiff = Object.entries(patch).some(
        ([key, value]) => String(prev[key] ?? "") !== String(value ?? ""),
      );
      if (!hasDiff) return prev;
      baselineRef.current = { ...baselineRef.current, ...patch };
      return { ...prev, ...patch };
    });
  }, [readOnly, config.readOnlyFields, maestroFormPatch, setValues, baselineRef]);

  const onCompareRowsRef = useRef(onCompareRows);
  onCompareRowsRef.current = onCompareRows;
  useEffect(() => {
    onCompareRowsRef.current?.(cambiosClienteRows);
  }, [cambiosClienteRows]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="space-y-4">
        <FormFieldsRenderer
          idPrefix={config.title}
          fields={formFields}
          values={values}
          onChange={() => undefined}
        />
        {!onCompareRows && cambiosClienteRows.length > 0 && (
          <EntidadComparePanel
            titulo={config.title}
            showEntity={false}
            readOnly
            rows={cambiosClienteRows}
          />
        )}
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
      <SeccionHeader titulo={config.title} />
      <FormFieldsRenderer
        idPrefix={config.title}
        fields={formFields}
        values={values}
        onChange={handleValuesPatch}
        onFieldChange={handleFieldChange}
      />
      {typeof onSave === "function" && (
        <div className="flex justify-end">
          <Button onClick={() => onSave()} disabled={isSaving || !isValid}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      )}

      <Dialog open={openCrearEntidad} onOpenChange={(open) => !open && setOpenCrearEntidad(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{config.dialogs.entidad}</DialogTitle>
          </DialogHeader>
          <NuevaEntidadCaptura
            apiMode={apiMode}
            tipo={config.tipo}
            onCreate={handleEntidadCreada}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const EntidadPublicFormSection = memo(EntidadPublicFormSectionBase);
