import { cn } from "@/shared/lib/utils";

/** Contenedor de cada sección: borde redondeado y sombra. */
export function Panel({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string | undefined }>) {
  return (
    <section
      className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-md", className)}
    >
      {children}
    </section>
  );
}

/** Encabezado de un `Panel`: ícono, título en mayúsculas, subtítulo y acción a la derecha. */
export function EncabezadoPanel({
  icono,
  titulo,
  subtitulo,
  accion,
}: Readonly<{
  icono: React.ReactNode;
  titulo: string;
  subtitulo?: string | undefined;
  accion?: React.ReactNode;
}>) {
  return (
    <div className="flex w-full items-center justify-between gap-3 bg-brand-50 px-4 py-3">
      <div className="flex items-center gap-3 text-left">
        <span className="text-primary [&>svg]:size-5">{icono}</span>
        <div>
          <p className="font-semibold uppercase leading-tight text-primary">{titulo}</p>
          {subtitulo ? <p className="mt-0.5 text-xs text-primary/80">{subtitulo}</p> : null}
        </div>
      </div>
      {accion}
    </div>
  );
}

/** Título grande del reporte con la línea a la derecha. */
export function TituloReporte({ titulo }: Readonly<{ titulo: string }>) {
  return (
    <div className="flex items-center gap-6">
      <h1 className="shrink-0 text-3xl font-medium uppercase text-foreground">{titulo}</h1>
      <span aria-hidden="true" className="h-1 flex-1 rounded bg-primary" />
    </div>
  );
}

/** Texto centrado para estados vacíos. */
export function MensajeVacio({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
