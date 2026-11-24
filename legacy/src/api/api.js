import axios from "axios";

const api_no_auth = axios.create({ baseURL: import.meta.env.VITE_AXIOS });

// let token = localStorage.getItem("token");

const api = axios.create({ baseURL: import.meta.env.VITE_AXIOS });

const actualizarHeadersAuth = () => {
  const token = localStorage.getItem("token");
  const version = localStorage.getItem("version_app");

  if (token) api.defaults.headers.common.authorization = `${token}`;
  else delete api.defaults.headers.common.authorization;

  if (version) api.defaults.headers.common.version_app = `${version}`;
  else delete api.defaults.headers.common.version_app;
};

window.addEventListener("storage", (event) => {
  if (event.key === "token" || event.key === "version_app") {
    actualizarHeadersAuth();
  }
});

actualizarHeadersAuth();

const verificarCodigo = (error, esError, url) => {
  const { cod_mensaje = "000", mensaje = "Error al validar" } = error;

  const isTokenError = [1001, 1062, 1002, 1003].includes(cod_mensaje);
  const isPublicRoute = typeof window !== "undefined" && window.location?.pathname?.startsWith("/public");

  // En rutas públicas no mostramos el modal de "Sesión finalizada".
  if (isTokenError && isPublicRoute) return;

  let errorArmado = `[${cod_mensaje}]: ${mensaje}`;
  // console.log(errorArmado, [1001, 1002, 1003, 1062, 1073, 1077].includes(cod_mensaje));
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

const convertKeysToLowerCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((v) => convertKeysToLowerCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key.toLowerCase()] = convertKeysToLowerCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

// api.interceptors.request.use(
//   (config) => {
//     // Verifica si el header requerido está presente
//     if (!config.headers["authorization"]) {
//       // Si el header no está presente, rechaza la solicitud
//       return Promise.reject(new Error('Header "authorization" is required.'));
//     }
//     // Si el header está presente, permite que la solicitud continúe
//     return config;
//   },
//   (error) => {
//     // Maneja cualquier error ocurrido antes de enviar la solicitud
//     return Promise.reject(error);
//   }
// );

class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// api.interceptors.request.use(
//   (config) => {
//     const url = config.url || "";

//     if (url.startsWith("/public/api")) {
//       return config;
//     }

//     const version = localStorage.getItem("version_app");
//     const token = localStorage.getItem("token");

//     if (!token && !version) return config;

//     if (!version) {
//       return Promise.reject(new Error('Header "version_app" is required.'));
//     }

//     config.headers = config.headers || {};
//     config.headers.version_app = `${version}`;

//     return config;
//   },
//   (error) => Promise.reject(error),
// );

api_no_auth.interceptors.response.use(
  function (response) {
    const { message, data, length } = response.data;
    if (data.cod_mensaje === 1075) {
      Promise.reject(new Error(data.cod_mensaje || "Se requiere que se Reinicie la contraseña"));
      const error = new CustomError(data.mensaje, data.cod_mensaje);
      verificarCodigo(data, true, response.config.url);
      return Promise.reject(new Error(data.cod_mensaje || "Se requiere que se Reinicie la contraseña"));
    }
    if (data.cod_mensaje === 1077) {
      const error = new CustomError(data.mensaje, data.cod_mensaje);

      return Promise.reject(error);
    }
    if (data.cod_mensaje === 1073) {
      const error = new CustomError(data.mensaje, data.cod_mensaje);

      return Promise.reject(error);
    }
    if (data.cod_mensaje === 404) {
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
api.interceptors.response.use(
  (response) => {
    const { message, data, length } = response.data;
    const { url, responseType } = response.config;
    const { data_interno = data } = { ...data };

    // SI EL RESPONSE ES UN ARCHIVO REGRESAR
    if (responseType) {
      return response;
    }

    // VERIFICAR ESTADO DE AUTENTICACIÓN
    if (data?.cod_mensaje)
      if (data.cod_mensaje === 1003) {
        verificarCodigo(data, !data.success, response.config.url);
        return Promise.reject(new Error(data.cod_mensaje || "Error")); //Promise.reject(response.data);
      }

    if (length || length === 0) {
      // console.log(length);
      if (response.data) {
        if (response.data.data) response.data.data = convertKeysToLowerCase(response.data.data);
        else response.data = convertKeysToLowerCase(response.data);
      }
      return response;
    } else if (data_interno?.success && response.config.method === "get") {
      // response.data = convertKeysToLowerCase(response.data);
      return response;
      // } else if (message === "SUCCESS" && response.config.method === "get") {
      //   // response.data = convertKeysToLowerCase(response.data);
      //   return convertKeysToLowerCase(response.data);
    } else if (url.includes("recuperar-archivo") || url.includes("generar-pdf-cotizacion-detalle") || url.includes("orquestador-recupera-formatos")) {
      return response;
    } else if (!data?.success && data?.lista_estados_proceso) {
      return convertKeysToLowerCase(response);
    } else if (data) {
      if (data.total_paginas >= 0) {
        response.data.data = convertKeysToLowerCase(response.data.data);
        return response;
      } else if (data.success) {
        if (data.cod_mensaje === 1077) return Promise.reject(new Error(data.cod_mensaje || "Se requiere que se Reinicie la contraseña"));
        if (data.cod_mensaje === 1055) {
          console.log("Código 1055 detectado - omitiendo procesamiento:", data.mensaje);
          return response; // Retorna la respuesta sin procesar verificarCodigo
        }
        if (data.cod_mensaje !== 1061) verificarCodigo(data, !data.success);

        // return data.success
        //   ? response
        //   : Promise.reject(new Error(data.cod_mensaje || "Error"));
        return response;
      } else if (response.data.message === "SUCCESS") {
        // console.log("SUCCESS", data);
        if (Object.hasOwn(data, "success")) {
          if (data.cod_mensaje === 1055) {
            console.log("Código 1055 detectado - omitiendo procesamiento:", data.mensaje);
            return response; // Retorna la respuesta sin procesar verificarCodigo
          }
          if (!data.success) verificarCodigo(data, true);
          else if (data.data?.successfull_inserts?.length === 0) verificarCodigo(data, true);

          return response;
        } else return response;
      } else {
        verificarCodigo(data, !data.success, response.config.url);
        // return data.success
        //   ? response
        //   : Promise.reject(new Error(data.cod_mensaje || "Error"));
        return response;
      }
    } else if (typeof message === "object") {
      verificarCodigo(message, true, response.config.url);
      return Promise.reject(new Error(data.cod_mensaje || "Error")); //Promise.reject(response.data);
    } else {
      if (response.data)
        if (response.data.data) response.data.data = convertKeysToLowerCase(response.data.data);
        else response.data = convertKeysToLowerCase(response.data);
      return response;
    }
  },
  function (err) {
    if (err.response) {
      const { status, message, error } = err.response.data;
      const errorUrl = err.config?.url || err.request?.responseURL || "unknown";
      if (error.status) {
        verificarCodigo({ ...error, mensaje: error.message, cod_mensaje: error.status }, true, errorUrl);
        return err;
      }
      console.log(err.response.data);
      if (typeof message === "object") {
        verificarCodigo(message, undefined, errorUrl);
        return err;
      }
      if (typeof error === "object") {
        verificarCodigo({ ...error, mensaje: error.message, cod_mensaje: 404 }, true, errorUrl);
        // return Promise.reject(new Error(error.message || "Error con código 404"));
        return err;
      }
    }
    return err;
    // return Promise.reject(new Error("Error en la respuesta de la API"));
  },
);

// axios.defaults.headers.common["Authorization"] ="Bearer " + localStorage.getItem("token");

export { api, api_no_auth };
