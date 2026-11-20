import { queryOptions, useQuery } from "@tanstack/react-query";
import { http } from "@/shared/api/client";
import { parseEnvelope } from "@/shared/api/envelope";
import { actividadSchema } from "./actividades";

export interface FiltrosActividadesPersonales {
  codAsesor: string | number;
  codEmpresa: string | number;
  codCc: string | number;
}

function actividadesPersonalesOptions(
  tipo: "en-curso" | "vencidas",
  filtros: FiltrosActividadesPersonales,
) {
  const endpoint =
    tipo === "en-curso"
      ? "/api/appweb/lista-actividades-en-curso"
      : "/api/appweb/lista-actividades-vencidas";
  return queryOptions({
    queryKey: ["actividades", tipo, filtros],
    queryFn: async () =>
      parseEnvelope(
        await http.get<unknown>(endpoint, {
          params: {
            cod_asesor: filtros.codAsesor,
            cod_empresa: filtros.codEmpresa,
            cod_cc: filtros.codCc,
          },
        }),
        actividadSchema,
        endpoint,
      ),
  });
}

export function useActividadesEnCurso(filtros: FiltrosActividadesPersonales | null) {
  return useQuery({
    ...actividadesPersonalesOptions(
      "en-curso",
      filtros ?? { codAsesor: "", codEmpresa: "", codCc: "" },
    ),
    enabled: Boolean(filtros),
  });
}

export function useActividadesVencidas(filtros: FiltrosActividadesPersonales | null) {
  return useQuery({
    ...actividadesPersonalesOptions(
      "vencidas",
      filtros ?? { codAsesor: "", codEmpresa: "", codCc: "" },
    ),
    enabled: Boolean(filtros),
  });
}
