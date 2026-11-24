import type { ActividadReporte } from "../api/actividades-reporte";
export function jsonSeguro<T>(valor: string | null | undefined): T[] {
  try {
    const parsed: unknown = valor ? JSON.parse(valor) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}
export function actividadesEnRango(actividades: ActividadReporte[], inicio: string, fin: string) {
  // G-1: el API aún ignora las fechas; se filtra el conjunto ya acotado por empresa y CC.
  // Como el legacy: cada fecha filtra sola y se compara por día local (no UTC).
  if (!inicio && !fin) return actividades;
  const desde = inicio ? new Date(`${inicio}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const hasta = fin ? new Date(`${fin}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
  if (Number.isNaN(desde) || Number.isNaN(hasta)) return [];
  return actividades.filter((actividad) => {
    const fecha = new Date(actividad.fecha_programada).getTime();
    return Number.isFinite(fecha) && fecha >= desde && fecha <= hasta;
  });
}
export interface ResultadoActividad {
  COD_ACTIVIDAD?: string | number;
  NOM_TIPO?: string;
  DESCRIPCION?: string;
  FECHA_PROGRAMADA?: string;
}
/**
 * El resultado viaja como JSON serializado y la tabla del histórico lo lee en cuatro columnas
 * por fila en cada render, orden o filtro: se memoiza por actividad para no reparsear miles
 * de cadenas. La caché es débil, así que se libera con los datos de la query.
 */
const resultadosParseados = new WeakMap<ActividadReporte, ResultadoActividad>();
export function actividadResultado(actividad: ActividadReporte): ResultadoActividad {
  const memoizado = resultadosParseados.get(actividad);
  if (memoizado) return memoizado;
  const resultado = jsonSeguro<ResultadoActividad>(actividad.resultado)[0] ?? {};
  resultadosParseados.set(actividad, resultado);
  return resultado;
}
/** Legacy `resultado_cod_actividad`: si hay resultado sin código, se etiqueta "Resultado Final". */
export function numeroResultado(actividad: ActividadReporte) {
  const resultado = actividadResultado(actividad);
  if (!actividad.resultado) return "";
  return resultado.COD_ACTIVIDAD ? String(resultado.COD_ACTIVIDAD) : "Resultado Final";
}
