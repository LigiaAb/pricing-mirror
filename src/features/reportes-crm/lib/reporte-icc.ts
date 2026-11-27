import type { FilaIcc } from "../api/reporte-icc";

/**
 * ICC (Índice de Cumplimiento Comercial, #194). Cada actividad llega YA CLASIFICADA del backend
 * (banderas 0/1 de `report_icc`: programada, no programada, realizada, sin resultado, vencida;
 * las anuladas valen 0). Aquí solo se suman las banderas por persona y se sacan los porcentajes:
 * - ICCa % = visitas programadas realizadas / visitas programadas × 100.
 * - ICCp % = llamadas programadas realizadas / llamadas programadas × 100.
 * - ICCc % = visitas no programadas realizadas / total de visitas (sin anuladas) × 100.
 * - Citas sin resultado: visitas finalizadas sin resultado.
 * - Vencidas: llamadas y visitas vencidas.
 */

/** Una fila de la tabla (por persona o TOTAL). Las claves son los `id` de las columnas. */
export interface ResumenIcc {
  nombre: string;
  visitas_programadas: number;
  visitas_realizadas: number;
  icca: number | null;
  llamadas_programadas: number;
  llamadas_realizadas: number;
  iccp: number | null;
  visitas_no_programadas_realizadas: number;
  visitas_total: number;
  iccc: number | null;
  sin_resultado: number;
  vencidas: number;
}

export function porcentajeIcc(parte: number, total: number): number | null {
  return total > 0 ? (parte / total) * 100 : null;
}

export function nombreUsuario(fila: FilaIcc): string {
  return fila.nombre.trim() || `Usuario ${fila.usuario}`;
}

/** Suma las banderas de las filas (una persona o todas). */
export function resumirIcc(nombre: string, filas: readonly FilaIcc[]): ResumenIcc {
  const suma = {
    visitas_programadas: 0,
    visitas_realizadas: 0,
    llamadas_programadas: 0,
    llamadas_realizadas: 0,
    visitas_no_programadas_realizadas: 0,
    visitas_total: 0,
    sin_resultado: 0,
    vencidas: 0,
  };
  for (const fila of filas) {
    const tipo = fila.tipo.trim().toUpperCase();
    suma.vencidas += fila.vencida;
    if (tipo === "VISITA") {
      suma.visitas_programadas += fila.programada;
      suma.visitas_realizadas += fila.programada_realizada;
      suma.visitas_no_programadas_realizadas += fila.no_programada_realizada;
      suma.visitas_total += fila.en_total;
      suma.sin_resultado += fila.sin_resultado;
    } else if (tipo === "LLAMADA") {
      suma.llamadas_programadas += fila.programada;
      suma.llamadas_realizadas += fila.programada_realizada;
    }
  }
  return {
    nombre,
    ...suma,
    icca: porcentajeIcc(suma.visitas_realizadas, suma.visitas_programadas),
    iccp: porcentajeIcc(suma.llamadas_realizadas, suma.llamadas_programadas),
    iccc: porcentajeIcc(suma.visitas_no_programadas_realizadas, suma.visitas_total),
  };
}

/** Una fila por usuario (ordenadas por nombre) y la fila de total. */
export function calcularIcc(filas: readonly FilaIcc[]): {
  personas: ResumenIcc[];
  total: ResumenIcc;
} {
  const grupos = new Map<string, FilaIcc[]>();
  for (const fila of filas) {
    const grupo = grupos.get(String(fila.usuario));
    if (grupo) grupo.push(fila);
    else grupos.set(String(fila.usuario), [fila]);
  }
  const personas = [...grupos.values()]
    .map((grupo) => resumirIcc(grupo[0] ? nombreUsuario(grupo[0]) : "", grupo))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return { personas, total: resumirIcc("TOTAL", filas) };
}
