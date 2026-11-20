import type { Workbook, Worksheet } from "exceljs";
import { LOGO_URL } from "./pdf-reporte";

/**
 * EXCEL CON EL FORMATO DE `pdf-reporte.ts`
 *
 * Misma plantilla que el PDF: logo, título con línea inferior, campos del encabezado
 * (etiqueta en negrita y mayúsculas), tabla con encabezado gris y pie azul
 * "- CROPA DSV 2024 -". Al imprimir: horizontal (tamaño de papel por defecto), ajustada al ancho, con el
 * encabezado de la tabla repetido y "Página N" arriba a la derecha.
 */

/** Colores del PDF (ARGB). */
const GRIS_ENCABEZADO = "FFAAAAAA";
// const AZUL_PIE = "FF00205B";
// const BLANCO = "FFFFFFFF";
const NEGRO = "FF000000";
const PIE = "- CROPA DSV 2024 -";

export type FilaExcel = {
  celdas: Array<string | number | null>;
  /** Fila de subtotal: negrita. */
  negrita?: boolean;
};

export type ReporteExcel = {
  titulo: string;
  /** Nombre de la hoja (máx. 31 caracteres). */
  hoja?: string;
  /** Campos bajo el título: período, empresa, centro de costo, etc. Vacíos no se escriben. */
  header?: Record<string, string | null | undefined>;
  columnas: string[];
  filas: FilaExcel[];
  /** Ancho (en caracteres) por columna; por defecto 14. */
  anchos?: Array<number | undefined>;
  /** Formato numérico de Excel por columna (ej. "#,##0", '0.00"%"'). */
  formatos?: Array<string | undefined>;
};

const BORDE = { style: "thin" as const, color: { argb: NEGRO } };
const BORDES = { top: BORDE, left: BORDE, bottom: BORDE, right: BORDE };

/** Descarga el logo como data URL; si falla, el Excel se genera sin logo. */
async function logoBase64(): Promise<string | null> {
  try {
    const respuesta = await fetch(LOGO_URL);
    if (!respuesta.ok) return null;
    const blob = await respuesta.blob();
    return await new Promise<string | null>((resolver) => {
      const lector = new FileReader();
      lector.onload = () => resolver(typeof lector.result === "string" ? lector.result : null);
      lector.onerror = () => resolver(null);
      lector.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Agrega al libro una hoja con el formato del PDF y la devuelve. */
export async function agregarHojaReporte(
  libro: Workbook,
  opciones: ReporteExcel,
): Promise<Worksheet> {
  const total = Math.max(1, opciones.columnas.length);
  const hoja = libro.addWorksheet((opciones.hoja ?? "Reporte").slice(0, 31), {
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
    },
    headerFooter: {
      oddHeader: `&L&B${opciones.titulo}&RPágina &P`,
      oddFooter: `&C${PIE}`,
    },
  });

  for (let i = 0; i < total; i++) {
    hoja.getColumn(i + 1).width = opciones.anchos?.[i] ?? 14;
  }

  // Filas 1-3: logo (195 x 39 pt en el PDF ≈ 260 x 52 px).
  const logo = await logoBase64();
  if (logo) {
    const id = libro.addImage({ base64: logo, extension: "png" });
    hoja.addImage(id, { tl: { col: 0, row: 0 }, ext: { width: 260, height: 52 } });
  }
  for (const numero of [1, 2, 3]) hoja.getRow(numero).height = 15;

  // Fila 4: título con la línea inferior del PDF.
  const filaTitulo = hoja.getRow(4);
  filaTitulo.getCell(1).value = opciones.titulo;
  filaTitulo.getCell(1).font = { bold: true, size: 15 };
  filaTitulo.height = 22;
  if (total > 1) hoja.mergeCells(4, 1, 4, total);
  filaTitulo.getCell(1).border = { bottom: BORDE };

  // Campos del encabezado: etiqueta en la primera columna, valor en el resto.
  let numero = 6;
  for (const [campo, valor] of Object.entries(opciones.header ?? {})) {
    if (valor == null || valor === "") continue;
    const fila = hoja.getRow(numero);
    fila.getCell(1).value = campo.toUpperCase();
    fila.getCell(1).font = { bold: true, size: 10 };
    fila.getCell(2).value = valor;
    fila.getCell(2).font = { size: 10 };
    if (total > 2) hoja.mergeCells(numero, 2, numero, total);
    numero += 1;
  }
  numero += 1;

  // Encabezado de la tabla: gris del PDF, negrita, con bordes.
  const filaEncabezado = hoja.getRow(numero);
  opciones.columnas.forEach((columna, i) => {
    const celda = filaEncabezado.getCell(i + 1);
    celda.value = columna;
    celda.font = { bold: true, size: 9, color: { argb: NEGRO } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS_ENCABEZADO } };
    celda.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    celda.border = BORDES;
  });
  hoja.views = [{ /* state: "frozen", */ ySplit: numero }];
  hoja.pageSetup.printTitlesRow = `${numero}:${numero}`;
  numero += 1;

  // Cuerpo: cuadrícula como el tema "grid" del PDF.
  for (const { celdas, negrita } of opciones.filas) {
    const fila = hoja.getRow(numero);
    celdas.forEach((valor, i) => {
      const celda = fila.getCell(i + 1);
      celda.value = valor;
      celda.font = { size: 9, bold: negrita === true };
      celda.border = BORDES;
      const formato = opciones.formatos?.[i];
      if (formato) celda.numFmt = formato;
      celda.alignment = {
        vertical: "top",
        horizontal: typeof valor === "number" ? "right" : "left",
      };
    });
    numero += 1;
  }

  // pie altera visualizacion de formato
  // // Pie azul del PDF.
  // numero += 1;
  // const filaPie = hoja.getRow(numero);
  // filaPie.getCell(1).value = PIE;
  // if (total > 1) hoja.mergeCells(numero, 1, numero, total);
  // const celdaPie = filaPie.getCell(1);
  // celdaPie.font = { size: 7, color: { argb: BLANCO } };
  // celdaPie.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_PIE } };
  // celdaPie.alignment = { horizontal: "center", vertical: "middle" };

  return hoja;
}
