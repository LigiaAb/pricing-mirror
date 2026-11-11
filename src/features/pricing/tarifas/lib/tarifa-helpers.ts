// import type { Servicio } from "@/features/catalogos";
import type { FilaServicioMetodo } from "../api/types-api";

type TarifaContext = {
  centroCostoId?: {
    cod_cc?: string | number | null;
  } | null;
  empresaId?: {
    cod_empresa?: string | number | null;
  } | null;
};

export const DEFAULT_TODOS_VALUE: null = null;

export const CATALOGOS_AGREGAR_TODOS = {
  tiposServicio: true,
  tiposAplicacion: true,
  clasificacionesCarga: true,
  tiposCarga: true,
  categoriasTransporte: true,
  incoterms: true,
};

export const eliminarDuplicadosById = <T>(arr: T[], id: keyof T) => {
  return arr.filter((item, index) => arr.findIndex((i) => i[id] === item[id]) === index);
};

export const convertClasificacionServicio = (actual: number) => {
  if (actual === 0 || actual === 277) return 277; // INTERNO
  if (actual === 1 || actual === 278) return 278; // EXTERNO
  if (actual === 2 || actual === 275) return 275; // DUE AGENT
  if (actual === 3 || actual === 274) return 274; // DUE CARRIER
  if (actual === 4 || actual === 276) return 276; // FLETE
  if (actual === 5 || actual === 347) return 347; // FLETE EXPRESS
  return null;
};

export const setServicioBase = (ctx: TarifaContext | null): FilaServicioMetodo => ({
  cod_servicio: 0,
  cod_cc: Number(ctx?.centroCostoId?.cod_cc ?? 0),
  cod_empresa: Number(ctx?.empresaId?.cod_empresa ?? 0),
  cod_rubro: 0,
  cod_tipo_servicio: 0,
  cod_tipo_aplicacion: 0,
  categoria_transporte: 0,
  clasificacion: 0,
  cod_estado: 1,
  cod_clasificacion_carga: 0,
  cod_tipo_calculo: 0,
  cod_tipo_carga: 0,
  cod_tipo_pago: 0,
  incoterm_id: 0,
  cod_tipo_transporte: 0,
  entidad_id: 0,
  nombre: "",
  siglas: "",
  servicio_interno: false,
  servicio_especial: false,
  obligatorio: false,
});

// Convierte camelCase -> snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`);
}

// Convierte snake_case -> camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, letra) => letra.toUpperCase());
}

type SnakeToCamelCase<S extends string> = S extends `${infer P}_${infer R}`
  ? `${P}${Capitalize<SnakeToCamelCase<R>>}`
  : S;

type CamelToSnakeCase<S extends string> = S extends `${infer P}${infer R}`
  ? R extends Uncapitalize<R>
    ? `${Lowercase<P>}${CamelToSnakeCase<R>}`
    : `${Lowercase<P>}_${CamelToSnakeCase<R>}`
  : S;

type ConAmbosFormatos<T extends object> = T & {
  [K in keyof T as K extends string
    ? K extends `${string}_${string}`
      ? SnakeToCamelCase<K>
      : CamelToSnakeCase<K>
    : never]: T[K];
};

/**
 * Agrega automáticamente la variante camelCase o snake_case
 * de cada campo del objeto, sin pisar valores ya existentes.
 */
export function conAmbosFormatos<T extends object>(obj: T): ConAmbosFormatos<T> {
  const source = obj as Record<string, unknown>;
  const resultado: Record<string, unknown> = { ...source };

  for (const key of Object.keys(source)) {
    const valor = source[key];

    if (key.includes("_")) {
      const camel = snakeToCamel(key);

      if (!(camel in resultado)) {
        resultado[camel] = valor;
      }
    } else {
      const snake = camelToSnake(key);

      if (!(snake in resultado)) {
        resultado[snake] = valor;
      }
    }
  }

  return resultado as ConAmbosFormatos<T>;
}

/* ==========================================================================
 * FORMATO / VALIDACIÓN COMPARTIDOS
 * ========================================================================== */

/** Cantidad de decimales de un número (para validar porcentajes). */
export const obtenerCantidadDecimales = (numero: string | number | null | undefined) => {
  const valor = Number(numero ?? 0);

  const parteEntera = Math.trunc(valor);
  const diferencia = valor - parteEntera;

  const diferenciaComoCadena = diferencia.toString().split(".");

  const parteDecimal = diferenciaComoCadena[1] || "";

  return parteDecimal.length;
};

/** Fecha en formato "yyyy-MM-dd" para un <input type="date">; vacío si no es válida. */
export const formatDateForInput = (date: Date | string | null | undefined) => {
  if (!date) return "";

  const d = date instanceof Date ? date : new Date(date);

  return Number.isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
};
