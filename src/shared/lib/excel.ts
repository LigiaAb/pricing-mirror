import type { Alignment, Borders, Font } from "exceljs";

type ValorExcel = string | number | boolean | Date | null | undefined;
type FormatoExcel = {
  tipo: "dolar" | "quetzal" | "moneda" | "numero" | "date";
  moneda?: string;
  /** Para fechas, formato de Excel, por ejemplo: "dd/mm/yyyy". */
  formato?: string;
};
type CeldaConFormato = {
  dato: ValorExcel;
  alignFormat?: Partial<Alignment>;
  textFormat?: Partial<Font>;
  borderFormat?: Partial<Borders>;
  formato?: FormatoExcel;
  fontColor?: string;
};
export type CeldaExcel = ValorExcel | CeldaConFormato;
type EncabezadoExcel = string[] | Record<string, ValorExcel>;
type EstiloColumnaExcel = {
  fontColor?: string;
  fontColorMap?: Record<string, string>;
  fontColorFn?: (valor: ValorExcel, fila: CeldaExcel[]) => string | null | undefined;
};
const BORDE_CELDA = {
  style: "thin",
  color: { argb: "FF94A3B8" },
} as const;
const BORDES_CELDA: Partial<Borders> = {
  top: BORDE_CELDA,
  bottom: BORDE_CELDA,
  left: BORDE_CELDA,
  right: BORDE_CELDA,
};
const BORDE_CABECERA = {
  style: "medium",
  color: { argb: "FF64748B" },
} as const;
const BORDES_CABECERA: Partial<Borders> = {
  top: BORDE_CABECERA,
  bottom: BORDE_CABECERA,
  left: BORDE_CABECERA,
  right: BORDE_CABECERA,
};
const BORDE_ENCABEZADO_GRUPO = {
  style: "medium",
  color: { argb: "FF64748B" },
} as const;
const BORDE_INTERNO_ENCABEZADO_GRUPO = {
  style: "thin",
  color: { argb: "FF94A3B8" },
} as const;
function esCeldaConFormato(valor: CeldaExcel): valor is CeldaConFormato {
  return typeof valor === "object" && valor !== null && "dato" in valor;
}
/** Descarga un archivo Excel a partir de un base64 devuelto por el back. */
export function descargarExcelDesdeBase64(base64: string, nombreArchivo: string): void {
  const limpio = (base64.split(",")[1] || base64).replace(/\s/g, "");
  const binStr = atob(limpio);
  const arr = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  const blob = new Blob([arr], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
}
/** Carga ExcelJS solamente al solicitar una exportación. */
export async function exportarExcel({
  nombreArchivo,
  titulo,
  encabezado = [],
  hojas,
}: {
  nombreArchivo: string;
  titulo?: string;
  encabezado?: EncabezadoExcel;
  hojas: Array<{
    nombre: string;
    columnas: string[];
    filas: Array<CeldaExcel[]>;
    /** Color ARGB de la pestaña. */
    color?: string;
    /** Agrega bordes a encabezados y datos. Desactivado por defecto. */
    mostrarCuadricula?: boolean;
    /** Índices desde 1. Para el margen del legacy: columnaInicio: 3. */
    columnaInicio?: number;
    filaInicio?: number;
    /** Si se omite, utiliza el encabezado general. */
    encabezado?: EncabezadoExcel;
    autoFiltro?: boolean;
    /**
     * Ancho fijo por columna de la tabla (índice 0 = primera columna); `undefined` deja el
     * automático. Útil cuando el título o el encabezado ensanchan la primera columna.
     */
    anchos?: Array<number | undefined>;
    /**
     * Color ARGB de relleno para el título, el encabezado y la fila de columnas (texto en blanco),
     * a lo ancho de la tabla. Sin él se conservan sin relleno.
     */
    colorEncabezado?: string;
    gruposColumnas?: Array<{
      titulo: string;
      cantidadColumnas: number;
    }>;
    secciones?: Array<{
      titulo: string;
      columnas: string[];
      filas: Array<CeldaExcel[]>;
    }>;
    props?: {
      styles?: {
        /** Las claves corresponden a los textos de `columnas`. */
        columns?: Record<string, EstiloColumnaExcel>;
      };
    };
    colorCelda?: (
      valor: CeldaExcel,
      indiceColumna: number,
      fila: CeldaExcel[],
    ) => string | undefined;
  }>;
}): Promise<void> {
  const ExcelJS = await import("exceljs");
  const libro = new ExcelJS.Workbook();
  for (const hoja of hojas) {
    const pagina = libro.addWorksheet(hoja.nombre, {
      views: [{ showGridLines: false }],
    });
    if (hoja.color) {
      pagina.properties.tabColor = { argb: hoja.color };
    }
    const columnaInicio = Math.max(1, hoja.columnaInicio ?? 1);
    let siguienteFila = Math.max(1, hoja.filaInicio ?? 1);
    const agregarFila = (valores: CeldaExcel[]) => {
      const fila = pagina.getRow(siguienteFila++);
      valores.forEach((valor, indice) => {
        const celda = fila.getCell(columnaInicio + indice);
        celda.value = esCeldaConFormato(valor) ? (valor.dato ?? "") : (valor ?? "");

        if (esCeldaConFormato(valor)) {
          if (valor.alignFormat) celda.alignment = valor.alignFormat;
          if (valor.borderFormat) celda.border = valor.borderFormat;
          if (valor.textFormat || valor.fontColor) {
            celda.font = {
              ...(valor.textFormat ?? {}),
              ...(valor.fontColor ? { color: { argb: valor.fontColor } } : {}),
            };
          }
        }
      });
      return fila;
    };
    const anchoTabla = Math.max(
      1,
      ...(hoja.secciones ?? [{ columnas: hoja.columnas }]).map((s) => s.columnas.length),
    );
    /** Rellena la fila con `colorEncabezado` a lo ancho de la tabla y deja el texto en blanco. */
    const pintarEncabezado = (numeroFila: number) => {
      if (!hoja.colorEncabezado) return;
      const fila = pagina.getRow(numeroFila);
      for (let col = columnaInicio; col < columnaInicio + anchoTabla; col++) {
        const celda = fila.getCell(col);
        celda.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: hoja.colorEncabezado },
        };
        celda.font = { ...(celda.font ?? {}), color: { argb: "FFFFFFFF" } };
      }
    };
    const primeraFilaEncabezado = siguienteFila;
    if (titulo) {
      agregarFila([
        {
          dato: titulo,
          textFormat: { bold: true, size: 20 },
        },
      ]);
    }
    agregarFila([""]);
    const encabezadoHoja = hoja.encabezado ?? encabezado;
    const lineasEncabezado: CeldaExcel[][] = Array.isArray(encabezadoHoja)
      ? encabezadoHoja.map((linea) => [linea])
      : Object.entries(encabezadoHoja).map(([clave, valor]) => [
          {
            dato: clave.toUpperCase(),
            alignFormat: { horizontal: "right" },
          },
          valor,
        ]);
    for (const linea of lineasEncabezado) {
      agregarFila(linea);
    }
    for (let numero = primeraFilaEncabezado; numero < siguienteFila; numero++) {
      pintarEncabezado(numero);
    }
    if (titulo || lineasEncabezado.length > 0) {
      siguienteFila++;
    }
    const secciones = hoja.secciones ?? [
      { titulo: "", columnas: hoja.columnas, filas: hoja.filas },
    ];
    for (const [indiceSeccion, seccion] of secciones.entries()) {
      if (indiceSeccion > 0) siguienteFila++;
      if (seccion.titulo) {
        const filaTitulo = agregarFila([seccion.titulo]);
        filaTitulo.font = { bold: true };
        if (seccion.columnas.length > 1) {
          pagina.mergeCells(
            filaTitulo.number,
            columnaInicio,
            filaTitulo.number,
            columnaInicio + seccion.columnas.length - 1,
          );
        }
      }
      if (hoja.gruposColumnas && !hoja.secciones) {
        const filaGrupos = agregarFila([]);
        let columnaInicial = columnaInicio;
        for (const grupo of hoja.gruposColumnas) {
          const columnaFinal = columnaInicial + grupo.cantidadColumnas - 1;
          filaGrupos.getCell(columnaInicial).value = grupo.titulo;
          if (columnaFinal > columnaInicial) {
            pagina.mergeCells(filaGrupos.number, columnaInicial, filaGrupos.number, columnaFinal);
          }
          filaGrupos.getCell(columnaInicial).border = {
            top: BORDE_ENCABEZADO_GRUPO,
            bottom: BORDE_INTERNO_ENCABEZADO_GRUPO,
            left: BORDE_ENCABEZADO_GRUPO,
            right: BORDE_ENCABEZADO_GRUPO,
          };
          columnaInicial = columnaFinal + 1;
        }
        filaGrupos.font = { bold: true };
        filaGrupos.alignment = { horizontal: "center" };
      }
      const cabecera = agregarFila(seccion.columnas);
      cabecera.font = { bold: true };
      if (hoja.colorEncabezado) {
        pintarEncabezado(cabecera.number);
        cabecera.alignment = { horizontal: "center", vertical: "middle" };
      }
      if (hoja.mostrarCuadricula === true) {
        seccion.columnas.forEach((_, indice) => {
          cabecera.getCell(columnaInicio + indice).border = BORDES_CABECERA;
        });
      }
      // Excel admite un autofiltro por hoja: se aplica a la primera tabla.
      if (hoja.autoFiltro === true && indiceSeccion === 0 && seccion.columnas.length > 0) {
        pagina.autoFilter = {
          from: {
            row: cabecera.number,
            column: columnaInicio,
          },
          to: {
            row: cabecera.number,
            column: columnaInicio + seccion.columnas.length - 1,
          },
        };
      }
      if (hoja.gruposColumnas && !hoja.secciones) {
        let columnaInicial = columnaInicio;
        for (const grupo of hoja.gruposColumnas) {
          const columnaFinal = columnaInicial + grupo.cantidadColumnas - 1;
          for (let columna = columnaInicial; columna <= columnaFinal; columna += 1) {
            cabecera.getCell(columna).border = {
              top: BORDE_INTERNO_ENCABEZADO_GRUPO,
              bottom: BORDE_ENCABEZADO_GRUPO,
              ...(columna === columnaInicial ? { left: BORDE_ENCABEZADO_GRUPO } : {}),
              ...(columna === columnaFinal ? { right: BORDE_ENCABEZADO_GRUPO } : {}),
            };
          }
          columnaInicial = columnaFinal + 1;
        }
      }
      for (const fila of seccion.filas) {
        const filaExcel = agregarFila(fila);
        fila.forEach((valor, indiceColumna) => {
          const celda = filaExcel.getCell(columnaInicio + indiceColumna);
          const configuracion = esCeldaConFormato(valor) ? valor : undefined;
          const valorOriginal = esCeldaConFormato(valor) ? valor.dato : valor;
          const claveColumna = seccion.columnas[indiceColumna];
          const estiloColumna =
            claveColumna === undefined ? undefined : hoja.props?.styles?.columns?.[claveColumna];
          let colorColumna: string | null | undefined;
          if (estiloColumna?.fontColorFn) {
            colorColumna = estiloColumna.fontColorFn(valorOriginal, fila);
          } else if (
            estiloColumna?.fontColorMap &&
            valorOriginal !== null &&
            valorOriginal !== undefined
          ) {
            colorColumna = estiloColumna.fontColorMap[String(valorOriginal)];
          } else {
            colorColumna = estiloColumna?.fontColor;
          }
          const color =
            configuracion?.fontColor ||
            hoja.colorCelda?.(valor, indiceColumna, fila) ||
            colorColumna;
          if (configuracion?.alignFormat) {
            celda.alignment = configuracion.alignFormat;
          }
          if (hoja.mostrarCuadricula === true) {
            celda.border = BORDES_CELDA;
          }
          if (configuracion?.borderFormat) {
            celda.border = configuracion.borderFormat;
          }
          if (configuracion?.textFormat || color) {
            celda.font = {
              ...(configuracion?.textFormat ?? {}),
              ...(color ? { color: { argb: color } } : {}),
            };
          }
          const formato = configuracion?.formato;
          if (formato) {
            switch (formato.tipo) {
              case "dolar":
                celda.numFmt = "$#,##0.00;[Red]-$#,##0.00";
                break;
              case "quetzal":
                celda.numFmt = "Q#,##0.00;[Red]-Q#,##0.00";
                break;
              case "moneda": {
                const moneda = (formato.moneda ?? "").replace(/"/g, '""');
                celda.numFmt = `"${moneda}"#,##0.00;[Red]-"${moneda}"#,##0.00`;
                break;
              }
              case "numero":
                celda.numFmt = formato.formato || "#";
                break;
              case "date":
                // Recibe Date o texto ISO; vacío se conserva vacío.
                if (valorOriginal !== null && valorOriginal !== undefined && valorOriginal !== "") {
                  const fecha =
                    valorOriginal instanceof Date
                      ? valorOriginal
                      : typeof valorOriginal === "string"
                        ? new Date(valorOriginal)
                        : undefined;
                  if (fecha && !Number.isNaN(fecha.getTime())) {
                    celda.value = fecha;
                  }
                }
                celda.numFmt = formato.formato || "dd/mm/yyyy";
                break;
            }
          }
        });
      }
    }
    pagina.columns.forEach((columna, indiceColumna) => {
      if (indiceColumna < columnaInicio - 1) {
        columna.width = 3;
        return;
      }
      const anchoFijo = hoja.anchos?.[indiceColumna - (columnaInicio - 1)];
      if (anchoFijo !== undefined) {
        columna.width = anchoFijo;
        return;
      }
      let dataMax = 0;
      columna.eachCell?.({ includeEmpty: true }, (celda) => {
        if (celda.value === null || celda.value === undefined) return;
        const longitud = String(celda.value).length + 3;
        if (longitud > dataMax) dataMax = longitud;
      });
      columna.width = dataMax === 0 ? dataMax : Math.min(Math.max(dataMax, 10), 90);
    });
  }
  const blob = new Blob([await libro.xlsx.writeBuffer()], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
}
