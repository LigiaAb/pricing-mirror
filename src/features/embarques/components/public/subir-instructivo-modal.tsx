"use client";

/**
 * Modal que pide al cliente subir el PDF del Instructivo Embarque firmado
 * antes de ejecutar "Completar". Replica el flujo privado de documentos:
 *   1) guardar-archivo (FormData) → ruta_archivo
 *   2) insertar-coordinacion-documento con cod_tipo_documento=256
 * Ambos contra los endpoints públicos con el token de interacción del link.
 */

import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGuardarArchivoPublico } from "@/features/archivos";
import { useCreateCoordinacionDocumentoPublico } from "@/features/coordinaciones";
import { COD_TIPO_DOCUMENTO_INSTRUCTIVO_FIRMADO } from "@/features/embarques/lib/constantes";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface Props {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onCompletar: () => Promise<boolean>;
  readonly embarqueId: string | number | null | undefined;
  readonly codFile: string;
  readonly isCompleting?: boolean;
  readonly onDownloadPdf: (options: { forceDownload: boolean }) => Promise<void>;
  readonly isGeneratingPdf?: boolean;
  readonly isRefreshingForPdf?: boolean;
  readonly allStepsValid?: boolean;
}

export function SubirInstructivoModal({
  open,
  onClose,
  onCompletar,
  embarqueId,
  codFile,
  isCompleting = false,
  onDownloadPdf,
  isGeneratingPdf = false,
  isRefreshingForPdf = false,
  allStepsValid = false,
}: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorSubida, setErrorSubida] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const submitEnCursoRef = useRef(false);

  const { mutateAsync: subirArchivo, isPending: isUploading } = useGuardarArchivoPublico();
  const { mutateAsync: crearDocumento, isPending: isCreatingDoc } =
    useCreateCoordinacionDocumentoPublico();

  useEffect(() => {
    if (open) {
      setArchivo(null);
      setErrorSubida("");
    }
  }, [open]);

  const aceptarArchivo = useCallback((file: File | null | undefined) => {
    setErrorSubida("");
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrorSubida("Archivo no válido. Seleccione un PDF.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrorSubida("El archivo supera el tamaño máximo permitido (10 MB).");
      return;
    }
    setArchivo(file);
  }, []);

  const handleSubirYCompletar = async () => {
    if (!archivo || !embarqueId || submitEnCursoRef.current) return;
    submitEnCursoRef.current = true;
    setErrorSubida("");
    try {
      const rutaArchivo = await subirArchivo({
        archivo,
        tipo_documento: "coordinaciones",
        embarque_id: embarqueId,
        cod_file: codFile || "",
      });
      await crearDocumento({
        embarque_id: embarqueId as string | number,
        cod_tipo_documento: COD_TIPO_DOCUMENTO_INSTRUCTIVO_FIRMADO,
        ubicacion: "coordinaciones",
        tipo_documento: "coordinaciones",
        url_archivo: String(rutaArchivo),
        descripcion: "",
        estado_cod: 1,
      });
      const completado = await onCompletar();
      if (!completado) {
        setErrorSubida("No se pudo completar la carta. Intente nuevamente.");
      }
    } catch {
      setErrorSubida("No se pudo subir el archivo y completar la carta. Intente nuevamente.");
    } finally {
      submitEnCursoRef.current = false;
    }
  };

  const isWorking = isUploading || isCreatingDoc || isGeneratingPdf || isRefreshingForPdf;

  const labelDescarga = (() => {
    if (isRefreshingForPdf) return "Actualizando datos...";
    if (isGeneratingPdf) return "Generando PDF...";
    return `Descargar Formulario${allStepsValid ? "" : " (borrador)"}`;
  })();

  return (
    <Dialog
      open={open}
      onOpenChange={(abierto) => {
        if (!abierto && !isWorking && !isCompleting) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Subir Instructivo Embarque Firmado</DialogTitle>
        </DialogHeader>

        <p className="text-sm font-medium">Instrucciones</p>
        <p className="text-sm">
          1. Descarga el Formulario, 2. verifica los datos, 3. fírmalo y súbelo aquí.
        </p>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          disabled={isGeneratingPdf || isRefreshingForPdf}
          onClick={() => {
            onDownloadPdf({ forceDownload: true }).catch(() =>
              setErrorSubida("No se pudo generar el PDF. Intente nuevamente."),
            );
          }}
        >
          {isGeneratingPdf || isRefreshingForPdf ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {labelDescarga}
        </Button>

        {archivo ? (
          <div className="flex items-center justify-between gap-2 rounded-md border p-3">
            <div className="flex min-w-0 items-center gap-2">
              {isWorking ? (
                <Loader2 className="size-5 shrink-0 animate-spin text-primary" />
              ) : (
                <FileText className="size-5 shrink-0 text-primary" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{archivo.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isWorking || isCompleting ? "Procesando..." : "Listo para subir y completar"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={isWorking || isCompleting}
              onClick={() => {
                setArchivo(null);
                setErrorSubida("");
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className={`w-full cursor-pointer rounded-md border-2 border-dashed p-8 text-center transition-colors ${dragActive ? "border-primary bg-accent" : "border-primary/60 hover:bg-accent"}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              aceptarArchivo(e.dataTransfer.files?.[0]);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => aceptarArchivo(e.target.files?.[0])}
            />
            <div className="flex flex-col items-center gap-2">
              <FileText className="size-9 text-primary" />
              <p className="text-sm">
                {dragActive
                  ? "Suelte el archivo aquí..."
                  : "Arrastre y suelte el archivo PDF firmado aquí, o de click para seleccionar uno"}
              </p>
              <p className="text-xs text-muted-foreground">Tamaño máximo: 10 MB</p>
            </div>
          </button>
        )}

        {errorSubida && <p className="text-xs text-destructive">{errorSubida}</p>}

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isWorking || isCompleting}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={!archivo || !embarqueId || isWorking || isCompleting}
            onClick={() => void handleSubirYCompletar()}
          >
            {isWorking || isCompleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {isUploading
              ? "Subiendo PDF..."
              : isCreatingDoc
                ? "Registrando documento..."
                : isCompleting
                  ? "Completando..."
                  : "Subir y completar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
