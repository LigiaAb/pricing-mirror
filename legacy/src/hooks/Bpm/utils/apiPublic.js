import axios from "axios";

/**
 * Cliente HTTP específico para los endpoints públicos de clientes
 * bajo el prefijo `/clientes/api/v2/`.
 *
 * A diferencia de `api_no_auth` (de `src/api/api.js`), esta instancia:
 *   - Inyecta los headers `Authorization` (token_interaccion) y `version_app`
 *     desde `localStorage.public_token` y `localStorage.public_version_app`
 *     en cada request.
 *   - Sincroniza esos headers ante cambios en `localStorage` vía el evento
 *     `storage`.
 *   - Conserva el manejo de errores de respuesta del interceptor original
 *     de `api_no_auth` (códigos 1075, 1077, 1073, 404).
 *
 * El ciclo de vida del token es responsabilidad del caller (la vista pública
 * lo persiste al montar y lo limpia al desmontar).
 */

const baseURL = import.meta.env.VITE_AXIOS;

const api_no_auth_v2 = axios.create({ baseURL });

const PUBLIC_TOKEN_KEY = "public_token";
const PUBLIC_VERSION_KEY = "public_version_app";

const refrescarHeadersPublicos = () => {
  const token = localStorage.getItem(PUBLIC_TOKEN_KEY);
  const version = localStorage.getItem(PUBLIC_VERSION_KEY);

  if (token) {
    api_no_auth_v2.defaults.headers.common.Authorization = `${token}`;
  } else {
    delete api_no_auth_v2.defaults.headers.common.Authorization;
  }

  if (version) {
    api_no_auth_v2.defaults.headers.common.version_app = `${version}`;
  } else {
    delete api_no_auth_v2.defaults.headers.common.version_app;
  }
};

api_no_auth_v2.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(PUBLIC_TOKEN_KEY);
    const version = localStorage.getItem(PUBLIC_VERSION_KEY);

    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = token;
    } else {
      delete config.headers.Authorization;
    }

    if (version) {
      config.headers.version_app = version;
    } else {
      delete config.headers.version_app;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

window.addEventListener("storage", (event) => {
  if (event.key === PUBLIC_TOKEN_KEY || event.key === PUBLIC_VERSION_KEY) {
    refrescarHeadersPublicos();
  }
});

refrescarHeadersPublicos();

// ============================================================================
// INTERCEPTOR DE RESPUESTA: replica el manejo de errores de api_no_auth
// para mantener consistencia con el resto del proyecto.
// ============================================================================

const verificarCodigo = (error, esError, url) => {
  const { cod_mensaje = "000", mensaje = "Error al validar" } = error;

  const isTokenError = [1001, 1062, 1002, 1003].includes(cod_mensaje);
  const isPublicRoute = typeof window !== "undefined" && window.location?.pathname?.startsWith("/public");

  if (isTokenError && isPublicRoute) return;

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

class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

api_no_auth_v2.interceptors.response.use(
  function (response) {
    const { data } = response.data ?? {};
    if (data?.cod_mensaje === 1075) {
      Promise.reject(new Error(data.cod_mensaje || "Se requiere que se Reinicie la contraseña"));
      const error = new CustomError(data.mensaje, data.cod_mensaje);
      verificarCodigo(data, true, response.config.url);
      return Promise.reject(new Error(data.cod_mensaje || "Se requiere que se Reinicie la contraseña"));
    }
    if (data?.cod_mensaje === 1077) {
      const error = new CustomError(data.mensaje, data.cod_mensaje);
      return Promise.reject(error);
    }
    if (data?.cod_mensaje === 1073) {
      const error = new CustomError(data.mensaje, data.cod_mensaje);
      return Promise.reject(error);
    }
    if (data?.cod_mensaje === 404) {
      const error = new CustomError(data.mensaje, data.cod_mensaje);
      return Promise.reject(error);
    }
    return response;
  },
  function (err) {
    if (err.response) {
      const { status, message, error } = err.response.data;
      const errorUrl = err.config?.url || err.request?.responseURL || "unknown";

      if (typeof message === "object") {
        verificarCodigo(message, undefined, errorUrl);
      }
      if (typeof error === "object") {
        verificarCodigo({ ...error, mensaje: error.message, cod_mensaje: 404 }, true, errorUrl);
        return Promise.reject(new Error(error.message || "Error con código 404"));
      }
    }
  },
);

export default api_no_auth_v2;
