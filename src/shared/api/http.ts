import { env } from "@/shared/config/env";
import { ApiError, SesionExpiradaError } from "./errors";

/**
 * Núcleo HTTP único: construcción de URL, headers, parseo de respuesta,
 * normalización de claves y conversión a la taxonomía de errores.
 * Los adaptadores client.ts (browser) y server.ts (RSC) son envoltorios
 * delgados sobre executeRequest.
 */

export type HttpOptions = RequestInit & {
  skipAuth?: boolean;
  params?: Record<string, unknown>;
  skipNormalization?: boolean;
};

export interface HttpAdapter {
  /** Convierte el endpoint lógico en URL final (proxy o backend directo). */
  resolveUrl(endpoint: string, params?: Record<string, unknown>): string;
  /** Headers de autenticación u otros propios del entorno. */
  prepareHeaders?(headers: Record<string, string>, options: HttpOptions): Promise<void> | void;
  /** Hook ante SesionExpiradaError (logout + redirect en browser). */
  onSesionExpirada?(): void;
}

/** Claves del backend llegan en casing inconsistente: se normalizan a minúsculas. */
export const normalizeKeys = (obj: unknown): unknown => {
  if (Array.isArray(obj)) {
    return obj.map((v) => normalizeKeys(v));
  }
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc: Record<string, unknown>, key) => {
      acc[key.toLowerCase()] = normalizeKeys((obj as Record<string, unknown>)[key]);
      return acc;
    }, {});
  }
  return obj;
};

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value !== null && value !== undefined) return JSON.stringify(value);
  return "";
}

function formatMessage(msg: unknown, codMensaje: unknown): string {
  let text: string;
  if (typeof msg === "string") text = msg;
  else if (Array.isArray(msg)) text = msg.join(", ");
  else text = safeString(msg);
  return codMensaje ? `[${safeString(codMensaje)}] ${text}` : text;
}

export function getErrorMessage(data: unknown): string {
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;

    if (d.data && typeof d.data === "object") {
      const innerData = d.data as Record<string, unknown>;
      const innerMsg = innerData.mensaje ?? innerData.message;
      if (innerMsg !== undefined) {
        return formatMessage(innerMsg, innerData.cod_mensaje);
      }
    }

    const msg = d.mensaje ?? d.message ?? d.error;
    if (msg !== undefined) return formatMessage(msg, undefined);
  }
  if (typeof data === "string") return data;
  return "Error desconocido";
}

export function appendQueryParams(url: string, params: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return url;
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      for (const item of v) usp.append(k, safeString(item));
    } else {
      usp.append(k, safeString(v));
    }
  }
  const q = usp.toString();
  if (!q) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${q}`;
}

export function buildBackendUrl(endpoint: string, params: Record<string, unknown> = {}): string {
  const base = env.NEXT_PUBLIC_API_URL;
  const url = `${base}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  return appendQueryParams(url, params);
}

export async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) return response.json();
  return response.text();
}

function buildBaseHeaders(
  headers: HeadersInit | undefined,
  isFormData: boolean,
): Record<string, string> {
  const base: Record<string, string> = isFormData ? {} : { "Content-Type": "application/json" };
  base.version_app = env.NEXT_PUBLIC_APP_VERSION;
  return { ...base, ...(headers as Record<string, string> | undefined) };
}

function extractCodMensaje(data: unknown): string | number | undefined {
  const inner = (data as Record<string, unknown> | null | undefined)?.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    const cod = (inner as Record<string, unknown>).cod_mensaje;
    if (typeof cod === "string" || typeof cod === "number") return cod;
  }
  return undefined;
}

function envelopeIndicaSesionExpirada(data: unknown): boolean {
  const inner = (data as Record<string, unknown> | null | undefined)?.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    const d = inner as Record<string, unknown>;
    return d.success === false && d.cod_mensaje === 1003;
  }
  return false;
}

