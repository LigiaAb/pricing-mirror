type TipoArchivo = "pdf" | "excel" | "otro";

export interface DeteccionArchivo {
  tipo: TipoArchivo;
  /** MIME conocido para el contenido detectado (el blob puede traerlo vacío). */
  mime: string;
  /** Extensión con punto, para completar nombres de descarga sin extensión. */
  extension: string;
}

const MIME_PDF = "application/pdf";
const MIME_XLS = "application/vnd.ms-excel";
const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** MIME de Excel → extensión correspondiente. */
const EXTENSION_POR_MIME_EXCEL: ReadonlyMap<string, string> = new Map([
  [MIME_XLS, ".xls"],
  [MIME_XLSX, ".xlsx"],
  ["application/vnd.ms-excel.sheet.macroEnabled.12", ".xlsm"],
  ["application/vnd.ms-excel.sheet.binary.macroEnabled.12", ".xlsb"],
]);

// Firmas (magic numbers) del inicio del archivo.
const FIRMA_PDF = [0x25, 0x50, 0x44, 0x46] as const; // "%PDF"
const FIRMA_OLE2 = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] as const; // .xls (OLE2)
const FIRMA_ZIP = [0x50, 0x4b] as const; // .xlsx (OOXML, contenedor zip)

function iniciaCon(cabecera: Uint8Array, firma: readonly number[]): boolean {
  return firma.every((byte, indice) => cabecera[indice] === byte);
}

/** Detecta el tipo real de un blob por su contenido: `recuperar-archivo` no
 * informa el MIME, así que se leen las firmas del encabezado — PDF tiene visor
 * propio, Excel (`.xls` OLE2 o `.xlsx` OOXML) se descarga. Un contenedor zip de
 * Office se trata como `.xlsx` por ser el único formato de Excel de este flujo. */
export async function detectarTipoArchivo(blob: Blob): Promise<DeteccionArchivo> {
  const cabecera = new Uint8Array(await blob.slice(0, 8).arrayBuffer());

  if (iniciaCon(cabecera, FIRMA_PDF)) {
    return { tipo: "pdf", mime: MIME_PDF, extension: ".pdf" };
  }
  if (iniciaCon(cabecera, FIRMA_OLE2)) {
    return { tipo: "excel", mime: MIME_XLS, extension: ".xls" };
  }
  if (iniciaCon(cabecera, FIRMA_ZIP)) {
    return { tipo: "excel", mime: MIME_XLSX, extension: ".xlsx" };
  }

  // Las firmas no alcanzaron (p. ej. blob vacío): se respeta el MIME del blob.
  if (blob.type === MIME_PDF) {
    return { tipo: "pdf", mime: MIME_PDF, extension: ".pdf" };
  }
  const extensionExcel = EXTENSION_POR_MIME_EXCEL.get(blob.type);
  if (extensionExcel) {
    return { tipo: "excel", mime: blob.type, extension: extensionExcel };
  }

  return { tipo: "otro", mime: blob.type || "application/octet-stream", extension: "" };
}
