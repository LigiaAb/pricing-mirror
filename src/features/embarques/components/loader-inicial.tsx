"use client";

/**
 * Overlay de carga inicial de página completa sobre TODA la carga inicial
 * (incluidas las cascadas de catálogos de los hijos): el formulario se monta
 * detrás del overlay para que sus queries cuenten en `useIsFetching`, y el
 * ref solo se voltea tras sostenerse el silencio (debounce) — ver legacy
 * public/page.jsx.
 *
 * Vive en su propio componente (antes era el hook `useLoaderInicial`) para
 * que la suscripción a `useIsFetching()` — se dispara con CUALQUIER query de
 * la app, no solo las de esta página — no re-renderice el árbol completo de
 * la página anfitriona; solo este overlay se re-renderiza.
 */

import { useIsFetching } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Loader } from "@/shared/components/ui/loader";

interface LoaderInicialProps {
  /** Señal de carga propia de la página, independiente del contador global. */
  readonly cargandoBase: boolean;
}

export function LoaderInicial({ cargandoBase }: LoaderInicialProps) {
  const fetchingCount = useIsFetching();
  const initialLoadRef = useRef(true);
  const isPageLoading = cargandoBase || (initialLoadRef.current && fetchingCount > 0);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (isPageLoading) {
      setShowLoader(true);
      return;
    }
    const timer = setTimeout(() => {
      initialLoadRef.current = false;
      setShowLoader(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isPageLoading]);

  if (!showLoader) return null;

  return (
    <Loader texto="CARGANDO INFORMACIÓN" className="fixed inset-0 z-50 min-h-0 bg-background/95" />
  );
}
