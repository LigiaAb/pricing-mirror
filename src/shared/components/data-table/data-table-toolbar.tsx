"use client";
"use no memo";

import type { RowData } from "@tanstack/react-table";
import { ChevronDown, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import type * as React from "react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Input } from "@/shared/components/ui/input";
import type { ReactDataTable } from "@/shared/lib/tanstack-table";

interface DataTableToolbarProps<TData extends RowData> {
  table: ReactDataTable<TData>;
  showSearch: boolean;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  showColumnToggle: boolean;
  leadingActions?: React.ReactNode;
  leadingActionsFullWidth?: boolean;
  searchAction?: React.ReactNode;
  extraActions?: React.ReactNode;
  onRefresh?: (() => void) | undefined;
  isRefreshing: boolean;
}

/**
 * Toolbar en reposo: el material es la propia tarjeta y los controles auxiliares
 * son fantasma. Lo único que puede llevar relleno de marca es la acción primaria
 * que inyecte el dominio por `extraActions`.
 */
export function DataTableToolbar<TData extends RowData>({
  table,
  showSearch,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  showColumnToggle,
  leadingActions,
  leadingActionsFullWidth = false,
  searchAction,
  extraActions,
  onRefresh,
  isRefreshing,
}: Readonly<DataTableToolbarProps<TData>>) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {leadingActions && (
        <div
          className={
            leadingActionsFullWidth
              ? "flex min-w-0 flex-1 items-center gap-2"
              : "flex shrink-0 items-center gap-2"
          }
        >
          {leadingActions}
        </div>
      )}

      {showSearch && (
        <div className="flex min-w-0 flex-1 gap-2 sm:max-w-sm">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 stroke-[1.75px] text-muted-foreground"
            />
            <Input
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-9 border-border bg-surface-1 pr-9 pl-8 text-[14px] shadow-none md:text-[14px] focus-visible:ring-2"
            />
            {searchValue.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => onSearchChange("")}
                aria-label="Limpiar búsqueda"
              >
                <X aria-hidden="true" />
              </Button>
            )}
          </div>
          {searchAction}
        </div>
      )}

      {(extraActions || onRefresh || showColumnToggle) && (
        <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
          {onRefresh && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="Refrescar"
              title="Refrescar"
              aria-busy={isRefreshing}
            >
              <RefreshCw aria-hidden="true" className={isRefreshing ? "animate-spin" : undefined} />
            </Button>
          )}

          {showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <SlidersHorizontal aria-hidden="true" />
                  Columnas
                  <ChevronDown aria-hidden="true" className="opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48 p-1.5">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="rounded-md capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id.replaceAll("_", " ")}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {extraActions && (onRefresh || showColumnToggle) && (
            <div aria-hidden="true" className="mx-0.5 h-5 w-px bg-border" />
          )}

          {extraActions}
        </div>
      )}
    </div>
  );
}
