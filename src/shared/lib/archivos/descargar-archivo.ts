/** Descarga un blob como archivo mediante un ancla efímera con `download`: el
 * nombre debería traer extensión para que el navegador lo guarde bien. */
export function descargarArchivo(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const ancla = document.createElement("a");
  ancla.href = url;
  ancla.download = nombreArchivo;
  ancla.style.display = "none";
  document.body.append(ancla);
  ancla.click();
  ancla.remove();
  // Se pospone el revoke: Safari cancela la descarga si se libera de inmediato.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
