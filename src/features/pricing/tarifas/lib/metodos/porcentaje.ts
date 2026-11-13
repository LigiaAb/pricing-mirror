/* ==========================================================================
 * MÉTODO PORCENTAJE (por rubro): DEFINICIÓN ÚNICA DE CAMPOS
 *
 * Esquema, tipos, payload, validación y campos del formulario salen de aquí
 * (ver lib/campos-metodo.ts). Para agregar un campo: agrégalo en `campos` y,
 * si se ve, colócalo en components/metodos/porcentaje/porcentaje-form.tsx.
 *
 * A mano en el formulario: los avisos de más de 8 decimales (no bloquean).
 * ========================================================================== */

import { zId } from "@/shared/lib/zod-scalars";

import type { MonedaOpcion, RubroOpcion } from "../../hooks/use-opciones-tarifa";
import {
  definirMetodo,
  fijo,
  moneda,
  monto,
  rangoPermitido,
  rubro,
  ventaNoMenorQueCosto,
} from "../campos-metodo";

const PORCENTAJE = { min: 0, max: 100, step: "0.01", sufijo: "%" } as const;

const FUERA_DE_RANGO = "El porcentaje debe estar entre 0 y 100.";

/** Los mínimos vacíos se envían como 0. */
const numeroOCero = (valores: Record<string, unknown>, cod: string) => Number(valores[cod] ?? 0);

export const METODO_PORCENTAJE = definirMetodo({
  id: { cod: "cod_tarifa_porcentaje", siFalta: 0 },

  campos: {
    porcentaje_costo: monto({ label: "Porcentaje costo", inicial: 0, formulario: PORCENTAJE }),

    porcentaje_venta: monto({ label: "Porcentaje venta", inicial: 0, formulario: PORCENTAJE }),

    minimo_costo: monto({ label: "Mínimo Costo", aPayload: numeroOCero }),

    minimo_venta: monto({ label: "Mínimo Venta", aPayload: numeroOCero }),

    cod_rubro: rubro({ label: "Rubro", en: "rubro" }),

    cod_moneda_costo: moneda({ label: "Moneda de costo", en: "moneda_costo", requerido: true }),

    cod_moneda_venta: moneda({ label: "Moneda de venta", en: "moneda_venta", requerido: true }),

    cod_estado: fijo(1, { esquema: zId }),
  },

  // El orden es el de los mensajes debajo de cada campo.
  reglas: [
    ventaNoMenorQueCosto(
      "porcentaje_costo",
      "porcentaje_venta",
      "El valor de venta debe ser mayor al de costo",
      { vaciosComoCero: true },
    ),
    rangoPermitido("porcentaje_costo", 0, 100, FUERA_DE_RANGO),
    rangoPermitido("porcentaje_venta", 0, 100, FUERA_DE_RANGO),
  ],
});

type Tipos = typeof METODO_PORCENTAJE.tipos;

/** Registro de la lista (lo que devuelve el API). */
export type TarifaPorcentaje = Tipos["registro"];

/** Fila del formulario: el registro + las opciones de moneda y rubro. */
export type FilaPorcentaje = Tipos["fila"];

/** Lo que se envía a insertar / actualizar. */
export type TarifaPorcentajeMutationPayload = Tipos["payload"];

export type MonedaPorcentajeOption = MonedaOpcion;

export type RubroPorcentajeOption = RubroOpcion;
