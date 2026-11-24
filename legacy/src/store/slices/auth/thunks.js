import { api } from "../../../api";
import { checkingCredentials, login, logout, setJSON } from "./authSlice";
import {
  getCurrentCategoria,
  getCurrentCentroCosto,
  getCurrentEmpresa,
  getCurrentMenu,
  getCurrentModulo,
  getCurrentPais,
  removeCurrentCentroCosto,
  removeCurrentEmprsa,
  removeCurrentPais,
} from "../menu/menuSlice";
import { generatemenuTree, initCurrentsFromDefaultUrl, redirectToUserHome } from "../menu/thunks";
import { executeQuery } from "../../../utils/queryUtils";

/**
 * `auth/thunks.js`
 *
 * Contiene el flujo de autenticación y bootstrap de permisos:
 * - `checkingAuthentication`: se usa al hacer login (token + usuario) y luego obtiene permisos/menús.
 * - `checkingCurrentToken`: rehidrata sesión desde localStorage si hay token.
 * - `handleLogout`: limpia storage y resetea slices relacionados.
 *
 * NOTA sobre token vencido:
 * - El backend/interceptores disparan `customError` con `errorToken: true`.
 * - El logout real se ejecuta al confirmar en el modal de “Sesión finalizada”
 *   (ver `AnuncioComponent`), no aquí automáticamente.
 */

// Función reutilizable para obtener datos de usuario
const fetchUserData = async (cod_usuario) => {
  const [userRes, empRes, jsonUsuario, allMenus] = await Promise.all([
    executeQuery(
      ["usuario_actual", { cod_usuario: Number(cod_usuario) }],
      () => api.get("/api/appweb/listausuario", { params: { cod_usuario: Number(cod_usuario) } }).then(({ data }) => data.data[0]),
      {},
    ),
    executeQuery(
      ["puestos_usuario_actual", { cod_usuario: Number(cod_usuario) }],
      () => api.get("/api/appweb/listaemp-usu-puesto", { params: { cod_usuario: Number(cod_usuario) } }).then(({ data }) => data.data[0]),
      {},
    ),
    executeQuery(
      ["json_usuario_actual", { cod_usuario: Number(cod_usuario) }],
      () => api.get("/api/appweb/get-json-usuario", { params: { cod_usuario: Number(cod_usuario) } }).then(({ data }) => data.data),
      {},
    ),
    executeQuery(["relacion-modulos"], () => api.get("/api/appweb/get-json-modulo-menu-cat-opc-acc").then(({ data }) => data.data), {}),
  ]);

  const usuario = userRes;
  const cod_empleado = empRes.cod_empleado;
  const cod_puesto = empRes.cod_puesto;

  // Obtener el json_puesto del puesto asignado al usuario para extraer tiposTransporte
  let jsonFinal = jsonUsuario.json; // Usar json_usuario como base

  if (cod_puesto) {
    try {
      const puestoRes = await api.get("/api/appweb/lista-puesto", { params: { cod_puesto: Number(cod_puesto) } });
      const puesto = puestoRes.data?.data?.[0];
      if (puesto?.json_puesto) {
        const jsonPuestoParsed = typeof puesto.json_puesto === "string" ? JSON.parse(puesto.json_puesto) : puesto.json_puesto;

        // Combinar: usar json_usuario como base y agregar tiposTransporte del json_puesto
        if (jsonFinal?.permisos?.paises && jsonPuestoParsed?.paises) {
          Object.keys(jsonPuestoParsed.paises).forEach((paisId) => {
            const paisPuesto = jsonPuestoParsed.paises[paisId];
            if (paisPuesto?.empresas) {
              Object.keys(paisPuesto.empresas).forEach((empresaId) => {
                const empresaPuesto = paisPuesto.empresas[empresaId];
                if (empresaPuesto?.centrosCosto) {
                  Object.keys(empresaPuesto.centrosCosto).forEach((ccId) => {
                    const ccPuesto = empresaPuesto.centrosCosto[ccId];
                    const ccEnUsuario = jsonFinal.permisos.paises[paisId]?.empresas?.[empresaId]?.centrosCosto?.[ccId];
                    if (ccEnUsuario) {
                      // Si el json_puesto tiene tiposTransporte, usarlos; si no, establecer vacío
                      // jsonFinal.permisos.paises[paisId].empresas[empresaId].centrosCosto[ccId].tiposTransporte = ccPuesto?.tiposTransporte || {};
                    }
                  });
                }
              });
            }
          });
        }

        // Si el json_puesto no tiene estructura de paises, limpiar tiposTransporte de todos los centros de costo
        if (jsonFinal?.permisos?.paises && !jsonPuestoParsed?.paises) {
          Object.keys(jsonFinal.permisos.paises).forEach((paisId) => {
            const paisUsuario = jsonFinal.permisos.paises[paisId];
            if (paisUsuario?.empresas) {
              Object.keys(paisUsuario.empresas).forEach((empresaId) => {
                const empresaUsuario = paisUsuario.empresas[empresaId];
                if (empresaUsuario?.centrosCosto) {
                  Object.keys(empresaUsuario.centrosCosto).forEach((ccId) => {
                    // Establecer tiposTransporte como vacío si el json_puesto no tiene la estructura
                    jsonFinal.permisos.paises[paisId].empresas[empresaId].centrosCosto[ccId].tiposTransporte = {};
                  });
                }
              });
            }
          });
        }
      }
    } catch (e) {
      console.error("[fetchUserData] Error al obtener json_puesto:", e);
    }
  }

  if (cod_empleado) {
    const empleadoRes = await executeQuery(
      ["empleado_actual", { cod_empleado: cod_empleado ? Number(cod_empleado) : undefined }],
      () => api.get("/api/appweb/lista-empleado", { params: { cod_empleado: cod_empleado ? Number(cod_empleado) : undefined } }).then(({ data }) => data.data[0]),
      {},
    );

    return {
      usuario,
      empleado: empleadoRes,
      jsonArray: jsonFinal,
      allMenus,
    };
  } else {
    return {
      usuario,
      empleado: {},
      jsonArray: jsonFinal,
      allMenus,
    };
  }
};

