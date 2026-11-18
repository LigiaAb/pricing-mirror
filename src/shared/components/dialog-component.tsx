"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

interface DialogComponentProps {
  readonly open?: boolean;
  readonly openDialog?: boolean;
  readonly titulo?: string;
  readonly subtitulo?: string;
  readonly children?: ReactNode;
  readonly content?: ReactNode;
  readonly onClose?: () => void;
  readonly handleClose?: () => void;
  readonly setOpen?: (open: boolean) => void;
  readonly width?: string;
  readonly height?: string;
}

export function DialogComponent({
  open,
  openDialog,
  titulo,
  subtitulo,
  children,
  content,
  onClose,
  handleClose,
  setOpen,
  width = "fit-content",
  height = "fit-content",
}: DialogComponentProps) {
  const isOpen = open ?? openDialog ?? false;
  const close = onClose ?? handleClose ?? (() => setOpen?.(false));

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) close();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-auto" style={{ width, height }}>
        <DialogHeader>
          {titulo && <DialogTitle>{titulo}</DialogTitle>}
          {subtitulo && <DialogDescription>{subtitulo}</DialogDescription>}
        </DialogHeader>
        {content ?? children}
      </DialogContent>
    </Dialog>
  );
}
