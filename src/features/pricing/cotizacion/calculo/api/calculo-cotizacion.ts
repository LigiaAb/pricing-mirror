import { mutationOptions, useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zId } from "@/shared/lib/zod-scalars";

/* ==========================================================================
 * SCHEMAS BASE
 * ========================================================================== */

const numero = z.union([z.number(), z.string()]).nullable().optional();

const texto = z
  .union([z.string(), z.number()])
  .nullable()
  .optional()
  .transform((value) => (value == null ? "" : String(value)));

export const detalleCalculoSchema = z
  .object({
    tipo_desc: texto,

    tarifadetalle_descripcion: texto,

    tarifadetalle_valor: texto,
  })
  .passthrough();

export const rutaCalculoSchema = z
  .object({
    costo: numero,
    venta: numero,
  })
  .passthrough();

export const metodoCalculoSchema = z
  .object({
    cod_metodo: zId.nullable().optional(),

    cod_tipo_calculo: zId.nullable().optional(),

    costo: numero,
    venta: numero,

    original_venta: numero,

    rate_costo: numero,
    rate_venta: numero,

    original_rate_costo: numero,

    original_rate_venta: numero,

    minimo: numero,

    cod_moneda_costo: zId.nullable().optional(),

    cod_moneda_venta: zId.nullable().optional(),

    detalles: z.array(detalleCalculoSchema).optional().catch([]),

    rutas: z.array(rutaCalculoSchema).optional().catch([]),
  })
  .passthrough();

export const servicioCalculoSchema = z
  .object({
    cod_servicio: zId.nullable().optional(),

    nombre: texto,

    entidad_id: zId.nullable().optional(),

    entidad_nombre: texto,

    clasificacion: zId.nullable().optional(),

    servicio_clasificacion: zId.nullable().optional(),

    metodo: metodoCalculoSchema.nullable().optional(),
  })
  .passthrough();

export const rubroCalculoSchema = z
  .object({
    cod_rubro: zId.nullable().optional(),

    nombre: texto,
    nombre_rubro: texto,

    es_flete: z.boolean().nullable().optional(),

    es_tarifa_spot: z.boolean().nullable().optional(),

    cod_tipo_pago: zId.nullable().optional(),

    entidad_id: zId.nullable().optional(),

    clasificacion: zId.nullable().optional(),

    servicio_clasificacion: zId.nullable().optional(),

    /*
     * calcular-tarifa normalmente
     * devuelve rubro -> servicios[]
     */
    servicios: z.array(servicioCalculoSchema).optional().catch([]),

    /*
     * Algunas transformaciones posteriores
     * convierten la estructura a:
     *
     * rubro -> servicio
     */
    servicio: servicioCalculoSchema.nullable().optional(),

    metodo: metodoCalculoSchema.nullable().optional(),
  })
  .passthrough();

export type RubroCalculo = z.infer<typeof rubroCalculoSchema>;

export type ServicioCalculo = z.infer<typeof servicioCalculoSchema>;

export type MetodoCalculo = z.infer<typeof metodoCalculoSchema>;

/* ==========================================================================
 * PARAMS
 * ========================================================================== */

/*
 * Los criterios del cálculo son dinámicos:
 *
 * valor_cw
 * pais_origen
 * pais_destino
 * commodity
 * express
 * etc.
 *
 * No conviene inventar aquí un contrato
 * cerrado mientras el backend acepte
 * criterios dinámicos.
 */
export type CalculoTarifaParams = Record<string, unknown>;

/* ==========================================================================
 * FUNCIONES API
 * ========================================================================== */

/*
 * Endpoint principal.
 *
 * Lo utilizan actualmente:
 *
 * - Due Carrier
 * - Due Agent
 * - Due Carrier basado en Due Agent
 */
export async function calcularTarifa(params: CalculoTarifaParams) {
  return parseEnvelope(
    await http.get<unknown>("/api/appweb/calcular-tarifa", {
      params,
    }),
    rubroCalculoSchema,
    "calcular-tarifa",
  );
}

/*
 * Se utiliza para recuperar específicamente
 * los rubros de flete de la plantilla.
 */
export async function calcularTarifaRubros(params: CalculoTarifaParams) {
  return parseEnvelope(
    await http.get<unknown>("/api/appweb/calcular-tarifa-rubros", {
      params,
    }),
    rubroCalculoSchema,
    "calcular-tarifa-rubros",
  );
}

/*
 * Cálculo de Scalling.
 */
export async function calcularTarifaScalling(params: CalculoTarifaParams) {
  const { lista_paises: listaPaises, ...otrosParams } = params;
  const paramsScalling = Array.isArray(listaPaises)
    ? {
        ...otrosParams,
        "lista_paises[]": listaPaises,
      }
    : params;

  return parseEnvelope(
    await http.get<unknown>("/api/appweb/calcular-tarifa-scalling", {
      params: paramsScalling,
    }),
    rubroCalculoSchema,
    "calcular-tarifa-scalling",
  );
}

/* ==========================================================================
 * MUTATIONS
 * ========================================================================== */

/*
 * Aunque sean GET, funcionalmente estos endpoints
 * son acciones de cálculo.
 *
 * No queremos:
 *
 * - cache automática
 * - staleTime
 * - refetch on focus
 *
 * Queremos:
 *
 * mutateAsync(params)
 * isPending
 * error
 */
export const calcularTarifaOptions = () =>
  mutationOptions({
    mutationFn: calcularTarifa,
  });

export const calcularTarifaRubrosOptions = () =>
  mutationOptions({
    mutationFn: calcularTarifaRubros,
  });

export const calcularTarifaScallingOptions = () =>
  mutationOptions({
    mutationFn: calcularTarifaScalling,
  });

export function useCalcularTarifa() {
  return useMutation(calcularTarifaOptions());
}

export function useCalcularTarifaRubros() {
  return useMutation(calcularTarifaRubrosOptions());
}

export function useCalcularTarifaScalling() {
  return useMutation(calcularTarifaScallingOptions());
}
