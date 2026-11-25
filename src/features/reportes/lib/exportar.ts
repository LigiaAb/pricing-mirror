import { format } from "date-fns";
import type { BloquePdf } from "@/features/pricing/reportes";
import { exportarExcel } from "@/shared/lib/excel";
import type { ColumnaReporte, ValorCelda } from "./definir-reporte";
import type { Resumen } from "./resumen-agrupado";

/**
 * DESCARGAS (PDF y Excel) de cualquier reporte, con lo que ya está en pantalla:
 * encabezado (período y filtros elegidos), resumen agrupado y detalle.
 */

export interface TablaExportable {
  columnas: string[];
  filas: ValorCelda[][];
}

/** Resumen agrupado como tabla plana: niveles, columnas del pivote y total (con fila TOTAL). */
export function tablaResumen(resumen: Resumen): TablaExportable {
  const conTotal = resumen.tituloColumnas !== "";
  const total = (valor: number) => (conTotal ? [valor] : []);
  // Sin niveles solo queda la fila TOTAL, con una primera columna para su etiqueta.
  const niveles = resumen.niveles.length > 0 ? resumen.niveles : [""];
  const filas: ValorCelda[][] =
    resumen.niveles.length > 0
      ? resumen.filas.map((f) => [...f.claves, ...f.valores, ...total(f.total)])
      : [];
  filas.push([
    "TOTAL",
    ...Array<ValorCelda>(niveles.length - 1).fill(""),
    ...resumen.totales,
    ...total(resumen.total),
  ]);
  return { columnas: [...niveles, ...resumen.columnas, ...(conTotal ? ["Total"] : [])], filas };
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

export async function descargarExcel(opciones: {
  titulo: string;
  encabezado: Record<string, string>;
  resumen: TablaExportable;
  detalle: TablaExportable;
}): Promise<void> {
  await exportarExcel({
    nombreArchivo: `${nombreArchivo(opciones.titulo)}.xlsx`,
    titulo: opciones.titulo,
    encabezado: opciones.encabezado,
    hojas: [
      {
        nombre: "Resumen",
        columnas: opciones.resumen.columnas,
        filas: opciones.resumen.filas,
        mostrarCuadricula: true,
      },
      {
        nombre: "Detalle",
        columnas: opciones.detalle.columnas,
        filas: opciones.detalle.filas,
        mostrarCuadricula: true,
        autoFiltro: true,
      },
    ],
  });
}

/** Bloques del PDF: resumen agrupado y, en otra página, el detalle. */
export function bloquesPdf(resumen: TablaExportable, detalle: TablaExportable): BloquePdf[] {
  return [
    { tipo: "titulo", texto: "Resumen agrupado" },
    { tipo: "tabla", columnas: resumen.columnas, filas: resumen.filas },
    { tipo: "pagina" },
    { tipo: "titulo", texto: "Detalle" },
    { tipo: "tabla", columnas: detalle.columnas, filas: detalle.filas },
  ];
}
