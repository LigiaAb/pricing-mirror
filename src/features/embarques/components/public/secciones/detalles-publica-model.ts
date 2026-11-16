/**
 * Modelo puro de la sección Detalles (wizard público y CTS privado): opciones
 * de los selectores desde catálogos, normalización de lo guardado en carta /
 * coordinación y snapshot inicial resuelto contra esos catálogos. Separado
 * del componente para testearlo sin montar React.
 *
 * Reglas de negocio: los selects tipoPago/tipoCarga/servicio usan el LABEL
 * como value (contrato heredado del legacy), incoterm y clasificacionCarga
 * usan el ID; "Clasificación de carga" no es requerida y los checkboxes de
 * documentos CROPA solo aparecen con `showCropaDocs` (gasto rubro 127).
 */

import { CROPA_DOCS } from "@/features/embarques/lib/constantes";
import type { CampoFormulario } from "./validation";

/** Opción de catálogo; el incoterm puede traer además su `codigo` corto. */
export interface OpcionCatalogo {
  value: string | number;
  label: string;
  codigo?: string | number | null;
}

export interface CatalogosDetalles {
  tipoPago: OpcionCatalogo[];
  tipoCarga: OpcionCatalogo[];
  servicios: OpcionCatalogo[];
  incoterm: OpcionCatalogo[];
  clasificacionCarga: OpcionCatalogo[];
}

/** Lo guardado en carta/coordinación, con las formas mixtas del legacy. */
export interface DetallesData {
  tipoPago?: unknown;
  tipoCarga?: unknown;
  incoterm?: unknown;
  servicio?: unknown;
  clasificacionCarga?: unknown;
  peligrosidad?: string | string[] | boolean;
  cargaValiosa?: boolean;
  coberturaSeguro?: boolean;
  documentosCropa?: unknown;
  instruccionesManejo?: unknown;
  _modificadosDetalles?: string[];
  [key: string]: unknown;
}

/** Estado del formulario: selects como string y checkbox-groups como string[]. */
export interface DetallesValues {
  tipoPago: string;
  tipoCarga: string;
  incoterm: string;
  servicio: string;
  clasificacionCarga: string;
  peligrosidad: string[];
  documentosCropa: string[];
  instruccionesManejo: string;
  [key: string]: unknown;
}

// "Carga Peligrosa" ("S") ya no es checkbox: el criterio se movió a la
// clasificación de carga (CLASIFICACION_CARGA_PELIGROSA).
const PELIGROSIDAD_OPTIONS = [
  { value: "V", label: "Carga Valiosa" },
  { value: "C", label: "Cobertura de Seguro" },
];

const texto = (v: unknown): string => (v === undefined || v === null ? "" : String(v));

/** Catálogo {value,label} → opciones del selector, con el label como value. */
export const buildCatalogOptions = (
  catalog: OpcionCatalogo[],
): NonNullable<CampoFormulario["options"]> =>
  catalog.map((o) => ({ value: texto(o.label), label: texto(o.label) }));

/** Opciones con el ID del catálogo como value (incoterm, clasificación). */
const buildIdOptions = (catalog: OpcionCatalogo[]): NonNullable<CampoFormulario["options"]> =>
  catalog.map((o) => ({ value: texto(o.value), label: texto(o.label) }));

/**
 * Resuelve un ID numérico contra el catálogo a su label; un label ya resuelto
 * (o un valor desconocido) se devuelve tal cual.
 */
export const resolveToLabel = (value: unknown, catalog: OpcionCatalogo[]): string => {
  if (value === undefined || value === null || value === "") return "";
  const found = catalog.find((o) => String(o.value) === String(value));
  return found ? texto(found.label) : texto(value);
};

/**
 * Incoterm: el selector usa el ID como value; acepta ID, código corto ("FOB")
 * o label completo guardado y lo normaliza al ID.
 */
export const resolveIncotermValue = (value: unknown, catalog: OpcionCatalogo[]): string => {
  if (value === undefined || value === null || value === "") return "";
  const raw = String(value);
  if (catalog.some((o) => String(o.value) === raw)) return raw;
  const byCodigo = catalog.find(
    (o) =>
      o.codigo !== undefined &&
      o.codigo !== null &&
      String(o.codigo).toLowerCase() === raw.toLowerCase(),
  );
  if (byCodigo) return String(byCodigo.value);
  const byLabel = catalog.find((o) => o.label === raw);
  return byLabel ? String(byLabel.value) : raw;
};

