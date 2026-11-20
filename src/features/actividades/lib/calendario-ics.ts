import type { Actividad } from "../api/actividades";

function escapar(valor: string): string {
  return valor
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function fechaIcs(fecha: Date): string {
  return fecha
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function plegar(linea: string): string {
  const partes: string[] = [];
  let actual = "";
  let bytes = 0;
  for (const caracter of linea) {
    const longitud = new TextEncoder().encode(caracter).length;
    if (bytes + longitud > 75) {
      partes.push(actual);
      actual = ` ${caracter}`;
      bytes = 1 + longitud;
    } else {
      actual += caracter;
      bytes += longitud;
    }
  }
  if (actual) partes.push(actual);
  return partes.join("\r\n");
}

export interface CalendarioIcs {
  contenido: string;
  omitidas: number;
}

export function generarCalendarioIcs(actividades: Actividad[]): CalendarioIcs {
  const sello = fechaIcs(new Date());
  const eventos = actividades.flatMap((actividad) => {
    const fecha = new Date(actividad.fecha_programada);
    if (Number.isNaN(fecha.getTime())) return [];
    const descripcion = [actividad.descripcion, actividad.nombre_cliente]
      .filter(Boolean)
      .join("\\n");
    return [
      "BEGIN:VEVENT",
      `UID:actividad-${actividad.cod_actividad}@erpweb`,
      `DTSTAMP:${sello}`,
      `DTSTART:${fechaIcs(fecha)}`,
      `SUMMARY:${escapar([actividad.nom_tipo, actividad.asunto].filter(Boolean).join(" - "))}`,
      ...(descripcion ? [`DESCRIPTION:${escapar(descripcion)}`] : []),
      "END:VEVENT",
    ];
  });
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ERP Web//Calendario Actividades//ES",
    "CALSCALE:GREGORIAN",
    ...eventos,
    "END:VCALENDAR",
  ];
  return {
    contenido: `${lineas.map(plegar).join("\r\n")}\r\n`,
    omitidas: actividades.length - eventos.filter((linea) => linea === "BEGIN:VEVENT").length,
  };
}
