import { createSlice } from "@reduxjs/toolkit";

const regex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i;

export const screenSlice = createSlice({
  name: "screen",
  initialState: {
    movil: regex.test(navigator.userAgent),
    name: "xs",
    width: window.innerWidth,
    height: window.innerHeight,
    breakpoints: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  reducers: {
    setWindowSize(state, { payload }) {
      state.width = payload.width;
      state.breakpoints = payload.breakpoints;
      state.name = payload.name;

      // state = { ...payload, name };
    },
    setMovil(state, { payload }) {
      state.movil = payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setWindowSize, setMovil } = screenSlice.actions;
