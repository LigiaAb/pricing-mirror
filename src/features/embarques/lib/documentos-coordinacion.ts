import { asText } from "@/shared/lib/text";
import {
  CLASIFICACION_CARGA_PELIGROSA,
  COD_TIPO_DOCUMENTO_INSTRUCTIVO_FIRMADO,
  TIPO_DOCUMENTO_FACTURA_COBERTURA_SEGURO,
  TIPO_DOCUMENTO_HOJA_SEGURIDAD,
} from "./constantes";

export interface DocumentoEntry {
  nombre: string;
  archivo: File | null;
  obligatorio: boolean;
  visible?: boolean;
  tipoDocumentoId: number;
  tipoDescripcion?: string;
  urlServidor: string | null;
  descripcion: string;
  documentoIdCoord?: number;
  codFile?: string;
}

export interface ServerDoc {
  tipoDocumentoId: number;
  tipoDescripcion?: string | undefined;
  urlDocumento: string;
  documentoIdCoord: number;
  descripcion: string;
  codFile: string;
}

export const isPeligrosidadEnabled = (valor: unknown): boolean =>
  /^(s|si|true|1|y|yes)$/i.test(asText(valor).trim());

export const isPdfFile = (file: File): boolean =>
  file.type.toLowerCase().includes("pdf") || file.name.toLowerCase().endsWith(".pdf");

const entry = (
  nombre: string,
  tipoDocumentoId: number,
  extra: Partial<DocumentoEntry> = {},
): DocumentoEntry => ({
  nombre,
  archivo: null,
  obligatorio: false,
  tipoDocumentoId,
  urlServidor: null,
  descripcion: "",
  ...extra,
});

export const DOCUMENTOS_INICIALES: Record<string, DocumentoEntry> = {
  documento_peligrosidad: entry("Hoja de Seguridad MSDS", TIPO_DOCUMENTO_HOJA_SEGURIDAD, {
    visible: false,
  }),
  factura_cobertura_seguro: entry(
    "Factura Cobertura Seguro",
    TIPO_DOCUMENTO_FACTURA_COBERTURA_SEGURO,
    { visible: false },
  ),
  factura_electronica: entry("Factura Electrónica", 254),
  lista_empaque: entry("Copia Lista de Empaque", 217),
  eur1: entry("EUR1", 257),
  otros: entry("Otros", 157),
  deprex: entry("DEPREX", 219),
  formulario_instructivo: entry(
    "Formulario Instructivo Firmado por el cliente",
    COD_TIPO_DOCUMENTO_INSTRUCTIVO_FIRMADO,
    {
      obligatorio: true,
    },
  ),
  dua_complementaria: entry("DUA Complementaria", 263),
  dua_simplificada: entry("DUA Simplificada", 264),
  dua_definitiva: entry("DUA Definitiva", 265),
};

/** Sincroniza el estado local con los documentos que reporta el servidor. */
export const mergeServerDocs = (
  prev: Record<string, DocumentoEntry>,
  serverDocs: ServerDoc[],
): Record<string, DocumentoEntry> => {
  const next: Record<string, DocumentoEntry> = {};
  for (const [key, doc] of Object.entries(prev)) {
    if (serverDocs.length === 0) {
      next[key] = { ...doc, urlServidor: null };
      continue;
    }
    const found = serverDocs.find(
      (sd) => String(sd.tipoDocumentoId) === String(doc.tipoDocumentoId),
    );
    next[key] = found
      ? {
          ...doc,
          urlServidor: found.urlDocumento,
          descripcion: found.descripcion || doc.descripcion,
        }
      : { ...doc, urlServidor: null, descripcion: "" };
  }
  return next;
};

/** Entradas locales + documentos del servidor de tipos no conocidos por el catálogo local. */
export const combinarConServidor = (
  documentos: Record<string, DocumentoEntry>,
  serverDocs: ServerDoc[],
): Array<[string, DocumentoEntry]> => {
  const baseEntries = Object.entries(documentos);
  const knownTypeIds = new Set(baseEntries.map(([, doc]) => String(doc.tipoDocumentoId)));
  const extraServerEntries = serverDocs
    .filter((sd) => !knownTypeIds.has(String(sd.tipoDocumentoId)))
    .map(
      (sd, index) =>
        [
          `servidor_${sd.documentoIdCoord ?? sd.tipoDocumentoId ?? index}_${index}`,
          {
            nombre: sd.tipoDescripcion ?? `Documento ${sd.tipoDocumentoId ?? index}`,
            archivo: null,
            obligatorio: false,
            tipoDocumentoId: sd.tipoDocumentoId,
            urlServidor: sd.urlDocumento,
            descripcion: sd.descripcion ?? "",
            documentoIdCoord: sd.documentoIdCoord,
            codFile: sd.codFile,
          },
        ] as [string, DocumentoEntry],
    );
  return [...baseEntries, ...extraServerEntries];
};

const parseJsonOpcionales = (embarqueData: unknown): Record<string, unknown> => {
  const raw = embarqueData as Record<string, unknown> | null | undefined;
  const existingRaw =
    raw?.json_datos_opcionales ??
    raw?.jsonDatosOpcionales ??
    raw?.json_atributos_opcionales ??
    raw?.jsonAtributosOpcionales ??
    null;
  if (!existingRaw) return {};
  try {
    const parsed = typeof existingRaw === "string" ? JSON.parse(existingRaw) : existingRaw;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

/**
 * La Hoja de Seguridad (MSDS) es obligatoria cuando la clasificación de carga
 * de la coordinación es PELIGROSA (122) — reemplaza al criterio anterior por
 * el flag "S" de peligrosidad.
 */
export const esClasificacionPeligrosa = (embarqueData: unknown): boolean => {
  const raw = embarqueData as Record<string, unknown> | null | undefined;
  const clasificacion = raw?.clasificacionCargaId ?? raw?.clasificacion_carga_id ?? null;
  return Number(clasificacion) === CLASIFICACION_CARGA_PELIGROSA;
};

/**
 * La Factura Cobertura Seguro es obligatoria con cobertura de seguro activa
 * (top-level de la coordinación o dentro de json_datos_opcionales, donde la
 * persiste la sección Detalles y el motor de commit).
 */
export const esCoberturaSeguroActiva = (embarqueData: unknown): boolean => {
  const raw = embarqueData as Record<string, unknown> | null | undefined;
  if (raw?.coberturaSeguro === true || raw?.cobertura_seguro === true) return true;
  return isPeligrosidadEnabled(parseJsonOpcionales(embarqueData).coberturaSeguro);
};

/** Keys de documentos CROPA marcados en el JSON opcional de la coordinación. */
export const parseDocumentosCropaSeleccionados = (embarqueData: unknown): Set<string> => {
  const raw = embarqueData as Record<string, unknown> | null | undefined;
  const existingRaw =
    raw?.json_datos_opcionales ??
    raw?.jsonDatosOpcionales ??
    raw?.json_atributos_opcionales ??
    raw?.jsonAtributosOpcionales ??
    null;
  if (!existingRaw) return new Set<string>();
  try {
    const parsed = typeof existingRaw === "string" ? JSON.parse(existingRaw) : existingRaw;
    const documentosCropa = parsed?.documentosCropa ?? {};
    if (Array.isArray(documentosCropa)) return new Set(documentosCropa.map(String));
    return new Set(
      Object.entries(documentosCropa)
        .filter(
          ([, checked]) =>
            checked === true || checked === 1 || checked === "1" || checked === "true",
        )
        .map(([key]) => String(key)),
    );
  } catch {
    return new Set<string>();
  }
};
