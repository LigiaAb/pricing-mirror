import { createSlice } from "@reduxjs/toolkit";
import CryptoJS from "crypto-js";

/**
 * Slice de autenticación.
 *
 * Estado:
 * - `status`: `checking` | `authenticated` | `not-authenticated`
 * - Datos básicos del usuario (cod_usuario, usuario, nombre)
 * - `token` y `version` de app
 * - `json`: configuración (se guarda cifrada en localStorage vía `setJSON`)
 * - `jsonArray`/`allMenus`: permisos/menú ya normalizados para el ERP
 * - `defaultUrl`: ruta inicial del usuario (si existe)
 *
 * Notas:
 * - `setJSON/getJSON` cifran/descifran usando `VITE_ENCRIPT_KEY`.
 * - `logout` deja el slice en estado limpio y remueve `token`.
 */

// Función de encriptación/desencriptación reutilizable
const cryptoHandler = (data, action = "encrypt") => {
  if (action === "encrypt") {
    return CryptoJS.AES.encrypt(JSON.stringify(data), import.meta.env.VITE_ENCRIPT_KEY).toString();
  }

  const bytes = CryptoJS.AES.decrypt(data, import.meta.env.VITE_ENCRIPT_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

const initialState = {
  status: "checking", // 'checking', 'authenticated', 'not-authenticated'
  cod_usuario: null,
  usuario: null,
  nombre: null,
  token: null,
  empleado: null,
  version: 0,
  json: null,
  jsonArray: null,
  errorMessage: null,
  configuracion: null,
  defaultUrl: null,
  allMenus: null,
  dashboardAccessGranted: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Marca sesión como autenticada y guarda el payload normalizado.
     * `defaultUrl` puede venir explícito o desde `usuario.ruta_inicial`.
     */
    login: (state, { payload }) => {
      const { allMenus, token, usuario, empleado, version, json, jsonArray, nom_empleado, apellido_emp, defaultUrl } = payload;
      const parsedJson = typeof json === "string" ? JSON.parse(json) : json;

      return {
        ...state,
        status: "authenticated",
        token,
        cod_usuario: usuario.cod_usuario,
        usuario: usuario.usuario,
        nombre: `${nom_empleado} ${apellido_emp}`,
        empleado,
        version,
        json: parsedJson,
        jsonArray,
        errorMessage: null,
        configuracion: parsedJson?.configuracion || null,
        defaultUrl: defaultUrl ?? usuario?.ruta_inicial ?? null,
        allMenus: allMenus,
        dashboardAccessGranted: payload.dashboardAccessGranted || false,
      };
    },
    setJSON: (state, { payload }) => {
      const encrypted = cryptoHandler(payload);
      localStorage.setItem("json", encrypted);
      return { ...state, json: payload };
    },
    /**
     * Carga `json` desde localStorage (si existe) y lo descifra.
     */
    getJSON: (state) => {
      const encrypted = localStorage.getItem("json");
      if (!encrypted) return state;

      return {
        ...state,
        json: cryptoHandler(encrypted, "decrypt"),
      };
    },
    setDashboardAccessGranted: (state, { payload }) => {
      sessionStorage.setItem("dashboardAccessGranted", payload);
      return {
        ...state,
        dashboardAccessGranted: payload,
      };
    },
    /**
     * Limpia el estado de auth y remueve token persistido.
     */
    logout: () => {
      localStorage.removeItem("token");
      return { ...initialState, status: "not-authenticated" };
    },
    /**
     * Estado transitorio: útil para UI, pero se intenta usar lo mínimo posible.
     */
    checkingCredentials: (state) => ({
      ...state,
      status: "checking",
      cod_usuario: null,
      usuario: null,
    }),
  },
});

export const { setJSON, getJSON, login, logout, checkingCredentials, setDashboardAccessGranted } = authSlice.actions;
