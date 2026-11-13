/* ==========================================================================
 * MÉTODO RANGO: DEFINICIÓN ÚNICA DE CAMPOS
 *
 * Vive en pricing/shared porque Cotizaciones también lee la lista de rangos
 * (tarifaRangoSchema sale de aquí). Ver shared/lib/campos-metodo.ts.
 *
 * Para agregar un campo: agrégalo en `campos`; si se ve, colócalo en
 * tarifas/components/metodos/rango/rango-form.tsx y, si va en la tabla, su
 * código en la lista de rango-columns.tsx.
 *
 * Se conserva del código viejo:
 *   - Los montos se envían tal cual (sin Number) y `inicio || 0`; `final` siempre null.
 *   - Un campo requerido falta si es falso (`!valor`): 0 cuenta como vacío.
 *   - El formulario (grilla de 7 columnas, "" en lugar de null) se escribe a mano.
 * ========================================================================== */

import { zId } from "@/shared/lib/zod-scalars";

import {
  definirMetodo,
  delContexto,
  esquemaMonto,
  fijo,
  moneda,
  monto,
  propio,
  type ReglaMetodo,
} from "../campos-metodo";

type Id = string | number;
type Valores = Record<string, unknown>;

/** El valor tal cual o null (sin Number). */
const crudoONull = (valores: Valores, cod: string) => (valores[cod] ?? null) as Id | null;

/** Requerido: falta si es falso (incluye 0). */
const faltaSiFalso = (valores: Valores, cod: string) => !valores[cod];

/** Solo compara si costo y venta tienen valor (no 0). */
const ventaNoMenorQueCosto: ReglaMetodo = (valores) =>
  valores.costo && valores.venta && Number(valores.costo) > Number(valores.venta)
    ? { campo: "venta", mensaje: "El valor de venta debe ser igual o mayor al valor del costo" }
    : null;

const montoRequerido = (label: string, labelFaltante: string) =>
  monto({
    label,
    labelFaltante,
    requerido: true,
    falta: faltaSiFalso,
    inicial: "",
    aPayload: crudoONull,
  });

export const METODO_RANGO = definirMetodo({
  id: { cod: "cod_tarifa_rango", siFalta: null },

  // El orden de los requeridos es el de la lista de faltantes del formulario.
  campos: {
    cod_servicio: delContexto("codServicio"),

    inicio: monto({
      label: "A partir de...",
      inicial: "",
      aPayload: (valores, cod) => (valores[cod] || 0) as Id,
    }),

    final: fijo(null, { esquema: esquemaMonto }),

    costo_minimo: montoRequerido("Mínimo costo", "Mínimo de Costo"),

    venta_minimo: montoRequerido("Mínimo venta", "Mínimo de Venta"),

    costo: montoRequerido("Costo", "Costo"),

    venta: montoRequerido("Venta", "Venta"),

    cod_moneda_costo: moneda({
      label: "Moneda costo",
      labelFaltante: "Moneda de Costo",
      en: "moneda_costo",
      requerido: true,
      inicial: null,
    }),

    cod_moneda_venta: moneda({
      label: "Moneda venta",
      labelFaltante: "Moneda de Venta",
      en: "moneda_venta",
      requerido: true,
      inicial: null,
    }),

    cod_estado: propio({ esquema: zId, aPayload: (valores, cod) => (valores[cod] ?? 1) as Id }),
  },

  reglas: [ventaNoMenorQueCosto],
});

type Tipos = typeof METODO_RANGO.tipos;

/** Registro de la lista (lo que devuelve el API). */
export type TarifaRango = Tipos["registro"];

/** Fila del formulario (sin localId; ver tarifas/.../rango-columns.tsx). */
export type FilaRango = Tipos["fila"];

/** Lo que se envía al guardar cada rango. */
export type TarifaRangoMutationPayload = Tipos["payload"];
