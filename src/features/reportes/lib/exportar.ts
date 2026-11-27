import { format } from "date-fns";
import type { BloquePdf } from "@/features/pricing/reportes";
import type { ReportePdf } from "@/features/pricing/reportes/lib/pdf-reporte";
import type { TreeNode } from "@/features/pricing/shared";
import type { CampoConfig } from "@/shared/components/tabla-double/niveles-builder";
import type { useExcelJS } from "@/shared/hooks/use-dynamic-libraries";
import type { ColumnaReporte, ValorCelda } from "./definir-reporte";
import { agregarHojaReporte, type FilaExcel, type ReporteExcel } from "./excel-reporte";
import type { Resumen } from "./resumen-agrupado";

/**
 * DESCARGAS de cualquier reporte, con lo ya consultado. Son dos cosas distintas:
 * - Excel agrupado: el Resumen agrupado ("Personaliza tu reporte"), con el generador de pricing.
 * - Excel y PDF del reporte: el detalle (o el Excel propio de la definición, `excel`).
 * Encabezado: período y filtros de la consulta.
 */

export interface TablaExportable {
  columnas: string[];
  filas: ValorCelda[][];
}

/** Resumen agrupado listo para `agregarHojaReporte` (columnas, filas con negrita y formatos). */
export interface TablaResumenExcel {
  columnasNivel: string[];
  columnas: string[];
  filas: FilaExcel[];
  formatos: Array<string | undefined>;
}

/**
 * Resumen agrupado como tabla plana, igual que el Excel de Reportes de pricing (`exportarExcel`
 * de `pricing/reportes/components/tabla-kpi.tsx`): una columna por nivel de agrupación; cada
 * fila escribe solo su valor, en la columna de su nivel (sin repetir los superiores). El total
 * general va en la primera; las filas con hijos y el total, en negrita.
 */
export function tablaResumen(resumen: Resumen, niveles: readonly CampoConfig[]): TablaResumenExcel {
  const columnasNivel = niveles.length ? niveles.map((n) => n.etiqueta) : ["Concepto"];
  const filas: FilaExcel[] = [];
  const agregar = (nodos: readonly TreeNode[], ruta: string[]) => {
    for (const nodo of nodos) {
      const esRaiz = ruta.length === 0 && nodo.id === "total";
      const rutaNodo = esRaiz ? [] : [...ruta, nodo.label];
      const columnaNodo = Math.max(0, rutaNodo.length - 1);
      const celdasNivel = columnasNivel.map((_, i) => (i === columnaNodo ? nodo.label : null));
      filas.push({
        celdas: [
          ...celdasNivel,
          ...resumen.columnas.map((c) => {
            const valor = nodo.values?.[c.key];
            return valor === "" || valor == null ? null : Number(valor);
          }),
        ],
        negrita: Boolean(nodo.children?.length) || esRaiz,
      });
      agregar(nodo.children ?? [], rutaNodo);
    }
  };
  agregar(resumen.data, []);
  return {
    columnasNivel,
    columnas: [...columnasNivel, ...resumen.columnas.map((c) => c.label)],
    filas,
    formatos: [
      ...columnasNivel.map(() => undefined),
      ...resumen.columnas.map((c) => (c.label.includes("%") ? '0.00"%"' : "#,##0")),
    ],
  };
}

/** Detalle del reporte con sus columnas. */
export function tablaDetalle<TFila>(
  filas: readonly TFila[],
  columnas: readonly ColumnaReporte<TFila>[],
): TablaExportable {
  return {
    columnas: columnas.map((c) => c.label),
    filas: filas.map((f) => columnas.map((c) => c.valor(f))),
  };
}

/** Nombre de archivo: "<título> - ERPWEB - yyyy_MM_dd_HH_mm_ss". */
export const nombreArchivo = (titulo: string) =>
  `${titulo} - ERPWEB - ${format(new Date(), "yyyy_MM_dd_HH_mm_ss")}`;

/**
 * Excel agrupado (botón "Excel agrupado"): el Resumen agrupado con el mismo generador que
 * Reportes de pricing (`agregarHojaReporte`, copiado en `excel-reporte.ts`).
 */