// Thunks optimizados
/**
 * Login “completo”:
 * - configura headers globales en `api`
 * - obtiene usuario/empleado/permisos + menús
 * - persiste datos mínimos en localStorage
 * - construye árbol de menú en Redux (`generatemenuTree`)
 * - despacha `auth/login`
 * - devuelve una URL a navegar (resuelta por `redirectToUserHome`)
 */
export const checkingAuthentication = (d) => async (dispatch) => {
  // dispatch(checkingCredentials());

  try {
    const token = d.token_usuario;
    const cod_usuario = Number(d.cod_usuario);
    const version_app = d.version_app;

    // Configuración de headers
    if (version_app) api.defaults.headers.common.version_app = `${version_app}`;
    if (token) api.defaults.headers.common.authorization = `${token}`;

    if (version_app) api.defaults.headers.version_app = `${version_app}`;
    if (token) api.defaults.headers.authorization = `${token}`;

    const { usuario, empleado, jsonArray, allMenus } = await fetchUserData(cod_usuario);

    dispatch(generatemenuTree(allMenus, jsonArray));

    // Almacenamiento optimizado
    const storageItems = {
      token,
      cod_usuario,
      version_app,
      previo: 1,
      json: JSON.stringify(jsonArray),
      allMenus: JSON.stringify(allMenus),
    };

    Object.entries(storageItems).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });

    const dashboardAccessGranted = sessionStorage.getItem("dashboardAccessGranted");

    let tr = sessionStorage.getItem("tr");
    if (!tr) tr = "0";
    sessionStorage.setItem("tr", tr);

    dispatch(setJSON(usuario?.json));
    dispatch(
      login({
        token,
        usuario,
        empleado,
        version: version_app,
        json: JSON.stringify(jsonArray),
        jsonArray,
        allMenus,
        nom_empleado: empleado.nom_empleado,
        apellido_emp: empleado.apellido_emp,
        defaultUrl: jsonArray?.configuracion?.ruta_inicial,
        tr: Number(tr),
        dashboardAccessGranted: dashboardAccessGranted === "true",
      }),
    );

    /**
     * Inicialización de permisos/currents SOLO la primera vez después del login.
     * - Si hay `defaultUrl`, se resuelve el árbol completo: pais/empresa/cc/modulo/menu/categoría
     *   recorriendo permisos.
     * - Si no se puede resolver, caemos al redirect normal.
     */
    const urlFromDefault = dispatch(initCurrentsFromDefaultUrl());
    if (urlFromDefault) return urlFromDefault;

    // Fallback: redirección estándar (sin forzar el contexto completo).
    const url = dispatch(redirectToUserHome(true));
    return url || usuario?.ruta_inicial || null;
  } catch (error) {
    console.error(error);
    // dispatch(handleLogout({ errorMessage: error.message }));
    return;
  }
};

