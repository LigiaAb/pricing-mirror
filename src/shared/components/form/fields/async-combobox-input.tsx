"use client";

import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  popoverListClassName,
} from "@/shared/components/ui/popover";
import { normalizarBusqueda } from "@/shared/lib/text";
import { cn } from "@/shared/lib/utils";

type Key = string | number;

export interface AsyncComboboxInputProps<T> {
  id?: string | undefined;
  label?: string | undefined;
  value: T | null;
  onChange: (value: T | null) => void;
  fetchOptions: (search: string, signal?: AbortSignal) => Promise<T[]>;
  /** Clave de caché compartida; sin ella cada instancia cachea por separado. */
  queryKey?: string;
  getOptionValue: (option: T) => Key;
  getOptionLabel: (option: T) => string;
  getOptionDescription?: (option: T) => string | undefined;
  searchFields?: (keyof T)[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  readOnly?: boolean;
  clearable?: boolean;
  minSearchLength?: number;
  debounceMs?: number;
  fetchOnEmpty?: boolean;
  initialOptions?: T[];
  /** Máximo de opciones dibujadas a la vez (el listado no se virtualiza). Por defecto 100. */
  maxOptions?: number;
  className?: React.ComponentProps<"div">["className"];
  contentClassName?: React.ComponentProps<"div">["className"];
  onBlur?: (() => void) | undefined;
  ref?: React.Ref<HTMLButtonElement> | undefined;
  "aria-invalid"?: boolean | undefined;
  "aria-describedby"?: string | undefined;
}

/** Constante para que el default de `searchFields` no sea un arreglo nuevo en cada render. */
const SIN_CAMPOS_BUSQUEDA: never[] = [];

const MAX_OPCIONES_DEFAULT = 100;

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}

