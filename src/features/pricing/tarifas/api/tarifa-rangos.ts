import { mutationOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TARIFA_RANGOS_QUERY_KEY,
  type TarifaRangoMutationPayload,
} from "@/features/pricing/shared";
import { http } from "@/shared/api/client";

/* Lectura (esquema, tipos y consulta): compartida en pricing/shared/api/tarifa-rangos.ts */
export {
  type FiltrosTarifaRango,
  TARIFA_RANGOS_QUERY_KEY,
  type TarifaRango,
  tarifaRangoSchema,
  tarifaRangosOptions,
  useTarifaRangos,
} from "@/features/pricing/shared";
// Monedas: consulta única en ./monedas.ts (se conservan los nombres de este método).
export {
  type MonedaOperativa as MonedaRango,
  monedasOperativasOptions as monedasRangoOptions,
  useMonedasOperativas as useMonedasRango,
} from "./monedas";
// Payload: definición única en pricing/shared/lib/metodos/rango.ts.
export type { TarifaRangoMutationPayload };

export const guardarTarifaRangosOptions = () =>
  mutationOptions({
    mutationFn: async (rangos: TarifaRangoMutationPayload[]) => {
      return Promise.all(
        rangos.map((rango) => http.post<unknown>("/api/appweb/insertar-tarifa-rango", rango)),
      );
    },
  });

export function useGuardarTarifaRangos() {
  const queryClient = useQueryClient();

  return useMutation({
    ...guardarTarifaRangosOptions(),

    meta: { successMessage: "Rangos guardados" },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: TARIFA_RANGOS_QUERY_KEY,
      });
    },
  });
}
