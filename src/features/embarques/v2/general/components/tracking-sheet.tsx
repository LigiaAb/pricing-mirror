"use client";

import { Route } from "lucide-react";
import type * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import type { EmbarqueMaqueta } from "../lib/tipos";
import { Pendiente } from "./utils";

/**
 * Sheet lateral con el tracking interactivo (mismo estilo que el filtro de
 * Cotizaciones). El contenido llega por `children`: ahí va el componente de
 * tracking interactivo existente. Sin `children` muestra un aviso de maqueta.
 */
export function TrackingSheet({
  open,
  onOpenChange,
  embarque,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embarque: EmbarqueMaqueta | null;
  children?: React.ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-l bg-card p-0 sm:max-w-2xl"
      >
        <SheetHeader className="border-b bg-muted/40 px-4 py-5 pr-12 sm:px-6 sm:py-6 sm:pr-14">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Route className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <SheetTitle>Tracking</SheetTitle>
              <SheetDescription>
                {embarque ? `File #${embarque.codFile} · ${embarque.cliente}` : "Sin embarque"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
          {children ?? <Pendiente texto="Aquí va el componente de tracking interactivo existente." />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