export function AsyncComboboxInput<T>({
  id,
  label,
  value,
  onChange,
  fetchOptions,
  queryKey,
  getOptionValue,
  getOptionLabel,
  getOptionDescription,
  searchFields = SIN_CAMPOS_BUSQUEDA,
  placeholder = "Seleccione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin resultados.",
  disabled = false,
  readOnly = false,
  clearable = true,
  minSearchLength = 0,
  debounceMs = 300,
  fetchOnEmpty = true,
  initialOptions,
  maxOptions = MAX_OPCIONES_DEFAULT,
  className,
  contentClassName,
  onBlur,
  ref,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: Readonly<AsyncComboboxInputProps<T>>) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const debouncedQuery = useDebouncedValue(query, debounceMs);
  const isBlocked = disabled || readOnly;
  const search = debouncedQuery.trim();

  /*
   * fetchOptions suele declararse inline en los consumidores: guardarlo en un
   * ref evita que su cambio de referencia invalide la consulta en cada render.
   * Sin `queryKey` explícito la caché es por instancia; con él se comparte
   * entre todos los selectores que consulten lo mismo.
   *
   * Como la caché no se entera de que fetchOptions cambió:
   *   - Solo se consulta con el listado abierto (antes cada combo consultaba al
   *     montarse, a veces antes de que sus opciones hubieran cargado).
   *   - Al abrir, si las opciones guardadas se obtuvieron con otro fetchOptions
   *     (o con ninguno de esta instancia), se marcan como viejas y se vuelven a
   *     pedir. Si no, se usa la caché (30 s): un fetchOptions memoizado que busca
   *     en el servidor no consulta de nuevo cada vez que se abre. Sin esto el combo
   *     seguía mostrando la lista anterior (vacía si el catálogo aún no cargaba,
   *     o la de otro filtro: países de otro continente, commodities ya asignados).
   *     Mientras llega la respuesta se ve lo último (keepPreviousData).
   */
  const queryClient = useQueryClient();
  const fetchOptionsRef = React.useRef(fetchOptions);
  fetchOptionsRef.current = fetchOptions;
  const fetchOptionsUsadaRef = React.useRef<typeof fetchOptions | null>(null);
  const instanceKey = React.useId();
  const cacheKey = queryKey ?? instanceKey;

  const optionsQuery = useQuery({
    queryKey: ["async-combobox", cacheKey, search],
    queryFn: ({ signal }) => {
      const fetchActual = fetchOptionsRef.current;
      fetchOptionsUsadaRef.current = fetchActual;
      return fetchActual(search, signal);
    },
    enabled: open && !isBlocked && (fetchOnEmpty || search.length >= minSearchLength),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: false,
    // El error se muestra dentro del propio listado, no como toast global.
    meta: { silent: true },
  });

  const options = React.useMemo(
    () => (Array.isArray(optionsQuery.data) ? optionsQuery.data : (initialOptions ?? [])),
    [optionsQuery.data, initialOptions],
  );
  const isFetching = optionsQuery.isFetching;
  const fetchError = optionsQuery.error
    ? optionsQuery.error instanceof Error
      ? optionsQuery.error.message
      : "Error al cargar opciones"
    : null;

  const filteredOptions = React.useMemo(() => {
    const normalizedQuery = normalizarBusqueda(query.trim());

    if (!normalizedQuery) return options;

    return options.filter((option) => {
      const extraValues = searchFields.map((field) => option[field]);
      const searchableText = normalizarBusqueda(
        [getOptionLabel(option), getOptionValue(option), ...extraValues].join(" "),
      );

      return searchableText.includes(normalizedQuery);
    });
  }, [getOptionLabel, getOptionValue, options, query, searchFields]);

  // Dibujar miles de opciones congela el listado: se muestran las primeras y se busca al escribir.
  const visibleOptions = React.useMemo(
    () => filteredOptions.slice(0, maxOptions),
    [filteredOptions, maxOptions],
  );
  const hiddenCount = filteredOptions.length - visibleOptions.length;

  const selectedLabel = value ? getOptionLabel(value) : "";
  const canClear = clearable && value !== null && !isBlocked;

  const selectOption = (option: T) => {
    const alreadySelected =
      value !== null && String(getOptionValue(value)) === String(getOptionValue(option));

    onChange(alreadySelected && clearable ? null : option);
    setQuery("");
    setOpen(false);
  };

  const clearValue = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onChange(null);
    setQuery("");
  };

  const message = fetchError
    ? fetchError
    : isFetching
      ? "Cargando..."
      : !fetchOnEmpty && query.trim().length < minSearchLength
        ? `Ingrese al menos ${minSearchLength} caracteres.`
        : emptyMessage;

  return (
    <div className={cn("w-full", className)}>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen && !isBlocked && fetchOptionsUsadaRef.current !== fetchOptionsRef.current) {
            // Solo marca como viejas; la consulta sale al habilitarse con el listado abierto.
            void queryClient.invalidateQueries({
              queryKey: ["async-combobox", cacheKey],
              refetchType: "none",
            });
          }
          if (!isBlocked) setOpen(nextOpen);
          if (!nextOpen) onBlur?.();
        }}
      >
        <div className="relative w-full">
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              id={id}
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedBy}
              type="button"
              variant="outline"
              role="combobox"
              aria-label={label}
              aria-expanded={open}
              onBlur={() => {
                if (!open) onBlur?.();
              }}
              disabled={isBlocked}
              className={cn(
                "h-9 w-full justify-between font-normal",
                !value && "text-muted-foreground",
                ariaInvalid && "border-destructive focus-visible:ring-destructive/20",
                canClear && "pr-16",
              )}
            >
              <span className="min-w-0 flex-1 truncate text-left">
                {selectedLabel || placeholder}
              </span>

              <span className="ml-2 flex shrink-0 items-center gap-1">
                {isFetching && <Loader2 className="size-4 animate-spin opacity-60" />}

                <ChevronsUpDown className="size-4 opacity-50" />
              </span>
            </Button>
          </PopoverTrigger>

          {canClear && (
            <button
              type="button"
              aria-label="Limpiar selección"
              tabIndex={-1}
              onClick={clearValue}
              className="absolute right-8 top-1/2 z-10 -translate-y-1/2 rounded-sm hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <PopoverContent
          className={cn(popoverListClassName, "p-0", contentClassName)}
          align="start"
          sideOffset={4}
        >
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder={searchPlaceholder}
              className="h-9"
            />

            <CommandList>
              <CommandEmpty>{message}</CommandEmpty>

              <CommandGroup>
                {visibleOptions.map((option) => {
                  const optionValue = String(getOptionValue(option));
                  const selected = value !== null && String(getOptionValue(value)) === optionValue;
                  const description = getOptionDescription?.(option);

                  return (
                    <CommandItem
                      key={optionValue}
                      value={optionValue}
                      onSelect={() => selectOption(option)}
                      className="items-start"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="wrap-anywhere">{getOptionLabel(option)}</p>

                        {description && (
                          <p className="wrap-anywhere text-xs text-muted-foreground">
                            {description}
                          </p>
                        )}
                      </div>

                      <Check
                        className={cn(
                          "ml-auto mt-0.5 size-4 shrink-0 text-primary",
                          selected ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>

              {hiddenCount > 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Se muestran {visibleOptions.length} de {filteredOptions.length}. Escriba para
                  buscar.
                </p>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
