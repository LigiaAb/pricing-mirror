import type { ColumnaTabla, TreeNode } from "@/features/pricing/shared";
import type { CampoConfig } from "@/shared/components/tabla-double/niveles-builder";
import type { ColumnaReporte } from "./definir-reporte";

/**
 * RESUMEN AGRUPADO (tabla dinámica genérica, igual que la de Reportes de pricing)
 *
 * Arma el árbol que dibuja `TablaDouble` (mismo formato que `construirTablaKpi` de pricing):
 * un nodo raíz "TOTAL GENERAL" con las filas agrupadas por los niveles elegidos en
 * "Personaliza tu reporte" (`NivelesBuilder`) y columnas por un campo (o ninguna).
 * Medidas: cantidad de registros y la suma de cada columna `sumable` del reporte.
 */

export interface ConfiguracionResumen {
  /** Niveles de filas, en el orden en que se agrupan. */
  niveles: CampoConfig[];
  /** Campo de columnas; "" = sin columnas (solo el total). */
  columna: string;
}

const SIN_DATO = "SIN DATO";

/** Grupo de columnas del total (siempre al final). */
const CLAVE_TOTAL = "__total__";

/** Campos de una definición que se pueden agrupar (filas o columnas). */
export const camposAgrupables = <TFila>(columnas: readonly ColumnaReporte<TFila>[]) =>
  columnas.filter((c) => c.agrupable).map<CampoConfig>((c) => ({ campo: c.id, etiqueta: c.label }));

interface Medida<TFila> {
  key: string;
  etiqueta: string;
  valor: (fila: TFila) => number;
}

function medidasDe<TFila>(columnas: readonly ColumnaReporte<TFila>[]): Medida<TFila>[] {
  return [
    { key: "cantidad", etiqueta: "Cantidad", valor: () => 1 },
    ...columnas
      .filter((c) => c.sumable)
      .map((c) => ({
        key: c.id,
        etiqueta: c.label,
        valor: (fila: TFila) => {
          const n = Number(c.valor(fila));
          return Number.isFinite(n) ? n : 0;
        },
      })),
  ];
}

type Nodo = {
  id: string;
  label: string;
  sumas: Map<string, number[]>;
  hijos: Map<string, Nodo>;
};

const nuevoNodo = (id: string, label: string): Nodo => ({
  id,
  label,
  sumas: new Map(),
  hijos: new Map(),
});

export interface Resumen {
  /** Un nodo raíz "TOTAL GENERAL" con los niveles debajo (vacío sin filas). */
  data: TreeNode[];
  columnas: ColumnaTabla[];
}

export function calcularResumen<TFila>(
  filas: readonly TFila[],
  columnas: readonly ColumnaReporte<TFila>[],
  config: ConfiguracionResumen,
): Resumen {
  const porId = new Map(columnas.map((c) => [c.id, c]));
  const texto = (campo: string, fila: TFila) => {
    const valor = porId.get(campo)?.valor(fila);
    const limpio = valor == null ? "" : String(valor).trim();
    return limpio || SIN_DATO;
  };
  const medidas = medidasDe(columnas);
  const raiz = nuevoNodo("total", "TOTAL GENERAL");
  const valoresColumna = new Set<string>();

  const sumarEn = (nodo: Nodo, grupo: string, valores: number[]) => {
    for (const clave of grupo === CLAVE_TOTAL ? [CLAVE_TOTAL] : [grupo, CLAVE_TOTAL]) {
      const suma = nodo.sumas.get(clave) ?? medidas.map(() => 0);
      valores.forEach((v, i) => {
        suma[i] = (suma[i] ?? 0) + v;
      });
      nodo.sumas.set(clave, suma);
    }
  };

  for (const fila of filas) {
    const valores = medidas.map((m) => m.valor(fila));
    const grupo = config.columna ? texto(config.columna, fila) : CLAVE_TOTAL;
    if (grupo !== CLAVE_TOTAL) valoresColumna.add(grupo);

    let nodo = raiz;
    sumarEn(nodo, grupo, valores);
    for (const nivel of config.niveles) {
      const valor = texto(nivel.campo, fila);
      let hijo = nodo.hijos.get(valor);
      if (!hijo) {
        hijo = nuevoNodo(`${nodo.id}|${nivel.campo}:${valor}`, valor);
        nodo.hijos.set(valor, hijo);
      }
      nodo = hijo;
      sumarEn(nodo, grupo, valores);
    }
  }

  const grupos = [...[...valoresColumna].sort(), CLAVE_TOTAL];
  const etiquetaCampo = porId.get(config.columna)?.label ?? config.columna;

  const columnasTabla: ColumnaTabla[] = grupos.flatMap((grupo) =>
    medidas.map((medida) => ({
      key: `${grupo}__${medida.key}`,
      label:
        grupo === CLAVE_TOTAL
          ? config.columna
            ? `Total · ${medida.etiqueta}`
            : medida.etiqueta
          : `${etiquetaCampo} ${grupo} · ${medida.etiqueta}`,
      entero: medida.key === "cantidad",
      excluirTotal: true,
    })),
  );

  const aTreeNode = (nodo: Nodo): TreeNode => {
    const values: Record<string, number> = {};
    for (const grupo of grupos) {
      const suma = nodo.sumas.get(grupo);
      medidas.forEach((medida, i) => {
        values[`${grupo}__${medida.key}`] = suma?.[i] ?? 0;
      });
    }
    return {
      id: nodo.id,
      label: nodo.label,
      values,
      children: [...nodo.hijos.values()]
        .sort((a, b) => a.label.localeCompare(b.label))
        .map(aTreeNode),
    };
  };

  return { data: filas.length ? [aTreeNode(raiz)] : [], columnas: columnasTabla };
}
