import type { FilaIcc } from "../api/reporte-icc";

/**
 * ICC (Índice de Cumplimiento Comercial), definiciones del usuario (#194). Entran las
 * actividades con fecha programada en el rango; las anuladas no cuentan. Los días se cuentan en
 * hora de Guatemala.
 * - Programada: programada después del día en que se creó.
 * - No programada: programada el mismo día de creación o hasta 15 días antes (más de 15 días
 *   antes no es ni una ni otra).
 * - Realizada: finalizada (`finalizada = 1`).
 * - ICCa % = visitas programadas realizadas / visitas programadas × 100.
 * - ICCp % = llamadas programadas realizadas / llamadas programadas × 100.
 * - ICCc % = visitas no programadas realizadas / total de visitas × 100.
 * - Citas sin resultado: visitas finalizadas con `con_resultado = 0`.
 * - Vencidas: llamadas y visitas abiertas y sin resultado más de 7 días después del día
 *   programado.
 */

const MS_DIA = 86_400_000;
/** Guatemala va 6 horas detrás de UTC (sin horario de verano). */
const MS_UTC_GUATEMALA = 6 * 3_600_000;
const MAX_DIAS_ATRAS_NO_PROGRAMADA = 15;
const DIAS_PARA_VENCER = 7;

export interface ResumenIcc {
  nombre: string;
  visitasProgramadas: number;
  visitasRealizadas: number;
  icca: number | null;
  llamadasProgramadas: number;
  llamadasRealizadas: number;
  iccp: number | null;
  visitasNoProgramadasRealizadas: number;
  visitas: number;
  iccc: number | null;
  sinResultado: number;
  vencidas: number;
}

/** Día en Guatemala (días desde 1970) de un instante en ms. */
const dia = (ms: number) => Math.floor((ms - MS_UTC_GUATEMALA) / MS_DIA);

/** Día en Guatemala de una fecha ISO; `null` si no es válida. */
function diaLocal(fecha: string): number | null {
  const ms = Date.parse(fecha);
  return Number.isNaN(ms) ? null : dia(ms);
}

function clasificar(fila: FilaIcc): "programada" | "no-programada" | null {
  const creacion = diaLocal(fila.fecha_creacion);
  const programacion = diaLocal(fila.fecha_programacion);
  if (creacion == null || programacion == null) return null;
  const dias = programacion - creacion;
  if (dias >= 1) return "programada";
  return dias >= -MAX_DIAS_ATRAS_NO_PROGRAMADA ? "no-programada" : null;
}

const porcentaje = (parte: number, total: number) => (total > 0 ? (parte / total) * 100 : null);

function resumir(nombre: string, filas: readonly FilaIcc[], hoy: number): ResumenIcc {
  let visitasProgramadas = 0;
  let visitasRealizadas = 0;
  let llamadasProgramadas = 0;
  let llamadasRealizadas = 0;
  let visitasNoProgramadasRealizadas = 0;
  let visitas = 0;
  let sinResultado = 0;
  let vencidas = 0;
  for (const fila of filas) {
    if (fila.estado.trim().toUpperCase() === "ANULADO") continue;
    const tipo = fila.tipo.trim().toUpperCase();
    const finalizada = fila.finalizada === 1;
    const clase = clasificar(fila);
    const programacion = diaLocal(fila.fecha_programacion);
    if (
      !finalizada &&
      fila.con_resultado === 0 &&
      programacion != null &&
      hoy - programacion > DIAS_PARA_VENCER
    ) {
      vencidas += 1;
    }
    if (tipo === "VISITA") {
      visitas += 1;
      if (clase === "programada") {
        visitasProgramadas += 1;
        if (finalizada) visitasRealizadas += 1;
      } else if (clase === "no-programada" && finalizada) {
        visitasNoProgramadasRealizadas += 1;
      }
      if (finalizada && fila.con_resultado === 0) sinResultado += 1;
    } else if (tipo === "LLAMADA" && clase === "programada") {
      llamadasProgramadas += 1;
      if (finalizada) llamadasRealizadas += 1;
    }
  }
  return {
    nombre,
    visitasProgramadas,
    visitasRealizadas,
    icca: porcentaje(visitasRealizadas, visitasProgramadas),
    llamadasProgramadas,
    llamadasRealizadas,
    iccp: porcentaje(llamadasRealizadas, llamadasProgramadas),
    visitasNoProgramadasRealizadas,
    visitas,
    iccc: porcentaje(visitasNoProgramadasRealizadas, visitas),
    sinResultado,
    vencidas,
  };
}

/** Una fila por usuario (ordenadas por nombre) y la fila de total. `ahora` decide las vencidas. */
export function calcularIcc(
  filas: readonly FilaIcc[],
  ahora: number = Date.now(),
): { personas: ResumenIcc[]; total: ResumenIcc } {
  const hoy = dia(ahora);
  const grupos = new Map<string, FilaIcc[]>();
  for (const fila of filas) {
    const grupo = grupos.get(String(fila.usuario));
    if (grupo) grupo.push(fila);
    else grupos.set(String(fila.usuario), [fila]);
  }
  const personas = [...grupos.entries()]
    .map(([usuario, grupo]) => {
      const primera = grupo[0];
      const nombre = primera ? `${primera.nombres} ${primera.apellidos}`.trim() : "";
      return resumir(nombre || `Usuario ${usuario}`, grupo, hoy);
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return { personas, total: resumir("TOTAL", filas, hoy) };
}