/**
 * Logout explícito / confirmado:
 * - limpia localStorage y los "currents" de sessionStorage
 * - resetea slice de menú (pais/empresa/cc) y slice de auth
 */
export const handleLogout = () => (dispatch) => {
  localStorage.clear();
  ["dashboardAccessGranted", "currentPais", "currentEmpresa", "currentCentroCosto", "currentModulo", "currentMenu", "currentCategoria"].forEach((item) => sessionStorage.removeItem(item));

  dispatch(removeCurrentPais());
  dispatch(removeCurrentEmprsa());
  dispatch(removeCurrentCentroCosto());

  dispatch(logout());
};

/**
 * Rehidratación de sesión (bootstrap al cargar la app):
 * - lee token/cod_usuario/version_app desde localStorage
 * - si faltan, no hace nada (se considera no autenticado)
 * - si existen, vuelve a consultar permisos/menús y reconstruye Redux
 * - aplica redirección con `redirectToUserHome` preservando la ruta actual si aplica
 */
export const checkingCurrentToken = () => async (dispatch) => {
  // dispatch(checkingCredentials());

  dispatch(getCurrentPais());
  dispatch(getCurrentEmpresa());
  dispatch(getCurrentCentroCosto());
  dispatch(getCurrentModulo());
  dispatch(getCurrentMenu());
  dispatch(getCurrentCategoria());

  let tr = sessionStorage.getItem("tr");
  if (!tr) {
    sessionStorage.setItem("tr", "0");
    tr = 0;
  }
  const token = localStorage.getItem("token");
  const cod_usuario = localStorage.getItem("cod_usuario");
  const version_app = localStorage.getItem("version_app");
  const dashboardAccessGranted = sessionStorage.getItem("dashboardAccessGranted");

  if (!token || !cod_usuario || !version_app) {
    // localStorage.removeItem("previo");
    return dispatch(handleLogout());
    // return;
  }

  try {
    if (version_app) api.defaults.headers.common.version_app = `${version_app}`;
    if (token) api.defaults.headers.common.authorization = `${token}`;

    if (version_app) api.defaults.headers.version_app = `${version_app}`;
    if (token) api.defaults.headers.authorization = `${token}`;

    const { usuario, empleado, jsonArray, allMenus } = await fetchUserData(cod_usuario);

    dispatch(generatemenuTree(allMenus, jsonArray));

    dispatch(
      login({
        token,
        usuario,
        cod_usuario,
        empleado,
        version: version_app,
        json: JSON.stringify(jsonArray),
        jsonArray,
        allMenus,
        nom_empleado: empleado.nom_empleado,
        apellido_emp: empleado.apellido_emp,
        defaultUrl: jsonArray?.configuracion?.ruta_inicial,
        tr: Number(tr),
        dashboardAccessGranted: dashboardAccessGranted === "true",
      }),
    );

    sessionStorage.setItem("tr", Number(tr) + 1);
    dispatch(redirectToUserHome(Number(tr) === 0, window.location?.pathname));
  } catch (error) {
    // dispatch(handleLogout({ errorMessage: error.message }));
  }
};
