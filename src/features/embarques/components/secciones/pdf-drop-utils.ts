import type React from "react";
import { isPdfFile } from "../../lib/documentos-coordinacion";

export function handlePdfDrop(
  e: React.DragEvent<HTMLButtonElement>,
  setDragOver: (v: boolean) => void,
  setSelectedFile: (f: File) => void,
) {
  e.preventDefault();
  setDragOver(false);
  const file = e.dataTransfer.files?.[0];
  if (file && isPdfFile(file)) {
    setSelectedFile(file);
  }
}
