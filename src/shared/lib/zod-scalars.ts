import { z } from "zod";

/**
 * Primitivos canónicos para schemas de respuestas de API/BD.
 *
 * Fuente única de verdad: reemplazan los `idField` redeclarados en cada schema.
 * No se hace coerción a `number` porque la API devuelve ids/códigos mixtos y
 * alfanuméricos (`"PE"`, `"E001"`, `"FILE001"`), por lo que la unión refleja la
 * realidad del dato y evita `NaN` en runtime.
 */

/** Id o código: la API los entrega como número o como string. */
export const zId = z.union([z.string(), z.number()]);
export const zIdNull = zId.nullable();
export const zIdOpt = zId.optional();
export const zIdNullOpt = zId.nullable().optional();

/** Id "seguro": ante un valor inválido cae a 0 en vez de romper la validación. */
export const zIdSafe = zId.catch(0);

/** Id nullable "seguro": ante un valor inválido cae a null. */
export const zIdSafeNull = zId.nullable().catch(null);

export const zStr = z.string();
export const zStrNull = z.string().nullable();
export const zStrOpt = z.string().optional();
export const zStrNullOpt = z.string().nullable().optional();

export const zNum = z.number();
export const zNumNull = z.number().nullable();

const TRUTHY = /^(s|si|sí|true|1|y|yes)$/i;

/**
 * Normaliza flags `S/N`, `1/0`, `true/false` (string|number|boolean) → boolean.
 * Misma lógica que `normalizePeligrosidad` para mantener consistencia.
 */
export const zBool = z
  .union([z.boolean(), z.number(), z.string()])
  .transform((v) => (typeof v === "boolean" ? v : TRUTHY.test(String(v).trim())));
export const zBoolOpt = zBool.optional();

export type Id = z.infer<typeof zId>;
