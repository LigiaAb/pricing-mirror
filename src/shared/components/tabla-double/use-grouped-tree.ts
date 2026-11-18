"use client";

import { useMemo } from "react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface NivelConfig {
  campo: string;
  prefijo: string;
  defecto: string;
  label?: (doc: Record<string, unknown>, idValor: string) => string;
  esHoja?: boolean;
}

interface ColumnaConfig {
  key: string;
  label: string;
}

export interface TreeNode<T extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  label: string;
  values: Record<string, number>;
  children: TreeNode<T>[];
  extra?: Record<string, unknown>;
  [key: string]: unknown;
}
interface NodoEnConstruccion<T extends Record<string, unknown>> {
  id?: string;
  label?: string;
  values: Record<string, number>;
  children?: TreeNode<T>[];
  childrenMap?: Record<string, NodoEnConstruccion<T>>;
  extra?: Record<string, unknown>;
}

interface UseGroupedTreeParams<T extends Record<string, unknown>> {
  documentos: T[];
  niveles: NivelConfig[];
  columnas: (string | ColumnaConfig)[];
  obtenerColumnaActiva: (doc: T) => string;
  obtenerValor: (doc: T) => number;

  obtenerValoresDocumento?: (doc: T) => Record<string, number> | null;

  idDocumento: (doc: T) => string;

  obtenerDatosExtra?: (doc: T) => Record<string, unknown>;
}

// ── Hook principal ────────────────────────────────────────────────────────────

/**
 * Hook genérico para agrupar una lista plana de documentos en un árbol
 * de N niveles, acumulando totales por columna en cada nivel.
 */
export function useGroupedTree<T extends Record<string, unknown>>({
  documentos,
  niveles,
  columnas,
  obtenerColumnaActiva,
  obtenerValor,
  obtenerValoresDocumento,
  idDocumento,
  obtenerDatosExtra,
}: UseGroupedTreeParams<T>): TreeNode<T>[] {
  return useMemo(() => {
    if (!documentos?.length || !niveles?.length) return [];

    // Acepta:
    // ['2023', '2024']
    //
    // o:
    // [{ key: '2023', label: '2023' }]
    const columnKeys = columnas.map((c) => (typeof c === "string" ? c : c.key));

    const safeNum = (v: unknown) => Number(v) || 0;

    // Garantizamos que siempre exista un nivel hoja.
    const hayHojaExplicita = niveles.some((n) => n.esHoja);

    const nivelesNormalizados = hayHojaExplicita
      ? niveles
      : niveles.map((n, i) => (i === niveles.length - 1 ? { ...n, esHoja: true } : n));

    // Crear objeto de valores inicializado en cero.
    const crearValoresVacios = (): Record<string, number> => {
      const valores: Record<string, number> = {};

      columnKeys.forEach((k) => {
        valores[k] = 0;
      });

      return valores;
    };

    // Raíz del árbol.
    const raiz: NodoEnConstruccion<T> = {
      values: {},
      childrenMap: {},
    };

    // ─────────────────────────────────────────────────────────────────────
    // RECORRER DOCUMENTOS
    // ─────────────────────────────────────────────────────────────────────

    documentos.forEach((doc) => {
      let valoresDocumento: Record<string, number> | null = null;

      // Si existe una función personalizada, la utilizamos.
      if (obtenerValoresDocumento) {
        valoresDocumento = obtenerValoresDocumento(doc);
      }

      // Si no se proporcionó obtenerValoresDocumento,
      // mantenemos el comportamiento original.
      if (!valoresDocumento) {
        const columnaActiva = obtenerColumnaActiva(doc);
        const valor = safeNum(obtenerValor(doc));

        valoresDocumento = {};

        if (valoresDocumento) {
          const valores = valoresDocumento; // TypeScript deduce que 'valores' no es null/undefined
          columnKeys.forEach((k) => {
            valores[k] = k === columnaActiva ? valor : 0;
          });
        }
      }

      // ───────────────────────────────────────────────────────────────────
      // RECORRER LOS NIVELES DE AGRUPACIÓN
      // ───────────────────────────────────────────────────────────────────

      const extraDocumento = obtenerDatosExtra ? obtenerDatosExtra(doc) : undefined;

      let nodoActual: NodoEnConstruccion<T> = raiz;

      const nodosEnRuta: NodoEnConstruccion<T>[] = [];

      nivelesNormalizados.forEach((nivel) => {
        const idValor = String(doc[nivel.campo] ?? nivel.defecto);

        const key = `${nivel.prefijo}_${idValor}`;

        if (!nodoActual.childrenMap?.[key]) {
          const label = nivel.label ? nivel.label(doc, idValor) : String(idValor);

          nodoActual.childrenMap = nodoActual.childrenMap ?? {};

          nodoActual.childrenMap[key] = nivel.esHoja
            ? {
                id: key,
                label,
                values: crearValoresVacios(),
                children: [],
                extra: {},
              }
            : {
                id: key,
                label,
                values: crearValoresVacios(),
                childrenMap: {},
                extra: {},
              };
        }

        nodoActual = nodoActual.childrenMap[key];

        if (extraDocumento) {
          nodoActual.extra = {
            ...(nodoActual.extra ?? {}),
            ...extraDocumento,
          };
        }

        nodosEnRuta.push(nodoActual);
      });

      // ───────────────────────────────────────────────────────────────────
      // AGREGAR DOCUMENTO AL NODO HOJA
      // ───────────────────────────────────────────────────────────────────

      const nodoHoja = nodosEnRuta[nodosEnRuta.length - 1];

      if (!nodoHoja) return;

      const docId = idDocumento(doc);
      const hijos = nodoHoja.children ?? [];

      nodoHoja.children = [
        ...hijos,
        {
          id: `doc_${hijos.length}_${docId}`,
          label: docId,
          values: valoresDocumento,
          extra: nodoActual.extra ?? {},
          children: [],
        },
      ];

      // ───────────────────────────────────────────────────────────────────
      // ACUMULAR TOTALES EN TODOS LOS NIVELES
      // ───────────────────────────────────────────────────────────────────

      nodosEnRuta.forEach((nodo) => {
        columnKeys.forEach((k) => {
          nodo.values[k] = (nodo.values[k] ?? 0) + (valoresDocumento?.[k] ?? 0);
        });
      });
    });

    // ─────────────────────────────────────────────────────────────────────
    // CONVERTIR CHILDRENMAP A ARRAYS
    // ─────────────────────────────────────────────────────────────────────

    const aArray = (childrenMap?: Record<string, NodoEnConstruccion<T>>): TreeNode<T>[] => {
      const mapa = childrenMap ?? {};

      return Object.values(mapa).map((nodo) => ({
        id: nodo.id ?? "",
        label: nodo.label ?? "",
        values: nodo.values,
        extra: nodo.extra ?? {},
        children: nodo.children ?? aArray(nodo.childrenMap),
      }));
    };

    return aArray(raiz.childrenMap);
  }, [
    documentos,
    niveles,
    columnas,
    obtenerColumnaActiva,
    obtenerValor,
    obtenerValoresDocumento,
    idDocumento,
    obtenerDatosExtra,
  ]);
}

