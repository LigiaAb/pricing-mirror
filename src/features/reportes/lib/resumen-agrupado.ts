import type { ColumnaReporte, ValorCelda } from "./definir-reporte";

/**
 * RESUMEN AGRUPADO (tabla dinámica genérica)
 *
 * Agrupa las filas del reporte por las columnas elegidas en "Personaliza tu reporte":
 * - `filas`: niveles (una fila del resumen por combinación de valores, ordenadas).
 * - `columna`: opcional; sus valores pasan a ser columnas (pivote).
 * - `medida`: `MEDIDA_CANTIDAD` (cuenta filas) o el id de una columna `sumable`.
 */

/** Medida por defecto: cantidad de registros. */
export const MEDIDA_CANTIDAD = "__cantidad__";

/** Texto para valores vacíos al agrupar. */
const SIN_VALOR = "(Sin dato)";

export interface ConfiguracionResumen {
  filas: readonly string[];
  columna: string;
  medida: string;
}

export interface FilaResumen {
  /** Un valor por nivel de `filas`. */
  claves: string[];
  /** Un valor por columna del pivote (o uno solo sin pivote). */
  valores: number[];
  total: number;
}

export interface Resumen {
  /** Encabezados de los niveles. */
  niveles: string[];
  /** Encabezado del pivote ("" si no hay columna). */
  tituloColumnas: string;
  /** Valores del pivote (columnas), ordenados; sin pivote, solo el nombre de la medida. */
  columnas: string[];
  filas: FilaResumen[];
  /** Totales por columna y total general. */
  totales: number[];
  total: number;
  /** Nombre de la medida (ej. "Cantidad"). */
  medida: string;
}

const texto = (valor: ValorCelda): string =>
  valor == null || valor === "" ? SIN_VALOR : String(valor);

const comparar = (a: string, b: string) => a.localeCompare(b, "es", { numeric: true });

export function calcularResumen<TFila>(
  filas: readonly TFila[],
  columnas: readonly ColumnaReporte<TFila>[],
  config: ConfiguracionResumen,
): Resumen {
  const porId = new Map(columnas.map((c) => [c.id, c]));
  const niveles = config.filas
    .map((id) => porId.get(id))
    .filter((c): c is ColumnaReporte<TFila> => c != null);
  const pivote = porId.get(config.columna);
  const medida = porId.get(config.medida);

  const valorMedida = (fila: TFila): number => {
    if (!medida) return 1;
    const n = Number(medida.valor(fila));
    return Number.isFinite(n) ? n : 0;
  };

  // Valores del pivote, ordenados.
  const columnasPivote = pivote
    ? [...new Set(filas.map((f) => texto(pivote.valor(f))))].sort(comparar)
    : [medida?.label ?? "Cantidad"];
  const indicePivote = new Map(columnasPivote.map((c, i) => [c, i]));

  // Una fila del resumen por combinación de niveles.
  const grupos = new Map<string, FilaResumen>();
  for (const fila of filas) {
    const claves = niveles.map((n) => texto(n.valor(fila)));
    const llave = JSON.stringify(claves);
    let grupo = grupos.get(llave);
    if (!grupo) {
      grupo = { claves, valores: columnasPivote.map(() => 0), total: 0 };
      grupos.set(llave, grupo);
    }
    const i = pivote ? (indicePivote.get(texto(pivote.valor(fila))) ?? 0) : 0;
    const v = valorMedida(fila);
    grupo.valores[i] = (grupo.valores[i] ?? 0) + v;
    grupo.total += v;
  }

  const filasResumen = [...grupos.values()].sort((a, b) => {
    for (let i = 0; i < a.claves.length; i++) {
      const r = comparar(a.claves[i] ?? "", b.claves[i] ?? "");
      if (r !== 0) return r;
    }
    return 0;
  });

  const totales = columnasPivote.map((_, i) =>
    filasResumen.reduce((suma, f) => suma + (f.valores[i] ?? 0), 0),
  );

  return {
    niveles: niveles.map((n) => n.label),
    tituloColumnas: pivote?.label ?? "",
    columnas: columnasPivote,
    filas: filasResumen,
    totales,
    total: totales.reduce((a, b) => a + b, 0),
    medida: medida?.label ?? "Cantidad",
  };
}

/** Número con separador de miles y hasta 2 decimales. */
export const formatearNumero = (n: number): string =>
  n.toLocaleString("es-GT", { maximumFractionDigits: 2 });
