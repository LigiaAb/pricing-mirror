"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zId } from "@/shared/lib/zod-scalars";

type Id = string | number;

export const plantillaClienteSchema = z
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

export const plantillaRubroSchema = z
  .object({
    cod_plantillarubro: zId,
    cod_rubro: zId,
    obligatorio: z.boolean().nullable().optional(),
    cod_tarifaplantilla: zId,
    cod_estado: zId.nullable().optional(),
    cod_servicio: zId.nullable().optional(),
  })
  .passthrough();

export type PlantillaCliente = z.infer<typeof plantillaClienteSchema>;
export type PlantillaRubro = z.infer<typeof plantillaRubroSchema>;
export type PlantillaClientePayload = Record<string, unknown>;

export const PLANTILLAS_CLIENTE_KEY = ["pricing", "plantillas-cliente"] as const;
export const PLANTILLAS_RUBROS_KEY = ["pricing", "plantillas-cliente", "rubros"] as const;

export function usePlantillasCliente(filtros: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: [...PLANTILLAS_CLIENTE_KEY, filtros],
    queryFn: async () =>
      parseEnvelope(
        await http.get<unknown>("/api/appweb/lista-tarifa-plantilla", { params: filtros }),
        plantillaClienteSchema,
        "lista-tarifa-plantilla",
      ),
    ...CACHE_DYNAMIC,
  });
}

export function usePlantillasRubros() {
  return useQuery({
    queryKey: PLANTILLAS_RUBROS_KEY,
    queryFn: async () =>
      parseEnvelope(
        await http.get<unknown>("/api/appweb/lista-plantilla-rubro"),
        plantillaRubroSchema,
        "lista-plantilla-rubro",
      ),
    ...CACHE_DYNAMIC,
  });
}

function obtenerIdInsertado(response: unknown): Id {
  const nivel1 =
    response && typeof response === "object" ? (response as Record<string, unknown>) : {};
  const nivel2 =
    nivel1.data && typeof nivel1.data === "object"
      ? (nivel1.data as Record<string, unknown>)
      : nivel1;
  const value = nivel2.cod_tarifaplantilla;
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error("La API no devolvió cod_tarifaplantilla.");
  }
  return value;
}

function useMutationPlantilla(endpoint: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PlantillaClientePayload) => http.post<unknown>(endpoint, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLANTILLAS_CLIENTE_KEY }),
  });
}

export function useInsertarPlantillaCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PlantillaClientePayload) =>
      obtenerIdInsertado(
        await http.post<unknown>("/api/appweb/insertar-tarifa-plantilla", payload),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLANTILLAS_CLIENTE_KEY }),
  });
}

export const useActualizarPlantillaCliente = () =>
  useMutationPlantilla("/api/appweb/actualizar-tarifa-plantilla");
export const useEliminarPlantillaCliente = () =>
  useMutationPlantilla("/api/appweb/eliminar-tarifa-plantilla");

export function useGuardarPlantillaRubros() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      insertar,
      eliminar,
    }: {
      insertar: Record<string, unknown>[];
      eliminar: Record<string, unknown>[];
    }) => {
      await Promise.all([
        ...insertar.map((item) => http.post("/api/appweb/insertar-plantilla-rubro", item)),
        ...eliminar.map((item) => http.post("/api/appweb/eliminar-plantilla-rubro", item)),
      ]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PLANTILLAS_RUBROS_KEY }),
  });
}
