/* ==========================================================================
 * NORMALIZACIÓN DE CATÁLOGOS
 *
 * Funciones puras que convierten los catálogos del backend al formato
 * { value, label } que usan los selects. Antes estaban copiadas en
 * gestion-cotizacion.tsx y cotizaciones-table.tsx.
 * ========================================================================== */

import type { OpcionFormularioCotizacion } from "../hooks/use-formulario-cotizacion";
import type { Id, Registro } from "./tipos";
import { esRegistro } from "./utils";

/** Acepta un arreglo, o un objeto con `items` / `data`, y devuelve solo los objetos. */
export function getCatalogArray(value: unknown): Registro[] {
  if (Array.isArray(value)) return value.filter(esRegistro);

  if (!esRegistro(value)) return [];

  if (Array.isArray(value.items)) return value.items.filter(esRegistro);

  if (Array.isArray(value.data)) return value.data.filter(esRegistro);

  return [];
}

/** Campos donde puede venir el código de un registro, en orden de prioridad. */
const CAMPOS_VALUE = [
  "value",
  "cod_tipo",
  "cod_pais",
  "cod_empresa",
  "cod_cc",
  "incoterm_id",
  "entidad_id",
  "cod_puntoenlace",
] as const;

/** Campos donde puede venir el texto de un registro, en orden de prioridad. */
const CAMPOS_LABEL = [
  "label",
  "nombre_pais",
  "nombre_emp",
  "nombre_cc",
  "nom_tipo",
  "tipo_desc",
  "descripcion",
  "nombre",
  "entidad_nombre",
  "codigo",
] as const;

function esIdValido(value: unknown): value is Id {
  return typeof value === "string" || typeof value === "number";
}

export function obtenerOptionValue(item: Registro): Id | null {
  for (const campo of CAMPOS_VALUE) {
    const candidate = item[campo];
    if (esIdValido(candidate)) return candidate;
  }

  return null;
}

export function obtenerOptionLabel(item: Registro) {
  for (const campo of CAMPOS_LABEL) {
    const candidate = item[campo];
    if (esIdValido(candidate)) return String(candidate);
  }

  return "";
}

/** Convierte cualquier catálogo a opciones { value, label, ...registroOriginal }. */
export function normalizarOpciones(value: unknown): OpcionFormularioCotizacion[] {
  return getCatalogArray(value).flatMap((item) => {
    const optionValue = obtenerOptionValue(item);

    if (optionValue == null) return [];

    return [
      {
        ...item,
        value: optionValue,
        label: obtenerOptionLabel(item) || String(optionValue),
      } as OpcionFormularioCotizacion,
    ];
  });
}

/** Filtra la tabla genérica de tipos por `tipo_tabla` (sin importar mayúsculas). */
export function filtrarPorTipoTabla(tipos: unknown, tablas: string[]) {
  return getCatalogArray(tipos).filter((item) =>
    tablas.includes(String(item.tipo_tabla ?? "").toUpperCase()),
  );
}