/**
 * Normaliza lo guardado (carta o coordinación) al estado del formulario:
 * peligrosidad string/boolean/array → string[] agregando V/C por los flags
 * booleanos; clasificación como string; documentosCropa como string[].
 */
export const buildDetalleFromData = (data?: DetallesData): DetallesValues => {
  const raw = data?.peligrosidad;
  let peligrosidad: string[] = [];
  if (Array.isArray(raw)) {
    peligrosidad = raw.map(String);
  } else if (raw === "S" || raw === true) {
    peligrosidad = ["S"];
  }
  if (data?.cargaValiosa === true && !peligrosidad.includes("V")) {
    peligrosidad = [...peligrosidad, "V"];
  }
  if (data?.coberturaSeguro === true && !peligrosidad.includes("C")) {
    peligrosidad = [...peligrosidad, "C"];
  }
  return {
    tipoPago: texto(data?.tipoPago),
    tipoCarga: texto(data?.tipoCarga),
    incoterm: texto(data?.incoterm),
    servicio: texto(data?.servicio),
    clasificacionCarga: texto(data?.clasificacionCarga),
    peligrosidad,
    documentosCropa: Array.isArray(data?.documentosCropa)
      ? (data.documentosCropa as unknown[]).map(String)
      : [],
    instruccionesManejo: texto(data?.instruccionesManejo),
  };
};

/**
 * Snapshot inicial del formulario: los IDs crudos se resuelven a los values
 * de cada selector (label para pago/carga/servicio, ID para incoterm); la
 * clasificación queda como ID en string.
 */
export const buildInitValues = (
  data: DetallesData | undefined,
  catalogos: CatalogosDetalles,
): DetallesValues => {
  const base = buildDetalleFromData(data);
  return {
    ...base,
    tipoPago: resolveToLabel(data?.tipoPago, catalogos.tipoPago),
    tipoCarga: resolveToLabel(data?.tipoCarga, catalogos.tipoCarga),
    incoterm: resolveIncotermValue(data?.incoterm, catalogos.incoterm),
    servicio: resolveToLabel(data?.servicio, catalogos.servicios),
  };
};

/**
 * Campos del formulario. Con `showCropaDocs` se agrega el grupo de checkboxes
 * "documentos que elaborará CROPA" (requerido: al menos uno marcado).
 */
export const buildDetalleFields = (
  catalogos: CatalogosDetalles,
  showCropaDocs: boolean,
): CampoFormulario[] => {
  const fields: CampoFormulario[] = [
    {
      key: "tipoPago",
      label: "Tipo de pago",
      type: "select",
      options: buildCatalogOptions(catalogos.tipoPago),
      colSpan: "span 6",
      required: true,
    },
    {
      key: "tipoCarga",
      label: "Tipo de carga",
      type: "select",
      options: buildCatalogOptions(catalogos.tipoCarga),
      colSpan: "span 6",
      required: true,
    },
    {
      key: "incoterm",
      label: "Incoterm",
      type: "select",
      options: buildIdOptions(catalogos.incoterm),
      colSpan: "span 6",
    },
    {
      key: "servicio",
      label: "Tipo de servicio",
      type: "select",
      options: buildCatalogOptions(catalogos.servicios),
      colSpan: "span 6",
      required: true,
    },
    {
      key: "clasificacionCarga",
      label: "Clasificación de carga",
      type: "select",
      options: buildIdOptions(catalogos.clasificacionCarga),
      colSpan: "span 6",
    },
    {
      key: "peligrosidad",
      label: "",
      type: "checkboxes",
      options: PELIGROSIDAD_OPTIONS,
      colSpan: "span 6",
    },
  ];
  if (showCropaDocs) {
    fields.push({
      key: "documentosCropa",
      label: "Documentos CROPA",
      type: "checkboxes",
      options: CROPA_DOCS.map((d) => ({ value: d.key, label: d.label })),
      colSpan: "span 12",
      required: true,
    });
  }
  fields.push({
    key: "instruccionesManejo",
    label: "Instrucciones de manejo",
    type: "textarea",
    rows: 3,
    colSpan: "span 12",
  });
  return fields;
};

/** true solo si el paso exige documentos CROPA y aún no se marca ninguno. */
export const cropaSinSeleccion = (showCropaDocs: boolean, values: DetallesValues): boolean =>
  showCropaDocs && (!Array.isArray(values.documentosCropa) || values.documentosCropa.length === 0);
