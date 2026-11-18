const ESTILOS = `
:root { color-scheme: light dark; --fondo: #f8fafc; --texto: #0f172a; --tenue: #64748b; --pista: #e2e8f0; --acento: #2563eb; --error: #dc2626; }
@media (prefers-color-scheme: dark) {
  :root { --fondo: #0f172a; --texto: #f1f5f9; --tenue: #94a3b8; --pista: #334155; --acento: #60a5fa; --error: #f87171; }
}
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; background: var(--fondo); color: var(--texto); font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.contenedor { display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; max-width: 360px; }
.spinner { width: 40px; height: 40px; border-radius: 50%; border: 4px solid var(--pista); border-top-color: var(--acento); animation: girar 0.8s linear infinite; }
.mensaje { margin: 0; font-size: 16px; font-weight: 500; }
.detalle { margin: 0; font-size: 14px; color: var(--tenue); }
.error .mensaje { color: var(--error); }
@keyframes girar { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spinner { animation-duration: 2.4s; } }
`;

function pintar(
  ventana: Window,
  {
    titulo,
    mensaje,
    detalle,
    error,
  }: { titulo: string; mensaje: string; detalle: string; error: boolean },
) {
  const doc = ventana.document;
  doc.title = titulo;

  if (!doc.getElementById("ventana-de-carga-estilos")) {
    const estilos = doc.createElement("style");
    estilos.id = "ventana-de-carga-estilos";
    estilos.textContent = ESTILOS;
    doc.head.append(estilos);
  }

  const contenedor = doc.createElement("main");
  contenedor.className = error ? "contenedor error" : "contenedor";
  contenedor.setAttribute("role", error ? "alert" : "status");
  contenedor.setAttribute("aria-live", "polite");

  if (!error) {
    const spinner = doc.createElement("div");
    spinner.className = "spinner";
    spinner.setAttribute("aria-hidden", "true");
    contenedor.append(spinner);
  }

  const parrafoMensaje = doc.createElement("p");
  parrafoMensaje.className = "mensaje";
  parrafoMensaje.textContent = mensaje;
  const parrafoDetalle = doc.createElement("p");
  parrafoDetalle.className = "detalle";
  parrafoDetalle.textContent = detalle;
  contenedor.append(parrafoMensaje, parrafoDetalle);

  doc.body.replaceChildren(contenedor);
}

/**
 * Abre una pestaña nueva durante el gesto del usuario (para que el navegador no
 * la bloquee como pop-up) y muestra un indicador de carga mientras se genera el
 * documento. Luego se le asigna el PDF con `location.href` o
 * `abrirPdfDesdeBase64EnVentana`.
 */
export function abrirVentanaDeCarga(mensaje = "Generando documento…"): Window | null {
  const ventana = window.open("about:blank", "_blank");
  if (ventana) {
    pintar(ventana, {
      titulo: mensaje,
      mensaje,
      detalle: "El documento se mostrará aquí en unos segundos.",
      error: false,
    });
  }
  return ventana;
}

/**
 * Sustituye el indicador de carga por un mensaje de error, para que el usuario
 * no se quede frente a una pestaña que desaparece sin explicación.
 */
export function mostrarErrorEnVentana(
  ventana: Window | null,
  mensaje = "No se pudo generar el documento.",
): void {
  if (!ventana || ventana.closed) return;
  pintar(ventana, {
    titulo: "Error al generar el documento",
    mensaje,
    detalle: "Puedes cerrar esta pestaña y volver a intentarlo.",
    error: true,
  });
}
