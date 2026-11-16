"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/shared/components/ui/button";

interface FormularioConGuardarProps {
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly guardando?: boolean;
  readonly onGuardar?: () => void;
  readonly maxWidth?: string;
}

interface GrupoFormularioProps {
  readonly titulo: string;
  readonly children: ReactNode;
}

export function GrupoFormulario({ titulo, children }: GrupoFormularioProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">{titulo}</h4>
      <div className="grid grid-cols-12 gap-4">{children}</div>
    </div>
  );
}

export function FormularioConGuardar({
  children,
  disabled = false,
  guardando = false,
  onGuardar,
  maxWidth,
}: FormularioConGuardarProps) {
  return (
    <div className="relative" style={maxWidth ? { maxWidth } : undefined}>
      <div className="pb-14">{children}</div>
      {onGuardar && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-end border-t bg-card/95 px-4 py-2.5 backdrop-blur supports-backdrop-filter:bg-card/60">
          <Button size="sm" onClick={onGuardar} disabled={disabled || guardando}>
            {guardando && <Loader2 className="mr-2 size-4 animate-spin" />}
            {guardando ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      )}
    </div>
  );
}
