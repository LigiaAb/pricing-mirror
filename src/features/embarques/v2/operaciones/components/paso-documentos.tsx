"use client";

import { Upload } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { EncabezadoPaso, Pendiente } from "../../shared/components/utils";

/**
 * Subida de documentos. No depende del paso del embarque: se puede usar en
 * cualquier momento (tab siempre habilitada y botón "Documentos" del resumen).
 */
export function PasoDocumentos() {
  return (
    <div className="space-y-4">
      <EncabezadoPaso
        titulo="Documentos"
        descripcion="Disponible en cualquier paso del embarque."
        acciones={
          <Button type="button" size="sm" disabled>
            <Upload className="size-4" aria-hidden="true" />
            Subir documento
          </Button>
        }
      />

      <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center text-sm text-muted-foreground">
        <Upload className="size-6 text-primary" aria-hidden="true" />
        <span>Arrastrar archivos aquí o seleccionar</span>
        <span className="text-xs">Tipo de documento · PDF, imágenes, Excel</span>
      </div>

      <Pendiente texto="Tabla de documentos subidos (tipo, nombre, usuario, fecha, acciones)." />
    </div>
  );
}
