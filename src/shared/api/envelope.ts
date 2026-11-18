import { z } from "zod";
import { env } from "@/shared/config/env";
import { reportError } from "@/shared/lib/sentry";
import { asText } from "@/shared/lib/text";
import { EnvelopeInvalidoError } from "./errors";

/**
 * El sobre del API se modela UNA sola vez. Forma habitual:
 *   { data: { success, mensaje, cod_mensaje, data: T[] } }
 * con variantes históricas: { data: T[] } y T[] a secas.
 */
interface ParseEnvelopeOptions {
  /** Propiedad que contiene la lista cuando el sobre no usa `data`. */
  listKey?: string;
}

interface ParseEnvelopeObjetoOptions {
  /** Propiedad que contiene el objeto cuando el sobre no usa `data`. */
  objectKey?: string;
}

function throwIfEnvelopeFailure(inner: Record<string, unknown>): void {
  if (inner.success === false) {
    const mensaje = asText(inner.mensaje ?? inner.message) || "Error desconocido";
    const cod = asText(inner.cod_mensaje);
    throw new Error(cod ? `[${cod}] ${mensaje}` : mensaje);
  }
}

/**
 * Desenvuelve el sobre y devuelve el arreglo de items SIN validar su forma.
 * Única implementación (reemplaza unwrapEnvelope/unwrapEnvelope).
 * Para datos nuevos usar parseEnvelope con schema.
 */
export function unwrapEnvelope<T = unknown>(
  data: unknown,
  options: ParseEnvelopeOptions = {},
): T[] {
  if (Array.isArray(data)) return data as T[];

  const inner = (data as Record<string, unknown> | null | undefined)?.data;

  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    const innerObj = inner as Record<string, unknown>;
    throwIfEnvelopeFailure(innerObj);
    if (Array.isArray(innerObj.data)) return innerObj.data as T[];
    if (options.listKey && Array.isArray(innerObj[options.listKey])) {
      return innerObj[options.listKey] as T[];
    }
  }

  if (Array.isArray(inner)) return inner as T[];

  return [];
}

/**
 * Desenvuelve el sobre y valida cada item con el schema.
 * - En desarrollo: lanza EnvelopeInvalidoError (el contrato se rompió: arregla el schema o el backend).
 * - En producción: reporta a Sentry y devuelve solo los items válidos (la vista no se cae).
 */
export function parseEnvelope<S extends z.ZodType>(
  data: unknown,
  schema: S,
  contexto: string,
  options?: ParseEnvelopeOptions,
): z.infer<S>[] {
  const raw = unwrapEnvelope<unknown>(data, options);
  const parsed = z.array(schema).safeParse(raw);
  if (parsed.success) return parsed.data;

  if (env.NODE_ENV === "development") {
    throw new EnvelopeInvalidoError(contexto, parsed.error.issues);
  }

  reportError(new Error(`[${contexto}] API response failed schema validation`), {
    issues: parsed.error.issues,
  });
  return raw.flatMap((item) => {
    const r = schema.safeParse(item);
    return r.success ? [r.data] : [];
  });
}

/**
 * Desenvuelve y valida respuestas cuyo `data` es un objeto en vez de un arreglo.
 * En producción, un schema con valores por defecto puede degradar a su forma vacía.
 */
export function parseEnvelopeObjeto<S extends z.ZodType>(
  data: unknown,
  schema: S,
  contexto: string,
  options: ParseEnvelopeObjetoOptions = {},
): z.infer<S> {
  let raw: unknown = {};

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const response = data as Record<string, unknown>;
    const inner = response.data;

    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      const innerObject = inner as Record<string, unknown>;
      const esSobre =
        "success" in innerObject ||
        "mensaje" in innerObject ||
        "message" in innerObject ||
        "cod_mensaje" in innerObject;

      if (esSobre) {
        throwIfEnvelopeFailure(innerObject);
        raw = options.objectKey ? innerObject[options.objectKey] : innerObject.data;
      } else {
        raw = innerObject;
      }
    } else if (!("data" in response)) {
      raw = response;
    }
  }

  const parsed = schema.safeParse(raw);
  if (parsed.success) return parsed.data;

  if (env.NODE_ENV === "development") {
    throw new EnvelopeInvalidoError(contexto, parsed.error.issues);
  }

  reportError(new Error(`[${contexto}] API response failed schema validation`), {
    issues: parsed.error.issues,
  });

  const fallback = schema.safeParse({});
  if (fallback.success) return fallback.data;

  throw new EnvelopeInvalidoError(contexto, parsed.error.issues);
}
