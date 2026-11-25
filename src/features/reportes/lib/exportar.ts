import { format } from "date-fns";
import type { BloquePdf } from "@/features/pricing/reportes";
import type { TreeNode } from "@/features/pricing/shared";
import type { CampoConfig } from "@/shared/components/tabla-double/niveles-builder";
import { exportarExcel } from "@/shared/lib/excel";
import type { ColumnaReporte, ValorCelda } from "./definir-reporte";
import type { Resumen } from "./resumen-agrupado";

/**
 * DESCARGAS de cualquier reporte, con lo ya consultado. Son dos cosas distintas:
 * - Excel agrupado: el Resumen agrupado ("Personaliza tu reporte").
 * - Excel y PDF del reporte: el detalle (o el Excel propio de la definición, `excel`).
 * Encabezado: período y filtros de la consulta.
 */

export interface TablaExportable {
  columnas: string[];
  filas: ValorCelda[][];
}

/**
 * Resumen agrupado como tabla plana (igual que el Excel de pricing): una columna por nivel de
 * agrupación; cada fila escribe solo su valor, en la columna de su nivel. El TOTAL GENERAL va
 * en la primera.
 */
export function tablaResumen(resumen: Resumen, niveles: readonly CampoConfig[]): TablaExportable {
  const columnasNivel = niveles.length ? niveles.map((n) => n.etiqueta) : ["Concepto"];
  const filas: ValorCelda[][] = [];
  const agregar = (nodos: readonly TreeNode[], profundidad: number) => {
    for (const nodo of nodos) {
      filas.push([
        ...columnasNivel.map((_, i) => (i === Math.max(profundidad - 1, 0) ? nodo.label : null)),
        ...resumen.columnas.map((c) => {
          const valor = nodo.values?.[c.key];
          return valor === "" || valor == null ? null : Number(valor);
        }),
      ]);
      agregar(nodo.children ?? [], profundidad + 1);
    }
  };
  agregar(resumen.data, 0);
  return { columnas: [...columnasNivel, ...resumen.columnas.map((c) => c.label)], filas };
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

/** Excel agrupado (botón "Excel agrupado"): el Resumen agrupado, como el Excel de pricing. */
export async function descargarExcelAgrupado(opciones: {
  titulo: string;
  encabezado: Record<string, string>;
  resumen: TablaExportable;
}): Promise<void> {
  await exportarExcel({
    nombreArchivo: `${nombreArchivo(`${opciones.titulo} - Resumen agrupado`)}.xlsx`,
    titulo: `${opciones.titulo} - Resumen agrupado`,
    encabezado: opciones.encabezado,
    hojas: [
      {
        nombre: "Resumen agrupado",
        columnas: opciones.resumen.columnas,
        filas: opciones.resumen.filas,
        mostrarCuadricula: true,
      },
    ],
  });
}

/** Excel del reporte (sin `excel` propio en la definición): el detalle con sus columnas. */
export async function descargarExcelReporte(opciones: {
  titulo: string;
  encabezado: Record<string, string>;
  detalle: TablaExportable;
}): Promise<void> {
  await exportarExcel({
    nombreArchivo: `${nombreArchivo(opciones.titulo)}.xlsx`,
    titulo: opciones.titulo,
    encabezado: opciones.encabezado,
    hojas: [
      {
        // Excel admite 31 caracteres en el nombre de la hoja.
        nombre: opciones.titulo.slice(0, 31),
        columnas: opciones.detalle.columnas,
        filas: opciones.detalle.filas,
        mostrarCuadricula: true,
        autoFiltro: true,
      },
    ],
  });
}

/** Bloques del PDF del reporte: el detalle con sus columnas. */
export function bloquesPdf(detalle: TablaExportable): BloquePdf[] {
  return [{ tipo: "tabla", columnas: detalle.columnas, filas: detalle.filas }];
}
