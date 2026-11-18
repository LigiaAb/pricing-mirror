"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Search } from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useId, useMemo, useRef, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  commandInputClassName,
  commandInputWrapperClassName,
  commandItemClassName,
} from "@/shared/components/ui/command";
import { deduplicarOpciones } from "@/shared/lib/array";
import { normalizarBusqueda } from "@/shared/lib/text";
import { cn } from "@/shared/lib/utils";

export interface ComboboxListOption {
  value: string;
  label: string;
  description?: string | undefined;
  disabled?: boolean | undefined;
}

/**
 * Por debajo de este tamaño conviene montar todas las filas: `cmdk` aporta
 * scoring difuso, type-ahead y navegación por teclado ya probados, y el costo
 * de unos cientos de nodos simples es imperceptible. Por encima, montarlas
 * todas congela el hilo principal al abrir el popover.
 */
const VIRTUALIZE_THRESHOLD = 1000;
const OVERSCAN = 12;

function textoBuscable(option: ComboboxListOption): string {
  return normalizarBusqueda(`${option.value} ${option.label} ${option.description ?? ""}`);
}

interface ComboboxListProps<T extends ComboboxListOption> {
  readonly options: readonly T[];
  readonly isSelected: (option: T) => boolean;
  readonly onSelect: (option: T) => void;
  readonly renderOption: (option: T, selected: boolean) => ReactNode;
  readonly searchPlaceholder?: string;
  readonly emptyMessage?: string;
  /** Nombre accesible del listado; `cmdk` pondría "Suggestions" en inglés. */
  readonly listLabel?: string;
  /** Estimación inicial de alto de fila; solo afecta al camino virtualizado. */
  readonly estimatedRowHeight?: number;
  /** Barra fija bajo el listado (contador, "Limpiar", …). */
  readonly footer?: ReactNode;
}

/**
 * Cuerpo compartido de los selectores buscables (`Combobox`, `ComboboxInput`,
 * `MultiSelect`): caja de búsqueda + listado filtrable, virtualizado solo
 * cuando hace falta. La presentación de cada fila la pone quien lo usa.
 */
export function ComboboxList<T extends ComboboxListOption>(props: ComboboxListProps<T>) {
  // El API repite registros y ningún llamador lo garantiza: sin deduplicar, un
  // `value` repetido produce keys duplicadas en React y una elección ambigua.
  const options = useMemo(() => deduplicarOpciones(props.options), [props.options]);

  return options.length > VIRTUALIZE_THRESHOLD ? (
    <VirtualizedOptions {...props} options={options} />
  ) : (
    <StandardOptions {...props} options={options} />
  );
}

function StandardOptions<T extends ComboboxListOption>({
  options,
  isSelected,
  onSelect,
  renderOption,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin resultados",
  listLabel = "Opciones",
  footer,
}: ComboboxListProps<T>) {
  return (
    <Command>
      <CommandInput placeholder={searchPlaceholder} className="h-9" />
      <CommandList label={listLabel}>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              key={option.value}
              value={option.label}
              keywords={[option.value, option.description ?? ""]}
              disabled={!!option.disabled}
              onSelect={() => onSelect(option)}
              className="items-start"
            >
              {renderOption(option, isSelected(option))}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      {footer}
    </Command>
  );
}

/** Primer índice navegable: la opción ya elegida si sigue visible, si no la primera habilitada. */
function indiceInicial<T extends ComboboxListOption>(
  options: readonly T[],
  isSelected: (option: T) => boolean,
): number {
  const elegido = options.findIndex((option) => !option.disabled && isSelected(option));
  return elegido >= 0 ? elegido : options.findIndex((option) => !option.disabled);
}

/**
 * Listado virtualizado con teclado propio.
 *
 * No usa `cmdk` aquí a propósito: su navegación recorre `querySelectorAll` sobre
 * el DOM montado, así que con virtualización las flechas se topan con el borde
 * de la ventana renderizada (~20 filas) y dejan de avanzar. Además fija
 * `aria-activedescendant` por su cuenta, sin dejar corregirlo desde fuera. Aquí
 * el índice activo vive en estado y arrastra al virtualizador con `scrollToIndex`.
 */
