/* ==========================================================================
 * MÉTODO COBERTURA: DEFINICIÓN ÚNICA DE CAMPOS
 *
 * Esquema, tipos, payload, validación y campos del formulario salen de aquí
 * (ver lib/campos-metodo.ts). Para agregar un campo: agrégalo en `campos` y,
 * si se ve, colócalo en components/metodos/cobertura/cobertura-form.tsx.
 *
 * A mano en el formulario: los avisos de más de 8 decimales (no bloquean).
 * ========================================================================== */

import { zId } from "@/shared/lib/zod-scalars";

import type { MonedaOpcion } from "../../hooks/use-opciones-tarifa";
import { definirMetodo, fijo, moneda, monto, ventaNoMenorQueCosto } from "../campos-metodo";

const PORCENTAJE = { min: 0, max: 100, step: "0.01", sufijo: "%" } as const;

export const METODO_COBERTURA = definirMetodo({
  id: { cod: "cod_tarifa_cobertura", siFalta: 0 },

  campos: {
    porcentaje_costo: monto({ label: "Porcentaje costo", inicial: 0, formulario: PORCENTAJE }),

    porcentaje_venta: monto({ label: "Porcentaje venta", inicial: 0, formulario: PORCENTAJE }),

    minimo_venta: monto({ label: "Mínimo venta", inicial: 0 }),

    minimo_costo: monto({ label: "Mínimo costo", inicial: 0 }),

    cod_moneda_costo: moneda({ label: "Moneda de costo", en: "moneda_costo", requerido: true }),

    cod_moneda_venta: moneda({ label: "Moneda de venta", en: "moneda_venta", requerido: true }),

    // Se envía null tanto al insertar como al actualizar (igual que el código viejo).
    cod_rubro: fijo(null, { esquema: zId.nullable().optional() }),

    cod_estado: fijo(1, { esquema: zId }),
  },

  reglas: [
    ventaNoMenorQueCosto(
      "porcentaje_costo",
      "porcentaje_venta",
      "El valor de venta debe ser mayor al de costo",
      { vaciosComoCero: true },
    ),
  ],
});

type Tipos = typeof METODO_COBERTURA.tipos;

/** Registro de la lista (lo que devuelve el API). */
export type TarifaCobertura = Tipos["registro"];

/** Fila del formulario: el registro + las opciones de moneda. */
export type FilaCobertura = Tipos["fila"];

/** Lo que se envía a insertar / actualizar. */
export type TarifaCoberturaMutationPayload = Tipos["payload"];

export type MonedaCoberturaOption = MonedaOpcion;