// ── Helper para generar columnas ─────────────────────────────────────────────

/**
 * Genera todas las columnas a partir de un campo del documento.
 *
 * Ejemplo:
 *
 * const columnas = useColumnasDesdeCampo(
 *   documentos,
 *   'FILE_ANIO'
 * );
 *
 * Caso especial:
 * RANGO_VENCIMIENTOS
 */
export function useColumnasDesdeCampo(
  documentos: Record<string, unknown>[],
  campo: string,
): ColumnaConfig[] {
  return useMemo(() => {
    if (!documentos?.length) return [];

    // ─────────────────────────────────────────────────────────────────────
    // CASO ESPECIAL: RANGOS DE VENCIMIENTO
    // ─────────────────────────────────────────────────────────────────────

    if (campo === "RANGO_VENCIMIENTOS") {
      return [
        {
          key: "POR_VENCER",
          label: "Por Vencer",
        },
        {
          key: "S15",
          label: "1 - 15",
        },
        {
          key: "S16_30",
          label: "16 - 30",
        },
        {
          key: "S31_60",
          label: "31 - 60",
        },
        {
          key: "S61_90",
          label: "61 - 90",
        },
        {
          key: "MAS_90",
          label: "Mas 90",
        },
      ];
    }

    // ─────────────────────────────────────────────────────────────────────
    // COLUMNAS DINÁMICAS
    // ─────────────────────────────────────────────────────────────────────

    const valoresUnicos: Record<string, boolean> = {};

    documentos.forEach((doc) => {
      const valor = doc[campo];

      if (valor != null && valor !== "") {
        valoresUnicos[String(valor)] = true;
      }
    });

    return Object.keys(valoresUnicos)
      .sort()
      .map((valor) => ({
        key: valor,
        label: valor,
      }));
  }, [documentos, campo]);
}
