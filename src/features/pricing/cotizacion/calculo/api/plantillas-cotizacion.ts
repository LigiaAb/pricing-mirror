"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zId } from "@/shared/lib/zod-scalars";

import type { Id } from "../lib/tipos";

export const plantillaCotizacionSchema = z
  .object({
    cod_tarifaplantilla: zId,
    descripcion: z.string().nullable().optional(),
    cod_empresa: zId.nullable().optional(),
    cod_cc: zId.nullable().optional(),
    cod_tipo_servicio: zId.nullable().optional(),
    cod_tipo_transporte: zId.nullable().optional(),
    cod_estado: zId.nullable().optional(),
    cod_tipo_carga: zId.nullable().optional(),
    cod_clasificacion_carga: zId.nullable().optional(),
    incoterm_id: zId.nullable().optional(),
    cod_tipo_pago: zId.nullable().optional(),
    entidad_id: zId.nullable().optional(),
    cod_puntoenlace_origen: zId.nullable().optional(),
    cod_pais_origen: zId.nullable().optional(),
    cod_tipo_puntoenlace_origen: zId.nullable().optional(),
    cod_puntoenlace_destino: zId.nullable().optional(),
    cod_pais_destino: zId.nullable().optional(),
    cod_tipo_puntoenlace_destino: zId.nullable().optional(),
    cod_ciudad_origen: zId.nullable().optional(),
    cod_ciudad_destino: zId.nullable().optional(),
    carrier_id: zId.nullable().optional(),
    entidadcontacto_id: zId.nullable().optional(),
    entidad_id_estacion: zId.nullable().optional(),
  })
  .passthrough();

export const plantillaCotizacionRubroSchema = z
  .object({
    cod_plantillarubro: zId,
    cod_rubro: zId,
    obligatorio: z.boolean().nullable().optional(),
    cod_tarifaplantilla: zId,
    cod_estado: zId.nullable().optional(),
    cod_servicio: zId.nullable().optional(),
  })
  .passthrough();

export type PlantillaCotizacion = z.infer<typeof plantillaCotizacionSchema>;
export type PlantillaCotizacionRubro = z.infer<typeof plantillaCotizacionRubroSchema>;

export type ContextoPlantillasCotizacion = {
  entidad_id: Id;
  cod_emp: Id;
  cod_cc: Id;
};

export const PLANTILLAS_COTIZACION_QUERY_KEY = ["pricing", "cotizacion", "plantillas"] as const;

export function usePlantillasPosiblesCotizacion(
  contexto: ContextoPlantillasCotizacion | null,
  codEstadoActivo: Id,
  enabled = true,
) {
  return useQuery({
    queryKey: [...PLANTILLAS_COTIZACION_QUERY_KEY, contexto, codEstadoActivo],
    queryFn: async () => {
      if (!contexto) return [];

      return parseEnvelope(
        await http.get<unknown>("/api/appweb/lista-tarifa-plantilla", {
          params: {
            entidad_id: contexto.entidad_id,
            cod_emp: contexto.cod_emp,
            cod_cc: contexto.cod_cc,
            cod_estado: codEstadoActivo,
          },
        }),
        plantillaCotizacionSchema,
        "lista-tarifa-plantilla",
      );
    },
    enabled: enabled && contexto !== null,
    ...CACHE_DYNAMIC,
  });
}

export function useRubrosPlantillaCotizacion(codTarifaPlantilla: Id | null, codEstadoActivo: Id) {
  return useQuery({
    queryKey: [...PLANTILLAS_COTIZACION_QUERY_KEY, "rubros", codTarifaPlantilla, codEstadoActivo],
    queryFn: async () => {
      if (codTarifaPlantilla == null) return [];

      return parseEnvelope(
        await http.get<unknown>("/api/appweb/lista-plantilla-rubro", {
          params: {
            cod_tarifaplantilla: codTarifaPlantilla,
            cod_estado: codEstadoActivo,
          },
        }),
        plantillaCotizacionRubroSchema,
        "lista-plantilla-rubro",
      );
    },
    enabled: codTarifaPlantilla !== null,
    ...CACHE_DYNAMIC,
  });
}
