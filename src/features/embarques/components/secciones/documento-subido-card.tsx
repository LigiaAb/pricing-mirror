"use client";

import { Eye, FileText, Pencil, Save, Server, Trash2, Upload } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { logger } from "@/shared/lib/logger";
import type { DocumentoEntry } from "../../lib/documentos-coordinacion";
import { handlePdfDrop } from "./pdf-drop-utils";

interface DocumentoSubidoCardProps {
  rowKey: string;
  doc: DocumentoEntry;
  onUpdateFileUpload: (
    key: string,
    e: React.ChangeEvent<HTMLInputElement>,
    doc: DocumentoEntry,
  ) => void;
  onRemoveFile: (key: string) => void;
  onDescripcionChange: (key: string, value: string) => void;
  recuperarArchivo: (params: { ruta_archivo: string }) => Promise<Blob>;
}

export function DocumentoSubidoCard({
  rowKey,
  doc,
  onUpdateFileUpload,
  onRemoveFile,
  onDescripcionChange,
  recuperarArchivo,
}: Readonly<DocumentoSubidoCardProps>) {
  const handleViewFile = async () => {
    if (doc.urlServidor) {
      try {
        const blob = await recuperarArchivo({ ruta_archivo: doc.urlServidor });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      } catch (error) {
        logger.error("Error al recuperar archivo:", error);
      }
    } else if (doc.archivo) {
      window.open(URL.createObjectURL(doc.archivo), "_blank");
    }
  };

  const nombre = doc.nombre ?? doc.tipoDescripcion ?? "Documento";

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dialogComment, setDialogComment] = useState(doc.descripcion ?? "");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (editDialogOpen) {
      setSelectedFile(null);
      setDialogComment(doc.descripcion ?? "");
    }
  }, [editDialogOpen, doc.descripcion]);

  const handleDialogSave = () => {
    if (!selectedFile) return;
    onDescripcionChange(rowKey, dialogComment);
    const fakeEvent = {
      target: { files: [selectedFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    onUpdateFileUpload(rowKey, fakeEvent, { ...doc, descripcion: dialogComment });
    setEditDialogOpen(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) =>
    handlePdfDrop(e, setDragOver, setSelectedFile);

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-green-200 bg-card shadow-sm transition-all hover:shadow-md dark:border-green-900/50">
      <div className="absolute inset-y-0 left-0 w-1 bg-green-500" />

      <div className="flex items-start gap-3 p-4 pl-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-600 dark:bg-green-700">
          <FileText className="h-5 w-5 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className=" text-sm font-semibold leading-tight">{nombre}</p>
              {doc.descripcion && (
                <p className="mt-0.5 text-xs text-muted-foreground">{doc.descripcion}</p>
              )}
            </div>
            <Badge
              variant="default"
              className="shrink-0 bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            >
              <Server className="mr-1 h-3 w-3" />
              En servidor
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 border-t bg-muted/30 px-4 py-2 pl-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ver PDF"
              title="Ver PDF"
              className="h-7 w-7"
              onClick={handleViewFile}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver PDF</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Editar documento"
              title="Editar documento"
              className="h-7 w-7"
              onClick={() => setEditDialogOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editar documento</TooltipContent>
        </Tooltip>

        {doc.archivo && !doc.urlServidor && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Eliminar local"
                title="Eliminar local"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onRemoveFile(rowKey)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Eliminar local</TooltipContent>
          </Tooltip>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar documento: {nombre}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <button
              ref={dropZoneRef}
              type="button"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={(() => {
                const base =
                  "flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors";
                if (dragOver) return `${base} border-primary bg-primary/5`;
                if (selectedFile)
                  return `${base} border-green-400 bg-green-50 dark:bg-green-900/10`;
                return `${base} border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5`;
              })()}
            >
              {selectedFile ? (
                <>
                  <FileText className="mb-2 h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </>
              ) : (
                <>
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Arrastra aqui el PDF o haz clic para seleccionar
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">Solo PDF</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="application/pdf"
                onChange={handleFileSelect}
              />
            </button>

            <div className="space-y-2">
              <label htmlFor="doc-comentario" className="text-sm font-medium text-muted-foreground">
                Comentario
              </label>
              <textarea
                id="doc-comentario"
                placeholder="Agregar un comentario..."
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                rows={3}
                value={dialogComment}
                onChange={(e) => setDialogComment(e.target.value)}
                maxLength={500}
              />
            </div>

            {selectedFile && (
              <Button className="w-full gap-2" onClick={handleDialogSave}>
                <Save className="h-4 w-4" />
                {doc.urlServidor ? "Reemplazar archivo" : "Guardar archivo"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
