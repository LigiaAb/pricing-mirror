import type {
  ReactTable,
  RowData,
  CellContext as TanStackCellContext,
  Column as TanStackColumn,
  ColumnDef as TanStackColumnDef,
  HeaderContext as TanStackHeaderContext,
  Row as TanStackRow,
  Table as TanStackTable,
} from "@tanstack/react-table";
import {
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table";

export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  globalFilteringFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});

type DataTableFeatures = typeof dataTableFeatures;

export type CellContext<TData extends RowData, TValue = unknown> = TanStackCellContext<
  DataTableFeatures,
  TData,
  TValue
>;
export type Column<TData extends RowData, TValue = unknown> = TanStackColumn<
  DataTableFeatures,
  TData,
  TValue
>;
export type ColumnDef<TData extends RowData, TValue = unknown> = TanStackColumnDef<
  DataTableFeatures,
  TData,
  TValue
>;
export type HeaderContext<TData extends RowData, TValue = unknown> = TanStackHeaderContext<
  DataTableFeatures,
  TData,
  TValue
>;
export type Row<TData extends RowData> = TanStackRow<DataTableFeatures, TData>;
export type Table<TData extends RowData> = TanStackTable<DataTableFeatures, TData>;
export type ReactDataTable<TData extends RowData> = ReactTable<DataTableFeatures, TData>;
