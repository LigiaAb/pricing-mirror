import { objetivos } from "@/features/objetivos/api/objetivos";

/** Objetivo de negocio que define la meta del Hit Rate (`lista-objetivos`). */
export const COD_OBJETIVO_HIT_RATE = 85;

/**
 * Meta del Hit Rate como fracción (0–1). `cantidad` llega como porcentaje entero
 * (85 → 0.85). `undefined` mientras carga, si falla o si el objetivo no existe:
 * el reporte se muestra sin la línea ni la columna de objetivo.
 */
export function useObjetivoHitRate() {
  const consulta = objetivos.useLista({ cod_objetivo: COD_OBJETIVO_HIT_RATE });
  const objetivo = consulta.data?.find(
    (fila) => String(fila.codObjetivo) === String(COD_OBJETIVO_HIT_RATE),
  );
  return {
    objetivo: objetivo == null ? undefined : objetivo.cantidad / 100,
    isLoading: consulta.isLoading,
  };
}
