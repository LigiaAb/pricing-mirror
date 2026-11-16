"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { Coordinacion } from "@/features/coordinaciones";
import { DataTable } from "@/shared/components/data-table/data-table";
import { encodeId } from "@/shared/lib/sqids";
import { coordinacionesColumns } from "./coordinaciones-columns";

interface CoordinacionesListProps {
  readonly data: Coordinacion[];
  readonly onRefresh?: () => void;
  readonly isRefreshing?: boolean;
}

const noopRefresh = () => {};

export function CoordinacionesList({
  data,
  onRefresh,
  isRefreshing = false,
}: CoordinacionesListProps) {
  const router = useRouter();

  const handleView = useCallback(
    (row: Coordinacion) => {
      const id = row.embarqueId;
      if (id) {
        router.push(`/embarques/embarques/gestion-embarques/${encodeId(Number(id))}`);
      }
    },
    [router],
  );

  const columns = useMemo(() => coordinacionesColumns({ handleView }), [handleView]);

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={data}
        searchKeys={["cod_file"]}
        searchPlaceholder="Buscar por código de archivo..."
        showPagination
        pageSize={10}
        onRefresh={onRefresh ?? noopRefresh}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}
