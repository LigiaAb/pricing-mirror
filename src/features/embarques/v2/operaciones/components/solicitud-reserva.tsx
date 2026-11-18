"use client";

import * as React from "react";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { type PropsActividad, TarjetaActividad } from "../../shared/components/tarjeta-actividad";
import type { GestionActividad } from "../../shared/lib/gestion-actividades";
import { FORMATOS_RESERVA } from "../lib/formatos-reserva";

/** Valor del Select para el formulario general (sin formato de aerolínea). */
const GENERAL = "general";

/**
 * OPS 2.1 "Preparar solicitud de reserva": se elige el formato de la
 * aerolínea (`lib/formatos-reserva.ts`) y la tarjeta muestra sus campos.
 * "General" = campos de OPS 2.1 en `lib/gestion-actividades.ts`.
 * Cuando se conecte el catálogo, el formato saldrá de la aerolínea elegida
 * (búsqueda por nombre, `proveedor`).
 */
export function SolicitudReserva({
  gestion,
  ...props
}: PropsActividad & { gestion: GestionActividad }) {
  const [formato, setFormato] = React.useState(GENERAL);
  const elegido = FORMATOS_RESERVA.find((item) => item.nombre === formato);
  const id = `${props.actividad.id.replace(/\s+/g, "-").toLowerCase()}-formato`;

  return (
    <TarjetaActividad
      {...props}
      gestion={
        elegido
          ? {
              ...gestion,
              campos: elegido.campos,
              pendiente: `Documento de ${elegido.nombre}: ${elegido.documento}. Falta definir el formato del archivo (Excel, PDF, Word…).`,
            }
          : gestion
      }
      antesDeCampos={
        <Field className="max-w-sm">
          <FieldLabel htmlFor={id}>Formato de reserva (aerolínea)</FieldLabel>
          <Select value={formato} onValueChange={setFormato}>
            <SelectTrigger id={id} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GENERAL}>General</SelectItem>
              {FORMATOS_RESERVA.map((item) => (
                <SelectItem key={item.nombre} value={item.nombre}>
                  {item.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      }
    />
  );
}