function VirtualizedOptions<T extends ComboboxListOption>({
  options,
  isSelected,
  onSelect,
  renderOption,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin resultados",
  listLabel = "Opciones",
  estimatedRowHeight = 40,
  footer,
}: ComboboxListProps<T>) {
  const [search, setSearch] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const listId = `${baseId}-list`;
  const opcionId = (indice: number) => `${baseId}-option-${indice}`;

  const filtradas = useMemo(() => {
    const aguja = normalizarBusqueda(search.trim());
    if (!aguja) return options;
    return options.filter((option) => textoBuscable(option).includes(aguja));
  }, [options, search]);

  const [activo, setActivo] = useState(() => indiceInicial(options, isSelected));
  // Reajuste de estado durante el render: al cambiar el filtro el índice
  // anterior apunta a otra opción (o a ninguna). Un efecto pintaría un frame
  // con el resaltado en la fila equivocada. Se compara la búsqueda y no la
  // identidad de `filtradas` porque varios llamadores arman `options` en línea:
  // el array cambia en cada render del padre y el resaltado saltaría solo.
  const [busquedaPrevia, setBusquedaPrevia] = useState(search);
  if (busquedaPrevia !== search) {
    setBusquedaPrevia(search);
    setActivo(indiceInicial(filtradas, isSelected));
  }

  const virtualizer = useVirtualizer({
    count: filtradas.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan: OVERSCAN,
  });

  /** Siguiente índice habilitado en la dirección dada; se queda quieto si no hay. */
  const buscarHabilitado = (desde: number, paso: number) => {
    for (let i = desde + paso; i >= 0 && i < filtradas.length; i += paso) {
      if (!filtradas[i]?.disabled) return i;
    }
    return desde;
  };

  const irA = (indice: number) => {
    if (indice < 0 || indice >= filtradas.length) return;
    setActivo(indice);
    virtualizer.scrollToIndex(indice, { align: "auto" });
  };

  const manejarTeclado = (evento: KeyboardEvent<HTMLInputElement>) => {
    switch (evento.key) {
      case "ArrowDown":
        evento.preventDefault();
        irA(buscarHabilitado(activo, 1));
        break;
      case "ArrowUp":
        evento.preventDefault();
        irA(buscarHabilitado(activo, -1));
        break;
      case "Home":
        evento.preventDefault();
        irA(buscarHabilitado(-1, 1));
        break;
      case "End":
        evento.preventDefault();
        irA(buscarHabilitado(filtradas.length, -1));
        break;
      case "Enter": {
        evento.preventDefault();
        const opcion = filtradas[activo];
        if (opcion && !opcion.disabled) onSelect(opcion);
        break;
      }
      default:
        break;
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
      <div className={commandInputWrapperClassName}>
        <Search className="mr-2 size-4 shrink-0 opacity-50" aria-hidden="true" />
        <input
          className={cn(commandInputClassName, "h-9")}
          type="text"
          role="combobox"
          aria-expanded
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={filtradas[activo] ? opcionId(activo) : undefined}
          placeholder={searchPlaceholder}
          value={search}
          autoComplete="off"
          spellCheck={false}
          onKeyDown={manejarTeclado}
          onChange={(evento) => {
            setSearch(evento.target.value);
            listRef.current?.scrollTo({ top: 0 });
          }}
        />
      </div>
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={listLabel}
        className="max-h-75 min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-1"
      >
        {filtradas.length === 0 ? (
          <div className="py-6 text-center text-sm" role="status">
            {emptyMessage}
          </div>
        ) : (
          <div className="relative" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((fila) => {
              const option = filtradas[fila.index];
              if (!option) return null;

              return (
                <div
                  key={option.value}
                  data-index={fila.index}
                  ref={virtualizer.measureElement}
                  className="absolute left-0 top-0 w-full px-1"
                  style={{ transform: `translateY(${fila.start}px)` }}
                >
                  {/* biome-ignore lint/a11y/useFocusableInteractive: en el patrón aria-activedescendant las opciones NO deben ser focusables; el foco se queda en el input de búsqueda. */}
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: el teclado lo maneja el input, que es donde vive el foco. */}
                  <div
                    id={opcionId(fila.index)}
                    role="option"
                    aria-selected={fila.index === activo}
                    aria-disabled={!!option.disabled}
                    data-selected={fila.index === activo}
                    data-disabled={!!option.disabled}
                    className={cn(commandItemClassName, "items-start")}
                    onClick={() => {
                      if (!option.disabled) onSelect(option);
                    }}
                    onPointerMove={() => {
                      if (!option.disabled) setActivo(fila.index);
                    }}
                  >
                    {renderOption(option, isSelected(option))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {footer}
    </div>
  );
}
