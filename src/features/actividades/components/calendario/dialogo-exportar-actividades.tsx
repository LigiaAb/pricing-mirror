"use client";

import { format, startOfMonth } from "date-fns";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import type { Actividad } from "../../api/actividades";
import { generarCalendarioIcs } from "../../lib/calendario-ics";

function descargar(nombre: string, contenido: string) {
  const blob = new Blob([contenido], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

export function DialogoExportarActividades({
  abierta,
  fecha,
  onAbiertaChange,
  obtenerActividades,
}: Readonly<{
  abierta: boolean;
  fecha: Date;
  onAbiertaChange: (abierta: boolean) => void;
  obtenerActividades: (inicio: string, fin: string) => Promise<Actividad[]>;
}>) {
  const inicioDefault = format(startOfMonth(fecha), "yyyy-MM-dd");
  const finDefault = format(fecha, "yyyy-MM-dd");
  const [inicio, setInicio] = useState(inicioDefault);
  const [fin, setFin] = useState(finDefault);
  const [estado, setEstado] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const exportar = async () => {
    if (!inicio || !fin || inicio > fin) {
      setEstado("Seleccione un rango de fechas válido.");
      return;
    }
    setExportando(true);
    setEstado(null);
    try {
      const actividades = await obtenerActividades(inicio, fin);
      if (!actividades.length) {
        setEstado("No hay actividades en el rango y filtros seleccionados.");
        return;
      }
      const resultado = generarCalendarioIcs(actividades);
      if (!resultado.contenido.includes("BEGIN:VEVENT")) {
        setEstado("No hay actividades con fecha programada para exportar.");
        return;
      }
      descargar(`Actividades - ${inicio} - ${fin}.ics`, resultado.contenido);
      setEstado(
        resultado.omitidas
          ? `Se exportaron actividades; ${resultado.omitidas} sin fecha fueron omitidas.`
          : "Actividades exportadas.",
      );
    } finally {
      setExportando(false);
    }
  };

  return (
    <Dialog open={abierta} onOpenChange={onAbiertaChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar Actividades</DialogTitle>
          <DialogDescription>
            Descarga las actividades filtradas en formato iCalendar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm" htmlFor="exportar-actividades-inicio">
            Fecha inicio
            <Input
              id="exportar-actividades-inicio"
              onChange={(e) => setInicio(e.target.value)}
              type="date"
              value={inicio}
            />
          </label>
          <label className="space-y-1 text-sm" htmlFor="exportar-actividades-fin">
            Fecha fin
            <Input
              id="exportar-actividades-fin"
              onChange={(e) => setFin(e.target.value)}
              type="date"
              value={fin}
            />
          </label>
        </div>
        {estado && (
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {estado}
          </p>
        )}
        <DialogFooter>
          <Button disabled={exportando} onClick={exportar} type="button">
            {exportando ? "Exportando..." : "Exportar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
