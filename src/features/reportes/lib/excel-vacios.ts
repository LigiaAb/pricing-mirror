import type { ColumnaReporte, DescargaReporte } from "./definir-reporte";
import { agregarHojaReporte } from "./excel-reporte";
import { nombreArchivo } from "./exportar";

/** Relleno de las celdas vacías (amarillo, ARGB). */
const AMARILLO = "FFFFFF00";

const estaVacia = (valor: unknown) =>
  valor === null || valor === undefined || (typeof valor === "string" && valor.trim() === "");

/**
 * Descarga `excel` de un reporte: el detalle con sus columnas, con el formato de los reportes
 * (`agregarHojaReporte`: logo, título, encabezado y cuadrícula) y cada celda vacía de la tabla
 * en amarillo, para ver de un vistazo los datos que faltan.
 *
 *   descargas: { excel: excelResaltandoVacios(columnas) }
 */
export function excelResaltandoVacios<TFila>(columnas: readonly ColumnaReporte<TFila>[]) {
  return async ({ filas, titulo, encabezado }: DescargaReporte<TFila>): Promise<void> => {
    if (filas.length === 0) throw new Error("No hay datos para exportar a Excel.");
    const ExcelJS = await import("exceljs");
    const libro = new ExcelJS.Workbook();
    const hoja = await agregarHojaReporte(libro, {
      titulo,
      hoja: titulo,
      header: encabezado,
      columnas: columnas.map((c) => c.label),
      filas: filas.map((fila) => ({ celdas: columnas.map((c) => c.valor(fila)) })),
    });
    // La tabla son las últimas filas de la hoja; empieza en la columna 2 (la 1 es margen).
    const ultima = hoja.rowCount;
    for (let numero = ultima - filas.length + 1; numero <= ultima; numero++) {
      const fila = hoja.getRow(numero);
      for (let columna = 2; columna < columnas.length + 2; columna++) {
        const celda = fila.getCell(columna);
        if (estaVacia(celda.value)) {
          celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AMARILLO } };
        }
      }
    }
    const blob = new Blob([await libro.xlsx.writeBuffer()], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `${nombreArchivo(titulo)}.xlsx`;
    enlace.click();
    URL.revokeObjectURL(url);
  };
}
