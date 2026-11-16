/* ==========================================================================
 * MÉTODO COSTO / VENTA: DEFINICIÓN ÚNICA DE CAMPOS
 *
 * Esquema, tipos, payload, validación y campos del formulario salen de aquí
 * (ver lib/campos-metodo.ts). Para agregar un campo: agrégalo en `campos` y,
 * si se ve, colócalo en components/metodos/costoVenta/costo-venta-form.tsx.
 * ========================================================================== */

import { zId } from "@/shared/lib/zod-scalars";

import type { MonedaOpcion } from "../../hooks/use-opciones-tarifa";
import {
  definirMetodo,
  delContexto,
  fijo,
  moneda,
  monto,
  ventaNoMenorQueCosto,
} from "../campos-metodo";

export const METODO_COSTO_VENTA = definirMetodo({
  id: { cod: "cod_tarifa_costoventa", siFalta: null },

  campos: {
    cod_servicio: delContexto("codServicio"),

    costo: monto({
      label: "Costo",
      requerido: true,
      formulario: { step: "0.1", simboloDe: "moneda_costo" },
    }),

    venta: monto({
      label: "Venta",
      requerido: true,
      formulario: { step: "0.1", simboloDe: "moneda_venta" },
    }),

    cod_moneda_costo: moneda({ label: "Moneda de costo", en: "moneda_costo", requerido: true }),

    cod_moneda_venta: moneda({ label: "Moneda de venta", en: "moneda_venta", requerido: true }),

    cod_estado: fijo(1, { esquema: zId }),
  },

  reglas: [
    ventaNoMenorQueCosto(
      "costo",
      "venta",
      "El valor de venta debe ser mayor o igual al valor de costo.",
    ),
  ],
});

type Tipos = typeof METODO_COSTO_VENTA.tipos;

/** Registro de la lista (lo que devuelve el API). */
export type TarifaCostoVenta = Tipos["registro"];

/** Fila del formulario: el registro + las opciones de moneda. */
export type FilaCostoVenta = Tipos["fila"];

/** Lo que se envía a insertar / actualizar. */
export type TarifaCostoVentaMutationPayload = Tipos["payload"];

export type MonedaCostoVentaOption = MonedaOpcion;
