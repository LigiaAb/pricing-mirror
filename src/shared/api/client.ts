import { clearSession } from "@/shared/lib/auth/session";
import { redirigir } from "@/shared/lib/navegacion";
import { appendQueryParams, buildBackendUrl, createHttpMethods, type HttpAdapter } from "./http";
import { getPublicSession } from "./public-session";

/**
 * Adaptadores HTTP de browser. Dos variantes:
 * - `http`: vía proxy (/api/proxy) con sesión; ÚNICA ruta de logout ante sesión expirada.
 * - `httpPublic`: directo al backend, endpoints públicos (login, carta pública).
 */

function onSesionExpirada(): void {
  clearSession();
  if (globalThis.window !== undefined) {
    // `expired=1` evita que el proxy rebote a un usuario con cookie aún
    // válida de vuelta a "/" (la cookie httpOnly no se puede borrar desde
    // elcliente; el proxy trata `/login?expired=1` como ruta pública).
    redirigir("/login?expired=1");
  }
}

const proxyAdapter: HttpAdapter = {
  resolveUrl(endpoint, params = {}) {
    const url = `/api/proxy${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    return appendQueryParams(url, params);
  },
  onSesionExpirada,
};

const publicAdapter: HttpAdapter = {
  resolveUrl: (endpoint, params = {}) => buildBackendUrl(endpoint, params),
  // Sesión pública (link de carta): Authorization desde public-session salvo
  // que el call site lo pase explícito. version_app de la sesión REEMPLAZA el
  // default del env (el backend público valida la versión del link, no la de
  // la app) — si un call site necesita otra versión, que use public-session.
  prepareHeaders(headers) {
    const { token, versionApp } = getPublicSession();
    if (token && !headers.Authorization) headers.Authorization = token;
    if (versionApp) headers.version_app = versionApp;
  },
};

export const http = createHttpMethods(proxyAdapter);

export const httpPublic = createHttpMethods(publicAdapter);
