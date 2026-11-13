import React from "react";
import type { MonedaOpcion, RubroOpcion } from "@/features/pricing/shared";

// Los tipos viven con el motor de campos de métodos (pricing/shared/lib/campos-metodo.ts).
export type { MonedaOpcion, RubroOpcion };

/* ==========================================================================
 * OPCIONES DE SELECT COMPARTIDAS POR LOS MÉTODOS DE TARIFA
 *
 * Antes cada tabla de método convertía monedas y rubros a { value, label }
 * con su propia copia del mismo código, y cada formulario tenía su propia
 * función de búsqueda local. Todo eso vive aquí.
 * ========================================================================== */

type Id = string | number;

/* ==========================================================================
 * MONEDAS
 * ========================================================================== */

type MonedaFuente = {
  cod_moneda: Id;
  simbolo_moneda?: string | null;
  nom_moneda?: string | null;
  [key: string]: unknown;
};

/** Convierte una moneda del backend en opción: "Q - Quetzal". */
export function monedaAOpcion(moneda: MonedaFuente): MonedaOpcion {
  return {
    ...moneda,

    value: String(moneda.cod_moneda),

    label: `${moneda.simbolo_moneda} - ${moneda.nom_moneda}`,

    cod_moneda: moneda.cod_moneda,

    simbolo: moneda.simbolo_moneda ?? undefined,
  };
}

/**
 * Monedas (de useMonedasOperativas) convertidas a opciones.
 * `soloOperativas`: además filtra por el campo `es_operativa` del registro.
 */
export function useOpcionesMonedas(
  monedas: MonedaFuente[] | undefined,
  { soloOperativas = false }: { soloOperativas?: boolean } = {},
) {
  return React.useMemo<MonedaOpcion[]>(
    () =>
      (monedas ?? [])
        .filter((moneda) => !soloOperativas || Boolean(moneda.es_operativa))
        .map(monedaAOpcion),
    [monedas, soloOperativas],
  );
}

/* ==========================================================================
 * RUBROS
 * ========================================================================== */

type RubroFuente = {
  cod_rubro?: Id | null;
  codRubro?: Id | null;
  nombre?: string | null;
  [key: string]: unknown;
};

/** Rubros del catálogo convertidos a opciones. */
export function useOpcionesRubros(rubros: unknown[] | undefined) {
  return React.useMemo<RubroOpcion[]>(
    () =>
      ((rubros ?? []) as RubroFuente[]).map((rubro) => ({
        ...rubro,
        value: String(rubro.cod_rubro ?? rubro.codRubro),
        label: rubro.nombre as string,
        cod_rubro: (rubro.cod_rubro ?? rubro.codRubro) as Id,
      })),
    [rubros],
  );
}

/* ==========================================================================
 * BÚSQUEDA LOCAL EN UN SELECT
 * ========================================================================== */

/** Filtra opciones cuyo label contiene el texto (sin importar mayúsculas). */
export function filtrarOpciones<T extends { label: string }>(opciones: T[], search: string): T[] {
  const busqueda = search.trim().toLowerCase();

  if (!busqueda) return opciones;

  return opciones.filter((opcion) => opcion.label.toLowerCase().includes(busqueda));
}

/** `fetchOptions` para AsyncComboboxInput que busca dentro de opciones ya cargadas. */
export function useFiltroOpciones<T extends { label: string }>(opciones: T[]) {
  return React.useCallback(
    async (search: string): Promise<T[]> => filtrarOpciones(opciones, search),
    [opciones],
  );
}
