"use client";

import { memo, useMemo } from "react";
import { DataTable } from "@/shared/components/data-table/data-table";
import { buildCargasPublicasColumns } from "./cargas-publicas-columns";
import type { CargaRow } from "./cargas-publicas-model";

interface CargasPublicasTablaProps {
  readonly filas: CargaRow[];
  readonly readOnly: boolean;
  readonly onEdit: (index: number) => void;
  readonly onDelete: (index: number) => void;
  readonly extraActions?: React.ReactNode;
  readonly footer?: React.ReactNode;
}

/** Tabla de productos con el diseño compartido `DataTable`, con el estado
 * "faltan datos" por fila y las acciones editar/eliminar (solo en edición). */
function CargasPublicasTablaBase({
  filas,
  readOnly,
  onEdit,
  onDelete,
  extraActions,
  footer,
}: CargasPublicasTablaProps) {
  const columns = useMemo(
    () => buildCargasPublicasColumns({ readOnly, onEdit, onDelete }),
    [readOnly, onEdit, onDelete],
  );

  return (
    <DataTable
      columns={columns}
      data={filas}
      searchKeys={["descripcion"]}
      searchPlaceholder="Buscar producto..."
      showColumnToggle
      showPagination
      pageSize={10}
      extraActions={extraActions}
      footer={footer}
    />
  );
}

export const CargasPublicasTabla = memo(CargasPublicasTablaBase);
