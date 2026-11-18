import "server-only";
import { getServerToken } from "@/shared/lib/auth/server-session";
import { buildBackendUrl, createHttpMethods, type HttpAdapter } from "./http";

/**
 * Adaptador HTTP para RSC y route handlers: va directo al backend con el
 * token de la cookie de sesión. `skipAuth: true` omite el Authorization
 * (endpoints públicos).
 */
const serverAdapter: HttpAdapter = {
  resolveUrl: (endpoint, params = {}) => buildBackendUrl(endpoint, params),
  async prepareHeaders(headers, options) {
    if (options.skipAuth) return;
    const token = await getServerToken();
    if (!token) throw new Error("Unauthorized: no active session");
    headers.Authorization = token;
  },
};

export const serverHttp = createHttpMethods(serverAdapter);
