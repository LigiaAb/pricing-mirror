"use client";

import { type PropsActividad, TarjetaActividad } from "../../shared/components/tarjeta-actividad";
import { gestionDe } from "../../shared/lib/gestion-actividades";
import { GESTION_BODEGAS } from "../lib/gestion-actividades";

/**
 * Formulario de una actividad de Bodega (tarjeta común con las definiciones de
 * `lib/gestion-actividades.ts` de esta carpeta).
 */
export function ActividadBodegas(props: PropsActividad) {
  return <TarjetaActividad {...props} gestion={gestionDe(GESTION_BODEGAS, props.actividad.id)} />;
}
