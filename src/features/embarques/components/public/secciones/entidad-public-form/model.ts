/**
 * Lógica pura del formulario público de entidad (Shipper/Consignatario):
 * valores iniciales, autorrelleno desde el maestro de entidades relacionadas y
 * filas del panel "Cambios del cliente". Portado del legacy
 * `entidadPublicFormSection.jsx` sin la parte de estado/efectos (ver
 * use-entidad-public-form.ts).
 */

import { getModifiedFields, unionModificados } from "../validation";

export type JsonRecord = Record<string, unknown>;

export interface OpcionCatalogo {
  value: string | number;
  label: string;
}

/** Nombres de campo del formulario — idénticos para shipper y consignatario. */
export const ENTIDAD_PUBLIC_FORM_KEYS = {
  entityField: "entidad_id",
  nombreField: "entidad_nombre",
  paisField: "entidad_pais",
  ciudadField: "direccion_recoleccion_ciudad",
  industriaField: "entidad_industria",
  addressField: "direccion_recoleccion",
  addressCountryField: "direccion_recoleccion_pais",
  addressDeptoField: "direccion_recoleccion_depto",
  addressMuniField: "direccion_recoleccion_muni",
  contactField: "entidad_contacto_nombre",
  contactIdField: "entidadcontacto_id",
  phoneField: "entidad_contacto_telefono",
  emailField: "entidad_contacto_email",
  identNumeroField: "entidad_nit",
} as const;

export const ENTIDAD_PUBLIC_REQUIRED_FIELDS = new Set([
  "entidad_nombre",
  "direccion_recoleccion",
  "entidad_nit",
  "entidad_contacto_nombre",
  "entidad_contacto_email",
  "entidad_contacto_telefono",
  // G14: el legacy también exige país/industria de la entidad y país de la
  // dirección de recolección (`REQUIRED_FIELDS` en entidadPublicFormSection.jsx).
  "entidad_pais",
  "entidad_industria",
  "direccion_recoleccion_pais",
]);

/** Tipo de dirección "recolección" en el maestro de la entidad. */
export const DIRECCION_TIPO_RECOLECCION = 145;

export interface EntidadPublicConfig {
  title: string;
  sectionLabel?: string;
  /** Valores normalizados de tipo_relacion/clasificación que matchean el rol. */
  aliases: Set<string>;
  /** cod_tipo de la entidad para el modal "Crear Entidad". */
  tipo: number;
  nitCodIdentificacion: number;
  /** Clave en `data` de la dirección (direccionRecoleccion | direccion). */
  addressDataKey: string;
  /** Clave en `data` del teléfono (telefono | telefonos). */
  phoneDataKey: string;
  hideIdentificacion?: boolean;
  hiddenFields?: Set<string>;
  /** Campos que se muestran con los datos existentes, pero no se pueden editar. */
  readOnlyFields?: Set<string>;
  /**
   * Tipo con el que se consulta `recuperar-datos-entidad-relacionada`.
   * Si no se indica, se conserva el tipo de la entidad cliente del link.
   */
  datosRelacionadosCodTipo?: number;
  /**
   * Completa la ficha relacionada con `recuperar-datos-entidad`. Se desactiva
   * cuando la respuesta de entidades relacionadas es la fuente autoritativa.
   */
  useEntidadFallback?: boolean;
  hideNuevoEntidad?: boolean;
  /**
   * Hidrata los sub-registros (dirección/NIT/contactos) desde el maestro del
   * CLIENTE cuando la ficha propia de la entidad no los tiene. Las fichas de
   * rol (p.ej. SH### del shipper) son cascarones: existen para la relación,
   * pero dirección de recolección, NIT y contactos están registrados en la
   * ficha del cliente. Sin esto el operador ve vacío lo que el cliente sí ve.
   */
  fallbackMaestroCliente?: boolean;
  dialogs: { entidad: string };
}

export function normalizeLabel(v: unknown): string {
  return String(v || "")
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();
}

/**
 * `entidad_nombre` a veces llega vacío en el snapshot (p.ej. entidades creadas
 * como "candidato"); el nombre real vive en `data_nombres[0]`. Sin este
 * fallback esas entidades quedan sin label y desaparecen del selector.
 */
export function resolveEntidadNombre(ent: JsonRecord | null | undefined): string {
  const nombres = Array.isArray(ent?.data_nombres) ? (ent.data_nombres as JsonRecord[]) : [];
  return String(ent?.entidad_nombre || nombres[0]?.entidadnombre_nombre || "");
}

