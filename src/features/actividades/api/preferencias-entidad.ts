import { useMutation } from "@tanstack/react-query";
import { http } from "@/shared/api/client";

export interface PreferenciasEntidadPayload {
  entidad_id: string | number;
  entidadcontacto_id: string | number | null;
  entidaddireccion_id: string | number | null;
  industria_id: string | number | null;
  periodicidad_id: string | number | null;
  commodity_id: string | number | null;
  instruccion: string;
  estado_id: number;
  transportes: Array<{
    tipo_transporte_id: number;
    paises: string[];
    tipo_carga: string[];
    clasificacion: string[];
  }>;
}

export function useActualizarPreferenciasEntidad() {
  return useMutation({
    mutationFn: (payload: PreferenciasEntidadPayload) =>
      http.post("/api/appweb/carga-entidad-preferencias", payload),
    meta: { successMessage: "Visiting Report actualizado" },
  });
}
