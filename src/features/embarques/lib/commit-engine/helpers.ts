/**
 * Helpers puros del motor "Crear Coordinación" (port de useCommitPendingChanges
 * del legacy). Sin I/O: todo lo que toca red vive en entidad-lookup /
 * commit-entidad / commit-pending-changes.
 */

import type { JsonRecord, OpcionCatalogo, RolCommit } from "./tipos";

export const toNum = (v: unknown): number | null =>
  v === undefined || v === null || v === "" ? null : Number(v);

/**
 * El núcleo HTTP no rechaza cuando el backend responde HTTP 200 con
 * `success: false` (solo lanza en !response.ok / sesión expirada). Sin esta
 * verificación explícita, un POST que falla a mitad de "Crear Coordinación"
 * se trataba como exitoso y la cadena seguía, dejando la coordinación a medio
 * armar. El body real va en `result.data` (sobre `{data: {success, mensaje}}`).
 */
export function assertOk<T>(result: T, accion: string): T {
  const payload = ((result as JsonRecord | null | undefined)?.data ?? result) as
    | JsonRecord
    | null
    | undefined;
  if (payload && payload.success === false) {
    const mensaje = typeof payload.mensaje === "string" ? payload.mensaje : "";
    throw new Error(mensaje || `No se pudo ${accion}.`);
  }
  return result;
}

/** Normaliza para comparar nombres de entidad sin importar acentos/mayúsculas. */
export const normalizeNombreEntidad = (v: unknown): string =>
  String(v || "")
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();

/** Clasificaciones/relaciones que cuentan como cada rol al buscar por nombre. */
export const ROLE_ALIASES: Record<RolCommit, ReadonlySet<string>> = {
  shipper: new Set(["SHIPPER", "CONSIGNOR", "REMITENTE", "EXPORTADOR", "CLIENTE"]),
  consignatario: new Set(["CONSIGNATARIO", "CONSIGNEE", "DESTINATARIO"]),
};

/** tipo_entidad (texto) que espera lista-entidad para la búsqueda global por nombre. */
export const ROLE_TIPO_ENTIDAD_NOMBRE: Record<RolCommit, string> = {
  shipper: "SHIPPER",
  consignatario: "CONSIGNATARIO",
};

export const ROLE_COORD_FIELDS: Record<RolCommit, { entidadField: string; contactoField: string }> =
  {
    shipper: { entidadField: "cod_entidad_shipper", contactoField: "contacto_id_shipper" },
    consignatario: {
      entidadField: "cod_entidad_consignatario",
      contactoField: "contacto_id_consignatario",
    },
  };

/**
 * Nombre a usar al crear una entidad NUEVA cuando `carta_${rol}.entidad_nombre`
 * no viajó en los mods: para el shipper el formulario pre-rellena el Nombre con
 * el del cliente, así que si el asesor no lo edita nunca entra en
 * `_modificados` — sin este fallback la entidad quedaba sin nombre y no se
 * creaba. El consignatario no hereda ese pre-relleno.
 */
export const ROLE_NOMBRE_FALLBACK: Record<RolCommit, (lc: JsonRecord) => string> = {
  shipper: (lc) =>
    String(lc?.entidad_nombre ?? lc?.cliente ?? lc?.entidadShipperNombre ?? lc?.nombreExp ?? ""),
  consignatario: (lc) => String(lc?.entidadConsignatarioNombre ?? ""),
};

/**
 * La sección Facturación guarda los cambios del cliente con nombres de campo
 * propios (camelCase) distintos a los canónicos que espera commitEntidad (los
 * mismos de shipper/consignatario). Sin esta traducción, `_modificados` nunca
 * coincide con infoFields/contactFields/… y la entidad de facturación no se
 * actualiza (Ciudad, Email, Nombre, NIT, etc.).
 */
const FACTURACION_FIELD_MAP: Record<string, string> = {
  cliente: "entidad_nombre",
  entidadPais: "entidad_pais",
  entidadCiudad: "direccion_recoleccion_ciudad",
  entidadIndustria: "entidad_industria",
  direccionFiscal: "direccion_recoleccion",
  direccionFiscalPais: "direccion_recoleccion_pais",
  direccionFiscalDepto: "direccion_recoleccion_depto",
  direccionFiscalMuni: "direccion_recoleccion_muni",
  clienteContacto: "entidad_contacto_nombre",
  clienteContactoEmail: "entidad_contacto_email",
  clienteContactoTelefono: "entidad_contacto_telefono",
  numero: "entidad_nit",
};

/**
 * Traduce el objeto `carta_facturacion.cliente` al shape canónico (valores +
 * `_modificados`) que consume commitEntidad. Las claves sin mapeo
 * (_contacto_tipo_list, entidadcontacto_id, entidad_id) pasan tal cual.
 */
export function mapFacturacionMods(cliente: unknown): JsonRecord | null {
  if (!cliente || typeof cliente !== "object" || Array.isArray(cliente)) return null;
  const origen = cliente as JsonRecord;
  const mapped: JsonRecord = {};
  for (const [key, value] of Object.entries(origen)) {
    if (key === "_modificados") continue;
    mapped[FACTURACION_FIELD_MAP[key] ?? key] = value;
  }
  const modificados = Array.isArray(origen._modificados) ? (origen._modificados as string[]) : [];
  mapped._modificados = modificados.map((m) => FACTURACION_FIELD_MAP[m] ?? m);
  return mapped;
}

export function parseJsonOpcionales(embarqueData: JsonRecord | null | undefined): JsonRecord {
  const raw =
    embarqueData?.json_datos_opcionales ??
    embarqueData?.jsonDatosOpcionales ??
    embarqueData?.json_atributos_opcionales ??
    embarqueData?.jsonAtributosOpcionales ??
    null;
  if (!raw) return {};
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as JsonRecord)
      : {};
  } catch {
    return {};
  }
}

/**
 * Resuelve un label guardado en la carta (o un id numérico crudo) contra un
 * catálogo `{value,label}` / `{codTipo,…}`.
 */
export function resolveCatalogValue(
  rawValue: unknown,
  catalog: OpcionCatalogo[] = [],
): number | string | null {
  if (rawValue === undefined || rawValue === null || rawValue === "") return null;
  const found = (catalog || []).find((opt) => String(opt.label) === String(rawValue));
  if (found) {
    return (found.value ?? found.codTipo ?? found.cod_tipo ?? found.cod_relacion_tipo ?? null) as
      | number
      | string
      | null;
  }
  const asNum = Number(rawValue);
  return Number.isNaN(asNum) ? null : asNum;
}
