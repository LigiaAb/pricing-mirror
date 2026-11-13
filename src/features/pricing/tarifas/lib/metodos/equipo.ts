/* ==========================================================================
 * MÉTODO EQUIPO: DEFINICIÓN ÚNICA DE CAMPOS
 *
 * Esquema, tipos, payload, validación y fila nueva salen de aquí (ver
 * lib/campos-metodo.ts). Para agregar un campo: agrégalo en `campos` y
 * colócalo en components/metodos/equipo/equipo-form.tsx.
 *
 * Diferencias con los demás métodos (se conservan del código viejo):
 *   - La opción del select se guarda en la MISMA llave del API
 *     (cod_equipo, cod_moneda_costo, cod_moneda_venta).
 *   - Las monedas usan `value` numérico (= cod_moneda) y se envía
 *     `opcion.value || null` tal cual al backend.
 *   - Al insertar no se envía cod_tarifa_equipo (lo resuelve MetodoEquipo).
 *   - El formulario tiene su propio estilo (asteriscos, placeholders,
 *     símbolo en la etiqueta): se escribe a mano.
 * ========================================================================== */

import { zId } from "@/shared/lib/zod-scalars";

import { definirMetodo, fijo, monto, opcion, ventaNoMenorQueCosto } from "../campos-metodo";

type Id = string | number;

export type EquipoOption = {
  value: Id;
  label: string;

  [key: string]: unknown;
};

export type MonedaEquipoOption = {
  value: Id;
  label: string;

  cod_moneda: Id;

  simbolo?: string;

  [key: string]: unknown;
};

/** `||` (no `??`): un value 0 o "" se envía null, igual que el código viejo. */
const valueONull = (valores: Record<string, unknown>, cod: string) =>
  (valores[cod] as { value?: Id } | null | undefined)?.value || null;

export const METODO_EQUIPO = definirMetodo({
  id: { cod: "cod_tarifa_equipo", siFalta: null },

  campos: {
    cod_equipo: opcion<EquipoOption>()({
      label: "Equipo",
      en: "cod_equipo",
      catalogo: "equipos",
      requerido: true,
      inicial: null,
      aPayload: valueONull,
    }),

    costo: monto({ label: "Costo", requerido: true, inicial: null }),

    venta: monto({ label: "Venta", requerido: true, inicial: null }),

    cod_moneda_costo: opcion<MonedaEquipoOption>()({
      label: "Moneda de costo",
      en: "cod_moneda_costo",
      catalogo: "monedasEquipo",
      requerido: true,
      inicial: null,
      aPayload: valueONull,
    }),

    cod_moneda_venta: opcion<MonedaEquipoOption>()({
      label: "Moneda de venta",
      en: "cod_moneda_venta",
      catalogo: "monedasEquipo",
      requerido: true,
      inicial: null,
      aPayload: valueONull,
    }),

    cod_estado: fijo(1, { esquema: zId.nullable(), inicial: 1 }),
  },

  reglas: [
    ventaNoMenorQueCosto("costo", "venta", "El valor de venta debe ser mayor al de costo"),
  ],
});

type Tipos = typeof METODO_EQUIPO.tipos;

/** Registro de la lista (lo que devuelve el API). */
export type TarifaEquipo = Tipos["registro"];

/** Fila del formulario: el registro con las opciones en cod_equipo / cod_moneda_*. */
export type FilaEquipo = Tipos["fila"];

/** Lo que se envía a insertar / actualizar. */
export type TarifaEquipoMutationPayload = Tipos["payload"];
