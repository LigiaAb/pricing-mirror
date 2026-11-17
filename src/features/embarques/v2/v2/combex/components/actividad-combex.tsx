"use client";

import { type PropsActividad, TarjetaActividad } from "../../shared/components/tarjeta-actividad";
import { gestionDe } from "../../shared/lib/gestion-actividades";
import { GESTION_COMBEX } from "../lib/gestion-actividades";

/**
 * Formulario de una actividad de CBX (tarjeta común con las definiciones de
 * `lib/gestion-actividades.ts` de esta carpeta).
 */
export function ActividadCombex(props: PropsActividad) {
  return <TarjetaActividad {...props} gestion={gestionDe(GESTION_COMBEX, props.actividad.id)} />;
}
