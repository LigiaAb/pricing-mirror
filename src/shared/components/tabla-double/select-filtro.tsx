"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { ComboboxList } from "@/shared/components/ui/combobox-list";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  popoverListClassName,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";

export interface OpcionFiltro {
  value: string;
  label: string;
  codigo?: string;
  [key: string]: unknown;
}

interface SelectFiltroProps {
  options: OpcionFiltro[];
  value: OpcionFiltro[];
  onChange: (value: OpcionFiltro[]) => void;
  searchable?: boolean;
  multi?: boolean;
  emitObjects?: boolean;
  placeholder?: string;
}

export default function SelectFiltro({
  options,
  value,
  onChange,
  multi = true,
  placeholder = "Selecciona...",
}: SelectFiltroProps) {
  const [open, setOpen] = useState(false);

  const estaSeleccionado = (opt: OpcionFiltro) => value.some((v) => v.value === opt.value);

  const toggleOpcion = (opt: OpcionFiltro) => {
    if (!multi) {
      if (estaSeleccionado(opt)) {
        onChange([]);
      } else {
        onChange([opt]);
      }
      setOpen(false);
      return;
    }

    if (estaSeleccionado(opt)) {
      onChange(value.filter((v) => v.value !== opt.value));
    } else {
      onChange([...value, opt]);
    }
  };

  const quitarOpcion = (opt: OpcionFiltro) => {
    onChange(value.filter((v) => v.value !== opt.value));
  };

  const limpiarSeleccion = () => {
    onChange([]);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full h-9 justify-between font-normal text-sm"
            >
              <span className="truncate text-left">
                {value.length === 0 ? (
                  <span className="text-muted-foreground">{placeholder}</span>
                ) : value.length === 1 ? (
                  (() => {
                    const selected = value[0];
                    return selected ? (selected.codigo ?? selected.label) : placeholder;
                  })()
                ) : (
                  `${value.length} seleccionados`
                )}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className={cn(popoverListClassName, "p-0")} align="start">
            {/* ComboboxList virtualiza cuando hay muchas opciones (p. ej. miles de clientes). */}
            <ComboboxList
              options={options}
              isSelected={estaSeleccionado}
              onSelect={toggleOpcion}
              searchPlaceholder="Buscar..."
              emptyMessage="Sin resultados."
              // Filas de una sola línea (alto fijo): con alturas distintas la lista
              // virtualizada encima filas o deja huecos al filtrar.
              estimatedRowHeight={32}
              renderOption={(opt, selected) => (
                <>
                  <Check className={cn("h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 flex-1 truncate" title={opt.label}>
                    {opt.label}
                  </span>
                </>
              )}
            />
          </PopoverContent>
        </Popover>

        {!multi && value.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={limpiarSeleccion}
            title="Quitar filtro"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Chips removibles, solo aplica en modo multi */}
      {multi && value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((v) => (
            <Badge key={v.value} variant="secondary" className="text-xs gap-1 pr-1">
              {v.codigo ?? v.label}
              <button
                type="button"
                className="rounded-full hover:bg-black/10"
                onClick={() => quitarOpcion(v)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
