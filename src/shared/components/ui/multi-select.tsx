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

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  readonly value: string[];
  readonly onChange: (value: string[]) => void;
  readonly options: MultiSelectOption[];
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly searchPlaceholder?: string;
  readonly emptyMessage?: string;
  readonly className?: string;
  readonly id?: string;
}

/**
 * Select buscable con selección múltiple: variante de `Combobox` que marca cada opción
 * con un checkbox (no cierra al elegir) y muestra los valores elegidos como chips removibles.
 */
export function MultiSelect({
  value,
  onChange,
  options,
  disabled,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin resultados",
  className,
  id,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const seleccionados = options.filter((opt) => value.includes(opt.value));
  const resumen = `${seleccionados.length} seleccionado${seleccionados.length === 1 ? "" : "s"}`;

  const alternar = (opcion: string) => {
    onChange(value.includes(opcion) ? value.filter((item) => item !== opcion) : [...value, opcion]);
  };

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn("w-full justify-between font-normal", className)}
          >
            <span className={cn("truncate", seleccionados.length === 0 && "text-muted-foreground")}>
              {seleccionados.length > 0 ? resumen : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className={cn(popoverListClassName, "p-0")}>
          <ComboboxList
            options={options}
            isSelected={(opt) => value.includes(opt.value)}
            onSelect={(opt) => alternar(opt.value)}
            searchPlaceholder={searchPlaceholder}
            emptyMessage={emptyMessage}
            footer={
              seleccionados.length > 0 ? (
                <div className="flex items-center justify-between border-t px-3 py-1.5">
                  <span className="text-xs text-muted-foreground">{resumen}</span>
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => onChange([])}
                  >
                    Limpiar
                  </button>
                </div>
              ) : null
            }
            renderOption={(opt, activo) => (
              <>
                <span
                  className={cn(
                    "mr-2 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                    activo ? "bg-primary text-primary-foreground" : "opacity-60",
                  )}
                >
                  {activo && <Check className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1 wrap-anywhere">{opt.label}</span>
              </>
            )}
          />
        </PopoverContent>
      </Popover>
      {seleccionados.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {seleccionados.map((opt) => (
            <Badge key={opt.value} variant="secondary" className="gap-1 py-0 pr-1 font-normal">
              {opt.label}
              <button
                type="button"
                aria-label={`Quitar ${opt.label}`}
                className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => onChange(value.filter((item) => item !== opt.value))}
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
