"use client";

import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import React from "react";
import { Button } from "@/shared/components/ui/button";
import type { Actividad } from "../../api/actividades";
import { diasSemana } from "../../lib/calendario-rejilla";
import { CardActividad } from "./card-actividad";

type DateRange = {
  from: Date;
  to: Date;
};

const eliminarActividadesDuplicadas = (actividades: Actividad[]) =>
  actividades.filter(
    (actividad, index) =>
      actividades.findIndex((a) => a.cod_actividad === actividad.cod_actividad) === index,
  );

export function RejillaSemana({
  fecha,
  actividades,
  diaSeleccionado,
  onSeleccionarDia,
  // onAbrirActividad,
  setearPeriodo,
}: Readonly<{
  fecha: Date;
  actividades: Actividad[];
  diaSeleccionado: Date;
  onSeleccionarDia: (fecha: Date) => void;
  // onAbrirActividad?: ((actividad: Actividad) => void) | undefined;
  setearPeriodo?: ((dia: Date) => void) | undefined;
}>) {
  const actividadesDeSemana = React.useMemo(
    () => diasSemana(fecha, actividades),
    [actividades, fecha],
  );

  const [_dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startOfWeek(fecha, { weekStartsOn: 1 }),
    to: addDays(startOfWeek(fecha, { weekStartsOn: 1 }), 6),
  });

  const _selectOneDayConverToWeek = (_current: DateRange, day: Date) => {
    const start = startOfWeek(day, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    setDateRange({ from: start, to: end });
    if (setearPeriodo) setearPeriodo(day);
  };

  return (
    <div className="flex space-x-1.5 flex-row md:flex-nowrap flex-wrap border border/60 bg-card ">
      <div className="md:size-auto size-full flex justify-center">
        {/* <Calendar
          weekStartsOn={1}
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={selectOneDayConverToWeek}
          className="rounded-lg border bg-background"
          locale={es}
          components={{
            DayButton: ({ children, ...props }: React.ComponentProps<typeof CalendarDayButton>) => {
              // const actividades_ = diasSemana(fecha, actividades).find((dia) => isSameDay(dia.fecha, props.date))?.actividades ?? [];

              // if (actividades_.length === 0) return <CalendarDayButton {...props}>{children}</CalendarDayButton>;
              return (
                <CalendarDayButton {...props}>
                  {children}
                  <span>
                    <CircleAlertIcon className="h-4 w-4" />
                  </span>
                </CalendarDayButton>
              );
            },
          }}
        /> */}
      </div>
      <div className="w-full">
        <div className="size-full md:size-auto grid overflow-hidden rounded-2xlbg-card shadow-xs md:grid-cols-2 xl:grid-cols-7">
          {actividadesDeSemana.map((dia) => (
            <section
              className="min-h-56 border-r border-b border-border/60 p-3 last:border-r-0 xl:border-b-0"
              key={dia.fecha.toISOString()}
            >
              <Button
                aria-pressed={isSameDay(dia.fecha, diaSeleccionado)}
                className={`mb-3 rounded-full px-2.5 py-1 text-sm font-semibold capitalize transition-colors ${isSameDay(dia.fecha, diaSeleccionado) ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted"}`}
                onClick={() => onSeleccionarDia(dia.fecha)}
                type="button"
                variant="ghost"
              >
                {format(dia.fecha, "EEE d", { locale: es })}
              </Button>
              <div className="space-y-2">
                {eliminarActividadesDuplicadas(dia.actividades).map((actividad) => (
                  <CardActividad
                    actividad={actividad}
                    key={actividad.cod_actividad}
                    // onClick={onAbrirActividad ? () => onAbrirActividad(actividad) : undefined}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
