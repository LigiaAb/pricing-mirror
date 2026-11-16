"use client";

import { useMutation } from "@tanstack/react-query";
import { useRecuperarArchivo } from "@/features/archivos";
import { type GenerarEtiquetasPayload, generarEtiquetasOracle } from "../api/etiquetas-emb";

const MAX_INTENTOS = 5;
const DELAY_BASE_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Genera el PDF de etiquetas y recupera el archivo con reintentos: el backend
 * lo arma de forma asíncrona, por lo que `recuperar-archivo` puede no tener
 * el PDF listo en el primer intento.
 */
export function useGenerarEtiquetasPdf() {
  const recuperarArchivo = useRecuperarArchivo({ meta: { silent: true } });

  return useMutation({
    mutationFn: async (payload: GenerarEtiquetasPayload) => {
      const { url_documento } = await generarEtiquetasOracle(payload);

      for (let intento = 1; intento <= MAX_INTENTOS; intento++) {
        const blob = await recuperarArchivo.mutateAsync({ ruta_archivo: url_documento });
        if (blob.type.includes("application/pdf")) return blob;
        if (intento < MAX_INTENTOS) await sleep(DELAY_BASE_MS * intento);
      }

      throw new Error("No se pudo recuperar el archivo de etiquetas generado.");
    },
  });
}
