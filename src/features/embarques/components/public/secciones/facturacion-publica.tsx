"use client";

import { Building2, FileText, Loader2, MapPin, Phone, RefreshCw } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  useFetchDatosEntidadPrivado,
  useFetchDatosEntidadPublico,
  useFetchEntidades,
} from "@/features/entidades";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { Button } from "@/shared/components/ui/button";
import { asText } from "@/shared/lib/text";
import { SeccionHeader } from "../seccion-header";
import type { CampoEntidadPublic } from "./entidad-public-form/fields";
import { FormFieldsRenderer } from "./entidad-public-form/form-fields-renderer";
import { getModifiedFields, unionModificados } from "./validation";

type JsonRecord = Record<string, unknown>;

const REQUIRED_KEYS = ["entidad_id", "cliente", "numero"] as const;

/** Tipo de entidad pre-cliente (sin clasificación CLIENTE todavía). */
const COD_TIPO_PRE_CLIENTE = 5;
const COD_TIPO_CLIENTE = 3;
/** Dirección a precargar: FACTURACION (12) → FISCAL (11) → primera activa. */
const DIRECCION_TIPO_FACTURACION = 12;
const DIRECCION_TIPO_FISCAL = 11;

function pick(...vals: unknown[]): string {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return "";
}

/** Sin inactivos; si todos están inactivos devuelve la lista original. */
function onlyActive(arr: JsonRecord[]): JsonRecord[] {
  const activos = arr.filter((x) => Number(x.cod_estado) === 1);
  return activos.length ? activos : arr;
}

function findFiscalDireccion(dirs: JsonRecord[]): JsonRecord | null {
  const pool = onlyActive(dirs);
  return (
    pool.find((d) => Number(d.cod_tipo) === DIRECCION_TIPO_FACTURACION) ??
    pool.find((d) => Number(d.cod_tipo) === DIRECCION_TIPO_FISCAL) ??
    pool[0] ??
    null
  );
}

/** NIT: identificación llamada "NIT", luego códigos conocidos (46/3), luego la primera. */
function findNit(idents: JsonRecord[]): JsonRecord | null {
  const pool = onlyActive(idents);
  return (
    pool.find((i) => String(i.nom_identificacion ?? "").toLowerCase() === "nit") ??
    pool.find((i) => ["46", "3"].includes(String(i.cod_identificacion))) ??
    pool[0] ??
    null
  );
}

interface CliInfo {
  entidad_id?: number | string | null;
}

/** Acciones "Agregar" para completar datos faltantes de la entidad cliente —
 * solo la usa gestión-embarques (editable); el wizard CTS/público no las pasa. */
interface FacturacionQuickCreateActions {
  readonly onAgregarNit?: () => void;
  readonly onAgregarDireccion?: () => void;
  readonly onAgregarContacto?: () => void;
}

interface FacturacionPublicaProps {
  /** Salida de construirFacturacionPublica (para _modificadosCliente previos). */
  readonly data?: JsonRecord;
  readonly isLoading?: boolean;
  readonly onValidityChange?: ((valid: boolean | "pending" | "pre-cliente") => void) | undefined;
  readonly onValuesChange?: ((values: { cliente: JsonRecord }) => void) | undefined;
  readonly cliInfo?: CliInfo | null;
  readonly selectedEntidadId?: number | string | null;
  readonly contactoIdCliente?: number | string | null;
  readonly apiMode?: "public" | "private";
  /** El token público se setea async en el padre; sin esto el fetch público dispara sin Authorization. */
  readonly tokenReady?: boolean;
  /** Botón "Recargar" junto al título — solo lo usa gestión-embarques. */
  readonly onRefresh?: () => void;
  readonly quickCreate?: FacturacionQuickCreateActions;
}

function campoConBoton(
  base: CampoEntidadPublic,
  boton?: { visible: boolean; onClick: () => void },
): CampoEntidadPublic[] {
  if (!boton) return [base];
  return [
    { ...base, colSpan: 10 },
    {
      key: `__btn_${base.key}__`,
      type: "button",
      colSpan: 2,
      action: { visible: boton.visible, enabled: true, nombre: "Agregar", onClick: boton.onClick },
    },
  ];
}

