"use client";

/**
 * Encabezados de sección del patrón de wizard (ModernFormHeader del legacy):
 * chip de icono + título. Presentacionales puros y sin dependencias de
 * dominio, para que cualquier feature los use y las secciones se vean igual
 * en el detalle CTS y en el de gestión de embarques.
 */

import { Info, type LucideIcon, UserRound } from "lucide-react";

/** Encabezado principal de una sección: chip grande + título + subtítulo. */
export function SeccionHeader({
  titulo,
  subtitulo,
  icono: Icono = UserRound,
  acciones,
}: Readonly<{
  titulo: string;
  subtitulo?: string;
  icono?: LucideIcon;
  /** Controles alineados a la derecha del encabezado (p. ej. "Recargar"). */
  acciones?: React.ReactNode;
}>) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-md bg-brand-100">
        <Icono className="size-5 text-section-accent" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold leading-tight tracking-[-0.02em]">{titulo}</h3>
        {subtitulo && <p className="text-sm text-muted-foreground">{subtitulo}</p>}
      </div>
      {acciones && <div className="flex shrink-0 items-center gap-2">{acciones}</div>}
    </div>
  );
}

/** Encabezado de subsección dentro del formulario: chip pequeño + título acentuado. */
export function SubseccionHeader({
  titulo,
  icono: Icono = Info,
}: Readonly<{ titulo: string; icono?: LucideIcon }>) {
  return (
    <div className="mt-2 mb-1 flex items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand-100">
        <Icono className="size-4 text-section-accent" />
      </span>
      <h4 className="text-base font-semibold uppercase tracking-wide text-section-accent">
        {titulo}
      </h4>
    </div>
  );
}
