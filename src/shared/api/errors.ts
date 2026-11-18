/**
 * Taxonomía de errores de la capa HTTP. Toda la app distingue errores por
 * instancia (instanceof), nunca parseando mensajes.
 */

export interface ApiErrorResponse {
  data: unknown;
  status: number;
}

export class ApiError extends Error {
  readonly response: ApiErrorResponse;
  /** Código de mensaje del backend (ej. 1003 = sesión expirada), si vino en el sobre */
  readonly codMensaje: string | number | undefined;

  constructor(
    message: string,
    response: ApiErrorResponse,
    codMensaje?: string | number | undefined,
  ) {
    super(message);
    this.name = "ApiError";
    this.response = response;
    this.codMensaje = codMensaje;
  }
}

/** El backend indicó sesión inválida/expirada (cod_mensaje 1003 o HTTP 401). */
export class SesionExpiradaError extends ApiError {
  constructor(message: string, response: ApiErrorResponse, codMensaje?: string | number) {
    super(message, response, codMensaje);
    this.name = "SesionExpiradaError";
  }
}

/**
 * El backend rechazó la operación por una regla de negocio (HTTP 200 +
 * `success: false`, p. ej. un usuario duplicado). Es un error del usuario, no del
 * sistema: el MutationCache global ya lo muestra en un toast, así que los
 * formularios no lo propagan como rechazo sin manejar (no debe llegar a Sentry).
 */
export class ErrorDeNegocio extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErrorDeNegocio";
  }
}

/** La respuesta del backend no cumple el schema esperado (solo se lanza en dev). */
export class EnvelopeInvalidoError extends Error {
  readonly issues: unknown;

  constructor(contexto: string, issues: unknown) {
    super(`[${contexto}] La respuesta del API no cumple el schema esperado`);
    this.name = "EnvelopeInvalidoError";
    this.issues = issues;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

export function isSesionExpirada(err: unknown): err is SesionExpiradaError {
  return err instanceof SesionExpiradaError;
}

/** Mensaje legible para handlers globales y toasts. */
export function mensajeDeError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Error desconocido";
}
