"use client";

import { ChevronDown, Search } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";
import {
  DEFAULT_LIMIT,
  formatVentaDisplay,
  MIN_SEARCH_LENGTH,
  SEARCH_LIMIT,
  type ServiceOption,
} from "../../lib/gastos-due";

interface ServiceAutocompleteProps {
  options: ServiceOption[];
  value: ServiceOption | null;
  onValueChange: (option: ServiceOption | null) => void;
  onSearchChange: (term: string) => void;
  searchText: string;
  helperText: string;
  disabled?: boolean;
}

export function ServiceAutocomplete({
  options,
  value,
  onValueChange,
  onSearchChange,
  searchText,
  helperText,
  disabled,
}: Readonly<ServiceAutocompleteProps>) {
  const [open, setOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchText);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSearch(searchText);
  }, [searchText]);

  const filteredOptions = (() => {
    const term = localSearch.trim().toLowerCase();
    if (!term) {
      return options.slice(0, DEFAULT_LIMIT);
    }
    if (term.length < MIN_SEARCH_LENGTH) return [];
    const matched = options.filter((o) => o.searchText.includes(term));
    return matched.slice(0, SEARCH_LIMIT);
  })();

  const grouped = (() => {
    const groups = new Map<string, ServiceOption[]>();
    for (const opt of filteredOptions) {
      const group = opt.rubroNombre ?? "Servicios";
      const arr = groups.get(group);
      if (arr) {
        arr.push(opt);
      } else {
        groups.set(group, [opt]);
      }
    }
    return groups;
  })();

  const handleSelect = (option: ServiceOption) => {
    onValueChange(option);
    setOpen(false);
    setLocalSearch("");
    onSearchChange("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalSearch(val);
    onSearchChange(val);
    if (!open) setOpen(true);
  };

  const needsMoreChars =
    localSearch.trim().length > 0 && localSearch.trim().length < MIN_SEARCH_LENGTH;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-1 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          onClick={() => {
            setOpen(!open);
            inputRef.current?.focus();
          }}
        >
          <span className="truncate">{value?.nombre ?? "Buscar servicio..."}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(90vw,520px)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b p-2">
          <div className="flex items-center gap-2 rounded-md border bg-card px-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={localSearch}
              onChange={handleInputChange}
              placeholder="Buscar servicio..."
              className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {needsMoreChars
              ? `Escribe al menos ${MIN_SEARCH_LENGTH} caracteres para buscar`
              : helperText}
          </p>
        </div>
        <ServicioDropdownList
          needsMoreChars={needsMoreChars}
          filteredOptions={filteredOptions}
          grouped={grouped}
          value={value}
          onSelect={handleSelect}
          listRef={listRef}
        />
      </PopoverContent>
    </Popover>
  );
}

interface ServicioDropdownListProps {
  needsMoreChars: boolean;
  filteredOptions: ServiceOption[];
  grouped: Map<string, ServiceOption[]>;
  value: ServiceOption | null;
  onSelect: (option: ServiceOption) => void;
  listRef: React.RefObject<HTMLDivElement | null>;
}

function ServicioDropdownList({
  needsMoreChars,
  filteredOptions,
  grouped,
  value,
  onSelect,
  listRef,
}: Readonly<ServicioDropdownListProps>) {
  if (needsMoreChars) {
    return (
      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
        Escribe al menos {MIN_SEARCH_LENGTH} caracteres
      </div>
    );
  }
  if (filteredOptions.length === 0) {
    return (
      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
        No se encontraron servicios
      </div>
    );
  }
  return (
    <div ref={listRef} className="max-h-90 overflow-y-auto p-0.5">
      {Array.from(grouped.entries()).map(([groupName, groupOptions]) => (
        <div key={groupName}>
          <div className="border-t bg-muted/50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {groupName}
          </div>
          {groupOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={cn(
                "flex w-full items-center justify-between px-2 py-1.5 text-left text-sm",
                "hover:bg-accent hover:text-accent-foreground",
                "border-b border-border/50 last:border-0",
                value?.key === option.key && "bg-accent",
              )}
              onClick={() => onSelect(option)}
            >
              <div className="min-w-0 flex-1 overflow-hidden pr-2">
                <div className="truncate text-sm">{option.nombre}</div>
                <div className="truncate text-xs text-muted-foreground">{option.siglas}</div>
              </div>
              <div className="w-23 shrink-0 text-right">
                <span className="text-sm font-semibold">{formatVentaDisplay(option.venta)}</span>
              </div>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
