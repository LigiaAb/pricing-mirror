/* STUB del repo espejo: solo tipos para verificar pricing/embarques. NO copiar al proyecto real. */
/* Envuelve ColumnDef de react-table 9 (pide TFeatures) con un solo genérico, como en el proyecto. */
import type { CellData, ColumnDef as ColumnDefV9, RowData, StockFeatures } from "@tanstack/react-table";

export type ColumnDef<TData extends RowData, TValue extends CellData = CellData> = ColumnDefV9<
  StockFeatures,
  TData,
  TValue
>;
