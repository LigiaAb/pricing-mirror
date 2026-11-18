import { descargarArchivo } from "@/shared/lib/archivos/descargar-archivo";

function base64ToBlob(base64: string, type = "application/pdf"): Blob {
  const binStr = atob(base64);
  const len = binStr.length;
  const arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i);
  }
  return new Blob([arr], { type });
}

function limpiarBase64(base64pdf: string): string {
  return (base64pdf.split(",")[1] || base64pdf).replace(/\s/g, "");
}

function crearBlobPdf(base64pdf: string): Blob {
  return base64ToBlob(limpiarBase64(base64pdf));
}

/**
 * Descarga el PDF (base64 del back, con o sin prefijo data:) con el nombre indicado.
 * Se agrega la extensión `.pdf` si no la trae.
 */
export function descargarPdfDesdeBase64(base64pdf: string, nombreArchivo: string): void {
  const nombre = /\.pdf$/i.test(nombreArchivo) ? nombreArchivo : `${nombreArchivo}.pdf`;
  descargarArchivo(crearBlobPdf(base64pdf), nombre);
}

/**
 * Abre el PDF en una pestaña nueva a partir de un base64pdf del back
 * (con o sin el prefijo data:application/pdf;filename=...;base64,).
 */
export function abrirPdfDesdeBase64(base64pdf: string) {
  const blob = crearBlobPdf(base64pdf);
  const url = URL.createObjectURL(blob);

  const win = window.open(url, "_blank");
  if (!win) {
    window.location.assign(url);
  }

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10_000);
}

/**
 * Muestra en una pestaña nueva un PDF devuelto como base64, reutilizando una
 * ventana ya abierta (p. ej. abierta durante el gesto del usuario para evitar
 * el bloqueo de pop-ups) si se provee.
 */
export function abrirPdfDesdeBase64EnVentana(
  base64pdf: string,
  ventanaPrevisualizacion?: Window | null,
): void {
  const blob = crearBlobPdf(base64pdf);
  const url = URL.createObjectURL(blob);

  const ventana = ventanaPrevisualizacion ?? window.open(url, "_blank");
  if (ventana) {
    ventana.location.href = url;
  } else {
    window.location.assign(url);
  }

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10_000);
}