export async function descargarExcelAgrupado(opciones: {
  titulo: string;
  encabezado: Record<string, string>;
  resumen: TablaResumenExcel;
  /** `loadExcelJS` de `useExcelJS()`. */
  cargarExcel: ReturnType<typeof useExcelJS>["loadExcelJS"];
  /** Rango consultado (`yyyy-MM-dd`), para el nombre del archivo como en pricing. */
  fechaInicio?: string | undefined;
  fechaFin?: string | undefined;
}): Promise<void> {
  if (opciones.resumen.filas.length === 0) throw new Error("No hay datos para exportar a Excel.");
  const { ExcelJS, saveAs } = await opciones.cargarExcel();
  const libro = new ExcelJS.Workbook();
  await agregarHojaReporte(libro, {
    titulo: `${opciones.titulo} - Resumen agrupado`,
    hoja: "Resumen agrupado",
    header: opciones.encabezado,
    columnas: opciones.resumen.columnas,
    filas: opciones.resumen.filas,
    formatos: opciones.resumen.formatos,
  });
  const buffer = await libro.xlsx.writeBuffer();
  // Como pricing: "<reporte>-<inicio>-<fin>.xlsx" (sin fechas, solo el nombre).
  const rango = [opciones.fechaInicio, opciones.fechaFin].filter(Boolean).join("-");
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${opciones.titulo} - Resumen agrupado${rango ? `-${rango}` : ""}.xlsx`,
  );
}

/**
 * Excel del reporte (`excel: true`): el detalle con sus columnas, con el MISMO generador que el
 * "Excel agrupado" (`agregarHojaReporte`, el de Reportes de pricing: logo, título, encabezado y
 * tabla con encabezado gris); la diferencia es que este no agrupa. `colorFondoCelda` (opcional)
 * rellena celdas (ej. las vacías en amarillo).
 */
export async function descargarExcelReporte(opciones: {
  titulo: string;
  encabezado: Record<string, string>;
  detalle: TablaExportable;
  colorFondoCelda?: ReporteExcel["colorFondoCelda"];
}): Promise<void> {
  if (opciones.detalle.filas.length === 0) throw new Error("No hay datos para exportar a Excel.");
  const ExcelJS = await import("exceljs");
  const libro = new ExcelJS.Workbook();
  await agregarHojaReporte(libro, {
    titulo: opciones.titulo,
    hoja: opciones.titulo,
    header: opciones.encabezado,
    columnas: opciones.detalle.columnas,
    filas: opciones.detalle.filas.map((celdas) => ({ celdas })),
    ...(opciones.colorFondoCelda ? { colorFondoCelda: opciones.colorFondoCelda } : {}),
  });
  const buffer = await libro.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `${nombreArchivo(opciones.titulo)}.xlsx`;
  enlace.click();
  URL.revokeObjectURL(url);
}

/** Bloques del PDF del reporte: el detalle con sus columnas. */
export function bloquesPdf(detalle: TablaExportable): BloquePdf[] {
  return [{ tipo: "tabla", columnas: detalle.columnas, filas: detalle.filas }];
}

/**
 * PDF propio con el formato de Reportes de pricing (el mismo generador que `pdf: true`), para
 * `descargas.pdf` de una definición. Se descarga; `archivo` por defecto: el nombre del reporte.
 *
 *   pdf: ({ filas, titulo, encabezado }) =>
 *     descargarPdf({ titulo, header: encabezado, contenido: [{ tipo: "tabla", columnas, filas }] })
 */
export async function descargarPdf(
  reporte: Omit<ReportePdf, "archivo" | "salida"> & { archivo?: string },
): Promise<void> {
  const { generarPdfReporte } = await import("@/features/pricing/reportes/lib/pdf-reporte");
  const archivo = reporte.archivo ?? `${nombreArchivo(reporte.titulo)}.pdf`;
  await new Promise<void>((resolver, rechazar) => {
    generarPdfReporte(
      { ...reporte, archivo },
      (doc) => {
        doc.save(archivo);
        resolver();
      },
      rechazar,
    );
  });
}
