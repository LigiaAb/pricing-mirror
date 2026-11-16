"use client";

/**
 * Estado del formulario público de entidad (Shipper/Consignatario), portado de
 * `entidadPublicFormSection.jsx`. Regla central: `baselineRef` es la línea base
 * para detectar ediciones REALES del cliente — arranca en los valores iniciales
 * y se actualiza junto con cada auto-relleno del maestro, para que los defaults
 * heredados no cuenten como "modificados"; solo lo que el cliente cambia a mano
 * respecto a esa línea base entra en `_modificados`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeKeys } from "@/features/carta-instrucciones";
import {
  useFetchDatosEntidadRelacionadaPrivado,
  useFetchDatosEntidadRelacionadaPublico,
} from "@/features/entidades";
import {
  aplicarSnapshotPreservandoModificados,
  CAMPOS_ENTIDAD_LIMPIOS,
  construirAutofillPatch,
  construirParcheCambioCampo,
  construirParcheEntidadCreada,
} from "./autofill";
import {
  buildInitialValues,
  type EntidadPublicConfig,
  type EntidadPublicFormValues,
  extraerMaestroEntidad,
  type JsonRecord,
  ENTIDAD_PUBLIC_FORM_KEYS as K,
  normalizeLabel,
  pickEntidadIdFromData,
} from "./model";
import { useEntidadFallback } from "./use-entidad-fallback";
import { useEntidadPublicCatalogos } from "./use-entidad-public-catalogos";
import { resolverPaisDestino, useResolverNombreACodigo } from "./use-resolver-codigo";

export interface UseEntidadPublicFormParams {
  config: EntidadPublicConfig;
  data: JsonRecord;
  cliInfo: JsonRecord | null;
  selectedEntidadId: string | number | null;
  apiMode: "public" | "private";
  isSaving: boolean;
  /** El token público se setea async en el padre; sin esto los fetch públicos disparan sin Authorization. */
  tokenReady: boolean;
}

