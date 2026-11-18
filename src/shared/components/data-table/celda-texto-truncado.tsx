"use client";

import { useRef, useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";

interface CeldaTextoTruncadoProps {
  readonly texto: string | number | null | undefined;
  readonly className?: string;
}

/**
 * Celda de data-table que limita el texto a 2 líneas con "…" al final.
 * El tooltip con el texto completo solo se abre cuando el texto está recortado.
 */
export function CeldaTextoTruncado({ texto, className }: CeldaTextoTruncadoProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [abierto, setAbierto] = useState(false);
  const contenido = texto === null || texto === undefined ? "" : String(texto);

  const cambiarAbierto = (siguiente: boolean) => {
    const el = ref.current;
    const recortado = el !== null && el.scrollHeight > el.clientHeight;
    setAbierto(siguiente && recortado);
  };

  return (
    <Tooltip open={abierto} onOpenChange={cambiarAbierto}>
      <TooltipTrigger asChild>
        <span ref={ref} className={cn("line-clamp-2 max-w-60 wrap-break-word", className)}>
          {contenido}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm whitespace-pre-wrap wrap-break-word">
        {contenido}
      </TooltipContent>
    </Tooltip>
  );
}
