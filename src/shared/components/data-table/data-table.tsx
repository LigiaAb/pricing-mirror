"use client";

import {
  type ColumnFiltersState,
  type ColumnVisibilityState,
  flexRender,
  type PaginationState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Updater,
  useTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ArrowUpDown, RefreshCw } from "lucide-react";
import * as React from "react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  type Column,
  type ColumnDef,
  dataTableFeatures,
  type Row,
} from "@/shared/lib/tanstack-table";
import { cn } from "@/shared/lib/utils";
import { DataTableCabecera, DataTableSegmentos, type SegmentoTabla } from "./data-table-cabecera";
import { DENSIDAD_POR_DEFECTO, DENSIDADES, type DensidadTabla } from "./data-table-densidad";
import {
  EstadoError,
  EstadoSinResultados,
  EstadoVacio,
  FilasEsqueleto,
} from "./data-table-estados";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableSelectionBar } from "./data-table-selection-bar";
import { DataTableToolbar } from "./data-table-toolbar";

// Por encima de este número de filas visibles el cuerpo se virtualiza
// (scroll interno + solo filas en viewport montadas).
const VIRTUALIZATION_THRESHOLD = 100;
const ACTION_COLUMN_IDS = new Set(["acciones", "actions"]);

function getEmptyHeaderLabel(columnId: string) {
  if (ACTION_COLUMN_IDS.has(columnId)) return "Acciones";
  if (columnId === "seleccion") return "Selección";
  return undefined;
}

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  /** IDs de columnas donde debe buscar el buscador (filtro global sobre esas columnas). */
  searchKeys?: string[];
  searchPlaceholder?: string;
  /** Valor controlado opcionalmente para el buscador. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showColumnToggle?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  /** Enable server-side pagination and provide its current state and total row count. */
  manualPagination?: boolean;
  paginationState?: PaginationState;
  onPaginationStateChange?: (updater: Updater<PaginationState>) => void;
  rowCount?: number;
  footer?: React.ReactNode;
  /** Contenido a la izquierda del buscador en la barra de herramientas. */
  leadingActions?: React.ReactNode;
  /** Permite que el contenido de acciones iniciales use todo el ancho de la toolbar. */
  leadingActionsFullWidth?: boolean;
  /** Acción mostrada inmediatamente a la derecha del buscador. */
  searchAction?: React.ReactNode;
  extraActions?: React.ReactNode;
  /** Altura de fila. Ver `data-table-densidad.ts`. */
  density?: DensidadTabla;
  /** IDs de columnas con dato numérico: se alinean a la derecha con cifras tabulares. */
  numericColumns?: string[];
  /** Muestra el esqueleto de carga en lugar de las filas. */
  isLoading?: boolean;
  /** Muestra el estado de error en lugar de las filas. */
  hasError?: boolean;
  errorMessage?: React.ReactNode;
  /** Referencia técnica del fallo, para que el usuario pueda reportarlo. */
  errorReference?: string;
  /** Si se pasa, el estado de error ofrece reintentar. */
  onRetry?: () => void;
  /** Título del estado vacío; por defecto "Todavía no hay registros". */
  emptyTitle?: React.ReactNode;
  /** Mensaje mostrado cuando no hay filas; por defecto "No se encontraron resultados." */
  emptyMessage?: React.ReactNode;
  /** Acción del estado vacío (normalmente, crear el primer registro). */
  emptyAction?: React.ReactNode;
  /** Optional refresh handler shown left to the Columnas button */
  onRefresh?: () => void;
  /** If provided, shows a spinner on refresh button while true */
  isRefreshing?: boolean;
  /** Optional metadata to pass to the table instance */
  meta?: Record<string, unknown>;
  /** Habilita una columna de selección; también puede decidirlo por fila. */
  enableRowSelection?: boolean | ((row: Row<TData>) => boolean);
  /** Recibe los registros seleccionados cada vez que cambia la selección. */
  onSelectionChange?: (selectedRows: TData[]) => void;
  /** Muestra el checkbox de "seleccionar todas" en el encabezado. */
  enableSelectAll?: boolean;
  /** Selección controlada por el padre; si se omite, el estado es interno. */
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (rowSelection: RowSelectionState) => void;
  /** Acciones masivas de la barra contextual de selección. */
  bulkActions?: React.ReactNode;
  /** Título de la vista, dentro de la cabecera de marca. */
  title?: React.ReactNode;
  /** Línea de contexto junto al título (total, hora de actualización, …). */
  titleSummary?: React.ReactNode;
  /** Vistas rápidas de la cabecera; el filtrado lo resuelve el dominio. */
  segments?: SegmentoTabla[];
  activeSegment?: string;
  onSegmentChange?: (id: string) => void;
}

