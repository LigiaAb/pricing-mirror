import type { Actividad } from "../../api/actividades";
import { TablaActividadesDia } from "./tabla-actividades-dia";

export function AgendaDia({
  fecha,
  actividades,
  puedeVerDetalle,
  puedeVerCxcFacturas,
}: Readonly<{
  fecha: Date;
  actividades: Actividad[];
  puedeVerDetalle: boolean;
  puedeVerCxcFacturas: boolean;
}>) {
  return (
    <TablaActividadesDia
      actividades={actividades}
      fecha={fecha}
      puedeVerDetalle={puedeVerDetalle}
      puedeVerCxcFacturas={puedeVerCxcFacturas}
    />
  );
}