function buildCampos(
  values: Record<string, string>,
  quickCreate?: FacturacionQuickCreateActions,
): CampoEntidadPublic[] {
  const tieneEntidad = Boolean(values.entidad_id);
  return [
    { key: "__section_info__", label: "Información", type: "section", icon: Building2 },
    { key: "cliente", label: "Nombre", type: "text", required: true, readOnly: true },
    { key: "__section_direccion__", label: "Dirección Fiscal", type: "section", icon: MapPin },
    ...campoConBoton(
      {
        key: "direccionFiscal",
        label: "Dirección Fiscal",
        type: "textarea",
        rows: 2,
        readOnly: true,
      },
      quickCreate?.onAgregarDireccion && {
        visible: tieneEntidad && !values.direccionFiscal,
        onClick: quickCreate.onAgregarDireccion,
      },
    ),
    { key: "__section_contacto__", label: "Contacto", type: "section", icon: Phone },
    ...campoConBoton(
      { key: "clienteContacto", label: "Nombre Contacto", type: "text", readOnly: true },
      quickCreate?.onAgregarContacto && {
        visible: tieneEntidad && !values.clienteContacto,
        onClick: quickCreate.onAgregarContacto,
      },
    ),
    { key: "clienteContactoEmail", label: "Email", type: "email", readOnly: true },
    { key: "clienteContactoTelefono", label: "Teléfono", type: "text", readOnly: true },
    { key: "__section_identificacion__", label: "Identificación", type: "section", icon: FileText },
    ...campoConBoton(
      { key: "numero", label: "NIT", type: "text", required: true, readOnly: true },
      quickCreate?.onAgregarNit && {
        visible: tieneEntidad && !values.numero,
        onClick: quickCreate.onAgregarNit,
      },
    ),
  ];
}

/**
 * Sección de Facturación (pública y privada): SIEMPRE de solo lectura — refleja
 * el maestro de `recuperar-datos-entidad` de la entidad cliente fijada por la
 * coordinación (`selectedEntidadId` = entidadIdCli; contacto preseleccionado por
 * `contactoIdCliente`). En privado detecta pre-cliente (lista-entidad tipo
 * CLIENTE vacía → cod_tipo 5) y reporta el estado "pre-cliente".
 */
