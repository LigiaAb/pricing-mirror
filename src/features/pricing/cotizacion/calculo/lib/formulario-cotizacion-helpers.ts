import type { OpcionFormularioCotizacion, ValoresFormulario } from "./formulario-cotizacion-tipos";
import { esRegistro, mismoId } from "./utils";

export const PAISES_TERRESTRES = new Set(["GT", "SV", "HN", "NI", "CR", "PA", "BZ", "MX", "US"]);

/** Tipo de punto de enlace de la cabecera. Terrestre no lleva: usa ciudades (queda en null). */
export const TIPO_PUNTO_POR_TRANSPORTE: Record<string, string> = {
  AEREO: "AEROPUERTO",
  MARITIMO: "PUERTO",
};

/**
 * Origen y destino que dependen del transporte (#142). Se limpian (objeto y código) al cambiar
 * de transporte; luego se asigna el default del nuevo (GUA aéreo, ciudad GUA terrestre).
 */
export const CAMPOS_UBICACION_POR_TRANSPORTE = [
  "puntoEnlaceOrigen",
  "cod_puntoenlace_origen",
  "puntoEnlaceDestino",
  "cod_puntoenlace_destino",
  "ciudadOrigen",
  "cod_ciudad_origen",
  "ciudadDestino",
  "cod_ciudad_destino",
  "direccion_origen",
  "direccion_destino",
] as const;

export function getValue(value: unknown) {
  if (!esRegistro(value)) return value ?? null;
  return value.value ?? null;
}

export function getLabel(value: unknown) {
  if (!esRegistro(value)) return "";
  return String(value.label ?? "");
}

export function buscarPorValue(opciones: OpcionFormularioCotizacion[] | undefined, value: unknown) {
  if (value == null) return null;
  return opciones?.find((item) => mismoId(item.value, value)) ?? null;
}

export function buscarPorLabel(opciones: OpcionFormularioCotizacion[] | undefined, label: string) {
  const objetivo = label.trim().toUpperCase();

  return (
    opciones?.find(
      (item) =>
        String(item.label ?? "")
          .trim()
          .toUpperCase() === objetivo,
    ) ?? null
  );
}

export function idNumerico(value: unknown) {
  const numero = Number(value);
  return Number.isFinite(numero) ? numero : 0;
}

export function valoresFormularioIguales(
  actual: ValoresFormulario,
  siguiente: ValoresFormulario,
): boolean {
  const keysActual = Object.keys(actual);
  const keysSiguiente = Object.keys(siguiente);

  if (keysActual.length !== keysSiguiente.length) {
    return false;
  }

  return keysSiguiente.every((key) => {
    const actualValue = actual[key];
    const siguienteValue = siguiente[key];

    if (Object.is(actualValue, siguienteValue)) {
      return true;
    }

    if (actualValue instanceof Date && siguienteValue instanceof Date) {
      return actualValue.getTime() === siguienteValue.getTime();
    }

    if (esRegistro(actualValue) && esRegistro(siguienteValue)) {
      return mismoId(actualValue.value, siguienteValue.value);
    }

    return false;
  });
}

export function entidadAOption(entidadOrigen: object): OpcionFormularioCotizacion | null {
  const entidad = entidadOrigen as Record<string, unknown>;
  const entidadId = entidad.entidad_id;

  if (typeof entidadId !== "string" && typeof entidadId !== "number") {
    return null;
  }

  const nombre = String(entidad.entidad_nombre ?? "");
  const codigo = String(entidad.codigo_entidad ?? "");

  return {
    ...entidad,
    value: entidadId,
    label: [codigo, nombre].filter(Boolean).join(" - ") || String(entidadId),
    entidad_id: entidadId,
    entidad_nombre: nombre,
    codigo_entidad: codigo,
    cod_tipo:
      typeof entidad.cod_tipo === "string" || typeof entidad.cod_tipo === "number"
        ? entidad.cod_tipo
        : null,
  } satisfies OpcionFormularioCotizacion;
}

/** Convierte entidades a opciones descartando las que repiten `value` (la key del combobox). */
export function entidadesAOpcionesUnicas(
  entidades: readonly object[],
): OpcionFormularioCotizacion[] {
  const vistos = new Set<string>();
  const opciones: OpcionFormularioCotizacion[] = [];

  for (const entidad of entidades) {
    const opcion = entidadAOption(entidad);
    if (!opcion) continue;

    const clave = String(opcion.value).trim();
    if (vistos.has(clave)) continue;

    vistos.add(clave);
    opciones.push(opcion);
  }

  return opciones;
}

export function contactoAOption(contactoOrigen: object): OpcionFormularioCotizacion | null {
  const contacto = contactoOrigen as Record<string, unknown>;
  const contactoId = contacto.entidadcontacto_id;

  if (typeof contactoId !== "string" && typeof contactoId !== "number") {
    return null;
  }

  const nombre = String(contacto.entidadcontacto_nombre ?? "");
  const email = String(contacto.entidadcontacto_email ?? "");

  return {
    ...contacto,
    value: contactoId,
    label: [nombre, email].filter(Boolean).join(" - ") || String(contactoId),
    entidadcontacto_id: contactoId,
    entidadcontacto_nombre: nombre,
    entidadcontacto_email: email,
  } satisfies OpcionFormularioCotizacion;
}
