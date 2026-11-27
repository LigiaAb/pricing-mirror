import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Actividad } from "../api/actividades";

const LUNES = { weekStartsOn: 1 as const };

export interface DiaCalendario {
  fecha: Date;
  esDelMes: boolean;
  actividades: Actividad[];
}

export interface ActividadesPorTipo {
  codTipo: number;
  nombreTipo: string;
  cantidad: number;
}

function fechaActividad(actividad: Actividad): Date | null {
  const fecha = new Date(actividad.fecha_programada);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function actividadesDelDia(actividades: Actividad[], fecha: Date): Actividad[] {
  return actividades.filter((actividad) => {
    const programada = fechaActividad(actividad);
    return programada ? isSameDay(programada, fecha) : false;
  });
}

/** Agrupa los indicadores del mes para que cada tipo ocupe un único lugar en el día. */
export function agruparActividadesPorTipo(actividades: Actividad[]): ActividadesPorTipo[] {
  const grupos = new Map<number, ActividadesPorTipo>();

  for (const actividad of actividades) {
    const codTipo = Number(actividad.cod_tipo);
    const grupo = grupos.get(codTipo);
    if (grupo) {
      grupo.cantidad += 1;
      continue;
    }
    grupos.set(codTipo, {
      codTipo,
      nombreTipo: actividad.nom_tipo || "Actividad",
      cantidad: 1,
    });
  }

  return [...grupos.values()];
}

/** Matriz lunes-domingo que cubre por completo el mes visible. */
/**
 * Días (YYYY-MM-DD, ambos inclusive) que dibuja la vista: semana completa en "semana" y la
 * rejilla del mes (con los días de las semanas vecinas) en "mes" y "dia". Se consulta solo ese
 * rango en lugar de todas las actividades.
 */
export function rangoConsultaCalendario(
  fecha: Date,
  vista: "mes" | "semana" | "dia",
): { fecha_inicio: string; fecha_fin: string } {
  const inicio =
    vista === "semana" ? startOfWeek(fecha, LUNES) : startOfWeek(startOfMonth(fecha), LUNES);
  const fin = vista === "semana" ? endOfWeek(fecha, LUNES) : endOfWeek(endOfMonth(fecha), LUNES);
  return { fecha_inicio: format(inicio, "yyyy-MM-dd"), fecha_fin: format(fin, "yyyy-MM-dd") };
}

export function crearRejillaMes(fecha: Date, actividades: Actividad[]): DiaCalendario[][] {
  const inicio = startOfWeek(startOfMonth(fecha), LUNES);
  const fin = endOfWeek(endOfMonth(fecha), LUNES);
  const semanas: DiaCalendario[][] = [];

  for (let cursor = inicio; cursor <= fin; cursor = addDays(cursor, 7)) {
    semanas.push(
      Array.from({ length: 7 }, (_, indice) => {
        const dia = addDays(cursor, indice);
        return {
          fecha: dia,
          esDelMes: dia.getMonth() === fecha.getMonth(),
          actividades: actividadesDelDia(actividades, dia),
        };
      }),
    );
  }
  return semanas;
}

export function diasSemana(fecha: Date, actividades: Actividad[]): DiaCalendario[] {
  const inicio = startOfWeek(fecha, LUNES);
  return Array.from({ length: 7 }, (_, indice) => {
    const dia = addDays(inicio, indice);
    return { fecha: dia, esDelMes: true, actividades: actividadesDelDia(actividades, dia) };
  });
}