function FacturacionPublica({
  data,
  isLoading = false,
  onValidityChange,
  onValuesChange,
  cliInfo = null,
  selectedEntidadId = null,
  contactoIdCliente = null,
  apiMode = "public",
  tokenReady = true,
  onRefresh,
  quickCreate,
}: FacturacionPublicaProps) {
  const isPublic = apiMode !== "private";
  // Entidad cliente: la elegida en la coordinación; cae al token público.
  const entidadId = pick(selectedEntidadId, cliInfo?.entidad_id) || null;

  const publicQuery = useFetchDatosEntidadPublico(
    { entidad_id: entidadId },
    { enabled: isPublic && tokenReady && Boolean(entidadId) },
  );

  // En privado, recuperar-datos-entidad filtra por cod_tipo (default CLIENTE).
  // Si la entidad no está clasificada como CLIENTE (pre-cliente), la consulta
  // con cod_tipo 3 vuelve vacía: se detecta y se consulta con cod_tipo 5.
  const { data: clienteEntidades = [], isSuccess: clienteQueryDone } = useFetchEntidades(
    { tipo_entidad: "CLIENTE", entidad_id: entidadId },
    { enabled: !isPublic && Boolean(entidadId) },
  );
  const esPreCliente = !isPublic && clienteQueryDone && clienteEntidades.length === 0;
  const codTipoCliente =
    (clienteEntidades[0] as { cod_tipo?: number | string } | undefined)?.cod_tipo ??
    (esPreCliente ? COD_TIPO_PRE_CLIENTE : COD_TIPO_CLIENTE);

  const privateQuery = useFetchDatosEntidadPrivado(
    { entidad_id: entidadId, cod_tipo: codTipoCliente },
    { enabled: !isPublic && Boolean(entidadId) && clienteQueryDone },
  );

  const activeQuery = isPublic ? publicQuery : privateQuery;
  const entidadData = activeQuery.data;
  const entidadLoading = activeQuery.isLoading;

  // Valores base: siempre el maestro de recuperar-datos-entidad (formulario de
  // solo lectura), nunca lo guardado previamente por el cliente en `data`.
  const baseValues = useMemo(() => {
    const entity = entidadData?.data_entidad?.[0] ?? null;
    const contactos = entidadData?.data_contactos ?? [];
    const contacto =
      contactos.find((c) => String(c.entidadcontacto_id) === String(contactoIdCliente)) ??
      contactos[0] ??
      null;
    const direccion = findFiscalDireccion(entidadData?.data_direcciones ?? []);
    const nit = findNit(entidadData?.data_identificaciones ?? []);

    return {
      entidad_id: pick(entity?.entidad_id, selectedEntidadId, data?.entidad_id),
      cliente: asText(entity?.entidad_nombre),
      entidadcontacto_id: contacto ? String(contacto.entidadcontacto_id) : "",
      clienteContacto: asText(contacto?.entidadcontacto_nombre),
      clienteContactoEmail: asText(contacto?.entidadcontacto_email),
      clienteContactoTelefono: asText(contacto?.entidadcontacto_telefono),
      direccionFiscal: asText(direccion?.entidaddireccion_direccion),
      numero: asText(nit?.entidadidentificacio_numero),
    };
  }, [entidadData, data, selectedEntidadId, contactoIdCliente]);

  const [values, setValues] = useState<Record<string, string>>(baseValues);

  const baseSig = useMemo(() => JSON.stringify(baseValues), [baseValues]);
  const lastBaseSig = useRef<string | null>(null);
  useEffect(() => {
    if (lastBaseSig.current === baseSig) return;
    lastBaseSig.current = baseSig;
    setValues(baseValues);
  }, [baseSig, baseValues]);

  const isValid = REQUIRED_KEYS.every((k) => String(values[k] ?? "").trim() !== "");
  const hasChanges = useMemo(
    () =>
      Object.keys(baseValues).some(
        (k) => String(values[k] ?? "") !== String(baseValues[k as keyof typeof baseValues] ?? ""),
      ),
    [values, baseValues],
  );

  const lastValiditySig = useRef<string | null>(null);
  useEffect(() => {
    if (typeof onValidityChange !== "function") return;
    let next: boolean | "pending" | "pre-cliente";
    if (esPreCliente && isValid && !hasChanges) {
      next = "pre-cliente";
    } else if (isValid && !hasChanges) {
      next = true;
    } else if (isValid) {
      next = "pending";
    } else {
      next = false;
    }
    const sig = `${next}|${hasChanges}`;
    if (lastValiditySig.current === sig) return;
    lastValiditySig.current = sig;
    onValidityChange(next);
  }, [isValid, hasChanges, esPreCliente, onValidityChange]);

  const lastReportedSig = useRef<string | null>(null);
  useEffect(() => {
    if (typeof onValuesChange !== "function") return;
    // Persistimos siempre entidad_id (entidad de facturación) además de los
    // campos ya modificados por el cliente en la carta.
    const modificados = unionModificados(
      unionModificados(
        Array.isArray(data?._modificadosCliente) ? (data._modificadosCliente as string[]) : [],
        getModifiedFields(baseValues, values),
      ),
      values.entidad_id ? ["entidad_id"] : [],
    );
    const cliente = { ...values, _modificados: modificados };
    const sig = JSON.stringify(cliente);
    if (lastReportedSig.current === sig) return;
    lastReportedSig.current = sig;
    onValuesChange({ cliente });
  }, [values, baseValues, data, onValuesChange]);

  const campos = useMemo(() => buildCampos(values, quickCreate), [values, quickCreate]);

  if (isLoading || entidadLoading) {
    return (
      <div className="flex justify-center py-3">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <BannerInformativo
        ocultar={!esPreCliente}
        severidad="error"
        titulo="Pre-cliente pendiente"
        mensaje="El pre-cliente debe convertirse en cliente."
      />
      <SeccionHeader
        titulo="Facturación"
        acciones={
          onRefresh ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onRefresh}
              aria-label="Recargar"
              title="Recargar"
            >
              <RefreshCw className="size-4" />
            </Button>
          ) : undefined
        }
      />
      <FormFieldsRenderer
        idPrefix="Facturación"
        fields={campos}
        values={values}
        onChange={() => undefined}
      />
    </div>
  );
}

export default memo(FacturacionPublica);
