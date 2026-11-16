"use client";

import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";

interface OpcionDestinoCardProps {
  readonly titulo: string;
  readonly subtitulo: string;
  readonly descripcion: string;
  readonly seleccionado: boolean;
  readonly onClick: () => void;
  readonly children?: React.ReactNode;
}

export function OpcionDestinoCard({
  titulo,
  subtitulo,
  descripcion,
  seleccionado,
  onClick,
  children,
}: OpcionDestinoCardProps) {
  // El área clickeable es un <button>; los children (p. ej. el date picker de
  // entrega) se renderizan FUERA del botón para no anidar botones.
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-xl border transition-all",
        seleccionado
          ? "border-primary shadow-lg"
          : "border-border hover:border-primary/50 hover:shadow-md",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full cursor-pointer items-start gap-3 p-4 text-left"
      >
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
            seleccionado ? "bg-primary text-primary-foreground" : "bg-muted",
          )}
        >
          <span className="text-lg">{titulo.charAt(0)}</span>
        </div>
        <div className="flex-1">
          <h3
            className={cn(
              "text-sm font-semibold",
              seleccionado ? "text-primary" : "text-foreground",
            )}
          >
            {titulo}
          </h3>
          <p className="text-xs text-muted-foreground">{subtitulo}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{descripcion}</p>
        </div>
      </button>
      {children && seleccionado && <div className="px-4 pb-4 pl-19">{children}</div>}
      {seleccionado && (
        <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <span className="text-xs">✓</span>
        </div>
      )}
    </div>
  );
}

interface MasterDisponibleCardProps {
  readonly master?: string;
  readonly houses?: string[];
  readonly paisDestino?: string;
  readonly cliente?: string;
  readonly lineaAerea?: string;
  readonly seleccionado: boolean;
  readonly onClick: () => void;
}

export function MasterDisponibleCard({
  master,
  houses,
  paisDestino,
  cliente,
  lineaAerea,
  seleccionado,
  onClick,
}: MasterDisponibleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative w-full cursor-pointer overflow-hidden rounded-xl border p-3 transition-all text-left",
        seleccionado
          ? "border-primary bg-primary/5 shadow-lg"
          : "border-border hover:border-primary/50 hover:shadow-md",
      )}
    >
      {seleccionado && (
        <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          <span className="text-xs">✓</span>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              seleccionado ? "bg-primary text-primary-foreground" : "bg-muted text-primary",
            )}
          >
            <span className="text-sm">✈</span>
          </div>
          <div className="min-w-0 pr-8">
            <p className="text-sm font-semibold leading-tight">
              {master ? `Master: ${master}` : "Master sin referencia"}
            </p>
            {houses && houses.length > 0 ? (
              <div className="mt-1">
                <p className="mb-1 text-xs text-muted-foreground">House:</p>
                <div className="flex flex-wrap gap-1">
                  {houses.map((h) => (
                    <Badge key={h} variant="outline" className="text-xs">
                      {h}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs tracking-wide text-muted-foreground">House sin referencia</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-muted p-2">
            <p className="mb-1 text-xs text-muted-foreground">País destino</p>
            <p className="text-sm font-semibold">{paisDestino || "No definido"}</p>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <p className="mb-1 text-xs text-muted-foreground">Línea aérea</p>
            <p className="text-sm font-semibold">{lineaAerea || "Pendiente"}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-3">
          <p className="mb-1 text-xs text-muted-foreground">Cliente coordinación</p>
          <p className="text-sm font-semibold leading-tight">{cliente || "No definido"}</p>
        </div>
      </div>
    </button>
  );
}