function isActionColumn<TData extends RowData>(column: ColumnDef<TData>) {
  return (
    (typeof column.id === "string" && ACTION_COLUMN_IDS.has(column.id)) ||
    ("accessorKey" in column &&
      typeof column.accessorKey === "string" &&
      ACTION_COLUMN_IDS.has(column.accessorKey))
  );
}

function orderActionColumnsLast<TData extends RowData>(columns: ColumnDef<TData>[]) {
  const actionColumns = columns.filter(isActionColumn);

  if (actionColumns.length === 0) return columns;

  return [...columns.filter((column) => !isActionColumn(column)), ...actionColumns];
}

function DataTableRow<TData extends RowData>({
  row,
  isSelected,
  densidad,
  esNumerica,
}: Readonly<{
  row: Row<TData>;
  isSelected: boolean;
  densidad: DensidadTabla;
  esNumerica: (columnId: string) => boolean;
}>) {
  // TanStack Table devuelve celdas y contextos con la misma referencia entre renders
  // aunque cambie el estado interno (p. ej. selección). React Compiler memoiza en base
  // a esas referencias y reutiliza los mismos elementos, por lo que los checkboxes de
  // fila nunca se repintaban al marcarlos.
  "use no memo";

  const escala = DENSIDADES[densidad];

  return (
    <TableRow
      data-state={isSelected && "selected"}
      className={cn(
        "group border-t border-b-0 border-border/60 transition-colors duration-150",
        "hover:bg-surface-1",
        isSelected &&
          "bg-brand-50 shadow-[inset_2px_0_0_hsl(var(--primary))] hover:bg-brand-100/60",
      )}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell
          key={cell.id}
          className={cn(
            escala.fila,
            escala.texto,
            "px-3.5 text-foreground/90 first:pl-4 last:pr-4",
            esNumerica(cell.column.id) && "tabular text-right",
            // La columna de acciones no envuelve: sus botones son un grupo, y al
            // estrecharse la columna caerían uno debajo de otro.
            ACTION_COLUMN_IDS.has(cell.column.id) && "w-px whitespace-nowrap",
          )}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  searchKeys,
  searchPlaceholder = "Buscar...",
  searchValue,
  onSearchChange,
  showColumnToggle = true,
  showPagination = true,
  pageSize = 10,
  manualPagination = false,
  paginationState,
  onPaginationStateChange,
  rowCount,
  footer,
  leadingActions,
  leadingActionsFullWidth = false,
  searchAction,
  extraActions,
  density = DENSIDAD_POR_DEFECTO,
  numericColumns,
  isLoading = false,
  hasError = false,
  errorMessage,
  errorReference,
  onRetry,
  emptyTitle = "Todavía no hay registros",
  emptyMessage = "No se encontraron resultados.",
  emptyAction,
  onRefresh,
  isRefreshing = false,
  meta,
  enableRowSelection = false,
  onSelectionChange,
  enableSelectAll = true,
  rowSelection: controlledRowSelection,
  onRowSelectionChange: setControlledRowSelection,
  bulkActions,
  title,
  titleSummary,
  segments,
  activeSegment,
  onSegmentChange,
}: Readonly<DataTableProps<TData>>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<ColumnVisibilityState>({});
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState("");
  const globalFilter = searchValue ?? internalGlobalFilter;
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({});
  const rowSelection = controlledRowSelection ?? internalRowSelection;
  const setRowSelection = setControlledRowSelection ?? setInternalRowSelection;
  const [internalPagination, setInternalPagination] = React.useState({ pageIndex: 0, pageSize });
  const pagination = paginationState ?? internalPagination;

  const columnasNumericas = React.useMemo(() => new Set(numericColumns ?? []), [numericColumns]);
  const esNumerica = React.useCallback(
    (columnId: string) => columnasNumericas.has(columnId),
    [columnasNumericas],
  );

  const tableColumns = React.useMemo<ColumnDef<TData>[]>(() => {
    const orderedColumns = orderActionColumnsLast(columns);

    if (!enableRowSelection) return orderedColumns;

    const selectionColumn: ColumnDef<TData> = {
      id: "seleccion",
      enableHiding: false,
      enableSorting: false,
      size: 36,
      ...(enableSelectAll && {
        header: ({ table }) => (
          <Checkbox
            aria-label="Seleccionar todas las filas"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(value === true)}
          />
        ),
      }),
      cell: ({ row }) => (
        <Checkbox
          aria-label={`Seleccionar fila ${row.index + 1}`}
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(value) => row.toggleSelected(value === true)}
        />
      ),
    };

    return [selectionColumn, ...orderedColumns];
  }, [columns, enableRowSelection, enableSelectAll]);

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns: tableColumns,
    enableRowSelection,
    defaultColumn: {
      filterFn: "includesString",
    },
    globalFilterFn: "includesString",
    ...(searchKeys && {
      getColumnCanGlobalFilter: (column) => searchKeys.includes(column.id),
    }),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: (updater) => {
      const next = typeof updater === "function" ? updater(globalFilter) : updater;
      onSearchChange?.(next);
      setInternalGlobalFilter(next);
    },
    onRowSelectionChange: (updater) =>
      setRowSelection(typeof updater === "function" ? updater(rowSelection) : updater),
    onPaginationChange: onPaginationStateChange ?? setInternalPagination,
    manualPagination,
    ...(rowCount !== undefined && { rowCount }),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      rowSelection,
      pagination,
    },
    ...(meta && { meta }),
  });

  const onSelectionChangeRef = React.useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;
  const lastSelectionSignatureRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    if (!enableRowSelection) {
      lastSelectionSignatureRef.current = undefined;
      return;
    }

    const selectedIds = new Set(Object.keys(rowSelection));
    const selectedRows = table
      .getCoreRowModel()
      .flatRows.filter((row) => selectedIds.has(row.id))
      .map((row) => ({ id: row.id, original: row.original }));

    const selectionSignature = selectedRows.map((row) => row.id).join("|");
    if (lastSelectionSignatureRef.current === selectionSignature) return;

    lastSelectionSignatureRef.current = selectionSignature;
    onSelectionChangeRef.current?.(selectedRows.map((row) => row.original));
  }, [enableRowSelection, rowSelection, table]);

  const rows = table.getRowModel().rows;
  const virtualizado = rows.length > VIRTUALIZATION_THRESHOLD;
  const seleccionadas = enableRowSelection ? Object.keys(rowSelection).length : 0;
  const totalFiltrado = table.getFilteredRowModel().rows.length;
  const hayFiltros = globalFilter.length > 0 || columnFilters.length > 0;

  const limpiarFiltros = React.useCallback(() => {
    table.setGlobalFilter("");
    setColumnFilters([]);
  }, [table]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => DENSIDADES[density].alturaEstimada,
    overscan: 10,
    enabled: virtualizado,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? virtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end ?? 0)
      : 0;

  const muestraFilas = !isLoading && !hasError && rows.length > 0;
  const muestraEstadoVacio = !isLoading && !hasError && rows.length === 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Cabecera de marca: título, toolbar y segmentos son un solo bloque azul
          con el `thead`, y `.tabla-marca` recolorea sus tokens en local. */}
      <div className="tabla-marca bg-brand-900 text-foreground">
        <DataTableCabecera titulo={title} resumen={titleSummary}>
          <DataTableToolbar
            table={table}
            showSearch={Boolean(searchKeys?.length)}
            searchPlaceholder={searchPlaceholder}
            searchValue={globalFilter}
            onSearchChange={(value) => table.setGlobalFilter(value)}
            showColumnToggle={showColumnToggle}
            leadingActions={leadingActions}
            leadingActionsFullWidth={leadingActionsFullWidth}
            searchAction={searchAction}
            extraActions={extraActions}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
          />
        </DataTableCabecera>

        {seleccionadas > 0 ? (
          <DataTableSelectionBar
            seleccionadas={seleccionadas}
            totalFiltrado={totalFiltrado}
            acciones={bulkActions}
            onSeleccionarTodos={() => table.toggleAllRowsSelected(true)}
            onLimpiar={() => table.toggleAllRowsSelected(false)}
          />
        ) : null}

        {segments && segments.length > 0 && (
          <DataTableSegmentos
            segmentos={segments}
            activo={activeSegment}
            onChange={onSegmentChange}
          />
        )}
      </div>

      <div
        ref={scrollRef}
        className={virtualizado ? "max-h-[70vh] overflow-auto" : "overflow-x-auto"}
      >
        <Table containerClassName="overflow-visible">
          <TableHeader className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="tabla-marca tabla-marca-thead border-y-0 border-t border-border bg-brand-900 hover:bg-brand-900"
              >
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const renderedHeader = header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext());
                  const emptyHeaderLabel = getEmptyHeaderLabel(header.column.id);

                  return (
                    <TableHead
                      key={header.id}
                      scope="col"
                      aria-sort={
                        sorted === "asc"
                          ? "ascending"
                          : sorted === "desc"
                            ? "descending"
                            : header.column.getCanSort()
                              ? "none"
                              : undefined
                      }
                      className={cn(
                        "h-9 px-3.5 text-[13px] leading-[18px] font-semibold uppercase tracking-[0.03em] text-muted-foreground first:pl-4 last:pr-4",
                        esNumerica(header.column.id) && "text-right",
                        ACTION_COLUMN_IDS.has(header.column.id) && "w-px whitespace-nowrap",
                      )}
                    >
                      {renderedHeader ||
                        (emptyHeaderLabel ? (
                          <span className="sr-only">{emptyHeaderLabel}</span>
                        ) : null)}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && <FilasEsqueleto columnas={tableColumns.length} densidad={density} />}

            {hasError && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={tableColumns.length} className="p-0">
                  <EstadoError
                    mensaje={errorMessage}
                    referencia={errorReference}
                    accion={
                      onRetry && (
                        <Button type="button" onClick={onRetry}>
                          <RefreshCw aria-hidden="true" />
                          Reintentar
                        </Button>
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            )}

            {muestraEstadoVacio && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={tableColumns.length} className="p-0">
                  {hayFiltros ? (
                    <EstadoSinResultados
                      total={data.length}
                      accion={
                        <Button type="button" variant="outline" onClick={limpiarFiltros}>
                          Limpiar filtros
                        </Button>
                      }
                    />
                  ) : (
                    <EstadoVacio titulo={emptyTitle} mensaje={emptyMessage} accion={emptyAction} />
                  )}
                </TableCell>
              </TableRow>
            )}

            {muestraFilas &&
              !virtualizado &&
              rows.map((row) => (
                <DataTableRow
                  key={row.id}
                  row={row}
                  isSelected={Boolean(rowSelection[row.id])}
                  densidad={density}
                  esNumerica={esNumerica}
                />
              ))}

            {muestraFilas && virtualizado && (
              <>
                {paddingTop > 0 && (
                  <tr>
                    <td colSpan={tableColumns.length} style={{ height: paddingTop, padding: 0 }} />
                  </tr>
                )}
                {virtualItems.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  if (!row) return null;
                  return (
                    <DataTableRow
                      key={row.id}
                      row={row}
                      isSelected={Boolean(rowSelection[row.id])}
                      densidad={density}
                      esNumerica={esNumerica}
                    />
                  );
                })}
                {paddingBottom > 0 && (
                  <tr>
                    <td
                      colSpan={tableColumns.length}
                      style={{ height: paddingBottom, padding: 0 }}
                    />
                  </tr>
                )}
              </>
            )}
          </TableBody>
        </Table>
        {footer}
      </div>

      {showPagination && (
        <div className="border-t border-border bg-surface-1">
          <DataTablePagination table={table} rowCount={manualPagination ? rowCount : undefined} />
        </div>
      )}
    </div>
  );
}

