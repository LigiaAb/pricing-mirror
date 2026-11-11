import { queryOptions, useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zId } from "@/shared/lib/zod-scalars";

import type { Id } from "../lib/tipos";

const numeroNullable = z.union([z.number(), z.string()]).nullable().optional();

export const rutaScallingSchema = z
  .object({
    cod_tarifa_scalling: zId.nullable().optional(),

    cod_metodo: zId.nullable().optional(),

    codigo: z.union([z.string(), z.number()]).nullable().optional(),

    punto_enlace: z.union([z.string(), z.number()]).nullable().optional(),

    rate: numeroNullable,

    costo: numeroNullable,

    cod_moneda: zId.nullable().optional(),

    cod_estado: zId.nullable().optional(),
  })
  .passthrough();

export type RutaScalling = z.infer<typeof rutaScallingSchema>;

const servicioScallingSchema = z
  .object({
    cod_servicio: zId,

    entidad_id: zId.nullable().optional(),

    cod_rubro: zId.nullable().optional(),
  })
  .passthrough();

const metodoScallingSchema = z
  .object({
    cod_metodo: zId,

    cod_servicio: zId.nullable().optional(),
  })
  .passthrough();

export const RUTAS_SCALLING_QUERY_KEY = ["cotizaciones", "scalling", "rutas"] as const;

export async function obtenerRutasScalling(entidadId: Id) {
  /*
   * Mismo flujo actual:
   *
   * entidad + rubro 134
   *        ↓
   * servicios
   *        ↓
   * métodos
   *        ↓
   * tarifa-scalling
   */
  const servicios = parseEnvelope(
    await http.get<unknown>("/api/appweb/lista-servicios", {
      params: {
        entidad_id: entidadId,

        cod_rubro: 134,

        cod_estado: 1,
      },
    }),
    servicioScallingSchema,
    "lista-servicios-scalling",
  );

  if (!servicios.length) {
    return [];
  }

  const metodosPorServicio = await Promise.all(
    servicios.map(async (servicio) =>
      parseEnvelope(
        await http.get<unknown>("/api/appweb/lista-metodos", {
          params: {
            cod_servicio: servicio.cod_servicio,

            cod_estado: 1,
          },
        }),
        metodoScallingSchema,
        "lista-metodos-scalling",
      ),
    ),
  );

  const metodos = metodosPorServicio.flat();

  if (!metodos.length) {
    return [];
  }

  const rutasPorMetodo = await Promise.all(
    metodos.map(async (metodo) =>
      parseEnvelope(
        await http.get<unknown>("/api/appweb/lista-tarifa-scalling", {
          params: {
            cod_metodo: metodo.cod_metodo,

            cod_estado: 1,
          },
        }),
        rutaScallingSchema,
        "lista-tarifa-scalling",
      ),
    ),
  );

  return rutasPorMetodo.flat();
}

export const rutasScallingOptions = (entidadId?: Id | null) =>
  queryOptions({
    queryKey: [...RUTAS_SCALLING_QUERY_KEY, entidadId],

    queryFn: () => {
      if (entidadId == null) {
        return Promise.resolve([]);
      }

      return obtenerRutasScalling(entidadId);
    },

    enabled: entidadId != null,

    ...CACHE_DYNAMIC,
  });

export function useRutasScalling(entidadId?: Id | null) {
  return useQuery(rutasScallingOptions(entidadId));
}
