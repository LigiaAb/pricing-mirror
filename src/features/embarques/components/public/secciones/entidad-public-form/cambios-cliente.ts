/**
 * Panel "Cambios del cliente" del formulario público de entidad: valor maestro
 * (BD) vs valor enviado por el cliente para los campos de `_modificados`.
 * Portado del legacy `entidadPublicFormSection.jsx`.
 */

import { ENTIDAD_REL_FIELD_MAP, getEntidadRelSource } from "@/features/carta-instrucciones";
import { extractContactoTipoList, type JsonRecord, type OpcionCatalogo } from "./model";

/**
 * Resuelve un valor (o lista de códigos) contra opciones {value,label} y
 * devuelve el label legible; sin match devuelve el valor crudo.
 */
export function resolveCatalogLabel(rawValue: unknown, options: OpcionCatalogo[] = []): string {
  if (rawValue === undefined || rawValue === null || rawValue === "") return "";
  const findLabel = (v: unknown) => {
    const found = options.find((opt) => String(opt.value) === String(v));
    return found ? (found.label ?? String(v)) : String(v);
  };
  if (Array.isArray(rawValue)) return rawValue.map(findLabel).join(", ");
  return findLabel(rawValue);
}

function normalizeCompareValue(v: unknown): string {
  if (Array.isArray(v))
    return [...v]
      .map(String)
      .sort((a, b) => a.localeCompare(b))
      .join(",");
  return String(v ?? "");
}

interface CambioDef {
  key: string;
  label: string;
  section: string;
  catalog?: string;
}

/**
 * Campos comparables shipper/consignatario: clave del form → etiqueta, sección
 * y catálogo para resolver el label. La sección coincide con las del formulario.
 */
const CAMBIOS_DEFS: CambioDef[] = [
  { key: "entidad_nombre", label: "Nombre", section: "info" },
  { key: "entidad_pais", label: "País", section: "info", catalog: "paises" },
  { key: "direccion_recoleccion_ciudad", label: "Ciudad", section: "info", catalog: "ciudades" },
  { key: "entidad_industria", label: "Industria", section: "info", catalog: "industrias" },
  { key: "direccion_recoleccion", label: "Dirección de Recolección", section: "Dirección" },
  { key: "direccion_recoleccion_pais", label: "País", section: "Dirección", catalog: "paises" },
  {
    key: "direccion_recoleccion_depto",
    label: "Departamento",
    section: "Dirección",
    catalog: "departamentos",
  },
  {
    key: "direccion_recoleccion_muni",
    label: "Municipio",
    section: "Dirección",
    catalog: "municipios",
  },
  { key: "entidad_contacto_nombre", label: "Nombre Contacto", section: "Contacto" },
  { key: "entidad_contacto_email", label: "Email", section: "Contacto" },
  { key: "entidad_contacto_telefono", label: "Teléfono", section: "Contacto" },
  {
    key: "_contacto_tipo_list",
    label: "Tipo(s) de Contacto",
    section: "Contacto",
    catalog: "tiposContacto",
  },
  { key: "entidad_nit", label: "NIT", section: "Identificación" },
];

type SeparatedAccessor = (s: MaestroSeparado) => unknown;

/** Fuentes "separadas" (privado): consultas puntuales de contacto/dirección/NIT. */
export interface MaestroSeparado {
  contacto?: JsonRecord | null;
  direccion?: JsonRecord | null;
  nit?: string | null;
}

/**
 * Convierte los subregistros puntuales del maestro privado al shape del
 * formulario. Solo incluye una sección cuando el backend realmente devolvió
 * ese registro, para no borrar datos mientras las consultas siguen cargando.
 */
export function buildMaestroFormPatch(separated: MaestroSeparado): JsonRecord {
  const patch: JsonRecord = {};
  const direccion = separated.direccion;
  if (direccion) {
    patch.direccion_recoleccion = direccion.direccion ?? direccion.entidaddireccion_direccion ?? "";
    patch.direccion_recoleccion_pais = direccion.cod_pais ?? "";
    patch.direccion_recoleccion_depto = direccion.cod_depto ?? "";
    patch.direccion_recoleccion_muni = direccion.cod_muni ?? "";
  }
  if (separated.nit) patch.entidad_nit = separated.nit;
  return patch;
}

/**
 * Campos cuyo maestro se resuelve preferentemente desde una consulta separada
 * (en privado el snapshot de recuperar-datos-entidad-relacionada puede traer
 * esos sub-arreglos vacíos o desactualizados).
 */
const SEPARATED_FIELD_ACCESSORS: Record<string, SeparatedAccessor> = {
  entidad_contacto_nombre: (s) => s.contacto?.entidadcontacto_nombre ?? "",
  entidad_contacto_email: (s) => s.contacto?.entidadcontacto_email ?? "",
  entidad_contacto_telefono: (s) => s.contacto?.entidadcontacto_telefono ?? "",
  direccion_recoleccion: (s) => s.direccion?.direccion ?? "",
  direccion_recoleccion_pais: (s) => s.direccion?.cod_pais ?? "",
  direccion_recoleccion_depto: (s) => s.direccion?.cod_depto ?? "",
  direccion_recoleccion_muni: (s) => s.direccion?.cod_muni ?? "",
  entidad_nit: (s) => s.nit ?? "",
};

