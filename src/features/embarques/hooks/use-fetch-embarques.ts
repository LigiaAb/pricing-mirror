import { tipos } from "@/features/catalogos";
export function useFetchTiposFecha(options?: Record<string, unknown>) {
  return tipos.useLista({ tipo_tabla: "coordinacion_fecha" }, options);
}
