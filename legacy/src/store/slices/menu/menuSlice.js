import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";

import { createSlice } from "@reduxjs/toolkit";

// Encriptar datos
const encryptData = (data) => {
  const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), import.meta.env.VITE_ENCRIPT_KEY).toString();
  return ciphertext;
};

// Desencriptar datos
const decryptData = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, import.meta.env.VITE_ENCRIPT_KEY);
  return bytes.toString(CryptoJS.enc.Utf8); // JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

export const menuSlice = createSlice({
  name: "menu",
  initialState: {
    catalogo_menus: [],
    menus: [],
    menusObj: [],
    currentPais: null,
    currentEmpresa: null,
    currentCentroCosto: null,
    currentMenu: null,
    currentModulo: null,
    currentCategoria: null,
    currentUrl: sessionStorage.getItem("ruta") || "/",
  },
  reducers: {
    setCurrentUrl: (state, { payload }) => {
      state.currentUrl = payload;
    },
    setMenus: (state, { payload }) => {
      state.menus = payload.menus;
      state.menusObj = payload.menusJSON;
    },
    setCatalogoMenus: (state, { payload }) => {
      state.catalogo_menus = payload.menus;
    },
    setCurrentPais: (state, { payload }) => {
      state.currentPais = payload;
      const encrypt = encryptData(payload);
      sessionStorage.setItem("currentPais", encrypt);
    },
    setCurrentEmpresa: (state, { payload }) => {
      state.currentEmpresa = payload;
      const encrypt = encryptData(payload);
      sessionStorage.setItem("currentEmpresa", encrypt);
    },
    setCurrentCentroCosto: (state, { payload }) => {
      state.currentCentroCosto = payload;
      const encrypt = encryptData(payload);
      sessionStorage.setItem("currentCentroCosto", encrypt);
    },
    setCurrentMenu: (state, { payload }) => {
      const { menu } = payload;
      const encrypt = encryptData(menu);
      sessionStorage.setItem("currentMenu", encrypt);
      state.currentMenu = menu;
    },
    setCurrentModulo: (state, { payload }) => {
      const { modulo } = payload;
      const encrypt = encryptData(modulo);
      sessionStorage.setItem("currentModulo", encrypt);
      state.currentModulo = modulo;
    },
    setCurrentCategoria: (state, { payload }) => {
      const { categoria } = payload;
      const encrypt = encryptData(categoria);
      sessionStorage.setItem("currentCategoria", encrypt);
      state.currentCategoria = categoria;
    },
    removeCurrentPais: (state) => {
      state.currentPais = null;
      sessionStorage.removeItem("currentPais");
    },
    removeCurrentEmprsa: (state) => {
      state.currentEmpresa = null;
      sessionStorage.removeItem("currentEmpresa");
    },
    removeCurrentCentroCosto: (state) => {
      state.currentCentroCosto = null;
      sessionStorage.removeItem("currentCentroCosto");
    },
    removeCurrentModulo: (state) => {
      state.currentModulo = null;
      sessionStorage.removeItem("currentModulo");
    },
    removeCurrentMenu: (state) => {
      state.currentMenu = null;
      sessionStorage.removeItem("currentMenu");
    },
    removeCurrentCategoria: (state) => {
      state.currentCategoria = null;
      sessionStorage.removeItem("currentCategoria");
    },
    getCurrentPais: (state, { payload }) => {
      let encrypted = sessionStorage.getItem("currentPais");
      if (encrypted) {
        let decrypt = decryptData(encrypted);
        let currentPais = typeof decrypt === "string" ? JSON.parse(decrypt) : decrypt;
        state.currentPais = currentPais;
      }
    },
    getCurrentEmpresa: (state, { payload }) => {
      let encrypted = sessionStorage.getItem("currentEmpresa");
      if (encrypted) {
        let decrypt = decryptData(encrypted);
        let currentEmpresa = typeof decrypt === "string" ? JSON.parse(decrypt) : decrypt;
        state.currentEmpresa = currentEmpresa;
      }
    },
    getCurrentCentroCosto: (state, { payload }) => {
      let encrypted = sessionStorage.getItem("currentCentroCosto");
      if (encrypted) {
        let decrypt = decryptData(encrypted);
        let currentCentroCosto = typeof decrypt === "string" ? JSON.parse(decrypt) : decrypt;
        state.currentCentroCosto = currentCentroCosto;
      }
    },
    getCurrentMenu: (state, { payload }) => {
      let encrypted = sessionStorage.getItem("currentMenu");

      if (encrypted) {
        let decrypt = decryptData(encrypted);
        if (decrypt !== "") {
          let menu = JSON.parse(decrypt);
          state.currentMenu = menu;
        }
      } else state.currentMenu = null;
    },
    getCurrentModulo: (state, { payload }) => {
      let encrypted = sessionStorage.getItem("currentModulo");

      if (encrypted) {
        let decrypt = decryptData(encrypted);
        if (decrypt !== "") {
          let modulos = JSON.parse(decrypt);
          state.currentModulo = modulos;
        }
      } else state.currentModulo = null;
    },
    getCurrentCategoria: (state, { payload }) => {
      let encrypted = sessionStorage.getItem("currentCategoria");
      if (encrypted) {
        let decrypt = decryptData(encrypted);
        if (decrypt !== "") {
          let categoria = JSON.parse(decrypt);
          state.currentCategoria = categoria;
        }
      } else state.currentCategoria = null;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  setMenus,
  setCurrentMenu,
  setCurrentModulo,
  setCurrentCategoria,
  setCurrentPais,
  setCurrentEmpresa,
  setCurrentCentroCosto,
  setCurrentUrl,
  setCatalogoMenus,
  getCurrentMenu,
  getCurrentModulo,
  getCurrentCategoria,
  getCurrentPais,
  getCurrentEmpresa,
  getCurrentCentroCosto,
  removeCurrentModulo,
  removeCurrentMenu,
  removeCurrentCategoria,
  removeCurrentPais,
  removeCurrentEmprsa,
  removeCurrentCentroCosto,
} = menuSlice.actions;
