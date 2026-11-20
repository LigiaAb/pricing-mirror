import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import type { Actividad } from "../../api/actividades";
import { colorActividad } from "../../lib/actividad-colores";
import { iconoActividad } from "../../lib/actividad-iconos";
import { agruparActividadesPorTipo, crearRejillaMes } from "../../lib/calendario-rejilla";

const COLORES_INDICADOR: Record<string, string> = {
  blue: "text-primary",
  emerald: "text-emerald-500",
  violet: "text-violet-500",
  amber: "text-amber-500",
  rose: "text-rose-500",
  cyan: "text-cyan-500",
};

export function RejillaMes({
  fecha,
  actividades,
  diaSeleccionado,
  onSeleccionarDia,
}: Readonly<{
  fecha: Date;
  actividades: Actividad[];
  diaSeleccionado: Date;
  onSeleccionarDia: (fecha: Date) => void;
}>) {
  const semanas = crearRejillaMes(fecha, actividades);
  const dias = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
      <div className="grid grid-cols-7 border-b border-primary/80 bg-primary text-center text-[0.65rem] font-semibold tracking-wide text-primary-foreground uppercase sm:text-xs">
        {dias.map((dia, indice) => (
          <div className="p-2" key={dia}>
            {format(new Date(2024, 0, indice + 1), "EEE", { locale: es })}
          </div>
        ))}
      </div>
      {semanas.map((semana) => (
        <div className="grid grid-cols-7" key={semana[0]?.fecha.toISOString()}>
          {semana.map((dia) => (
            <section
              className="min-h-20 border-r border-b border-border/50 p-1.5 last:border-r-0 sm:min-h-24 sm:p-2"
              key={dia.fecha.toISOString()}
            >
              <button
                aria-label={`Seleccionar día ${format(dia.fecha, "d 'de' MMMM", { locale: es })}`}
                aria-pressed={isSameDay(dia.fecha, diaSeleccionado)}
                className={`group flex min-h-16 w-full flex-col items-center rounded-xl p-1 text-xs transition-colors sm:min-h-20 ${dia.esDelMes ? "font-medium" : "text-muted-foreground/60"} ${isSameDay(dia.fecha, diaSeleccionado) ? "bg-primary/5" : "hover:bg-muted/40"}`}
                onClick={() => onSeleccionarDia(dia.fecha)}
                type="button"
              >
                <span
                  className={`grid size-7 place-items-center rounded-full transition-colors ${isSameDay(dia.fecha, diaSeleccionado) ? "bg-primary font-semibold text-primary-foreground shadow-sm" : "group-hover:bg-background"}`}
                >
                  {format(dia.fecha, "d")}
                </span>
                <span className="mt-2 flex flex-wrap justify-center gap-x-1.5 gap-y-1">
                  {(dia.esDelMes ? agruparActividadesPorTipo(dia.actividades) : []).map((grupo) => {
                    const Icono = iconoActividad(grupo.nombreTipo);
                    return (
                      <span
                        aria-label={`${grupo.cantidad} actividades de tipo ${grupo.nombreTipo}`}
                        className={`inline-flex items-center gap-0.5 text-xs ${COLORES_INDICADOR[colorActividad(grupo.codTipo)] ?? "text-primary"}`}
                        key={grupo.codTipo}
                        role="img"
                        title={`${grupo.nombreTipo}: ${grupo.cantidad}`}
                      >
                        <Icono aria-hidden="true" size={13} />
                        <span>{grupo.cantidad}</span>
                      </span>
                    );
                  })}
                </span>
              </button>
            </section>
          ))}
        </div>
      ))}
    </div>
  );
}
