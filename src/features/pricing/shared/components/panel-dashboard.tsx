/* Panel con encabezado para pantallas de pricing (Reportes y las nuevas).
 * Copia de `wms-hn/components/reportes/panel-dashboard.tsx`: mismo markup y clases. */
import { cn } from "@/shared/lib/utils";

/** Encabezado de un `Panel`: ícono, título, subtítulo opcional y acción a la derecha. */
export function SectionHeader({
  icon,
  title,
  subtitle,
  action,
}: Readonly<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string | undefined;
  action?: React.ReactNode;
}>) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-brand-50 px-5 py-3.5">
      <div className="flex items-center gap-3">
        <span className="text-primary">{icon}</span>
        <div>
          <p className="text-lg font-semibold leading-tight text-primary">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/** Contenedor con borde redondeado y sombra. */
export function Panel({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string | undefined }>) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Texto centrado para cuando no hay datos. */
export function MensajeVacio({ children }: Readonly<{ children: React.ReactNode }>) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
