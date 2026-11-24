import { configureStore } from "@reduxjs/toolkit";
import { authSlice } from "./slices/auth/authSlice";
import { screenSlice } from "./slices/screen/screenSlice";
import { menuSlice } from "./slices/menu/menuSlice";
import { notificacionSlice } from "./slices/notificaciones/notificacionSlice";
import { themeSlice } from "./slices/theme/themeSlice";
import { anunciosSlice } from "./slices/anuncios/anunciosSlice";
import centroCostoReducer from "./slices/centroCostos/centroCostoSlice";
import { statusSlice } from "./slices/status/statusSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    screen: screenSlice.reducer,
    menu: menuSlice.reducer,
    notificacion: notificacionSlice.reducer,
    theme: themeSlice.reducer,
    anuncios: anunciosSlice.reducer,
    centroDeCostos: centroCostoReducer,
    status: statusSlice.reducer,
  },
});
