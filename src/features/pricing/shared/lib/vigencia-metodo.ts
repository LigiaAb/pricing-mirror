import { endOfDay, isAfter, isValid, isWithinInterval, startOfDay, subDays } from "date-fns";

/**
 * Estado de vigencia de un método según su fecha final:
 * - vencida: la fecha ya pasó.
 * - proximaAVencer: vence en los próximos 15 días.
 */
export function getEstadoMetodo(fecha?: Date | string | null) {
  const sinEstado = { vencida: false, proximaAVencer: false };

  if (!fecha) return sinEstado;

  const fechaFinal = fecha instanceof Date ? fecha : new Date(fecha);

  if (!isValid(fechaFinal)) return sinEstado;

  const ahora = new Date();
  const vencida = isAfter(ahora, fechaFinal);

  const proximaAVencer =
    !vencida &&
    isWithinInterval(startOfDay(ahora), {
      start: startOfDay(subDays(fechaFinal, 15)),
      end: endOfDay(fechaFinal),
    });

  return { vencida, proximaAVencer };
}
