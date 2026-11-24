import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setWindowSize, setMovil } from "../store/slices/screen/screenSlice";
import { useTheme } from "@emotion/react";

export const useWindowSize = () => {
  const theme = useTheme();
  const dispatch = useDispatch();

  // Obtener el tamaño de la ventana desde Redux
  const { windowSize, movil } = useSelector((state) => state.screen);

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const breakpoints = theme.breakpoints?.values;

      let name = "";
      if (width >= breakpoints.xl) name = "xl";
      else if (width >= breakpoints.lg) name = "lg";
      else if (width >= breakpoints.md) name = "md";
      else if (width >= breakpoints.sm) name = "sm";
      else name = "xs";

      // Despachar la acción para actualizar el tamaño de la ventana en el estado global
      dispatch(setWindowSize({ name, width, height, breakpoints }));
    }

    // Agregar event listener
    window.addEventListener("resize", handleResize);

    // Llamar a handleResize inmediatamente para inicializar con el tamaño actual
    handleResize();

    // Limpiar el event listener cuando el componente se desmonte
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    function detectarUserAgent() {
      const ua = navigator.userAgent;

      const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Windows Phone|Opera Mini/i.test(ua);

      dispatch(setMovil(esMovil));
    }

    // Detecta al iniciar
    detectarUserAgent();

    // Si quieres volver a evaluarlo cuando el usuario rote o cambie tamaño
    window.addEventListener("resize", detectarUserAgent);
    // Si quieres volver a evaluarlo cuando regresen a la pestaña
    window.addEventListener("focus", detectarUserAgent);

    return () => {
      window.removeEventListener("resize", detectarUserAgent);
      window.removeEventListener("focus", detectarUserAgent);
    };
  }, [dispatch]);

  // Retornar el tamaño de la ventana desde Redux
  return windowSize;
};

export default useWindowSize;
