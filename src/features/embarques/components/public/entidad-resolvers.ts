/**
 * Resolvers puros de fallback contra el maestro de entidades relacionadas del
 * cliente (port de los helpers de public/page.jsx del legacy). Sin estado ni
 * queries: reciben la lista de entidades ya normalizada.
 */

import { normalizeKeys } from "@/features/carta-instrucciones";

export type JsonRecord = Record<string, unknown>;

export const texto = (v: unknown): string => (v === undefined || v === null ? "" : String(v));

export function primeroConDatos(...vals: unknown[]): string {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== "") return String(v);
  }
  return "";
}

// Peligrosidad persiste con formas mixtas (lista de códigos, booleano o "S");
// se normaliza al contrato de DetallesData.
export const normalizarPeligrosidad = (v: unknown): string | string[] | boolean =>
  Array.isArray(v) ? v.map(String) : typeof v === "boolean" ? v : texto(v);

/** Mismos aliases de rol shipper que usa ShipperPublicas. */
const SHIPPER_ALIASES = new Set(["SHIPPER", "CONSIGNOR", "REMITENTE", "EXPORTADOR", "CLIENTE"]);

function normalizeLabel(v: unknown): string {
  return String(v || "")
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();
}

export function soloActivos(arr: JsonRecord[]): JsonRecord[] {
  return arr.filter((x) => x.cod_estado == null || Number(x.cod_estado) === 1);
}

/** Primera entidad relacionada con rol shipper y nombre utilizable. */
export function encontrarShipperFallbackId(entidades: JsonRecord[]): unknown {
  const primera = entidades.find((e) => {
    const clasificacion = normalizeLabel(e.entidad_clasificacion);
    const rol = clasificacion || normalizeLabel(e.descripcion_tipo_relacion);
    const nombres = Array.isArray(e.data_nombres) ? (e.data_nombres as JsonRecord[]) : [];
    return (
      SHIPPER_ALIASES.has(rol) &&
      e.entidad_id &&
      (e.entidad_nombre || nombres[0]?.entidadnombre_nombre)
    );
  });
  return primera?.entidad_id ?? null;
}

/**
 * Aplana la respuesta de `recuperar-datos-entidad` (claves en MAYÚSCULAS,
 * `data_entidad` como array y los sub-registros como arrays hermanos) a la
 * misma forma plana que usa un elemento de `allEntidades`, para poder
 * reutilizar `resolverNombreEntidad`/`resolverNitEntidad`/etc. como fallback
 * puntual cuando la entidad no aparece (o llega incompleta) en esa lista.
 */
export function aplanarEntidadPublica(raw: unknown): JsonRecord | null {
  const detalle = normalizeKeys(raw ?? {}) as JsonRecord;
  const registros = (key: string): JsonRecord[] =>
    Array.isArray(detalle[key]) ? (detalle[key] as JsonRecord[]) : [];
  const base = registros("data_entidad")[0];
  if (!base) return null;
  return {
    ...base,
    data_nombres: registros("data_nombres"),
    data_contactos: registros("data_contactos"),
    data_direcciones: registros("data_direcciones"),
    data_identificaciones: registros("data_identificaciones"),
  };
}

export function buscarEntidad(entidades: JsonRecord[], entidadId: unknown): JsonRecord | null {
  return entidadId == null || entidadId === ""
    ? null
    : (entidades.find((e) => String(e.entidad_id) === String(entidadId)) ?? null);
}

export function resolverNombreEntidad(entidades: JsonRecord[], entidadId: unknown): string {
  const ent = buscarEntidad(entidades, entidadId);
  const nombres = Array.isArray(ent?.data_nombres) ? (ent.data_nombres as JsonRecord[]) : [];
  return texto(ent?.entidad_nombre || nombres[0]?.entidadnombre_nombre || "");
}

export interface ContactoResuelto {
  nombre: string;
  email: string;
  telefono: string;
}