export function useEntidadPublicForm({
  config,
  data,
  cliInfo,
  selectedEntidadId,
  apiMode,
  isSaving,
  tokenReady,
}: UseEntidadPublicFormParams) {
  const [values, setValues] = useState<EntidadPublicFormValues>(() =>
    buildInitialValues(
      { ...data, entidad_id: pickEntidadIdFromData(data, selectedEntidadId) },
      config,
    ),
  );
  const baselineRef = useRef<JsonRecord>(values);
  const [modoNuevaEntidad, setModoNuevaEntidad] = useState(false);
  // "Nuevo" en Contacto no abre modal: bloquea el selector y deja los campos
  // nombre/email/teléfono libres para capturar un contacto nuevo en el form.
  const [modoNuevoContacto, setModoNuevoContacto] = useState(false);
  const [openCrearEntidad, setOpenCrearEntidad] = useState(false);

  // --- entidades relacionadas del cliente -----------------------------------
  const entidadesRelParams = {
    entidad_id: cliInfo?.entidad_id,
    cod_tipo: config.datosRelacionadosCodTipo ?? cliInfo?.cod_tipo ?? 3,
    cod_estado: 1,
  };
  const habilitado = Boolean(cliInfo?.entidad_id);
  const esPrivado = apiMode === "private";
  const relPrivado = useFetchDatosEntidadRelacionadaPrivado(entidadesRelParams, {
    enabled: esPrivado && habilitado,
  });
  const relPublico = useFetchDatosEntidadRelacionadaPublico(entidadesRelParams, {
    enabled: !esPrivado && tokenReady && habilitado,
  });
  const entidadesRelQuery = esPrivado ? relPrivado : relPublico;
  const allEntidades = useMemo(
    () => (entidadesRelQuery.data?.data || []).map((e) => normalizeKeys(e)),
    [entidadesRelQuery.data],
  );
  const entidadesRelLoading = entidadesRelQuery.isLoading;

  // Fallback de resolución de entidad no relacionada (plan §7.D.6).
  const entidadFallback = useEntidadFallback({
    apiMode,
    entidadSeleccionadaId: values.entidad_id,
    codTipo: config.tipo,
    tokenReady,
    enabled: config.useEntidadFallback !== false,
    ...(config.fallbackMaestroCliente
      ? { clienteId: cliInfo?.entidad_id, clienteCodTipo: Number(cliInfo?.cod_tipo ?? 3) }
      : {}),
  });

  const findEntidadById = useCallback(
    (id: unknown): JsonRecord | null => {
      if (id === undefined || id === null || id === "") return null;
      const found = allEntidades.find((e) => String(e.entidad_id) === String(id));
      if (entidadFallback && String(entidadFallback.entidad_id) === String(id)) {
        // El detalle puntual contiene los sub-registros completos (dirección,
        // NIT y contactos); la relación conserva metadatos que el detalle no
        // entrega, por lo que se combinan con prioridad del detalle.
        return { ...(found ?? {}), ...entidadFallback };
      }
      return found ?? null;
    },
    [allEntidades, entidadFallback],
  );

  // `descripcion_tipo_relacion` describe la RELACIÓN (300, "relacionada al
  // cliente"), no el tipo de la entidad — el backend devuelve el mismo texto
  // para todas las filas. Se prioriza `entidad_clasificacion` y solo se cae a
  // la descripción de la relación cuando la clasificación viene vacía.
  const entidades = useMemo(
    () =>
      allEntidades.filter((e) => {
        const clasificacion = normalizeLabel(e.entidad_clasificacion);
        if (clasificacion) return config.aliases.has(clasificacion);
        return config.aliases.has(normalizeLabel(e.descripcion_tipo_relacion));
      }),
    [allEntidades, config.aliases],
  );

  // --- catálogos -------------------------------------------------------------
  const rawEntidadActual = useMemo(
    () => findEntidadById(values.entidad_id),
    [findEntidadById, values.entidad_id],
  );
  const masterAddr = useMemo(
    () => extraerMaestroEntidad(rawEntidadActual).direccion,
    [rawEntidadActual],
  );
  const catalogos = useEntidadPublicCatalogos({
    apiMode,
    tokenReady,
    codPaisInfo: String(values.entidad_pais ?? ""),
    codPaisDir: String(values.direccion_recoleccion_pais ?? ""),
    codDepto: String(values.direccion_recoleccion_depto ?? ""),
    masterCodPais: String(masterAddr?.cod_pais ?? ""),
    masterCodDepto: String(masterAddr?.cod_depto ?? ""),
  });

  const resolvedData = useMemo(
    () => resolverPaisDestino(data, catalogos.paisesRaw),
    [data, catalogos.paisesRaw],
  );

  // Campos que el cliente ya modificó explícitamente (persistidos al guardar):
  // ni el auto-relleno ni el reset deben pisarlos con "" aunque un snapshot
  // recién refetcheado (o momentáneamente incompleto) los traiga vacíos.
  const explicitlyModifiedKeys = useMemo(
    () => new Set(Array.isArray(data?._modificados) ? (data._modificados as string[]) : []),
    [data],
  );

  // --- reset cuando cambia el snapshot guardado ------------------------------
  const resolvedDataSig = useMemo(() => JSON.stringify(resolvedData || {}), [resolvedData]);
  const lastResolvedSig = useRef<string | null>(null);
  const lastSelectedSig = useRef<string | null>(null);
  useEffect(() => {
    const selectedSig = selectedEntidadId == null ? "" : String(selectedEntidadId);
    if (lastResolvedSig.current === resolvedDataSig && lastSelectedSig.current === selectedSig) {
      return;
    }
    lastResolvedSig.current = resolvedDataSig;
    lastSelectedSig.current = selectedSig;
    const nuevos = buildInitialValues(
      {
        ...(resolvedData || {}),
        entidad_id: pickEntidadIdFromData(resolvedData, selectedEntidadId),
      },
      config,
    );
    setValues((prev) => {
      const patched = aplicarSnapshotPreservandoModificados(nuevos, prev, explicitlyModifiedKeys);
      // La línea base refleja lo aplicado a `values` (no `nuevos` sin parchar),
      // o `hasChanges` compararía contra un valor que nunca se mostró.
      baselineRef.current = patched;
      return patched;
    });
    // Entidad guardada como "nueva" sin entidad_id (creada vía "Nuevo" en la
    // vista pública): sin id guardado NI seleccionado, forzar el modo "nueva
    // entidad" para que el selector no muestre la entidad anterior.
    const entidadIdVacio =
      resolvedData?.entidad_id === "" || resolvedData?.entidad_id === undefined;
    const sinSeleccion =
      selectedEntidadId === undefined || selectedEntidadId === null || selectedEntidadId === "";
    if (entidadIdVacio && sinSeleccion && resolvedData?.nombre) {
      setModoNuevaEntidad(true);
      setModoNuevoContacto(true);
    }
  }, [resolvedDataSig, resolvedData, config, selectedEntidadId, explicitlyModifiedKeys]);

  // --- auto-relleno desde el maestro de la entidad seleccionada --------------
  // Se re-dispara cuando cambia el snapshot o al terminar un guardado: el GET
  // posterior al POST puede devolver un snapshot incompleto y dejar en blanco
  // campos que ya estaban completos.
  const lastAutoSig = useRef<string | null>(null);
  useEffect(() => {
    const id = values.entidad_id;
    if (!id) return;
    const ent = findEntidadById(id);
    if (!ent) return;
    // La lista relacionada llega antes que el detalle completo. Incluir el
    // contenido resuelto evita que el primer intento (aún sin sub-registros)
    // impida el autorrelleno cuando lleguen dirección, contacto y NIT.
    const sig = `${id}|${resolvedDataSig}|${isSaving}|${JSON.stringify(ent)}`;
    if (lastAutoSig.current === sig) return;
    lastAutoSig.current = sig;
    // Los campos configurados como solo lectura se muestran siempre desde el
    // maestro. Un `_modificados` histórico de la carta no puede impedir que
    // se rellenen con los datos vigentes de Shipper.
    const canFill = (key: string) =>
      config.readOnlyFields?.has(key) || !explicitlyModifiedKeys.has(key);
    setValues((prev) => {
      const patch = construirAutofillPatch(prev, ent, canFill);
      if (Object.keys(patch).length === 0) return prev;
      baselineRef.current = { ...baselineRef.current, ...patch };
      return { ...prev, ...patch };
    });
  }, [
    values.entidad_id,
    findEntidadById,
    explicitlyModifiedKeys,
    config.readOnlyFields,
    resolvedDataSig,
    isSaving,
  ]);

  // En Shipper los campos de entidad son de consulta. Al terminar la carga
  // del detalle puntual, se reemplazan con el maestro aunque el snapshot de
  // la carta traiga valores vacíos o modificaciones históricas. El contacto
  // conserva su edición normal; solo se completa si todavía está vacío.
  useEffect(() => {
    const readOnlyFields = config.readOnlyFields;
    if (!entidadFallback || !readOnlyFields?.size) return;
    setValues((prev) => {
      const valuesToHydrate = { ...prev };
      for (const key of readOnlyFields) valuesToHydrate[key] = "";
      const patch = construirAutofillPatch(valuesToHydrate, entidadFallback, () => true);
      if (Object.keys(patch).length === 0) return prev;
      baselineRef.current = { ...baselineRef.current, ...patch };
      return { ...prev, ...patch } as EntidadPublicFormValues;
    });
  }, [entidadFallback, config.readOnlyFields]);

  // --- resolver nombre → código de depto/muni guardados como texto -----------
  const aplicarDepto = useCallback(
    (codigo: string) => setValues((prev) => ({ ...prev, direccion_recoleccion_depto: codigo })),
    [],
  );
  const aplicarMuni = useCallback(
    (codigo: string) => setValues((prev) => ({ ...prev, direccion_recoleccion_muni: codigo })),
    [],
  );
  useResolverNombreACodigo(
    catalogos.departamentoOptions,
    values.direccion_recoleccion_depto,
    aplicarDepto,
  );
  useResolverNombreACodigo(
    catalogos.municipioOptions,
    values.direccion_recoleccion_muni,
    aplicarMuni,
  );

  // --- cambio de campo con parche satélite ------------------------------------
  const handleFieldChange = useCallback(
    (key: string, value: unknown): JsonRecord => {
      const ent = key === K.entityField ? findEntidadById(value) : null;
      const patch = construirParcheCambioCampo(key, value, ent, rawEntidadActual);
      if (key === K.entityField) {
        // Defaults del maestro de la entidad recién seleccionada, no ediciones
        // manuales: no deben contar como "modificados".
        baselineRef.current = { ...baselineRef.current, ...patch };
      }
      return patch;
    },
    [findEntidadById, rawEntidadActual],
  );

  const limpiarCamposEntidad = useCallback((resetBaseline: boolean) => {
    // Al iniciar "Nuevo" se limpian TODOS los campos heredados Y la línea base:
    // si quedaran con el valor de la entidad anterior (fijado por el auto-
    // relleno), `getModifiedFields` no detectaría diferencia y esos valores
    // nunca entrarían en `_modificados` — se perderían al guardar aunque se
    // vean rellenos en pantalla.
    if (resetBaseline) {
      baselineRef.current = { ...baselineRef.current, ...CAMPOS_ENTIDAD_LIMPIOS };
    }
    setValues((prev) => ({ ...prev, ...CAMPOS_ENTIDAD_LIMPIOS }) as EntidadPublicFormValues);
  }, []);

  const handleEntidadCreada = useCallback((optionEntidad: JsonRecord) => {
    setValues(
      (prev) =>
        ({ ...prev, ...construirParcheEntidadCreada(optionEntidad) }) as EntidadPublicFormValues,
    );
    setOpenCrearEntidad(false);
    setModoNuevaEntidad(true);
    setModoNuevoContacto(true);
  }, []);

  return {
    values,
    setValues,
    baselineRef,
    allEntidades,
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
    explicitlyModifiedKeys,
  };
}
