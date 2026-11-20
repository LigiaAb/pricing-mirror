import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCatalogo } from "@/features/catalogos";
import { CACHE_DYNAMIC } from "@/shared/api/cache";
import { http } from "@/shared/api/client";
import { type Actividad, actividades, actividadSchema, aPayloadActividad } from "./actividades";

const ENDPOINT_ACTUALIZAR = "/api/appweb/actualizar-actividad";

export interface ResumenAsignacion {
  total: number;
  asignadas: number;
  fallidas: number;
}

export const actividadesSinAsignar = createCatalogo({
  nombre: "actividades-sin-asignar",
  schema: actividadSchema,
  endpoints: {
    lista: "/api/appweb/lista-actividades-sin-asignar",
  },
  cache: CACHE_DYNAMIC,
});

/** Asigna en paralelo y conserva el resultado parcial para informar N de M. */
export async function asignarActividades(
  seleccion: Actividad[],
  codAsesor: string | number,
): Promise<ResumenAsignacion> {
  const resultados = await Promise.allSettled(
    seleccion.map((actividad) =>
      http.post(ENDPOINT_ACTUALIZAR, {
        ...aPayloadActividad(actividad),
        cod_asesor: codAsesor,
      }),
    ),
  );
  const asignadas = resultados.filter((resultado) => resultado.status === "fulfilled").length;
  return {
    total: resultados.length,
    asignadas,
    fallidas: resultados.length - asignadas,
  };
}

export function useAsignarActividades() {
  const queryClient = useQueryClient();
  return useMutation<
    ResumenAsignacion,
    Error,
    { seleccion: Actividad[]; codAsesor: string | number }
  >({
    mutationFn: ({ seleccion, codAsesor }) => asignarActividades(seleccion, codAsesor),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: actividades.keys.all }),
        queryClient.invalidateQueries({ queryKey: actividadesSinAsignar.keys.all }),
      ]);
    },
  });
}
