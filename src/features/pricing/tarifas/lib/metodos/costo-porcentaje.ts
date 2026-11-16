/* ==========================================================================
 * MÉTODO COSTO POR PORCENTAJE: DEFINICIÓN ÚNICA DE CAMPOS
 *
 * Esquema, tipos, payload, validación y campos del formulario salen de aquí
 * (ver lib/campos-metodo.ts). Para agregar un campo: agrégalo en `campos` y,
 * si se ve, colócalo en components/metodos/costo-porcentaje/costo-porcentaje-form.tsx.
 *
 * El lado de costo (porcentaje_costo, minimo_costo, moneda de costo) se envía
 * pero hoy no se muestra en el formulario. Solo la moneda de venta es requerida.
 *
 * A mano en el formulario: el input de venta (etiqueta, max, step y "%"
 * cambian con es_porcentaje), el radio Porcentaje / Valor y los avisos de
 * más de 8 decimales.
 * ========================================================================== */

import { zId } from "@/shared/lib/zod-scalars";

import type { MonedaOpcion, RubroOpcion } from "../../hooks/use-opciones-tarifa";
import {
  booleano,
  definirMetodo,
  fijo,
  moneda,
  monto,
  type ReglaMetodo,
  rubro,
  sinEsquema,
  ventaNoMenorQueCosto,
} from "../campos-metodo";

/** Los mínimos vacíos se envían como 0. */
const numeroOCero = (valores: Record<string, unknown>, cod: string) => Number(valores[cod] ?? 0);

/**
 * Si es porcentaje se guarda en enteros con decimales (25.26 = 25.26 %), no como 0.2526;
 * Cotizaciones lo convierte a factor (÷ 100) al calcular la venta.
 * Porcentaje: entre 0 y 100. Valor: no negativo.
 */
const dentroDeRango =
  (campo: string): ReglaMetodo =>
  (valores) => {
    const valor = Number(valores[campo] ?? 0);
    const esPorcentaje = Boolean(valores.es_porcentaje);

    if (!(valor < 0 || (esPorcentaje && valor > 100))) return null;

    return {
      campo,
      mensaje: esPorcentaje
        ? "El porcentaje debe estar entre 0 y 100."
        : "El valor no puede ser negativo.",
    };
  };

export const METODO_COSTO_PORCENTAJE = definirMetodo({
  id: { cod: "cod_tarifa_porcentaje", siFalta: 0 },

  campos: {
    porcentaje_costo: monto({ label: "Porcentaje costo", inicial: 0 }),

    porcentaje_venta: monto({ label: "Porcentaje venta", inicial: 0 }),

    minimo_costo: monto({ label: "Costo Mínimo", inicial: 0, aPayload: numeroOCero }),

    minimo_venta: monto({ label: "Mínimo Venta", inicial: 0, aPayload: numeroOCero }),

    es_porcentaje: booleano({ label: "Tipo de valor", inicial: true }),

    // Se envía, pero no es parte del esquema de la lista ni se ve en el formulario.
    cod_rubro: sinEsquema(rubro({ label: "Rubro", en: "rubro" })),

    cod_moneda_costo: moneda({ label: "Moneda de costo", en: "moneda_costo", inicial: null }),

    cod_moneda_venta: moneda({
      label: "Moneda de venta",
      en: "moneda_venta",
      requerido: true,
      inicial: null,
    }),

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
    dentroDeRango("porcentaje_costo"),
    dentroDeRango("porcentaje_venta"),
  ],
});

type Tipos = typeof METODO_COSTO_PORCENTAJE.tipos;

/** Registro de la lista (lo que devuelve el API). */
export type TarifaCostoPorcentaje = Tipos["registro"];

/** Fila del formulario: el registro + las opciones de moneda y rubro. */
export type FilaCostoPorcentaje = Tipos["fila"];

/** Lo que se envía a insertar / actualizar. */
export type TarifaCostoPorcentajeMutationPayload = Tipos["payload"];

export type MonedaCostoPorcentajeOption = MonedaOpcion;

export type RubroCostoPorcentajeOption = RubroOpcion;
