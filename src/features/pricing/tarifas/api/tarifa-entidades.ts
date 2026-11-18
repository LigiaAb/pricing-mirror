import {
  mutationOptions,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { z } from "zod";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zId } from "@/shared/lib/zod-scalars";

export const TARIFA_ENTIDADES_QUERY_KEY = ["tarifas", "entidades"] as const;

export const tarifaEntidadSchema = z.object({
  cod_tarifa_entidad: zId,
  cod_metodo: zId,
  entidad_id: zId,
  cod_estado: zId,
  nombre_cliente: z.string().nullable().optional().catch(""),
});

export type TarifaEntidad = z.infer<typeof tarifaEntidadSchema>;

export interface FiltrosTarifaEntidad {
  codEstado?: string | number;
  codMetodo?: string | number;
  entidadId?: string | number;
}

export const tarifaEntidadesOptions = (filtros: FiltrosTarifaEntidad = {}) =>
  queryOptions({
    queryKey: [...TARIFA_ENTIDADES_QUERY_KEY, filtros],

    queryFn: async () =>
      parseEnvelope(
        await http.get<unknown>("/api/appweb/lista-tarifa-entidad", {
          params: {
            cod_estado: filtros.codEstado,
            cod_metodo: filtros.codMetodo,
            entidad_id: filtros.entidadId,
          },
        }),
        tarifaEntidadSchema,
        "lista-tarifa-entidad",
      ),
    ...CACHE_DYNAMIC,
  });

export function useTarifaEntidades(filtros: FiltrosTarifaEntidad = {}) {
  return useQuery(tarifaEntidadesOptions(filtros));
}

export type TarifaEntidadMutationPayload = {
  cod_tarifa_entidad?: string | number | null;
  cod_metodo: string | number;
  entidad_id: string | number;
  cod_estado?: string | number | null;
  [key: string]: unknown;
};

export const guardarTarifaEntidadOptions = () =>
  mutationOptions({
    mutationFn: async (payload: TarifaEntidadMutationPayload) => {
      return await http.post<unknown>("/api/appweb/insertar-tarifa-entidad", payload);
    },
  });

export const eliminarTarifaEntidadOptions = () =>
  mutationOptions({
    mutationFn: async (payload: TarifaEntidadMutationPayload) => {
      return await http.post<unknown>("/api/appweb/eliminar-tarifa-entidad", payload);
    },
  });

export function useGuardarTarifaEntidad() {
  const queryClient = useQueryClient();

  return useMutation({
    ...guardarTarifaEntidadOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: TARIFA_ENTIDADES_QUERY_KEY,
      });
    },
  });
}

export function useEliminarTarifaEntidad() {
  const queryClient = useQueryClient();

  return useMutation({
    ...eliminarTarifaEntidadOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: TARIFA_ENTIDADES_QUERY_KEY,
      });
    },
  });
}
