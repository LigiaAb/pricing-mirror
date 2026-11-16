"use client";

import { CheckCircle, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

interface CopyableLinkProps {
  readonly label: string;
  readonly value: string;
}

function CopyableLink({ label, value }: CopyableLinkProps) {
  const handleCopy = () => {
    if (navigator.clipboard && value) {
      const sanitized = value.replaceAll('"', "");
      navigator.clipboard.writeText(sanitized);
    }
  };

  return (
    <div className="mb-4">
      <Label className="mb-1 block text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <Input value={value || ""} readOnly className="flex-1" />
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          disabled={!value}
          aria-label="Copiar enlace"
          title="Copiar"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface LinkClienteDialogProps {
  readonly open?: boolean;
  readonly onClose?: () => void;
  readonly existingLink?: string;
  readonly generatedLink?: string;
  readonly isLoading?: boolean;
  readonly onGenerateNew?: (enviarNotificacion: boolean) => void;
}

export function LinkClienteDialog({
  open,
  onClose,
  existingLink = "",
  generatedLink = "",
  isLoading = false,
  onGenerateNew,
}: LinkClienteDialogProps) {
  const displayLink = generatedLink || existingLink;
  const justGenerated = Boolean(generatedLink) && !isLoading;
  // Plan §7.D.5: notificación por correo al cliente, activa por defecto.
  const [enviarNotificacion, setEnviarNotificacion] = useState(true);

  return (
    <Dialog open={open ?? false} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enlace para el cliente</DialogTitle>
          <DialogDescription>
            Comparta este enlace con el cliente para que complete su información.
          </DialogDescription>
        </DialogHeader>
        <div className="min-w-[320px] space-y-4">
          {displayLink ? (
            <div>
              {justGenerated && (
                <div className="mb-2 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-xs text-green-600">Nuevo link generado y guardado</span>
                </div>
              )}
              <CopyableLink label="Link actual" value={displayLink} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No existe un link guardado.</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onGenerateNew?.(enviarNotificacion)}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {isLoading ? "Generando..." : "Generar nuevo Link"}
            </Button>
            <div className="flex items-center gap-2">
              <Checkbox
                id="enviar-notificacion-link-cliente"
                checked={enviarNotificacion}
                onCheckedChange={(checked) => setEnviarNotificacion(checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="enviar-notificacion-link-cliente" className="text-sm font-normal">
                Enviar correo al cliente
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
