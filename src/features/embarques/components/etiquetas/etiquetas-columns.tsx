"use client";

import { Eye, FileCheck, Loader2 } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { formatearFecha, toIsoDate } from "@/shared/lib/date";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { GenerarEtiquetasPayload, ListaEtiquetasEmbarques } from "../../api/etiquetas-emb";
import { useGenerarEtiquetasPdf } from "../../hooks/use-generar-etiquetas-pdf";

function VerEtiquetaAction({ row }: { readonly row: ListaEtiquetasEmbarques }) {
  const [open, setOpen] = React.useState(false);
  const [inicio, setInicio] = React.useState(1);
  const [final, setFinal] = React.useState(row.ETIQ_BULTOS ?? 1);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);

  const generarPdf = useGenerarEtiquetasPdf();

  const resetForm = React.useCallback(() => {
    setInicio(1);
    setFinal(row.ETIQ_BULTOS ?? 1);
    setPdfUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, [row.ETIQ_BULTOS]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleGenerar = async () => {
    const payload: GenerarEtiquetasPayload = {
      etiq_hawb: row.ETIQ_HAWB ?? "",
      etiq_mawb: row.ETIQ_MAWB ?? "",
      etiq_destino: row.ETIQ_DESTINO ?? "",
      etiq_origen: row.ETIQ_ORIGEN ?? "",
      etiq_bultos: row.ETIQ_BULTOS ?? 0,
      etiq_csgnee: row.ETIQ_CSGNEE ?? "",
      inicio,
      final,
    };
    const blob = await generarPdf.mutateAsync(payload);
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDescargar = () => {
    if (!pdfUrl) return;

    const nombreArchivo = `ETIQUETAS-${row.ETIQ_MAWB || "etiquetas"}_${toIsoDate(new Date())}.pdf`;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button aria-label="Ver etiquetas" title="Ver etiquetas" variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Coordinación MAWB {row.ETIQ_MAWB || ""} / HAWB {row.ETIQ_HAWB || ""}
          </DialogTitle>
          <DialogDescription>
            Indica el rango de bultos a imprimir y genera el PDF de etiquetas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`inicio-${row.ETIQ_HAWB}`}>Inicio</Label>
            <Input
              id={`inicio-${row.ETIQ_HAWB}`}
              type="number"
              min={1}
              value={inicio}
              onChange={(e) => setInicio(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`final-${row.ETIQ_HAWB}`}>Final</Label>
            <Input
              id={`final-${row.ETIQ_HAWB}`}
              type="number"
              min={1}
              value={final}
              onChange={(e) => setFinal(Number(e.target.value))}
            />
          </div>
        </div>

        {pdfUrl && (
          <Alert variant="success">
            <FileCheck className="h-4 w-4" />
            <AlertTitle>Etiquetas generadas</AlertTitle>
            <AlertDescription>
              El PDF se abrió en una pestaña nueva. Si el navegador bloqueó la ventana emergente,
              usa el botón &quot;Ver PDF&quot;.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          {pdfUrl && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(pdfUrl, "_blank", "noopener,noreferrer")}
              >
                Ver PDF
              </Button>

              <Button type="button" variant="outline" onClick={handleDescargar}>
                Descargar
              </Button>
            </>
          )}

          <Button
            type="button"
            onClick={() => void handleGenerar()}
            disabled={generarPdf.isPending}
          >
            {generarPdf.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Generar Etiquetas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function etiquetasColumns(): ColumnDef<ListaEtiquetasEmbarques>[] {
  return [
    { accessorKey: "ETIQ_HAWB", header: "House" },
    { accessorKey: "ETIQ_MAWB", header: "Master" },
    { accessorKey: "EMP_CODIGO", header: "Empresa" },
    { accessorKey: "DEPORG_CODIGO", header: "Centro de Costo" },
    { accessorKey: "ETIQ_CSGNEE", header: "Consignatario" },
    { accessorKey: "ETIQ_ORIGEN", header: "Origen" },
    { accessorKey: "ETIQ_DESTINO", header: "Destino" },
    { accessorKey: "ETIQ_BULTOS", header: "Bultos" },
    {
      accessorKey: "ETIQ_FECHA",
      header: "Fecha",
      cell: ({ row }) => formatearFecha(row.original.ETIQ_FECHA),
    },
    {
      accessorKey: "ETIQ_ETS",
      header: "ETS",
      cell: ({ row }) => formatearFecha(row.original.ETIQ_ETS),
    },
    {
      accessorKey: "acciones",
      header: "Acciones",
      cell: ({ row }) => <VerEtiquetaAction row={row.original} />,
    },
  ];
}
