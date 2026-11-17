"use client";

import { type PropsActividad, TarjetaActividad } from "../../shared/components/tarjeta-actividad";
import { gestionDe } from "../../shared/lib/gestion-actividades";
import { GESTION_OPERACIONES } from "../lib/gestion-actividades";

/**
 * Formulario de una actividad de OPS (tarjeta común con las definiciones de
 * `lib/gestion-actividades.ts` de esta carpeta).
 */
export function ActividadOperaciones(props: PropsActividad) {
  return (
    <TarjetaActividad {...props} gestion={gestionDe(GESTION_OPERACIONES, props.actividad.id)} />
  );
}
