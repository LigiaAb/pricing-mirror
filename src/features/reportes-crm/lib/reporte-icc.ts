import type { FilaIcc } from "../api/reporte-icc";

/**
 * ICC (Índice de Cumplimiento Comercial), definiciones del usuario (#194):
 * - Programadas: actividades con fecha programada en el rango, sin las anuladas.
 * - Realizadas: las finalizadas (estado 24, `finalizada = 1`).
 * - Pendientes: programadas aún no finalizadas.
 * - ICC % = realizadas / programadas × 100 (`null` si no hay programadas).
 * - Sin resultado: finalizadas con `con_resultado = 0`.
 * Las anuladas no cuentan: se muestran aparte.
 */

/** Descripción de estado de las anuladas (TIPO/ESTADO por nombre, como el backend). */
const ESTADO_ANULADO = "ANULADO";

export const TIPOS_ICC = ["LLAMADA", "VISITA"] as const;
export type TipoIcc = (typeof TIPOS_ICC)[number];

export interface ConteoIcc {
  programadas: number;
  realizadas: number;
  pendientes: number;
  anuladas: number;
  sinResultado: number;
  icc: number | null;
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

export function porcentajeIcc(realizadas: number, programadas: number): number | null {
  return programadas > 0 ? (realizadas / programadas) * 100 : null;
}

function contar(filas: FilaIcc[]): ConteoIcc {
  let programadas = 0;
  let realizadas = 0;
  let anuladas = 0;
  let sinResultado = 0;
  for (const fila of filas) {
    if (esAnulada(fila)) {
      anuladas += 1;
      continue;
    }
    programadas += 1;
    if (!esFinalizada(fila)) continue;
    realizadas += 1;
    if (fila.con_resultado === 0) sinResultado += 1;
  }
  return {
    programadas,
    realizadas,
    pendientes: programadas - realizadas,
    anuladas,
    sinResultado,
    icc: porcentajeIcc(realizadas, programadas),
  };
}

function resumir(usuario: string | null, nombre: string, filas: FilaIcc[]): ResumenIcc {
  const porTipo = Object.fromEntries(
    TIPOS_ICC.map((tipo) => [
      tipo,
      contar(filas.filter((fila) => fila.tipo.trim().toUpperCase() === tipo)),
    ]),
  ) as Record<TipoIcc, ConteoIcc>;
  return { usuario, nombre, ...contar(filas), porTipo };
}

/** Una fila por usuario (ordenadas por nombre) y la fila de total. */
export function calcularIcc(filas: FilaIcc[]): { personas: ResumenIcc[]; total: ResumenIcc } {
  const grupos = new Map<string, FilaIcc[]>();
  for (const fila of filas) {
    const clave = String(fila.usuario);
    const grupo = grupos.get(clave);
    if (grupo) grupo.push(fila);
    else grupos.set(clave, [fila]);
  }

  const personas = [...grupos.entries()]
    .map(([usuario, grupo]) =>
      resumir(usuario, grupo[0] ? nombreUsuario(grupo[0]) : usuario, grupo),
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return { personas, total: resumir(null, "TOTAL", filas) };
}
