import { Upload } from "lucide-react";
import React from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useCatalogosCotizacion } from "../hooks/use-catalogos-cotizacion";
import type { ReasonCodeSpot } from "../lib/tipos";

export type { ReasonCodeSpot };

type Props = {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  archivo: File | null;

  descripcion: string;

  reasonCode: ReasonCodeSpot | null;

  guardando?: boolean;

  onArchivoChange: (archivo: File | null) => void;

  onDescripcionChange: (descripcion: string) => void;

  onReasonCodeChange: (reason: ReasonCodeSpot | null) => void;

  onGuardar: () => void | Promise<void>;
};

export function SpotDocumentoDialog({
  open,
  onOpenChange,

  archivo,
  descripcion,
  reasonCode,

  guardando = false,

  onArchivoChange,
  onDescripcionChange,
  onReasonCodeChange,

  onGuardar,
}: Props) {
  const { reasonCodesSpot: reasonCodes } = useCatalogosCotizacion().calculo;

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      onOpenChange(next);

      /*
       * El diálogo viejo limpiaba
       * los tres campos al cerrar.
       */
      if (!next) {
        onArchivoChange(null);

        onDescripcionChange("");

        onReasonCodeChange(null);
      }
    },
    [onOpenChange, onArchivoChange, onDescripcionChange, onReasonCodeChange],
  );

  const puedeGuardar = Boolean(archivo && reasonCode && descripcion);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Solicitar archivo SPOT</DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* =========================
              ARCHIVO + REASON
          ========================== */}

          <div className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="archivo-spot" className="text-sm font-medium">
                Archivo de justificación
                <span className="text-destructive"> *</span>
              </label>

              <input
                id="archivo-spot"
                type="file"
                accept="application/pdf,.pdf"
                disabled={guardando}
                className="file:bg-primary file:text-primary-foreground border-input bg-background w-full rounded-md border text-sm file:mr-3 file:border-0 file:px-3 file:py-2"
                onChange={(event) => {
                  onArchivoChange(event.target.files?.[0] ?? null);
                }}
              />

              {archivo ? (
                <p className="truncate text-xs text-muted-foreground">{archivo.name}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="reason-code-spot" className="text-sm font-medium">
                Reason code
                <span className="text-destructive"> *</span>
              </label>

              <select
                id="reason-code-spot"
                disabled={guardando}
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                value={reasonCode?.value ?? ""}
                onChange={(event) => {
                  const selected =
                    reasonCodes.find((item) => String(item.value) === event.target.value) ?? null;

                  onReasonCodeChange(selected);
                }}
              >
                <option value="">Seleccione</option>

                {reasonCodes.map((item) => (
                  <option key={String(item.value)} value={String(item.value)}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* =========================
              DESCRIPCIÓN
          ========================== */}

          <div className="space-y-1">
            <label htmlFor="descripcion-spot" className="text-sm font-medium">
              Descripción
              <span className="text-destructive"> *</span>
            </label>

            <textarea
              id="descripcion-spot"
              rows={7}
              disabled={guardando}
              value={descripcion}
              className="border-input bg-background min-h-32 w-full resize-y rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(event) => onDescripcionChange(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={guardando}
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            disabled={!puedeGuardar || guardando}
            onClick={() => void onGuardar()}
          >
            <Upload className="size-4" />

            {guardando ? "Guardando..." : "Guardar versión con este archivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
