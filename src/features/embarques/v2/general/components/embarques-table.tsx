"use client";

import { Eye } from "lucide-react";
import * as React from "react";
import { DataTable, DataTableColumnHeader } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import { pasoTrackingDe } from "../../shared/lib/operacion";
import type { EmbarqueMaqueta } from "../../shared/lib/tipos";
import { operacionDeEmbarque } from "../lib/registro-operaciones";

/** "3/6 · Bodega" con los pasos de la operación del embarque (solo el número si no está definida). */
function textoPaso(embarque: EmbarqueMaqueta): string {
  const operacion = operacionDeEmbarque(embarque);
  if (!operacion) return String(embarque.pasoActual);
  const corto = pasoTrackingDe(operacion, embarque.pasoActual)?.corto ?? "";
  return `${embarque.pasoActual}/${operacion.pasos.length} · ${corto}`;
}

function crearColumnas({
  seleccionado,
  onVer,
}: {
  seleccionado: EmbarqueMaqueta | null;
  onVer: (embarque: EmbarqueMaqueta) => void;
}): ColumnDef<EmbarqueMaqueta>[] {
  return [
    {
      accessorKey: "codFile",
      header: ({ column }) => <DataTableColumnHeader column={column} title="File" />,
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "cliente",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
      enableSorting: true,
    },
    {
      accessorKey: "tipoTransporte",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Transporte" />,
      enableSorting: true,
    },
    {
      accessorKey: "origen",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Origen" />,
      enableSorting: true,
    },
    {
      accessorKey: "destino",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Destino" />,
      enableSorting: true,
    },
    {
      accessorKey: "etd",
      header: ({ column }) => <DataTableColumnHeader column={column} title="ETD" />,
      enableSorting: true,
    },
    {
      accessorKey: "eta",
      header: ({ column }) => <DataTableColumnHeader column={column} title="ETA" />,
      enableSorting: true,
    },
    {
      accessorKey: "pasoActual",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Paso" />,
      enableSorting: true,
      cell: ({ row }) => <span className="text-nowrap">{textoPaso(row.original)}</span>,
    },
    {
      accessorKey: "estado",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
      enableSorting: true,
    },
    {
      id: "acciones",
      header: "Acciones",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const embarque = row.original;
        const activo = seleccionado?.id === embarque.id;

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              size="icon"
              variant={activo ? "default" : "ghost"}
              aria-label={`Ver embarque ${embarque.codFile}`}
              onClick={() => onVer(embarque)}
            >
              <Eye className="size-4" aria-hidden="true" />
            </Button>
          </div>
        );
      },
    },
  ];
}

export function EmbarquesTable({
  data,
  seleccionado,
  onSeleccionar,
  filtro,
}: {
  data: EmbarqueMaqueta[];
  seleccionado: EmbarqueMaqueta | null;
  onSeleccionar: (embarque: EmbarqueMaqueta) => void;
  filtro?: React.ReactNode;
}) {
  const columns = React.useMemo(
    () => crearColumnas({ seleccionado, onVer: onSeleccionar }),
    [seleccionado, onSeleccionar],
  );

  return (
    <DataTable
      title="Embarques"
      columns={columns}
      data={data}
      searchKeys={["codFile", "cliente", "tipoTransporte", "origen", "destino", "estado"]}
      searchPlaceholder="Buscar embarque…"
      emptyTitle="No hay embarques"
      emptyMessage="No se encontraron embarques."
      extraActions={filtro}
    />
  );
}
