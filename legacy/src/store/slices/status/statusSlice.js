import { createSlice } from "@reduxjs/toolkit";

export const statusSlice = createSlice({
  name: "status",
  initialState: {
    cargando: false,
    mensaje: "",
  },
  reducers: {
    encenderCarga: (state, { payload }) => {
      state.mensaje = payload || "Cargando...";
      state.cargando = true;
    },
    apagarCarga: (state, { payload }) => {
      state.mensaje = payload || "";
      state.cargando = false;
    },
  },
});

export const { encenderCarga, apagarCarga, status } = statusSlice.actions;
