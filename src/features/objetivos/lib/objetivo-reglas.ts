import { z } from "zod";
import type { Periodicidad } from "@/features/catalogos";

const ESTADO_ACTIVO = 1;

/** `fechaInicial + noDias` (calendario), la cota inferior de `fecha_final`. */
export function fechaFinalMinima(fechaInicial: Date, noDias: number): Date {
  const resultado = new Date(fechaInicial);
  resultado.setDate(resultado.getDate() + noDias);
  return resultado;
}

function noDiasDe(periodicidades: Periodicidad[], codPeriodicidad: string): number | null {
  const periodicidad = periodicidades.find((p) => String(p.cod_periodicidad) === codPeriodicidad);
  return periodicidad ? Number(periodicidad.no_dias) : null;
}

/**
 * Schema del formulario de objetivo. `no_dias` depende de la periodicidad elegida,
 * así que la regla de fechas se arma con las periodicidades ya cargadas (a
 * diferencia del legacy, que lee `periodicidad.no_dias` sin comprobar que exista).
 */
export function construirObjetivoSchema(periodicidades: Periodicidad[]) {
  return z
    .object({
      descripcion: z.string().min(1, "La descripción es requerida"),
      cantidad: z.coerce.number().min(1, "La cantidad debe ser mayor a 0"),
      cod_emp: z.string().min(1, "La empresa es requerida"),
      cod_cc: z.string().min(1, "El centro de costo es requerido"),
      cod_tipo_actividad: z.string().min(1, "El tipo de actividad es requerido"),
      cod_periodicidad: z.string().min(1, "La periodicidad es requerida"),
      cod_tipo_asignacion: z.string().min(1, "El tipo de asignación es requerido"),
      cod_estado: z.string().min(1, "El estado es requerido"),
      fecha_inicial: z.string().min(1, "La fecha inicial es requerida"),
      fecha_final: z.string().min(1, "La fecha final es requerida"),
      evaluar_creador: z.boolean().optional(),
    })
    .superRefine((valores, ctx) => {
      const noDias = noDiasDe(periodicidades, valores.cod_periodicidad);
      if (noDias === null) return;

      const inicial = new Date(valores.fecha_inicial);
      const final = new Date(valores.fecha_final);
      if (Number.isNaN(inicial.getTime()) || Number.isNaN(final.getTime())) return;

      if (final < fechaFinalMinima(inicial, noDias)) {
        ctx.addIssue({
          code: "custom",
          path: ["fecha_final"],
          message:
            "La fecha final debe ser mayor o igual a la fecha inicial más los días de la periodicidad.",
        });
      }
    });
}

/** Estado GLOBAL (`cod_tipo` 25) acotado a ACTIVO/INACTIVO — únicos valores reales en la tabla. */
export const ESTADOS_OBJETIVO = [
  { value: String(ESTADO_ACTIVO), label: "Activo" },
  { value: "2", label: "Inactivo" },
] as const;