/**
 * Códigos de tipo de contacto: `data_entidad_contacto_tipo` llega como JSON
 * string con objetos {cod_tipo,…}; también acepta array directo o fallback a
 * `lista_cod_tipo`.
 */
export function extractContactoTipoList(contacto: JsonRecord | null | undefined): string[] {
  if (!contacto) return [];
  let raw: unknown =
    contacto.data_entidad_contacto_tipo ?? contacto.lista_cod_tipo ?? contacto._contacto_tipo_list;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      raw = [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) =>
      String((t as JsonRecord)?.cod_tipo ?? (t as JsonRecord)?.COD_TIPO ?? (t as unknown) ?? ""),
    )
    .filter(Boolean);
}

export function pickEntidadIdFromData(
  d: JsonRecord | null | undefined,
  fallback: unknown,
): string | number {
  const id = d?.entidad_id;
  if (id !== undefined && id !== null && id !== "") return id as string | number;
  if (fallback !== undefined && fallback !== null && fallback !== "")
    return fallback as string | number;
  return "";
}

export interface EntidadPublicFormValues extends JsonRecord {
  entidad_id: string | number;
  entidad_nombre: string;
  entidad_pais: string;
  direccion_recoleccion: string;
  direccion_recoleccion_pais: string;
  direccion_recoleccion_ciudad: string;
  direccion_recoleccion_depto: string;
  direccion_recoleccion_muni: string;
  entidad_industria: string;
  entidadcontacto_id: string;
  entidad_contacto_nombre: string;
  entidad_contacto_telefono: string;
  entidad_contacto_email: string;
  _contacto_tipo_list: string[];
  entidad_nit: string;
}

export function buildInitialValues(
  d: JsonRecord | null | undefined,
  config: Pick<EntidadPublicConfig, "addressDataKey" | "phoneDataKey">,
): EntidadPublicFormValues {
  const texto = (v: unknown) => (v === undefined || v === null ? "" : String(v));
  return {
    entidad_id: pickEntidadIdFromData(d, ""),
    entidad_nombre: texto(d?.nombre),
    entidad_pais: texto(d?.paisDestino),
    direccion_recoleccion: texto(d?.[config.addressDataKey]),
    direccion_recoleccion_pais: texto(d?.paisDestino),
    direccion_recoleccion_ciudad: texto(d?.ciudadDestino),
    direccion_recoleccion_depto: texto(d?.departamentoDestino),
    direccion_recoleccion_muni: texto(d?.municipioDestino),
    entidad_industria: texto(d?.industria),
    entidadcontacto_id: d?.entidadcontacto_id != null ? String(d.entidadcontacto_id) : "",
    entidad_contacto_nombre: texto(d?.contacto),
    entidad_contacto_telefono: texto(d?.[config.phoneDataKey]),
    entidad_contacto_email: texto(d?.email),
    _contacto_tipo_list: extractContactoTipoList(d),
    entidad_nit: texto(d?.nit),
    entidaddireccion_id: d?.entidaddireccion_id ?? null,
    entidadidentificacion_id: d?.entidadidentificacion_id ?? null,
  };
}

/** Sub-registros del maestro de una entidad relacionada, ya localizados. */
export interface MaestroEntidad {
  contacto: JsonRecord | null;
  direccion: JsonRecord | null;
  nit: string;
}

export function extraerMaestroEntidad(ent: JsonRecord | null | undefined): MaestroEntidad {
  const contactos = Array.isArray(ent?.data_contactos) ? (ent.data_contactos as JsonRecord[]) : [];
  const direcciones = Array.isArray(ent?.data_direcciones)
    ? (ent.data_direcciones as JsonRecord[])
    : [];
  const identificaciones = Array.isArray(ent?.data_identificaciones)
    ? (ent.data_identificaciones as JsonRecord[])
    : [];
  const nit = identificaciones.find(
    (i) => String(i.nom_identificacion || "").toLowerCase() === "nit",
  );
  return {
    contacto: contactos[0] ?? null,
    direccion: direcciones.find((d) => Number(d.cod_tipo) === DIRECCION_TIPO_RECOLECCION) ?? null,
    nit: String(nit?.entidadidentificacio_numero || ""),
  };
}

/** `_modificados` a reportar: unión de los persistidos y los de esta sesión. */
export function calcularModificados(
  persistidos: unknown,
  baseline: JsonRecord,
  values: JsonRecord,
): string[] {
  return unionModificados(
    Array.isArray(persistidos) ? (persistidos as string[]) : [],
    getModifiedFields(baseline, values),
  );
}
