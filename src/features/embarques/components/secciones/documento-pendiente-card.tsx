"use client";

import { FileText, FileUp, Save, Upload } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { type DocumentoEntry, isPdfFile } from "../../lib/documentos-coordinacion";
import { handlePdfDrop } from "./pdf-drop-utils";

interface DocumentoPendienteCardProps {
  rowKey: string;
  doc: DocumentoEntry;
  onFileUpload: (key: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onDescripcionChange: (key: string, value: string) => void;
  onFileSave: (key: string, file?: File | null) => void;
  tipo: "obligatorio" | "cropa";
}

export function DocumentoPendienteCard({
  rowKey,
  doc,
  onFileUpload,
  onDescripcionChange,
  onFileSave,
  tipo,
}: Readonly<DocumentoPendienteCardProps>) {
  const [localDesc, setLocalDesc] = useState(doc.descripcion ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setLocalDesc(doc.descripcion ?? ""), [doc.descripcion]);

  const nombre = doc.nombre ?? doc.tipoDescripcion ?? "Documento";
  const isObligatorio = tipo === "obligatorio";

  const borderColor = isObligatorio
    ? "border-destructive/40 "
    : "border-amber-200 dark:border-amber-900/50";
  const barColor = isObligatorio ? "bg-destructive" : "bg-amber-500";
  const iconBg = isObligatorio ? "bg-destructive " : "bg-amber-600 dark:bg-amber-700";
  const badgeVariant = isObligatorio ? "destructive" : "secondary";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isPdfFile(file)) return;
    setSelectedFile(file);
    e.target.value = "";
  };

  const handleSave = () => {
    if (!selectedFile) return;
    onDescripcionChange(rowKey, localDesc);
    const fakeEvent = {
      target: { files: [selectedFile] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    onFileUpload(rowKey, fakeEvent);
    onFileSave(rowKey, selectedFile);
    setSelectedFile(null);
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

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border ${borderColor} bg-card shadow-sm transition-all hover:shadow-md`}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${barColor}`} />

      <div className="p-4 pl-5">
        <div className="mb-3 flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
          >
            <FileUp className="h-5 w-5 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-tight">{nombre}</p>
              <Badge variant={badgeVariant} className="shrink-0 text-xs">
                {isObligatorio ? "Requerido" : "CROPA"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <Input
            placeholder="Descripción (opcional)"
            className="h-8 text-xs"
            value={localDesc}
            onChange={(e) => setLocalDesc(e.target.value)}
            onBlur={() => onDescripcionChange(rowKey, localDesc)}
            maxLength={250}
          />
        </div>

        {selectedFile ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-900/50 dark:bg-green-900/10">
              <FileText className="h-4 w-4 shrink-0 text-green-500" />
              <span className="flex-1 text-sm font-medium text-green-700 dark:text-green-400">
                {selectedFile.name}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Cambiar archivo"
                    title="Cambiar archivo"
                    className="h-6 w-6 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                    onClick={() => setSelectedFile(null)}
                  >
                    <FileUp className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cambiar archivo</TooltipContent>
              </Tooltip>
            </div>
            <Button size="sm" className="w-full gap-1.5" onClick={handleSave}>
              <Save className="h-3.5 w-3.5" />
              Guardar
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm font-medium transition-colors ${
              dragOver
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 hover:text-primary text-muted-foreground"
            }`}
          >
            <Upload className="h-5 w-5" />
            <span>Arrastra un PDF aquí o haz clic para seleccionar</span>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={handleFileSelect}
            />
          </button>
        )}
      </div>
    </div>
  );
}
