"use client";

import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { DialogTitleWithClose } from "./shared";
import { resolveEmbarqueId } from "./utils";

interface CargasDetailDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly embarqueData?: Record<string, unknown>;
  readonly embarqueId?: string | number | null;
}

export function CargasDetailDialog({
  open,
  onClose,
  embarqueData = {},
  embarqueId = null,
}: CargasDetailDialogProps) {
  const resolvedId = resolveEmbarqueId(embarqueData, embarqueId);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-6xl">
        <DialogTitleWithClose title="Detalle de Cargas" onClose={onClose} />
        <div className="px-6 pb-6">
          <p className="text-sm text-muted-foreground">
            Embarque ID: {resolvedId ?? "No disponible"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Componente de cargas pendiente de migrar.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
