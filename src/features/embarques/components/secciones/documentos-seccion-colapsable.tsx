"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronDown, ChevronRight, RefreshCcw } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";

interface DocumentosSeccionColapsableProps {
  titulo: string;
  subtitulo: string;
  icono: LucideIcon;
  iconoBg: string;
  badge: React.ReactNode;
  isLoadingDocs: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
}

/** Cabecera colapsable común de las secciones de documentos (subidos/pendientes). */
export function DocumentosSeccionColapsable({
  titulo,
  subtitulo,
  icono: Icon,
  iconoBg,
  badge,
  isLoadingDocs,
  onRefresh,
  children,
}: Readonly<DocumentosSeccionColapsableProps>) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div className="mb-3 flex w-full items-center justify-between gap-1 rounded-lg px-1 py-2 transition-colors hover:bg-muted/50">
        <button
          type="button"
          aria-expanded={expanded}
          className="flex flex-1 cursor-pointer items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setExpanded(!expanded)}
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${iconoBg}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold leading-tight">{titulo}</h3>
            <p className="text-xs text-muted-foreground">{subtitulo}</p>
          </div>
          {badge}
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Refrescar"
          onClick={onRefresh}
          disabled={isLoadingDocs}
        >
          <RefreshCcw className={`h-4 w-4 ${isLoadingDocs ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
          {children}
        </div>
      )}
    </div>
  );
}
