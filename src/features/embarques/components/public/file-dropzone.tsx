"use client";

import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { MAX_FILE_SIZE_MB } from "@/features/embarques/lib/constantes";
import { isPdfFile } from "@/features/embarques/lib/documentos-coordinacion";
import { cn } from "@/shared/lib/utils";

interface FileDropzoneProps {
  readonly onFileAccepted: (file: File) => void;
  readonly onRejected?: (message: string) => void;
  readonly disabled?: boolean;
  readonly maxSizeMB?: number;
  readonly label?: string;
  readonly compact?: boolean;
}

/**
 * Zona de carga con arrastrar-y-soltar o click: solo PDF, tamaño máximo
 * configurable (drag&drop nativo — sin dependencia externa).
 */
export function FileDropzone({
  onFileAccepted,
  onRejected,
  disabled = false,
  maxSizeMB = MAX_FILE_SIZE_MB,
  label = "Arrastra el PDF aquí o haz clic para seleccionar",
  compact = false,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const procesarArchivo = (file: File | undefined) => {
    if (!file) return;
    if (!isPdfFile(file)) {
      onRejected?.("Archivo no válido. Seleccione un PDF.");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      onRejected?.(`El archivo supera el tamaño máximo permitido (${maxSizeMB} MB).`);
      return;
    }
    onFileAccepted(file);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed px-4 text-center transition-colors",
        compact ? "py-2" : "py-6",
        dragActive ? "border-primary bg-primary/5" : "border-input bg-muted/30",
        disabled ? "cursor-default opacity-60" : "cursor-pointer hover:border-primary",
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (!disabled) procesarArchivo(e.dataTransfer.files?.[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          procesarArchivo(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <UploadCloud
        className={cn("text-muted-foreground opacity-80", compact ? "size-5" : "size-7")}
      />
      <span className={cn("font-medium", compact ? "text-xs" : "text-sm")}>
        {dragActive ? "Suelta el archivo aquí..." : label}
      </span>
      <span className="text-xs text-muted-foreground">Solo PDF · Máximo {maxSizeMB} MB</span>
    </button>
  );
}
