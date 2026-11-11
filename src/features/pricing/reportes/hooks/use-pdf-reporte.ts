"use client";
import React from "react";
import { generarPdfReporte, type ReportePdf } from "../lib/pdf-reporte";

export function usePdfReporte(
  opciones: {
    onError?: ((mensaje: string | null) => void) | undefined;
    onGenerando?: ((generando: boolean) => void) | undefined;
  } = {},
) {
  const [generando, setGenerando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const ocupado = React.useRef(false);
  const montado = React.useRef(true);

  React.useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  function terminar(mensaje: string | null): void {
    ocupado.current = false;
    if (!montado.current) return;
    setGenerando(false);
    setError(mensaje);
    opciones.onError?.(mensaje);
    opciones.onGenerando?.(false);
  }

  function generar(reporte: ReportePdf): void {
    if (ocupado.current) return;
    ocupado.current = true;
    setGenerando(true);
    setError(null);
    opciones.onError?.(null);
    opciones.onGenerando?.(true);
    const ventana =
      reporte.salida === "visualizar" ? window.open("", "vista-previa-reporte") : null;
    generarPdfReporte(
      reporte,
      (doc) => {
        if (!montado.current) {
          ocupado.current = false;
          ventana?.close();
          return;
        }
        try {
          if (reporte.salida === "visualizar") {
            if (!ventana) throw new Error("El navegador bloqueó la vista previa del PDF.");
            ventana.location.href = URL.createObjectURL(doc.output("blob"));
          } else doc.save(reporte.archivo);
          terminar(null);
        } catch (causa) {
          terminar(causa instanceof Error ? causa.message : "No se pudo guardar el PDF.");
        }
      },
      (causa) => {
        ventana?.close();
        terminar(causa.message);
      },
    );
  }

  return { generar, generando, error };
}
