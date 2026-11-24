import { createSlice } from "@reduxjs/toolkit";

export const anunciosSlice = createSlice({
  name: "anuncios",
  initialState: {
    anuncios: [],
  },
  reducers: {
    agregarAnuncios: (state, { payload }) => {
      payload.anuncios.forEach((nuevoAnuncio) => {
        const anuncioExistente = state.anuncios.find((a) => a.cod === nuevoAnuncio.cod);
        if (anuncioExistente) {
          // Incrementar contador si ya existe el anuncio y reiniciar tiempo
          anuncioExistente.contador = (anuncioExistente.contador || 1) + 1;
          anuncioExistente.tiempoRestante = 3000; // Reiniciar tiempo
          anuncioExistente.open = true;
        } else {
          // Agregar el nuevo anuncio con contador en 1 y tiempo inicial
          state.anuncios.push({ ...nuevoAnuncio, open: true, contador: 1, tiempoRestante: 3000 });
        }
      });
    },
    quitarAnuncios: (state, { payload }) => {
      state.anuncios = state.anuncios.filter((a) => a.key !== payload.key);
    },
    cerrarAnuncios: (state, { payload }) => {
      state.anuncios = state.anuncios.map((a) => (a.key == payload.key ? { ...a, open: false } : a));
    },
    actualizarAnuncios: (state, { payload }) => {
      state.anuncios = state.anuncios.map((a) => (a.key == payload.anuncio.key ? payload.anuncio : a));
    },
    actualizarTiempos: (state) => {
      state.anuncios = state.anuncios.map((a) => (a.tiempoRestante > 0 ? { ...a, tiempoRestante: a.tiempoRestante - 1000 } : a));
    },
  },
});

export const { agregarAnuncios, quitarAnuncios, cerrarAnuncios, actualizarAnuncios, actualizarTiempos } = anunciosSlice.actions;
