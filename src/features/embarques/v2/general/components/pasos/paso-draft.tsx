"use client";

import { FileText, Send } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { EncabezadoPaso, Pendiente } from "../utils";

export function PasoDraft() {
  return (
    <div className="space-y-4">
      <EncabezadoPaso
        titulo="Draft"
        descripcion="Elaboración del draft y envío para revisión."
        acciones={
          <>
            <Button type="button" size="sm" variant="outline" disabled>
              <FileText className="size-4" aria-hidden="true" />
              Generar draft
            </Button>
            <Button type="button" size="sm" disabled>
              <Send className="size-4" aria-hidden="true" />
              Enviar draft
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Pendiente className="min-h-72 lg:col-span-2" texto="Vista previa del draft." />
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <span className="text-sm font-semibold">Envíos</span>
          <Pendiente className="flex-1" texto="Versiones enviadas, destinatarios y respuestas." />
        </div>
      </div>
    </div>
  );
}