export function resolverContactoEntidad(
  entidades: JsonRecord[],
  entidadId: unknown,
  tiposSeleccionados: unknown[] = [],
  contactoIdPreferido: unknown = null,
): ContactoResuelto {
  const vacio = { nombre: "", email: "", telefono: "" };
  const ent = buscarEntidad(entidades, entidadId);
  const contactos = Array.isArray(ent?.data_contactos) ? (ent.data_contactos as JsonRecord[]) : [];
  if (contactos.length === 0) return vacio;
  const tipos = (tiposSeleccionados || []).map(String);
  const tiposDeContacto = (c: JsonRecord): JsonRecord[] => {
    let raw: unknown = c.data_entidad_contacto_tipo ?? [];
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        raw = [];
      }
    }
    return Array.isArray(raw) ? (raw as JsonRecord[]) : [];
  };
  // contactos "vacíos" (sin nombre/email/teléfono) no deben ganar el match
  // heurístico por tipo — el PDF terminaba mostrando "N/A".
  const tieneDatos = (c: JsonRecord) =>
    Boolean(c?.entidadcontacto_nombre || c?.entidadcontacto_email || c?.entidadcontacto_telefono);
  // el contacto elegido por ID en la coordinación siempre gana sobre el
  // match por tipo (fallback heurístico).
  const porId =
    contactoIdPreferido != null && contactoIdPreferido !== ""
      ? contactos.find((c) => String(c.entidadcontacto_id) === String(contactoIdPreferido))
      : null;
  const match = tipos.length
    ? contactos.find(
        (c) =>
          tieneDatos(c) &&
          tiposDeContacto(c).some((t) => tipos.includes(String(t.cod_tipo ?? t.COD_TIPO))),
      )
    : null;
  const contacto = porId || match || contactos.find(tieneDatos) || contactos[0];
  return {
    nombre: texto(contacto?.entidadcontacto_nombre),
    email: texto(contacto?.entidadcontacto_email),
    telefono: texto(contacto?.entidadcontacto_telefono),
  };
}

export function resolverNitEntidad(entidades: JsonRecord[], entidadId: unknown): string {
  const ent = buscarEntidad(entidades, entidadId);
  const idents = Array.isArray(ent?.data_identificaciones)
    ? (ent.data_identificaciones as JsonRecord[])
    : [];
  const nit = idents.find((i) => String(i.nom_identificacion || "").toLowerCase() === "nit");
  return texto(nit?.entidadidentificacio_numero);
}

export function resolverDireccionEntidad(entidades: JsonRecord[], entidadId: unknown): string {
  const ent = buscarEntidad(entidades, entidadId);
  const dirs = Array.isArray(ent?.data_direcciones) ? (ent.data_direcciones as JsonRecord[]) : [];
  const direccion = dirs.find((d) => Number(d.cod_tipo) === 145);
  return texto(direccion?.entidaddireccion_direccion);
}

export type OpcionLabel = { value?: unknown; label?: string };

export function resolverLabelCatalogo(catalog: OpcionLabel[], id: unknown): string {
  if (id == null || id === "") return "";
  const opcion = catalog.find((t) => String(t.value ?? "") === String(id));
  return opcion?.label ?? String(id);
}

/**
 * Datos de facturación desde el maestro de la entidad cliente: NIT (por nombre
 * o códigos 46/3), dirección fiscal (cod_tipo 12 → 11) y contacto preferido.
 */
export function resolverFacturacionEntidad(
  entidadData: {
    data_identificaciones?: JsonRecord[];
    data_direcciones?: JsonRecord[];
    data_contactos?: JsonRecord[];
    data_entidad?: JsonRecord[];
  } | null,
  contactoIdPreferido: unknown,
): { nit: string; direccionFiscal: string; nombre: string; contacto: ContactoResuelto } {
  const idents = soloActivos(entidadData?.data_identificaciones ?? []);
  const nit =
    idents.find((i) => String(i.nom_identificacion || "").toLowerCase() === "nit") ??
    idents.find((i) => ["46", "3"].includes(String(i.cod_identificacion))) ??
    idents[0];
  const dirs = soloActivos(entidadData?.data_direcciones ?? []);
  const direccion =
    dirs.find((d) => Number(d.cod_tipo) === 12) ??
    dirs.find((d) => Number(d.cod_tipo) === 11) ??
    dirs[0];
  const contactos = soloActivos(entidadData?.data_contactos ?? []);
  const contacto =
    contactos.find((c) => String(c.entidadcontacto_id) === String(contactoIdPreferido)) ??
    contactos[0];
  return {
    nit: texto(nit?.entidadidentificacio_numero),
    direccionFiscal: texto(direccion?.entidaddireccion_direccion),
    nombre: texto(entidadData?.data_entidad?.[0]?.entidad_nombre),
    contacto: {
      nombre: texto(contacto?.entidadcontacto_nombre),
      email: texto(contacto?.entidadcontacto_email),
      telefono: texto(contacto?.entidadcontacto_telefono),
    },
  };
}
