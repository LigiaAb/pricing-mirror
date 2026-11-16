import { safeString } from "@/shared/lib/text";

export interface ComputeSplitTotalArgs {
  splitMode: boolean;
  matchMode: boolean;
  wchFlag: boolean;
  valFlag: boolean;
  taxFlag: boolean;
  tableTotal: number;
  valuationRaw: number;
  taxRaw: number;
  dueAgentTotal: number;
  dueCarrierTotal: number;
  totalGrand: number;
}

export function computeSplitTotal(args: ComputeSplitTotalArgs): number {
  const {
    splitMode,
    matchMode,
    wchFlag,
    valFlag,
    taxFlag,
    tableTotal,
    valuationRaw,
    taxRaw,
    dueAgentTotal,
    dueCarrierTotal,
    totalGrand,
  } = args;
  if (!splitMode) return matchMode ? totalGrand : 0;
  return (
    (wchFlag ? tableTotal : 0) +
    (valFlag ? valuationRaw : 0) +
    (taxFlag ? taxRaw : 0) +
    dueAgentTotal +
    dueCarrierTotal
  );
}

export function parseToNumber(v: unknown): number {
  if (v === undefined || v === null || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(safeString(v).replaceAll(",", "").trim());
  return Number.isFinite(n) ? n : 0;
}

export function formatNumber(v: unknown): string {
  const n = parseToNumber(v);
  if (n === 0) return "";
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}
