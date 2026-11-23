export { type Actividad, actividades, aPayloadActividad } from "./api/actividades";
export {
  type FiltrosActividadesPersonales,
  useActividadesEnCurso,
  useActividadesVencidas,
} from "./api/actividades-personales";
export {
  type HistorialActividad,
  historialActividadSchema,
  useHistorialActividades,
} from "./api/historial-actividades";
export { ActividadDetalle } from "./components/detalle/actividad-detalle";
export { ActividadForm } from "./components/formulario/actividad-form";
export { ActividadesTabsClient } from "./components/lista/actividades-tabs-client";
export { colorActividad } from "./lib/actividad-colores";
export { iconoActividad } from "./lib/actividad-iconos";
export {
  estadoInicialActividad,
  fechaActividadValida,
  resultadoCierraCotizacion,
} from "./lib/actividad-reglas";
export { componerActividadVista } from "./lib/actividad-vista";
export {
  filtrarActividadesCalendario,
  filtrosCalendarioDesdeUrl,
  filtrosCalendarioUrl,
} from "./lib/calendario-filtros";
export { generarCalendarioIcs } from "./lib/calendario-ics";
