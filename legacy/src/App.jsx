import { ThemeProvider } from "@emotion/react";
import { CssBaseline, GlobalStyles, createTheme } from "@mui/material";
import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Rutas } from "./router/index.routes";
import styles from "./style/styles";
import AnuncioComponent from "./components/AnunciosComponent/AnuncioComponent";
import { agregarAnuncios } from "./store/slices/anuncios/anunciosSlice";
import { setDarkTheme, setLightTheme } from "./store/slices/theme/themeSlice";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./utils/queryUtils";
import MetaHandler from "./components/MetaHandler";

/**
 * Punto de entrada de la app.
 *
 * Responsabilidades:
 * - Inyectar providers globales (React Query, MUI Theme).
 * - Montar el `BrowserRouter` y las rutas (`Rutas`).
 * - Escuchar eventos globales:
 *   - `storage` (cambio de tema entre pestañas)
 *   - `customError` (errores centralizados provenientes de interceptores de API)
 *
 * Nota importante sobre sesión:
 * - Si el token vence, aquí SOLO se muestra el anuncio.
 * - El cierre de sesión por token vencido se ejecuta únicamente al confirmar en el modal
 *   (ver `AnuncioComponent`), para que el usuario “decida” haciendo click.
 */
function App() {
  // expose it to window for TanStack Query DevTools (dev only)
  if (typeof globalThis.window !== "undefined" && typeof globalThis !== "undefined" && globalThis.process?.env?.NODE_ENV !== "production") {
    globalThis.__TANSTACK_QUERY_CLIENT__ = queryClient;
  }

  const { status } = useSelector((state) => state.auth);
  const { fontSize, theme } = useSelector((state) => state.theme);
  const dispatch = useDispatch();

  /**
   * Handler global de errores emitidos por `src/api/api.js`.
   * Se limita a encolar anuncios; NO ejecuta logout automático.
   */
  const handleCustomError = useCallback(
    (ev) => {
      // Importante: si el token vence, NO revalidamos ni hacemos logout automático acá.
      // Solo mostramos el anuncio y la decisión final ocurre en el modal (confirmación).
      dispatch(agregarAnuncios({ anuncios: [{ ...ev.detail, key: new Date().getTime(), open: true }] }));
    },
    [dispatch]
  );

  useEffect(() => {
    /**
     * Sincroniza el tema entre pestañas:
     * cuando otra pestaña actualiza `localStorage.theme`, esta pestaña reacciona.
     */
    const handler = (event) => {
      if (event.key !== "theme") return;

      const nuevoTema = event.newValue;

      if (nuevoTema === "dark") {
        dispatch(setDarkTheme());
      } else {
        dispatch(setLightTheme());
      }
    };

    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener("storage", handler);
    };
  }, [dispatch]);

  useEffect(() => {
    /**
     * Listener global para anuncios centralizados.
     * Estos eventos se disparan típicamente desde los interceptores de Axios.
     */
    window.addEventListener("customError", handleCustomError);
    return () => {
      window.removeEventListener("customError", handleCustomError);
    };
  }, [handleCustomError]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={createTheme(theme)}>
        <AnuncioComponent />
        <CssBaseline enableColorScheme />
        <GlobalStyles styles={styles({ fontSize })} />
        <BrowserRouter>
          <MetaHandler />
          <Rutas status={status} />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
