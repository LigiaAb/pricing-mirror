"use client";

import {
  useListarCoordinacionGastosCriterio,
  useObtenerUltimaVersionCoordinacionGastos,
} from "@/features/gastos";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { DataTable, DataTableColumnHeader } from "@/shared/components/data-table/data-table";
import type { CellContext, ColumnDef, HeaderContext } from "@/shared/lib/tanstack-table";
import { asNumber, asText } from "@/shared/lib/text";

function CampoHeader({ column }: HeaderContext<GastoCriterioRow, unknown>) {
  return <DataTableColumnHeader column={column} title="Campo" />;
}

function CampoCell({ row }: CellContext<GastoCriterioRow, unknown>) {
  return <span className="font-medium">{row.original.campo}</span>;
}

function ValorHeader({ column }: HeaderContext<GastoCriterioRow, unknown>) {
  return <DataTableColumnHeader column={column} title="Valor" className="justify-end" />;
}

function ValorCell({ row }: CellContext<GastoCriterioRow, unknown>) {
  return <div className="text-right tabular-nums">{formatCurrency(row.original.valor)}</div>;
}

interface GastoCriterioRow {
  campo: string;
  valor: number;
}

interface TablaGastosCriterioProps {
  readonly embarqueId?: string | number | null;
}

function toNumber(val: unknown): number {
  if (val === null || val === undefined || val === "") return 0;
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

function formatCurrency(val: number | string): string {
  const n = typeof val === "string" ? Number.parseFloat(val) : val;
  if (Number.isNaN(n)) return "$0.00";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TablaGastosCriterio({ embarqueId }: TablaGastosCriterioProps) {
  const { data: ultimaVersionData, isSuccess: versionLoaded } =
    useObtenerUltimaVersionCoordinacionGastos(embarqueId ?? undefined);

  const embarqueVersion = ultimaVersionData?.embarque_version ?? null;

  const {
    data: criterios = [],
    isFetching,
    refetch,
  } = useListarCoordinacionGastosCriterio({
    embarque_id: asNumber(embarqueId),
    embarque_version: embarqueVersion,
    enabled: Boolean(embarqueId && versionLoaded),
  });

  const rows: GastoCriterioRow[] = (criterios ?? []).map((c) => ({
    campo: asText(c.criterioCampo),
    valor: toNumber(c.valor),
  }));

  const total = rows.reduce((sum, r) => sum + r.valor, 0);

  const columns: ColumnDef<GastoCriterioRow>[] = [
    {
      accessorKey: "campo",
      header: CampoHeader,
      cell: CampoCell,
    },
    {
      accessorKey: "valor",
      header: ValorHeader,
      cell: ValorCell,
    },
  ];

  if (!embarqueId) {
    return (
      <BannerInformativo
        severidad="warning"
        titulo="Sin embarque"
        mensaje="No hay identificador de embarque."
      />
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Gastos por criterio</h3>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">
            Total: <strong>{formatCurrency(total)}</strong>
          </span>
        )}
      </div>
      <DataTable
        columns={columns}
        data={rows}
        searchKeys={["campo"]}
        searchPlaceholder="Buscar por campo..."
        showPagination
        pageSize={5}
        showColumnToggle={false}
        onRefresh={refetch}
        isRefreshing={isFetching}
      />
    </div>
  );
}