/**
 * Valor maestro (BD) de un campo del form: prioriza las consultas separadas y
 * cae al snapshot raw de recuperar-datos-entidad-relacionada.
 */
export function getMasterValue(
  rawEntidad: JsonRecord | null | undefined,
  key: string,
  formVals: JsonRecord,
  separated: MaestroSeparado = {},
): unknown {
  if (key === "_contacto_tipo_list") {
    if (separated.contacto) return extractContactoTipoList(separated.contacto);
    const source = getEntidadRelSource(rawEntidad, "contacto", formVals);
    return extractContactoTipoList(source);
  }

  const separatedAccessor = SEPARATED_FIELD_ACCESSORS[key];
  if (separatedAccessor) {
    if (key.startsWith("entidad_contacto_") && separated.contacto) {
      return separatedAccessor(separated);
    }
    if (key.startsWith("direccion_recoleccion") && separated.direccion) {
      return separatedAccessor(separated);
    }
    if (key === "entidad_nit" && separated.nit !== null && separated.nit !== undefined) {
      return separatedAccessor(separated);
    }
  }

  if (!rawEntidad) return "";
  const def = ENTIDAD_REL_FIELD_MAP[key];
  if (!def) return "";
  const source = getEntidadRelSource(rawEntidad, def.src, formVals);
  return source?.[def.rawCode || def.code] ?? "";
}

/**
 * Arma el maestro "separado" (G15) a partir de las respuestas crudas de las
 * consultas puntuales de contacto/dirección/identificación (privado): el
 * contacto elegido (o el primero), la dirección tipo "recolección" (o la
 * primera) y el NIT (primera identificación cuyo `nom_identificacion` sea
 * "NIT"). Paridad `entidadPublicFormSection.jsx` (`masterContactoSeparado`,
 * `masterDireccionSeparada`, `masterNitSeparado`).
 */
export function buildMaestroSeparado({
  contactos = [],
  direcciones = [],
  identificaciones = [],
  entidadcontactoId,
  direccionTipoRecoleccion,
}: {
  contactos?: JsonRecord[];
  direcciones?: JsonRecord[];
  identificaciones?: JsonRecord[];
  entidadcontactoId?: unknown;
  direccionTipoRecoleccion: number;
}): MaestroSeparado {
  const contacto =
    contactos.find((c) => String(c.entidadcontacto_id) === String(entidadcontactoId)) ??
    contactos[0] ??
    null;
  const direccion =
    direcciones.find((d) => Number(d.cod_tipo) === direccionTipoRecoleccion) ??
    direcciones[0] ??
    null;
  const identificacion = identificaciones.find(
    (i) => String(i.nom_identificacion || "").toLowerCase() === "nit",
  );
  return {
    contacto,
    direccion,
    nit: identificacion ? ((identificacion.entidadidentificacion_numero as string) ?? "") : "",
  };
}

export interface CambioClienteRow {
  configKey: string;
  label: string;
  section: string;
  currentValue: unknown;
  currentLabel: string;
  clienteValue: unknown;
  clienteLabel: string;
  modificado: boolean;
  iguales: boolean;
}

export interface BuildCambiosParams {
  modificados: unknown;
  rawEntidad: JsonRecord | null | undefined;
  values: JsonRecord;
  sectionInfo: string;
  catalogs: Record<string, OpcionCatalogo[]>;
  separated?: MaestroSeparado;
}

/**
 * Filas del panel "Cambios del cliente" (maestro BD → valor enviado por el
 * cliente) para los campos listados en `_modificados`. Descarta las filas
 * donde ambos valores ya son iguales.
 */
export function buildCambiosClienteRows({
  modificados,
  rawEntidad,
  values,
  sectionInfo,
  catalogs,
  separated = {},
}: BuildCambiosParams): CambioClienteRow[] {
  const mods = Array.isArray(modificados) ? modificados.map(String) : [];
  if (mods.length === 0) return [];

  return CAMBIOS_DEFS.filter((def) => mods.includes(def.key))
    .map((def) => {
      const masterValue = getMasterValue(rawEntidad, def.key, values, separated);
      const clienteValue =
        def.key === "_contacto_tipo_list"
          ? ((values._contacto_tipo_list as unknown[]) ?? [])
          : (values[def.key] ?? "");

      const formatLabel = (value: unknown) =>
        def.catalog && catalogs[def.catalog]
          ? resolveCatalogLabel(value, catalogs[def.catalog])
          : Array.isArray(value)
            ? value.join(", ")
            : String(value ?? "");

      return {
        configKey: def.key,
        label: def.label,
        section: def.section === "info" ? sectionInfo : def.section,
        currentValue: masterValue,
        currentLabel: formatLabel(masterValue),
        clienteValue,
        clienteLabel: formatLabel(clienteValue),
        modificado: true,
        iguales: normalizeCompareValue(masterValue) === normalizeCompareValue(clienteValue),
      };
    })
    .filter((row) => !row.iguales);
}
