import type { FilaIcc } from "../api/reporte-icc";

/**
 * ICC (Índice de Cumplimiento Comercial), definiciones del usuario (#194). Entran las
 * actividades con fecha programada en el rango; las anuladas no cuentan (se muestran aparte).
 * Los días se cuentan en hora de Guatemala (`diaLocal`).
 * - Programada: programada después del día en que se creó (`x + y`, y ≥ 1).
 * - No programada: programada el mismo día de creación o hasta 15 días antes (`x − y`, y ≤ 15).
 *   Programadas más de 15 días antes de crearse no son ni una ni otra (solo cuentan en el total).
 * - Realizada: finalizada (estado 24, `finalizada = 1`).
 * - Pendientes: programadas aún no finalizadas.
 * - ICC % = programadas realizadas / programadas × 100 (`null` si no hay programadas).
 * - ICCc % = no programadas realizadas / total (sin anuladas) × 100.
 * - Sin resultado: finalizadas con `con_resultado = 0`.
 * - Vencida: sigue abierta y sin resultado más de 7 días después del día en que debía
 *   registrarse (el mayor entre creación y programación): si es sábado, tiene hasta el sábado
 *   siguiente; el domingo ya está vencida.
 */

/** Descripción de estado de las anuladas (TIPO/ESTADO por nombre, como el backend). */
const ESTADO_ANULADO = "ANULADO";

/** Horas que Guatemala (UTC-6, sin horario de verano) va detrás de UTC. */
const HORAS_UTC_LOCAL = 6;
const MS_DIA = 86_400_000;
/** Días que puede estar programada antes de crearse para contar como no programada. */
const MAX_DIAS_ATRAS_NO_PROGRAMADA = 15;
/** Días que tiene una actividad abierta para registrar su resultado. */
const DIAS_PARA_VENCER = 7;

export const TIPOS_ICC = ["LLAMADA", "VISITA"] as const;
export type TipoIcc = (typeof TIPOS_ICC)[number];

export interface ConteoIcc {
  programadas: number;
  realizadas: number;
  pendientes: number;
  anuladas: number;
  sinResultado: number;
  icc: number | null;
  noProgramadas: number;
  noProgramadasRealizadas: number;
  /** Todas las actividades sin las anuladas (divisor del ICCc). */
  total: number;
  iccNoProgramadas: number | null;
  vencidas: number;
}

export interface ResumenIcc extends ConteoIcc {
  /** `null` en la fila de total. */
  usuario: string | null;
  nombre: string;
  porTipo: Record<TipoIcc, ConteoIcc>;
}

export function esAnulada(fila: FilaIcc): boolean {
  return fila.estado.trim().toUpperCase() === ESTADO_ANULADO;
}

export function esFinalizada(fila: FilaIcc): boolean {
  return fila.finalizada === 1;
}

export function nombreUsuario(fila: FilaIcc): string {
  return `${fila.nombres} ${fila.apellidos}`.trim() || `Usuario ${fila.usuario}`;
}

/** Día (en Guatemala) de una fecha UTC en ISO, como número de días desde 1970; `null` si no es válida. */
export function diaLocal(fecha: string): number | null {
  const ms = Date.parse(fecha);
  return Number.isNaN(ms) ? null : Math.floor((ms - HORAS_UTC_LOCAL * 3_600_000) / MS_DIA);
}

/** `programada`, `no-programada` o `null` (fechas inválidas o programada más de 15 días antes). */
export function clasificarProgramacion(fila: FilaIcc): "programada" | "no-programada" | null {
  const creacion = diaLocal(fila.fecha_creacion);
  const programacion = diaLocal(fila.fecha_programacion);
  if (creacion == null || programacion == null) return null;
  const dias = programacion - creacion;
  if (dias >= 1) return "programada";
  return dias >= -MAX_DIAS_ATRAS_NO_PROGRAMADA ? "no-programada" : null;
}

/** Abierta, sin resultado y con más de 7 días desde el día en que debía registrarse. */
export function esVencida(fila: FilaIcc, ahora: number): boolean {
  if (esAnulada(fila) || esFinalizada(fila) || fila.con_resultado !== 0) return false;
  const creacion = diaLocal(fila.fecha_creacion);
  const programacion = diaLocal(fila.fecha_programacion);
  const hoy = diaLocal(new Date(ahora).toISOString());
  if (hoy == null || (creacion == null && programacion == null)) return false;
  return hoy - Math.max(creacion ?? -Infinity, programacion ?? -Infinity) > DIAS_PARA_VENCER;
}

export function porcentajeIcc(realizadas: number, programadas: number): number | null {
  return programadas > 0 ? (realizadas / programadas) * 100 : null;
}

function contar(filas: FilaIcc[], ahora: number): ConteoIcc {
  let programadas = 0;
  let realizadas = 0;
  let noProgramadas = 0;
  let noProgramadasRealizadas = 0;
  let total = 0;
  let anuladas = 0;
  let sinResultado = 0;
  let vencidas = 0;
  for (const fila of filas) {
    if (esAnulada(fila)) {
      anuladas += 1;
      continue;
    }
    total += 1;
    if (esVencida(fila, ahora)) vencidas += 1;
    const finalizada = esFinalizada(fila);
    const clase = clasificarProgramacion(fila);
    if (clase === "programada") {
      programadas += 1;
      if (finalizada) realizadas += 1;
    } else if (clase === "no-programada") {
      noProgramadas += 1;
      if (finalizada) noProgramadasRealizadas += 1;
    }
    if (finalizada && fila.con_resultado === 0) sinResultado += 1;
  }
  return {
    programadas,
    realizadas,
    pendientes: programadas - realizadas,
    anuladas,
    sinResultado,
    icc: porcentajeIcc(realizadas, programadas),
    noProgramadas,
    noProgramadasRealizadas,
    total,
    iccNoProgramadas: porcentajeIcc(noProgramadasRealizadas, total),
    vencidas,
  };
}

function resumir(
  usuario: string | null,
  nombre: string,
  filas: FilaIcc[],
  ahora: number,
): ResumenIcc {
  const porTipo = Object.fromEntries(
    TIPOS_ICC.map((tipo) => [
      tipo,
      contar(
        filas.filter((fila) => fila.tipo.trim().toUpperCase() === tipo),
        ahora,
      ),
    ]),
  ) as Record<TipoIcc, ConteoIcc>;
  return { usuario, nombre, ...contar(filas, ahora), porTipo };
}

/** Una fila por usuario (ordenadas por nombre) y la fila de total. `ahora` decide las vencidas. */
export function calcularIcc(
  filas: FilaIcc[],
  ahora: number = Date.now(),
): { personas: ResumenIcc[]; total: ResumenIcc } {
  const grupos = new Map<string, FilaIcc[]>();
  for (const fila of filas) {
    const clave = String(fila.usuario);
    const grupo = grupos.get(clave);
    if (grupo) grupo.push(fila);
    else grupos.set(clave, [fila]);
  }

  const personas = [...grupos.entries()]
    .map(([usuario, grupo]) =>
      resumir(usuario, grupo[0] ? nombreUsuario(grupo[0]) : usuario, grupo, ahora),
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return { personas, total: resumir(null, "TOTAL", filas, ahora) };
}
