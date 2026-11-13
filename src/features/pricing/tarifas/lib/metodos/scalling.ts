/* ==========================================================================
 * MÉTODO SCALLING: DEFINICIÓN ÚNICA DE CAMPOS
 *
 * Esquema, tipos, payload, validación, fila nueva y columnas salen de aquí
 * (ver lib/campos-metodo.ts). Para agregar un campo: agrégalo en `campos`;
 * si se ve, colócalo en components/metodos/scalling/scalling-form.tsx y, si va
 * en la tabla, su código en la lista de scalling-columns.tsx.
 *
 * A mano (se conserva del código viejo):
 *   - El tipo de punto de enlace no se envía: al leer sale del punto y en el
 *     formulario filtra los puntos (cascada). También es requerido para guardar.
 *   - cod_moneda ?? value ?? 1, costo ?? 0 (sin Number) y cod_estado ?? 1.
 *   - El formulario (combos sin `label`, placeholders propios) se escribe a mano.
 * ========================================================================== */

import { zId } from "@/shared/lib/zod-scalars";

import type { MonedaOpcion } from "../../hooks/use-opciones-tarifa";
import { definirMetodo, moneda, monto, opcion, propio } from "../campos-metodo";

type Id = string | number;

export type TipoPuntoEnlaceScallingOption = {
  value: string;
  label: string;

  cod_tipo: Id;

  [key: string]: unknown;
};

export type PuntoEnlaceScallingOption = {
  value: string;
  label: string;

  cod_puntoenlace: Id;
  cod_tipo: Id;

  [key: string]: unknown;
};

export type MonedaScallingOption = MonedaOpcion;

export const METODO_SCALLING = definirMetodo({
  id: { cod: "cod_tarifa_scalling", siFalta: 0 },

  campos: {
    cod_puntoenlace: opcion<PuntoEnlaceScallingOption>()({
      label: "Aduana/Puerto/Aeropuerto",
      en: "punto_enlace",
      catalogo: "puntosEnlace",
      buscarPor: (punto) => punto.cod_puntoenlace,
      requerido: true,
      inicial: null,
      aPayload: (valores) => {
        const punto = valores.punto_enlace as PuntoEnlaceScallingOption | null | undefined;

        return punto?.cod_puntoenlace ?? punto?.value ?? null;
      },
    }),

    costo: monto({
      label: "Valor",
      inicial: 0,
      aPayload: (valores, cod) => (valores[cod] ?? 0) as Id,
    }),

    cod_moneda: moneda({
      label: "Moneda",
      en: "moneda",
      requerido: true,
      inicial: null,
      // Sin moneda se envía 1 (comportamiento viejo).
      aPayload: (valores) => {
        const opcionMoneda = valores.moneda as MonedaOpcion | null | undefined;

        return (opcionMoneda?.cod_moneda ?? opcionMoneda?.value ?? 1) as Id;
      },
    }),

    cod_estado: propio({ esquema: zId, aPayload: (valores, cod) => (valores[cod] ?? 1) as Id }),
  },
});

type Tipos = typeof METODO_SCALLING.tipos;

/** Registro de la lista (lo que devuelve el API). */
export type TarifaScalling = Tipos["registro"];

/** Fila del formulario y de la tabla: la del método + el tipo de punto (cascada). */
export type FilaMetodoScalling = Tipos["fila"] & {
  tipo_puntoenlace?: TipoPuntoEnlaceScallingOption | null;
};

/** Lo que se envía a insertar / actualizar / eliminar. */
export type TarifaScallingMutationPayload = Tipos["payload"];
