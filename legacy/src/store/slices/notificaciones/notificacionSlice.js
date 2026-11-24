import { createSlice } from "@reduxjs/toolkit";
import notificaciones_dummy from "../../../database_dummy/notificaciones";

export const notificacionSlice = createSlice({
  name: "menu",
  initialState: { notificaciones: notificaciones_dummy },
  reducers: {
    setNotificaciones: (state, { payload }) => {
      const { notificaciones } = payload;
      state.notificaciones = notificaciones;
    },
    leerNotificacion: (state, { payload }) => {
      const { id_notificacion } = payload;
      state.notificaciones = state.notificaciones.map((i) => (i.id_notificacion === id_notificacion ? { ...i, leido: true } : i));
    },
  },
});

// Action creators are generated for each case reducer function
export const { notificaciones, setNotificaciones, leerNotificacion } = notificacionSlice.actions;
