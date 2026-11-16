"use client";

/**
 * Panel "Historial de cambios": compara lo que el cliente envió en la carta
 * pública contra el maestro actual (BD). Presentacional; las filas se arman
 * con `buildCambiosClienteRows`. Rediseño D.7 (paridad legacy 2026-07-16):
 * chips valor viejo (tachado al aplicar) → valor nuevo, secciones colapsables
 * y estado "Aplicado". Los handlers de Aceptar/Deshacer se conectan en el
 * detalle CTS privado (en la vista pública no se muestra).
 */

import { Building2, Check, ChevronDown, History, MoveRight, Undo2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import type { CambioClienteRow } from "./secciones/entidad-public-form/cambios-cliente";

export interface CompareRow extends CambioClienteRow {
  puedeDeshacer?: boolean;
}

interface Props {
  readonly titulo?: string;
  readonly showEntity?: boolean;
  readonly clienteEntityNombre?: string;
  readonly differsEntity?: boolean;
  readonly isRelated?: boolean;
  readonly relating?: boolean;
  readonly readOnly?: boolean;
  readonly rows?: CompareRow[];
  readonly onAcceptEntity?: () => void;
  readonly onAcceptField?: (key: string, clienteValue: unknown) => void;
  readonly onAcceptAllFields?: () => void;
  readonly onUndoField?: (key: string) => void;
  readonly onUndoAllFields?: () => void;
}

const SIN_SECCION = "__sin_seccion__";

function renderValor(valor: unknown): string {
  if (valor === undefined || valor === null || valor === "") return "—";
  if (Array.isArray(valor)) return valor.length > 0 ? valor.join(", ") : "—";
  return String(valor);
}

function groupRowsBySection(
  rows: CompareRow[],
): Array<{ section: string; sectionRows: CompareRow[] }> {
  const groups = new Map<string, CompareRow[]>();
  for (const row of rows) {
    const key = row.section || SIN_SECCION;
    const lista = groups.get(key) ?? [];
    lista.push(row);
    groups.set(key, lista);
  }
  return Array.from(groups.entries()).map(([section, sectionRows]) => ({ section, sectionRows }));
}

function ValueChip({
  tone,
  strike = false,
  children,
}: {
  readonly tone: "old" | "new";
  readonly strike?: boolean;
  readonly children: string;
}) {
  return (
    <span
      className={cn(
        "inline-block max-w-full break-words rounded-md border px-2 py-0.5 text-xs leading-relaxed",
        tone === "new"
          ? "border-brand-200 bg-brand-50 font-semibold text-primary"
          : "border-border bg-muted font-medium text-muted-foreground",
        strike && "line-through",
      )}
    >
      {children}
    </span>
  );
}

function CampoModificado({
  row,
  readOnly,
  onAcceptField,
  onUndoField,
}: {
  readonly row: CompareRow;
  readonly readOnly: boolean;
  readonly onAcceptField?: ((key: string, clienteValue: unknown) => void) | undefined;
  readonly onUndoField?: ((key: string) => void) | undefined;
}) {
  const aplicado = Boolean(row.iguales) && !row.puedeDeshacer;
  return (
    <div className="flex flex-col gap-1.5 py-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {row.label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        <ValueChip tone="old" strike={Boolean(row.iguales)}>
          {renderValor(row.currentLabel ?? row.currentValue)}
        </ValueChip>
        <MoveRight className="size-4 shrink-0 text-muted-foreground/60" />
        <ValueChip tone="new">{renderValor(row.clienteLabel ?? row.clienteValue)}</ValueChip>
        {!readOnly && aplicado && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            <Check className="size-3" /> Aplicado
          </span>
        )}
      </div>
      {!readOnly && !aplicado && (
        <div className="flex justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={!row.puedeDeshacer}
            onClick={() => onUndoField?.(row.configKey)}
          >
            <Undo2 className="size-4" /> Deshacer
          </Button>
          <Button
            size="sm"
            className="rounded-full"
            onClick={() => onAcceptField?.(row.configKey, row.clienteValue)}
          >
            <Check className="size-4" /> Aceptar
          </Button>
        </div>
      )}
    </div>
  );
}

export function EntidadComparePanel({
  titulo = "",
  showEntity = true,
  clienteEntityNombre = "",
  differsEntity = false,
  isRelated = false,
  relating = false,
  readOnly = false,
  rows = [],
  onAcceptEntity,
  onAcceptField,
  onAcceptAllFields,
  onUndoField,
  onUndoAllFields,
}: Props) {
  const [collapsedSections, setCollapsedSections] = useState<ReadonlySet<string>>(new Set());

  const toggleSection = (key: string) =>
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const isDifferent = (row: CompareRow) =>
    String(row.currentValue ?? "") !== String(row.clienteValue ?? "");
  const camposModificados = rows.filter((row) =>
    readOnly
      ? row.modificado || isDifferent(row)
      : (row.modificado || isDifferent(row)) && (!row.iguales || row.puedeDeshacer),
  );
  const hayPorAceptar = camposModificados.some((row) => !row.iguales && !row.puedeDeshacer);
  const hayPorDeshacer = camposModificados.some((row) => row.puedeDeshacer);
  const grupos = groupRowsBySection(camposModificados);

  const tieneContenido = (showEntity && clienteEntityNombre) || camposModificados.length > 0;
  if (!tieneContenido) return null;

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="h-0.75 bg-gradient-to-r from-brand-900 to-brand-500" />
      <div className="p-3">
        <div className="mb-3 flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <History className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">Historial de cambios</p>
            {titulo && <p className="truncate text-xs text-muted-foreground">{titulo}</p>}
          </div>
        </div>

        {showEntity && clienteEntityNombre && (
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2",
              camposModificados.length > 0 && "mb-3",
              differsEntity
                ? isRelated
                  ? "border-brand-200 bg-brand-50"
                  : "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
                : "bg-muted",
            )}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Building2 className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-semibold">{renderValor(clienteEntityNombre)}</span>
            </div>
            {differsEntity && (
              <Button
                size="sm"
                className="rounded-full"
                disabled={relating}
                onClick={onAcceptEntity}
              >
                <Check className="size-4" />
                {relating ? "Aplicando..." : "Aceptar entidad"}
              </Button>
            )}
          </div>
        )}

        {camposModificados.length > 0 && (
          <>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                Cambios propuestos por el cliente
              </span>
              {!readOnly && (
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                    disabled={!hayPorDeshacer}
                    onClick={onUndoAllFields}
                  >
                    Deshacer todo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={!hayPorAceptar}
                    onClick={onAcceptAllFields}
                  >
                    Aceptar todo
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {grupos.map(({ section, sectionRows }) => {
                const isCollapsed = collapsedSections.has(section);
                return (
                  <div key={section} className="overflow-hidden rounded-lg border bg-card">
                    {section !== SIN_SECCION && (
                      <button
                        type="button"
                        onClick={() => toggleSection(section)}
                        className="flex w-full select-none items-center justify-between bg-muted px-3 py-1.5 hover:bg-muted/70"
                      >
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {section}
                        </span>
                        <ChevronDown
                          className={cn(
                            "size-4 text-muted-foreground transition-transform",
                            isCollapsed && "-rotate-90",
                          )}
                        />
                      </button>
                    )}
                    {!isCollapsed && (
                      <div className="divide-y px-3">
                        {sectionRows.map((row) => (
                          <CampoModificado
                            key={row.configKey}
                            row={row}
                            readOnly={readOnly}
                            onAcceptField={onAcceptField}
                            onUndoField={onUndoField}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
