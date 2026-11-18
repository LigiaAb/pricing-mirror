import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  getISOWeek,
  getISOWeeksInYear,
  startOfMonth,
  startOfWeek,
} from "date-fns";

const SEMANA_DESDE_LUNES = { weekStartsOn: 1 as const };

/** Un día de calendario: `YYYY-MM-DD` o su versión serializada en JSON
 * (`...T00:00:00(.sss)Z`) — los `date` de SQL Server viajan como medianoche
 * UTC y formatearlos en hora local pierde un día al oeste de UTC. */
const FECHA_CALENDARIO = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.\d{1,3})?Z)?$/;

/** Una fecha sin hora representa un día de calendario, no medianoche UTC. */
function fechaParaMostrar(date: string | Date | number | null | undefined): Date | null {
  if (date === null || date === undefined || date === "") {
    return null;
  }

  if (typeof date === "string") {
    const partes = FECHA_CALENDARIO.exec(date);
    if (partes) {
      const anio = Number(partes[1]);
      const mes = Number(partes[2]);
      const dia = Number(partes[3]);
      const fecha = new Date(0);
      fecha.setFullYear(anio, mes - 1, dia);
      fecha.setHours(0, 0, 0, 0);
      return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia
        ? fecha
        : null;
    }
  }

  const fecha = date instanceof Date ? date : new Date(date);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

const ZONA_HORARIA_FINAL = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Lee como hora local una fecha que el back guardó con la hora de pared de la operación
 * (`cropa_fecha_hora_actual`) en una columna DATETIME sin zona. El driver de SQL Server
 * la devuelve con `Z` como si fuera UTC; sin esa zona el navegador ya no la desplaza.
 * @param fecha - Fecha ISO tal como llega del API
 * @returns La misma fecha sin el sufijo de zona horaria
 */
export function quitarZonaHoraria(fecha: string): string {
  return fecha.replace(ZONA_HORARIA_FINAL, "");
}

export interface RangoFecha {
  inicio: Date;
  fin: Date;
}

/**
 * Formatea fecha y hora para mostrar según el idioma y zona horaria del usuario.
 * @param date - Fecha a formatear (string, Date, o null/undefined)
 * @returns String formateado o cadena vacía si no es válida
 */
export function formatearFechaHora(date: string | Date | null | undefined): string {
  return formatearFechaLocale(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formatea solo la hora según las preferencias del usuario, para listados donde
 * repetir la fecha completa en cada fila es ruido.
 * @param date - Fecha a formatear (string, Date, o null/undefined)
 * @returns String formateado o cadena vacía si no es válida
 */
export function formatearHora(date: string | Date | null | undefined): string {
  return formatearFechaLocale(date, { hour: "2-digit", minute: "2-digit" });
}

/**
 * Formatea una fecha según las preferencias del usuario para mostrar en tablas.
 * Para fechas de negocio sin hora (vigencias, tipos de cambio), donde mostrar
 * la hora sería ruido.
 * @param date - Fecha a formatear (string, Date, o null/undefined)
 * @returns String formateado o cadena vacía si no es válida
 */
export function formatearFecha(date: string | Date | null | undefined): string {
  return formatearFechaLocale(date, { year: "numeric", month: "2-digit", day: "2-digit" });
}

/**
 * Formatea una fecha con el idioma del entorno y las opciones indicadas.
 * En el navegador respeta el formato regional del usuario. Las fechas ISO sin
 * hora (`YYYY-MM-DD`) conservan su día aunque el usuario esté al oeste de UTC.
 * @param date - Fecha a formatear (string, Date, number, o null/undefined)
 * @param opciones - Opciones de `Intl.DateTimeFormatOptions`
 * @returns String formateado o cadena vacía si no es válida
 */
export function formatearFechaLocale(
  date: Date | string | number | null | undefined,
  opciones?: Intl.DateTimeFormatOptions,
): string {
  const parsed = fechaParaMostrar(date);
  if (!parsed) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, opciones).format(parsed);
}

/**
 * Convierte una fecha a formato ISO (YYYY-MM-DD)
 * @param date - Fecha a convertir (string, Date, o null/undefined)
 * @returns String en formato YYYY-MM-DD o null si no es válido
 */
export function toIsoDate(date: string | Date | null | undefined): string | null {
  if (!date) {
    return null;
  }

  try {
    if (date instanceof Date) {
      if (Number.isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString().split("T")[0] as string;
    }

    if (typeof date === "string") {
      // Si ya tiene formato ISO YYYY-MM-DD, retornar tal cual
      const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (isoRegex.test(date)) {
        return date;
      }

      // Intentar parsear la fecha
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) {
        return null;
      }
      return parsed.toISOString().split("T")[0] as string;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Convierte una fecha ISO a formato `datetime-local` (`YYYY-MM-DDTHH:mm`),
 * en hora local del navegador, para poblar un `<input type="datetime-local">`.
 * @param date - Fecha a convertir (string, Date, o null/undefined)
 * @returns String `YYYY-MM-DDTHH:mm` o cadena vacía si no es válida
 */
export function aInputDateTimeLocal(date: string | Date | null | undefined): string {
  if (!date) {
    return "";
  }

  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return format(parsed, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Convierte el valor de un `<input type="datetime-local">` (`YYYY-MM-DDTHH:mm`,
 * en hora local) a ISO con offset, para enviar al backend.
 * @param value - Valor del input, o cadena vacía
 * @returns String ISO o null si el valor no es válido
 */
export function deInputDateTimeLocal(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

/** Devuelve el primer y último instante del mes que contiene la fecha. */
export function rangoMes(fecha: Date): RangoFecha {
  return {
    inicio: startOfMonth(fecha),
    fin: endOfMonth(fecha),
  };
}

/** Devuelve la semana de lunes a domingo que contiene la fecha. */
export function rangoSemana(fecha: Date): RangoFecha {
  return {
    inicio: startOfWeek(fecha, SEMANA_DESDE_LUNES),
    fin: endOfWeek(fecha, SEMANA_DESDE_LUNES),
  };
}

/** Devuelve el inicio (lunes) de cada semana ISO del año indicado. */
export function semanasDelAnio(anio: number): Date[] {
  const referencia = new Date(anio, 0, 4);
  const primeraSemana = startOfWeek(referencia, SEMANA_DESDE_LUNES);
  const totalSemanas = getISOWeeksInYear(referencia);

  return Array.from({ length: totalSemanas }, (_, indice) => addWeeks(primeraSemana, indice));
}

/** Devuelve el número de semana ISO (1–52/53) de la fecha. */
export function numeroSemanaIso(fecha: Date): number {
  return getISOWeek(fecha);
}

/**
 * Diferencia entre dos fechas en meses fraccionarios, calculada por
 * interpolación calendario (no por división de milisegundos). Réplica 1:1
 * del algoritmo interno `monthDiff` de moment.js.
 */
function diferenciaEnMesesFraccion(a: Date, b: Date): number {
  if (a.getDate() < b.getDate()) {
    return -diferenciaEnMesesFraccion(b, a);
  }

  const wholeMonthDiff = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  const anchor = addMonths(a, wholeMonthDiff);

  let adjust: number;
  if (b.getTime() - anchor.getTime() < 0) {
    const anchor2 = addMonths(a, wholeMonthDiff - 1);
    adjust = (b.getTime() - anchor.getTime()) / (anchor.getTime() - anchor2.getTime());
  } else {
    const anchor2 = addMonths(a, wholeMonthDiff + 1);
    adjust = (b.getTime() - anchor.getTime()) / (anchor2.getTime() - anchor.getTime());
  }

  return -(wholeMonthDiff + adjust) || 0;
}

/**
 * Diferencia entre dos fechas en años fraccionarios, equivalente a
 * `moment(fin).diff(inicio, "years", true)`. **No** es `(fin - inicio) /
 * 365.25`: moment interpola entre los dos meses calendario más próximos a
 * `fin` medidos desde `inicio`, así que el resultado depende del calendario
 * (el mismo número de días da fracciones distintas según el mes). Migrado
 * literalmente del algoritmo `monthDiff` de moment.js para no desplazar
 * límites como `LIMITE_ANIOS_CONSULTA` ni un día frente al comportamiento
 * anterior.
 */
export function diferenciaEnAniosFraccion(fin: Date, inicio: Date): number {
  return diferenciaEnMesesFraccion(fin, inicio) / 12;
}
