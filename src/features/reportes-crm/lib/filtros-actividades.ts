import type { Estado, Tipo } from "@/features/catalogos";

/** Opciones que el reporte de visitas exponía en el legacy. */
const TIPOS_ACTIVIDAD_REPORTE = new Set([
  "CORREO",
  "LLAMADA",
  "VISITA",
  "SEGUIMIENTO COTIZACION",
  "SEGUIMIENTO CTS",
]);

export function estadosReporteActividad(estados: Estado[]): Estado[] {
  return estados.filter((estado) => estado.nom_tipo === "ACTIVIDAD");
}

export function tiposReporteActividad(tipos: Tipo[]): Tipo[] {
  return tipos.filter((tipo) => TIPOS_ACTIVIDAD_REPORTE.has(tipo.nomTipo));
}