// Componente de header ordenable reutilizable
interface DataTableColumnHeaderProps<TData extends RowData, TValue> {
  column: Column<TData, TValue>;
  title: string | React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  icon,
  className,
}: Readonly<DataTableColumnHeaderProps<TData, TValue>>) {
  // TanStack Table conserva la misma referencia de `column` entre renders aunque
  // cambie su estado interno de orden. React Compiler memoiza en base a esa
  // referencia y reutiliza el mismo elemento, por lo que el ícono de orden nunca
  // se actualizaba al hacer clic (ver mismo caso en DataTableRow más arriba).
  "use no memo";

  if (!column.getCanSort()) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {icon}
        <span>{title}</span>
      </div>
    );
  }

  const sorted = column.getIsSorted();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        // En reposo no hay flecha: la columna es ordenable, pero no lo grita.
        // La doble flecha aparece al pasar por encima o al enfocar con teclado.
        // La tipografía repite la del `th` de la cabecera de marca; si no,
        // ordenable y no ordenable se leerían como dos escalas distintas.
        "group -ml-2 h-7 gap-1 px-2 text-[13px] leading-[18px] font-semibold uppercase tracking-[0.03em]",
        "text-muted-foreground hover:bg-transparent hover:text-foreground",
        sorted && "text-primary hover:text-primary",
        className,
      )}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {icon}
      <span>{title}</span>
      {sorted === "asc" && <ArrowUp aria-hidden="true" className="text-primary" />}
      {sorted === "desc" && <ArrowDown aria-hidden="true" className="text-primary" />}
      {!sorted && (
        <ArrowUpDown
          aria-hidden="true"
          className="opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60"
        />
      )}
    </Button>
  );
}
