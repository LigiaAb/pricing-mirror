import axios from "axios";

/**
 * Cliente HTTP para hooks de Bpm.
 *
 * Replica el comportamiento del cliente de `src/api/api.js` (instancia `api`
 * con auth) pero con un diseño modular y mejoras:
 *   - Inyecta `authorization` y `version_app` por request (no en defaults
 *     globales) para evitar condiciones de carrera con el evento `storage`.
 *   - Sincroniza `token` y `version_app` desde `localStorage` ante eventos
 *     `storage` entre pestañas.
 *   - Mantiene el contrato: `customError` window event, lowercase keys,
 *     manejo de códigos 1001/1002/1003/1055/1061/1062/1073/1075/1077/404.
 *   - En rutas públicas (`/public*`) suprime el modal de "Sesión finalizada"
 *     para errores de token, igual que el original.
 *   - En errores sin `err.response` (timeout, DNS, conexión caída) rechaza
 *     la promesa de forma consistente para que el caller detecte el fallo.
 */

const REQUEST_TIMEOUT_MS = 30000;

const TOKEN_KEY = "token";
const VERSION_KEY = "version_app";
const TOKEN_ERROR_CODES = [1001, 1002, 1003, 1062];
const BYPASS_VERIFY_CODES = [1055, 1061];
const HARD_REJECT_CODES = [1075, 1077, 1073, 404];

const leerHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const version = localStorage.getItem(VERSION_KEY);
  return { token, version };
};

const inyectarHeadersAuth = (config) => {
  const { token, version } = leerHeaders();
  config.headers = config.headers || {};

  if (token) {
    config.headers.authorization = `${token}`;
  } else {
    delete config.headers.authorization;
  }

  if (version) {
    config.headers.version_app = `${version}`;
  } else {
    delete config.headers.version_app;
  }

  return config;
};

const esRutaPublica = () =>
  typeof window !== "undefined" && Boolean(window.location?.pathname?.startsWith("/public"));

class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = "CustomError";
  }
}

const dispatchCustomError = (cod_mensaje, mensaje, esError, url) => {
  const isTokenError = TOKEN_ERROR_CODES.includes(cod_mensaje);
  if (isTokenError && esRutaPublica()) return;

  const errorArmado = `[${cod_mensaje}]: ${mensaje}`;
  const myEvent = new CustomEvent("customError", {
    detail: {
      cod: cod_mensaje,
      message: errorArmado,
      type: esError ? "error" : "",
      url,
      errorToken: isTokenError,
    },
  });

  window.dispatchEvent(myEvent);
};

const verificarCodigo = (error, esError, url) => {
  const { cod_mensaje = "000", mensaje = "Error al validar" } = error ?? {};
  dispatchCustomError(cod_mensaje, mensaje, esError, url);
};

const convertKeysToLowerCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((v) => convertKeysToLowerCase(v));
  }
  if (obj !== null && typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key.toLowerCase()] = convertKeysToLowerCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

const lowerCaseData = (response) => {
  if (!response.data) return response;
  if (response.data.data) response.data.data = convertKeysToLowerCase(response.data.data);
  else response.data = convertKeysToLowerCase(response.data);
  return response;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_AXIOS,
  timeout: REQUEST_TIMEOUT_MS,
});

api.interceptors.request.use(
  (config) => inyectarHeadersAuth(config),
  (error) => Promise.reject(error),
);

window.addEventListener("storage", (event) => {
  if (event.key === TOKEN_KEY || event.key === VERSION_KEY) {
    inyectarHeadersAuth({ headers: api.defaults.headers.common });
  }
});

api.interceptors.response.use(
  (response) => {
    const { data } = response.data ?? {};
    const { url, responseType } = response.config;
    const { data_interno = data } = { ...(response.data ?? {}) };

    if (responseType) {
      return response;
    }

    if (data?.cod_mensaje === 1003) {
      verificarCodigo(data, !data.success, response.config.url);
      return Promise.reject(new Error(data.cod_mensaje || "Error"));
    }

    if (response.data?.length || response.data?.length === 0) {
      return lowerCaseData(response);
    }

    if (data_interno?.success && response.config.method === "get") {
      return response;
    }

    if (
      url?.includes("recuperar-archivo") ||
      url?.includes("generar-pdf-cotizacion-detalle") ||
      url?.includes("orquestador-recupera-formatos") ||
      url?.includes("fila-carta-instrucciones") ||
      url?.includes("recuperar-datos-entidad")
    ) {
      return response;
    }

    if (!data?.success && data?.lista_estados_proceso) {
      response.data = convertKeysToLowerCase(response.data);
      return response;
    }

    if (data) {
      if (typeof data.total_paginas === "number" && data.total_paginas >= 0) {
        response.data.data = convertKeysToLowerCase(response.data.data);
        return response;
      }

      if (data.success) {
        if (data.cod_mensaje === 1077) {
          return Promise.reject(new CustomError(data.mensaje, data.cod_mensaje));
        }
        if (data.cod_mensaje === 1055) {
          return response;
        }
        if (data.cod_mensaje !== 1061) {
          verificarCodigo(data, !data.success, response.config.url);
        }
        return response;
      }

      if (response.data?.message === "SUCCESS") {
        if (Object.hasOwn(data, "success")) {
          if (data.cod_mensaje === 1055) {
            return response;
          }
          if (!data.success) verificarCodigo(data, true, response.config.url);
          else if (data.data?.successfull_inserts?.length === 0) {
            verificarCodigo(data, true, response.config.url);
          }
          return response;
        }
        return response;
      }

      verificarCodigo(data, !data.success, response.config.url);
      return response;
    }

    if (typeof response.data?.message === "object" && response.data.message !== null) {
      verificarCodigo(response.data.message, true, response.config.url);
      return Promise.reject(new Error(data?.cod_mensaje || "Error"));
    }

    return lowerCaseData(response);
  },
  (err) => {
    if (err.response) {
      const { status, message, error } = err.response.data ?? {};
      const errorUrl = err.config?.url || err.request?.responseURL || "unknown";

      if (error?.status) {
        verificarCodigo(
          { ...error, mensaje: error.message, cod_mensaje: error.status },
          true,
          errorUrl,
        );
        return Promise.reject(err);
      }

      if (typeof message === "object" && message !== null) {
        verificarCodigo(message, undefined, errorUrl);
        return Promise.reject(err);
      }

      if (typeof error === "object" && error !== null) {
        verificarCodigo(
          { ...error, mensaje: error.message, cod_mensaje: 404 },
          true,
          errorUrl,
        );
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  },
);

export { api, REQUEST_TIMEOUT_MS, CustomError };
