"use client";

import { type PropsActividad, TarjetaActividad } from "../../shared/components/tarjeta-actividad";
import { gestionDe } from "../../shared/lib/gestion-actividades";
import { GESTION_OPERACIONES } from "../lib/gestion-actividades";
import { SolicitudReserva } from "./solicitud-reserva";

/**
 * Formulario de una actividad de OPS (tarjeta común con las definiciones de
 * `lib/gestion-actividades.ts` de esta carpeta). OPS 2.1 usa su formulario
 * propio (formato de reserva según la aerolínea).
 */
export function ActividadOperaciones(props: PropsActividad) {
  if (props.actividad.id === "OPS 2.1") {
    return (
      <SolicitudReserva {...props} gestion={gestionDe(GESTION_OPERACIONES, props.actividad.id)} />
    );
  }
  return (
    <TarjetaActividad {...props} gestion={gestionDe(GESTION_OPERACIONES, props.actividad.id)} />
  );
}
