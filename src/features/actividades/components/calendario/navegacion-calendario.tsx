import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export type VistaCalendario = "mes" | "semana" | "dia";

interface NavegacionCalendarioProps {
  fecha: Date;
  vista: VistaCalendario;
  onFechaAnterior: () => void;
  onFechaSiguiente: () => void;
  onHoy: () => void;
  onCambiarVista: (vista: VistaCalendario) => void;
}

export function NavegacionCalendario(props: Readonly<NavegacionCalendarioProps>) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex items-center gap-2">
          <div className="ml-1 flex items-center rounded-full bg-muted/70 p-0.5">
            <Button
              aria-label="Periodo anterior"
              className="size-8 rounded-full border-0 bg-transparent shadow-none"
              onClick={props.onFechaAnterior}
              size="icon"
              variant="ghost"
            >
              <ChevronLeft />
            </Button>
            <Button
              aria-label="Periodo siguiente"
              className="size-8 rounded-full border-0 bg-transparent shadow-none"
              onClick={props.onFechaSiguiente}
              size="icon"
              variant="ghost"
            >
              <ChevronRight />
            </Button>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight capitalize sm:text-3xl">
            {format(props.fecha, "MMMM yyyy", { locale: es })}
          </h2>
          <Button className="rounded-full" onClick={props.onHoy} size="sm" variant="outline">
            Hoy
          </Button>
        </div>
      </div>
      <fieldset className="flex w-fit rounded-xl bg-muted/80 p-1">
        <legend className="sr-only">Vista del calendario</legend>
        {(["mes", "semana", "dia"] as const).map((vista) => (
          <Button
            aria-pressed={props.vista === vista}
            className="min-w-20 rounded-lg border-0 shadow-none"
            key={vista}
            onClick={() => props.onCambiarVista(vista)}
            size="sm"
            variant={props.vista === vista ? "default" : "ghost"}
          >
            {vista[0]?.toUpperCase()}
            {vista.slice(1)}
          </Button>
        ))}
      </fieldset>
    </div>
  );
}
