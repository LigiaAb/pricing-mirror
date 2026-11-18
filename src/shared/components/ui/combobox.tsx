"use client";

import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import * as React from "react";
import { Button } from "@/shared/components/ui/button";
import { ComboboxList } from "@/shared/components/ui/combobox-list";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  popoverListClassName,
} from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string | undefined;
  icon?: React.ComponentType<{ className?: string }> | undefined;
  disabled?: boolean | undefined;
}

interface ComboboxProps {
  readonly id?: string | undefined;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly options: readonly ComboboxOption[];
  readonly ariaLabel?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly isLoading?: boolean | undefined;
  readonly placeholder?: string | undefined;
  readonly searchPlaceholder?: string | undefined;
  readonly emptyMessage?: string | undefined;
  readonly className?: string | undefined;
  readonly popoverClassName?: string | undefined;
  /** Mantener en `false` dentro de un diálogo modal evita que su scroll lock intercepte la rueda. */
  readonly portalled?: boolean | undefined;
  /** Elegir de nuevo la opción ya seleccionada la limpia (`onChange("")`). */
  readonly clearable?: boolean | undefined;
  readonly onBlur?: (() => void) | undefined;
  readonly ref?: React.Ref<HTMLButtonElement> | undefined;
  readonly "aria-invalid"?: boolean | undefined;
  readonly "aria-describedby"?: string | undefined;
}

/**
 * Select buscable para catálogos largos (países, etc.): un `<Select>` con
 * cientos de opciones sin filtro obliga a hacer scroll manual sobre una
 * ventana visual muy chica, lo que se siente lento y "trabado" al usarlo.
 *
 * Es el único selector buscable síncrono: lo usan tanto las pantallas sueltas
 * como los campos `select`/`combobox` de `FormBuilder`.
 */
export function Combobox({
  id,
  value,
  onChange,
  options,
  ariaLabel,
  disabled,
  isLoading = false,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin resultados",
  className,
  popoverClassName,
  portalled = true,
  clearable = false,
  onBlur,
  ref,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!disabled) setOpen(next);
        if (!next) onBlur?.();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          // Con el popover abierto el foco se va al buscador: ahí no es un blur del campo.
          onBlur={() => {
            if (!open) onBlur?.();
          }}
          aria-busy={isLoading}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            ariaInvalid && "border-destructive focus-visible:ring-destructive/20",
            className,
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected?.icon && <selected.icon className="size-4 shrink-0 opacity-60" />}
            <span className="truncate">{selected?.label ?? placeholder}</span>
          </span>
          {isLoading ? (
            <Loader2 className="ml-2 size-4 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        portalled={portalled}
        align="start"
        sideOffset={4}
        className={cn(popoverListClassName, "p-0", popoverClassName)}
      >
        <ComboboxList
          options={options}
          isSelected={(option) => option.value === value}
          onSelect={(option) => {
            setOpen(false);
            onChange(clearable && option.value === value ? "" : option.value);
          }}
          searchPlaceholder={searchPlaceholder}
          emptyMessage={emptyMessage}
          estimatedRowHeight={52}
          renderOption={(option, isSelected) => (
            <>
              {option.icon && <option.icon className="mt-0.5 size-4 shrink-0 opacity-60" />}
              <span className="min-w-0 flex-1">
                <span className="block wrap-anywhere">{option.label}</span>
                {option.description ? (
                  <span className="block wrap-anywhere text-xs text-muted-foreground">
                    {option.description}
                  </span>
                ) : null}
              </span>
              <Check
                className={cn(
                  "ml-auto mt-0.5 size-4 shrink-0 text-primary",
                  isSelected ? "opacity-100" : "opacity-0",
                )}
              />
            </>
          )}
        />
      </PopoverContent>
    </Popover>
  );
}
