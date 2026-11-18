import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type BannerSeveridad = "error" | "info" | "success" | "warning";

export interface BannerInformativoProps {
  readonly titulo?: string;
  readonly mensaje?: string | string[] | React.ReactNode;
  readonly severidad?: BannerSeveridad;
  readonly acciones?: React.ReactNode;
  readonly ocultar?: boolean;
  readonly className?: string;
}

const iconos: Record<string, React.ReactNode> = {
  info: <Info className="h-6 w-6" />,
  success: <CheckCircle2 className="h-6 w-6" />,
  warning: <AlertTriangle className="h-6 w-6" />,
  error: <AlertCircle className="h-6 w-6" />,
};

const variantes: Record<string, string> = {
  info: "border-info bg-info/10 dark:border-info/50 dark:bg-info/15",
  success: "border-success bg-success/10 dark:border-success/50 dark:bg-success/15",
  warning: "border-warning bg-warning/10 dark:border-warning/50 dark:bg-warning/15",
  error: "border-destructive bg-destructive/10 dark:border-destructive/50 dark:bg-destructive/15",
};

const coloresIcono: Record<string, string> = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
};

export function BannerInformativo({
  titulo,
  mensaje,
  severidad = "info",
  acciones,
  ocultar = false,
  className,
}: BannerInformativoProps) {
  if (ocultar || (!titulo && !mensaje)) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border px-4 py-3 text-sm flex gap-3 text-foreground",
        variantes[severidad],
        className,
      )}
    >
      <div className={cn("mt-0.5 shrink-0", coloresIcono[severidad])}>{iconos[severidad]}</div>
      <div className="min-w-0 flex-1 text-foreground">
        {titulo && <h5 className="mb-1 font-semibold leading-none tracking-tight">{titulo}</h5>}
        {Array.isArray(mensaje) ? (
          <ul className="m-0 list-disc pl-4">
            {mensaje.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          typeof mensaje === "string" && <div>{mensaje}</div>
        )}
        {typeof mensaje !== "string" && !Array.isArray(mensaje) && mensaje}
      </div>
      {acciones && <div className="absolute right-4 top-3">{acciones}</div>}
    </div>
  );
}