export function throwOnApiError(data: unknown, response: Response): void {
  const codMensaje = extractCodMensaje(data);

  // El backend puede señalar sesión expirada con 200 + cod_mensaje 1003
  if (envelopeIndicaSesionExpirada(data) || response.status === 401) {
    throw new SesionExpiradaError(
      getErrorMessage(data),
      { data, status: response.status },
      codMensaje,
    );
  }

  // `data.success` no es un indicador global: según el endpoint puede ser
  // parte del payload funcional incluso cuando la respuesta fue exitosa.
  // Las mutaciones que lo usen como error de negocio deben validarlo en su
  // propia capa, donde se conoce el contrato concreto.
  if (!response.ok) {
    throw new ApiError(
      mensajeDeRespuestaFallida(data, response.status),
      { data, status: response.status },
      codMensaje,
    );
  }
}

/**
 * Una página HTML (p. ej. el 502/504 del reverse proxy cuando el backend no
 * responde) no se muestra cruda en el toast.
 */
function mensajeDeRespuestaFallida(data: unknown, status: number): string {
  if (typeof data === "string" && data.trimStart().startsWith("<")) {
    return `El servidor no está disponible o no respondió (HTTP ${status}). Intenta nuevamente.`;
  }
  return getErrorMessage(data);
}

/** Mensaje de un fetch que no obtuvo respuesta (red caída o `signal` vencida). */
function mensajeSinRespuesta(error: unknown): string {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    // La operación pudo completarse en el backend aunque la respuesta no llegara.
    return "El servidor no respondió a tiempo. Verifica si la operación se aplicó antes de reintentar.";
  }
  return error instanceof Error ? error.message : "Error de red";
}

export function applyNormalization<T>(data: unknown, skip: boolean | undefined): T {
  if (!skip && data && (typeof data === "object" || Array.isArray(data))) {
    return normalizeKeys(data) as T;
  }
  return data as T;
}

export async function executeRequest<T>(
  adapter: HttpAdapter,
  endpoint: string,
  options: HttpOptions = {},
): Promise<T> {
  const { skipAuth: _skipAuth, headers, params, skipNormalization, ...rest } = options;
  const url = adapter.resolveUrl(endpoint, params);
  const reqHeaders = buildBaseHeaders(headers, rest.body instanceof FormData);
  await adapter.prepareHeaders?.(reqHeaders, options);

  let response: Response;
  let data: unknown;
  try {
    response = await fetch(url, { headers: reqHeaders, ...rest });
    data = await parseResponse(response);
  } catch (error) {
    // Error de red/parseo/timeout: sin respuesta del backend
    throw new ApiError(mensajeSinRespuesta(error), {
      data: null,
      status: 0,
    });
  }

  try {
    throwOnApiError(data, response);
  } catch (error) {
    if (error instanceof SesionExpiradaError) {
      adapter.onSesionExpirada?.();
    }
    throw error;
  }

  return applyNormalization<T>(data, skipNormalization);
}

/** Métodos estándar construidos sobre un adaptador. */
export function createHttpMethods(adapter: HttpAdapter) {
  return {
    request<T>(endpoint: string, options?: HttpOptions) {
      return executeRequest<T>(adapter, endpoint, options ?? {});
    },
    get<T>(endpoint: string, options?: HttpOptions) {
      return executeRequest<T>(adapter, endpoint, { ...options, method: "GET" });
    },
    post<T>(endpoint: string, body: unknown, options?: HttpOptions) {
      const isFormData = body instanceof FormData;
      return executeRequest<T>(adapter, endpoint, {
        ...options,
        method: "POST",
        body: isFormData ? body : JSON.stringify(body),
      });
    },
    put<T>(endpoint: string, body: unknown, options?: HttpOptions) {
      return executeRequest<T>(adapter, endpoint, {
        ...options,
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    delete<T>(endpoint: string, options?: HttpOptions) {
      return executeRequest<T>(adapter, endpoint, { ...options, method: "DELETE" });
    },
  };
}
