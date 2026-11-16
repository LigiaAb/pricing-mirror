"use client";

import { CheckCircle2, Eye, FileText, FileWarning, Pencil, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CoordinacionDocumento } from "@/features/coordinaciones";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { FileDropzone } from "../file-dropzone";

export interface PersistirDocumentoInput {
  archivo: File;
  descripcion: string;
  serverDoc: CoordinacionDocumento | undefined;
  tipoDocumentoId: number;
}

interface DocumentoRequeridoCardProps {
  readonly tipoDocumentoId: number;
  readonly nombre: string;
  readonly serverDocs: CoordinacionDocumento[];
  readonly onPersistir: (input: PersistirDocumentoInput) => Promise<void>;
  readonly onVer: (urlArchivo: string) => Promise<void>;
  readonly onValidityChange: (valid: boolean) => void;
}

/**
 * Card de un documento obligatorio del paso público "Documentos": dropzone
 * mientras no hay archivo en servidor; con archivo subido, ver PDF y
 * reemplazarlo vía diálogo. La validez = archivo en servidor.
 */
export function DocumentoRequeridoCard({
  tipoDocumentoId,
  nombre,
  serverDocs,
  onPersistir,
  onVer,
  onValidityChange,
}: DocumentoRequeridoCardProps) {
  const serverDoc = serverDocs.find(
    (doc) => String(doc.tipoIdDocumento) === String(tipoDocumentoId),
  );
  const isSubido = Boolean(serverDoc?.urlArchivo);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  // Descripción del flujo "subir por primera vez" (card sin archivo aún).
  const [descripcion, setDescripcion] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editFile, setEditFile] = useState<File | null>(null);
  // Comentario del diálogo "Editar", con estado PROPIO (igual que el legacy
  // `editComment` en DocumentosPublicas.jsx): si compartiera el mismo estado
  // que `descripcion`, escribir en el diálogo se reflejaría en vivo en la
  // card por debajo antes de guardar, y "Cancelar" dejaría el texto sin
  // persistir pegado en memoria para la próxima apertura.
  const [editComment, setEditComment] = useState("");

  const onValidityChangeRef = useRef(onValidityChange);
  onValidityChangeRef.current = onValidityChange;
  useEffect(() => {
    onValidityChangeRef.current(isSubido);
  }, [isSubido]);

  const persistir = async (archivo: File | null, description: string, cerrarDialogo = false) => {
    if (!archivo) return;
    setIsSaving(true);
    setError("");
    try {
      await onPersistir({ archivo, descripcion: description, serverDoc, tipoDocumentoId });
      setPendingFile(null);
      if (cerrarDialogo) {
        setEditOpen(false);
        setEditFile(null);
      }
    } catch {
      setError(`No se pudo guardar "${nombre}". Intente nuevamente.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`flex-1 basis-[280px] rounded-xl border border-l-4 p-4 ${
        isSubido ? "border-l-green-600 bg-green-600/5" : "border-l-destructive bg-card"
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {isSubido ? (
              <CheckCircle2 className="size-5 shrink-0 text-green-600" />
            ) : (
              <FileWarning className="size-5 shrink-0 text-destructive" />
            )}
            <span className="truncate text-sm font-semibold">{nombre}</span>
          </div>
          {!isSubido && (
            <span className="shrink-0 rounded-full border border-destructive px-2 py-0.5 text-xs font-semibold text-destructive">
              Pendiente
            </span>
          )}
        </div>

        {isSubido ? (
          serverDoc?.descripcion && (
            <p className="break-words text-xs text-muted-foreground">{serverDoc.descripcion}</p>
          )
        ) : (
          <Input
            placeholder="Descripción (opcional)"
            value={descripcion}
            maxLength={250}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        )}

        {isSubido && (
          <div className="flex items-center justify-between pt-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-green-600 px-2 py-0.5 text-xs font-semibold text-green-600">
              <CheckCircle2 className="size-3.5" /> En Servidor
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                title="Ver PDF"
                onClick={() => void onVer(serverDoc?.urlArchivo ?? "")}
              >
                <Eye className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Editar"
                onClick={() => {
                  setEditComment(serverDoc?.descripcion || "");
                  setEditOpen(true);
                  setEditFile(null);
                  setError("");
                }}
              >
                <Pencil className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {!isSubido && !pendingFile && (
          <FileDropzone onFileAccepted={setPendingFile} onRejected={setError} compact />
        )}

        {!isSubido && pendingFile && (
          <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="size-4 shrink-0 text-destructive" />
              <span className="break-all text-xs">{pendingFile.name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="sm"
                onClick={() => void persistir(pendingFile, descripcion)}
                disabled={isSaving}
              >
                <Upload className="size-4" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Quitar archivo"
                onClick={() => {
                  setPendingFile(null);
                  setError("");
                }}
                disabled={isSaving}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <Dialog open={editOpen} onOpenChange={(open) => !isSaving && setEditOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar Documento — {nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {editFile ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                <span className="break-all text-xs">{editFile.name}</span>
                <Button variant="ghost" size="icon" onClick={() => setEditFile(null)}>
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <FileDropzone
                onFileAccepted={setEditFile}
                onRejected={setError}
                label="Arrastra el nuevo PDF aquí o haz clic para seleccionar"
              />
            )}
            <Input
              placeholder="Comentario (opcional)"
              value={editComment}
              maxLength={250}
              onChange={(e) => setEditComment(e.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={() => void persistir(editFile, editComment, true)}
              disabled={!editFile || isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
