"use client";

import { type PropsActividad, TarjetaActividad } from "../../shared/components/tarjeta-actividad";
import { gestionDe } from "../../shared/lib/gestion-actividades";
import { GESTION_OPERACIONES } from "../lib/gestion-actividades";
import { AsignacionGuias } from "./asignacion-guias";
import { SolicitudReserva } from "./solicitud-reserva";

/**
 * Formulario de una actividad de OPS (tarjeta común con las definiciones de
 * `lib/gestion-actividades.ts` de esta carpeta). OPS 2.1 usa su formulario
 * propio (formato de reserva según la aerolínea); OPS 1.1 y 1.2, el de guías
 * (según el servicio).
 */
export function ActividadOperaciones(props: PropsActividad) {
  if (props.actividad.id === "OPS 1.1" || props.actividad.id === "OPS 1.2") {
    return (
      <AsignacionGuias {...props} gestion={gestionDe(GESTION_OPERACIONES, props.actividad.id)} />
    );
  }
  if (props.actividad.id === "OPS 2.1") {
    return (
      <SolicitudReserva {...props} gestion={gestionDe(GESTION_OPERACIONES, props.actividad.id)} />
    );
  }
  return (
    <TarjetaActividad {...props} gestion={gestionDe(GESTION_OPERACIONES, props.actividad.id)} />
  );
}
