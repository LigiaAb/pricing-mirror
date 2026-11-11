"use client";

import { FileStack, Loader2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

import type { PlantillaCotizacion } from "../api/plantillas-cotizacion";

type Props = {
  open: boolean;
  plantillas: PlantillaCotizacion[];
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSeleccionar: (plantilla: PlantillaCotizacion) => void;
  onOmitir: () => void;
};

export function PlantillasPosiblesDialog({
  open,
  plantillas,
  isLoading = false,
  onOpenChange,
  onSeleccionar,
  onOmitir,
}: Readonly<Props>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Plantillas disponibles para el cliente</DialogTitle>
          <DialogDescription>
            Seleccione una plantilla para completar la información de la cotización.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Consultando plantillas...
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {plantillas.map((plantilla) => (
              <button
                key={String(plantilla.cod_tarifaplantilla)}
                type="button"
                className="rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onSeleccionar(plantilla)}
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 text-primary">
                    <FileStack className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold">
                      Plantilla {String(plantilla.cod_tarifaplantilla)}
                    </p>
                    <p className="mt-1 wrap-anywhere text-sm text-muted-foreground">
                      {plantilla.descripcion?.trim() || "Sin descripción"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <Button type="button" variant="outline" className="w-full" onClick={onOmitir}>
          Continuar sin plantilla
        </Button>
      </DialogContent>
    </Dialog>
  );
}
