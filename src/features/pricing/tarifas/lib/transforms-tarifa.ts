import type { FieldRule } from "./form-types";

/**
 * Convierte un valor visual a valor plano para el backend.
 *
 * - null / undefined → null
 * - Date → se devuelve igual (no se toca)
 * - objeto con .value → devuelve .value
 * - primitivo → devuelve igual
 */
export const getPlainValue = (value: unknown): unknown => {
  if (value === undefined || value === null) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object") return (value as { value?: unknown })?.value ?? null;
  return value;
};

/**
 * Convierte el estado visual del formulario a un payload de backend.
 *
 * Recorre fieldRules, toma el valor actual de cada campo,
 * lo convierte con getPlainValue y lo guarda con regla.cod.
 *
 * Si se pasa payload, filtra solo los campos que pertenecen a ese payload.
 */
export function valoresSoloCodigos(
  values: Record<string, unknown>,
  reglasCampos: Record<string, FieldRule>,
  payload?: string,
  defaultCodUsuario?: unknown,
): Record<string, unknown> {
  const resultado: Record<string, unknown> = {};

  Object.entries(reglasCampos).forEach(([key, regla]) => {
    if (!regla?.cod) return;

    if (payload) {
      const reglaPayload = regla?.payload ?? [];
      if (!reglaPayload.includes(payload)) return;
    }

    resultado[regla.cod] = getPlainValue(values?.[key]);
  });

  // Reglas extra frecuentes en este proyecto:
  if (values?.cod_estado !== undefined) {
    resultado.cod_estado = values.cod_estado;
  }

  if (resultado.cod_usuario === undefined) {
    resultado.cod_usuario = values?.cod_usuario ?? defaultCodUsuario ?? null;
  }

  return resultado;
}

/**
 * Dado un objeto de valores ya construido (con claves de backend),
 * devuelve solo los campos que pertenecen al payload indicado.
 *
 * Útil cuando ya tienes el payload completo y necesitas separarlo
 * en servicio / metodo sin recalcular desde el estado visual.
 */
export function filtrarValoresPorPayload(
  sourceValues: Record<string, unknown>,
  reglasCampos: Record<string, FieldRule>,
  payload?: string,
): Record<string, unknown> {
  const resultado: Record<string, unknown> = {};
  if (!sourceValues) return resultado;

  Object.entries(reglasCampos ?? {}).forEach(([, regla]) => {
    if (!regla?.cod) return;

    if (payload) {
      const reglaPayload = regla?.payload ?? [];
      if (!reglaPayload.includes(payload)) return;
    }

    resultado[regla.cod] = sourceValues[regla.cod];
  });

  return resultado;
}
