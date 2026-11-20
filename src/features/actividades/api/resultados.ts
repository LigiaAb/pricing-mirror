import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { zIdSafeNull } from "@/shared/lib/zod-scalars";
import { actividades } from "./actividades";

const texto = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value ?? "");

const resultadoActividadSchema = z.looseObject({
  cod_resultado: zIdSafeNull,
  cod_actividad: zIdSafeNull,
  cod_tipo_resultado: zIdSafeNull,
  nom_tipo_resultado: texto,
  nom_tipo: texto,
  descripcion: texto,
  fecha_creada: texto,
  fecha_programada: texto,
  referencia: texto,
});

export type ResultadoActividad = z.infer<typeof resultadoActividadSchema>;

const resultadosKeys = {
  all: ["resultados-actividad"] as const,
  lista: (codActividad: number) => ["resultados-actividad", codActividad] as const,
};

async function fetchResultados(codActividad: number): Promise<ResultadoActividad[]> {
  const respuesta = await http.get<unknown>("/api/appweb/lista-resultados", {
    params: { cod_actividad: codActividad },
  });
  return parseEnvelope(respuesta, resultadoActividadSchema, "lista-resultados");
}

export function useResultadosActividad(codActividad: number | null) {
  return useQuery({
    queryKey: resultadosKeys.lista(codActividad ?? 0),
    queryFn: () => fetchResultados(codActividad as number),
    enabled: codActividad !== null,
  });
}

export function useInsertarResultado() {
  const queryClient = useQueryClient();
  return useMutation<Record<string, unknown>, Error, Record<string, unknown>>({
    mutationFn: (payload) => http.post("/api/appweb/insertar-resultado", payload),
    meta: { successMessage: "Resultado registrado" },
    onSettled: async (_data, _error, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: resultadosKeys.lista(Number(variables.cod_actividad)),
        }),
        queryClient.invalidateQueries({ queryKey: actividades.keys.all }),
      ]);
    },
  });
}
