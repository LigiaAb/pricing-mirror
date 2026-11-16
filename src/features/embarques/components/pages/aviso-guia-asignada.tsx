"use client";

import { Check, CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface AvisoGuiaAsignadaProps {
  /** Correlativo de guía asignado; null cuando la coordinación se creó sin guía. */
  readonly guia: string | null;
  readonly onClose: () => void;
}

/**
 * Aviso que se muestra al regresar a la lista CTS después de crear una
 * coordinación (query param `?guia=…` o `?creada=1`).
 */
export function AvisoGuiaAsignada({ guia, onClose }: AvisoGuiaAsignadaProps) {
  const [copiada, setCopiada] = useState(false);

  const handleCopiar = async () => {
    if (!guia) return;
    await navigator.clipboard.writeText(guia);
    setCopiada(true);
  };

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="items-center text-center sm:text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
            <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <AlertDialogTitle className="text-xl">
            {guia ? "Guía asignada con éxito" : "Coordinación creada con éxito"}
          </AlertDialogTitle>
          {guia ? (
            <AlertDialogDescription asChild>
              <div className="mt-1 flex w-full items-center justify-between gap-2 rounded-lg border bg-muted/50 py-2 pl-4 pr-2">
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">Número de guía</p>
                  <p className="text-lg font-semibold tracking-tight text-foreground">{guia}</p>
                </div>
                <Button
                  variant={copiada ? "ghost" : "outline"}
                  size="icon"
                  aria-label="Copiar guía"
                  title="Copiar"
                  onClick={handleCopiar}
                  className={cn(copiada && "text-emerald-600 dark:text-emerald-400")}
                >
                  {copiada ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </AlertDialogDescription>
          ) : (
            <AlertDialogDescription>
              La coordinación se registró correctamente.
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Cerrar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
