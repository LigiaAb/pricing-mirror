"use client";

import { Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import React from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

import type { IdiomaPdfCotizacion } from "../api/cotizacion-detalle";

type Props = {
  open: boolean;
  cargando: boolean;
  error: string | null;
  pdfUrl: string | null;
  idioma: IdiomaPdfCotizacion;
  nombreArchivo: string;
  onOpenChange: (open: boolean) => void;
  onIdiomaChange: (idioma: IdiomaPdfCotizacion) => void | Promise<void>;
  onDescargar: () => void;
};

export function PdfCotizacionDialog({
  open,
  cargando,
  error,
  pdfUrl,
  idioma,
  nombreArchivo,
  onOpenChange,
  onIdiomaChange,
  onDescargar,
}: Props) {
  const abrirPdf = React.useCallback(() => {
    if (!pdfUrl) return;

    const nuevaVentana = window.open(pdfUrl, "_blank", "noopener,noreferrer");

    if (nuevaVentana) {
      nuevaVentana.opener = null;
    }
  }, [pdfUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>PDF de cotización</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={idioma === "es" ? "default" : "outline"}
            disabled={cargando || idioma === "es"}
            onClick={() => void onIdiomaChange("es")}
          >
            Español
          </Button>

          <Button
            type="button"
            variant={idioma === "en" ? "default" : "outline"}
            disabled={cargando || idioma === "en"}
            onClick={() => void onIdiomaChange("en")}
          >
            Inglés
          </Button>

          <span className="ml-auto truncate text-xs text-muted-foreground">{nombreArchivo}</span>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="relative flex min-h-48 items-center justify-center rounded-md border bg-muted/20 p-6">
          {cargando ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-background/80 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Generando PDF...
            </div>
          ) : null}

          {pdfUrl ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <FileText className="size-12 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">El PDF está listo</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ábrelo en una pestaña nueva para visualizarlo o descargarlo.
                </p>
              </div>
              <Button type="button" onClick={abrirPdf}>
                <ExternalLink className="size-4" />
                Abrir PDF
              </Button>
            </div>
          ) : !cargando ? (
            <div className="text-sm text-muted-foreground">
              No hay un PDF disponible para mostrar.
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>

          <Button type="button" disabled={!pdfUrl || cargando} onClick={onDescargar}>
            <Download className="size-4" />
            Descargar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
