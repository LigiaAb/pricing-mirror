"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { Label } from "@/shared/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";
import { OpcionDestinoCard } from "./destino-cards";
import { getConfirmButtonText, type OpcionDestino } from "./destino-model";

interface PasoConfirmarDestinoProps {
  readonly options: readonly OpcionDestino[];
  readonly existingGuia: string;
  readonly opcionSeleccionada: string | null;
  readonly onSelectOpcion: (id: string) => void;
  readonly fechaEntrega: Date | undefined;
  readonly onFechaEntregaChange: (fecha: Date | undefined) => void;
  readonly selectedOption: OpcionDestino | undefined;
  readonly processing: boolean;
  readonly onConfirm: () => void;
}

export function PasoConfirmarDestino({
  options,
  existingGuia,
  opcionSeleccionada,
  onSelectOpcion,
  fechaEntrega,
  onFechaEntregaChange,
  selectedOption,
  processing,
  onConfirm,
}: PasoConfirmarDestinoProps) {
  return (
    <div>
      {existingGuia && (
        <div className="mb-4 rounded-lg border bg-primary/5 p-4">
          <p className="mb-1 text-sm font-semibold">Guía Master asignada</p>
          <p className="text-sm">{existingGuia}</p>
        </div>
      )}

      <div className="space-y-4">
        {options.map((opt) => (
          <OpcionDestinoCard
            key={opt.id}
            titulo={opt.titulo}
            subtitulo={opt.subtitulo}
            descripcion={opt.descripcion}
            seleccionado={opcionSeleccionada === opt.id}
            onClick={() => onSelectOpcion(opt.id)}
          >
            {opt.requiresDate && opcionSeleccionada === opt.id && (
              <div className="mt-2">
                <Label>Fecha de entrega</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "mt-1 w-full justify-start text-left font-normal",
                        !fechaEntrega && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaEntrega ? (
                        format(fechaEntrega, "PPP", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fechaEntrega}
                      onSelect={onFechaEntregaChange}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </OpcionDestinoCard>
        ))}
      </div>

      <div className="mt-6 flex justify-end gap-2 border-t pt-4">
        <Button
          onClick={onConfirm}
          disabled={
            !opcionSeleccionada || (selectedOption?.requiresDate && !fechaEntrega) || processing
          }
        >
          {processing && <Loader2 className="size-4 animate-spin" />}
          {getConfirmButtonText(selectedOption, processing)}
        </Button>
      </div>
    </div>
  );
}
