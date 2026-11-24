import {
  endOfWeek,
  getISOWeek,
  getISOWeeksInYear,
  getISOWeekYear,
  isWithinInterval,
  startOfWeek,
} from "date-fns";
import type { ObjetivoReporte } from "../api/objetivos-reporte";

export interface MedidorObjetivo {
  id: string;
  objetivo: string;
  tipoActividad: string;
  periodicidadUnidad: string;
  empleado: string;
  actividades: number;
  meta: number;
  porcentaje: number;
}

export interface ActividadParaSerie {
  fecha_programada?: unknown;
  nom_tipo?: unknown;
}

/**
 * Serie anual por tipo de actividad del asesor. Es la misma fuente que usa la
 * gráfica legacy (`lista-actividades`), no las actividades acotadas por el
 * reporte de objetivos de la semana.
 */
export function serieSemanalPorTipo(
  actividades: ActividadParaSerie[],
  year = new Date().getFullYear(),
) {
  const tipos = Array.from(
    new Set(
      actividades.flatMap((actividad) =>
        typeof actividad.nom_tipo === "string" && actividad.nom_tipo ? [actividad.nom_tipo] : [],
      ),
    ),
  );
  const datos: Array<{ semana: number; [tipo: string]: string | number }> = Array.from(
    { length: getISOWeeksInYear(new Date(year, 11, 28)) },
    (_, index) => ({ semana: index + 1 }),
  );

  for (const actividad of actividades) {
    const fecha =
      typeof actividad.fecha_programada === "string" ? new Date(actividad.fecha_programada) : null;
    const tipo = typeof actividad.nom_tipo === "string" ? actividad.nom_tipo : "";
    if (
      fecha &&
      !Number.isNaN(fecha.getTime()) &&
      // Año ISO: fin de diciembre en la semana 1 del año siguiente no suma a la semana 1 actual.
      getISOWeekYear(fecha) === year &&
      tipo &&
      datos[getISOWeek(fecha) - 1]
    ) {
      const semana = datos[getISOWeek(fecha) - 1];
      if (semana) semana[tipo] = (Number(semana[tipo]) || 0) + 1;
    }
  }

  return { datos, tipos };
}

export function serieSemanal(
  fechas: Array<string | null | undefined>,
  year = new Date().getFullYear(),
) {
  const semanas = Array.from({ length: getISOWeeksInYear(new Date(year, 11, 28)) }, (_, index) => ({
    semana: index + 1,
    actividades: 0,
  }));
  for (const fecha of fechas) {
    const date = fecha ? new Date(fecha) : null;
    if (date && !Number.isNaN(date.getTime()) && date.getFullYear() === year) {
      const semana = semanas[getISOWeek(date) - 1];
      if (semana) semana.actividades += 1;
    }
  }
  return semanas;
}

/** Actividades programadas en la semana actual, de lunes a domingo, límites inclusivos. */
export function actividadesSemanaActual(
  fechas: Array<string | null | undefined>,
  ahora = new Date(),
): number {
  const intervalo = {
    start: startOfWeek(ahora, { weekStartsOn: 1 }),
    end: endOfWeek(ahora, { weekStartsOn: 1 }),
  };
  return fechas.reduce((total, fecha) => {
    const date = fecha ? new Date(fecha) : null;
    return date && !Number.isNaN(date.getTime()) && isWithinInterval(date, intervalo)
      ? total + 1
      : total;
  }, 0);
}

/** Medidores del reporte 5 para el periodo vigente de cada objetivo. */
export function medidoresObjetivosPeriodoActual(
  objetivos: ObjetivoReporte[],
  ahora = new Date(),
): MedidorObjetivo[] {
  return objetivos.map((objetivo, objetivoIndex) => {
    // La respuesta de este reporte puede traer el objetivo sin empleados. Legacy
    // conserva el medidor en ese caso; no hacerlo ocultaba por completo la segunda
    // gráfica aunque el objetivo sí existiera.
    const empleado = objetivo.empleados[0];
    const periodoActual = empleado?.datos.find((periodo) => {
      const inicio = new Date(periodo.fecha_inicial);
      const fin = new Date(periodo.fecha_final);
      return (
        !Number.isNaN(inicio.getTime()) &&
        !Number.isNaN(fin.getTime()) &&
        isWithinInterval(ahora, { start: inicio, end: fin })
      );
    });
    const actividades = periodoActual?.actividades.length ?? 0;
    const meta = Math.max(0, objetivo.cantidad);
    const porcentaje = meta === 0 ? 0 : Math.min(100, Math.round((actividades / meta) * 100));
    return {
      id: `${objetivo.cod_tipo_actividad ?? objetivo.descripcion}-${objetivoIndex}`,
      objetivo: objetivo.descripcion,
      tipoActividad: objetivo.tipo_descripcion,
      periodicidadUnidad: objetivo.periodicidad_unidad,
      empleado: empleado?.nombre || "Sin empleado asignado",
      actividades,
      meta,
      porcentaje,
    };
  });
}
