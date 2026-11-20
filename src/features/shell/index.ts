/**
 * Shell — layout protegido, header, sidebar, contexto operativo
 * (país/empresa/centro de costo) y la navegación derivada de la URL.
 */

export { ModuleDashboard } from "./components/module-dashboard";
export { ProtectedShell } from "./components/protected-shell";
export { SentryContextTracker } from "./components/sentry-context-tracker";
export {
  useObtenerAccionesPorNombreOpcionActual,
  useObtenerModulos,
  useObtenerNombresOpcionesCategoriaActual,
} from "./hooks/use-permisos-actuales";
export { usePermisosCategoria } from "./hooks/use-permisos-categoria";
export {
  construirRutaMenu,
  normalizarRutaModulo,
  rutaContienePathname,
} from "./lib/rutas";
export { useContextoOperativoStore } from "./stores/contexto-operativo-store";
export { useUIStore } from "./stores/ui-store";
