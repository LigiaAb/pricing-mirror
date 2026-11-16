"use client";

import { AlertTriangle, CheckCircle2, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import { asNumber, asText } from "@/shared/lib/text";
import type { CargaRow } from "./cargas-publicas-model";
import { getCamposFaltantesCarga } from "./validation";

interface BuildCargasPublicasColumnsParams {
  readonly readOnly: boolean;
  readonly onEdit: (index: number) => void;
  readonly onDelete: (index: number) => void;
}

/** Columnas de la tabla de productos (wizard público / detalle CTS). */
export function buildCargasPublicasColumns({
  readOnly,
  onEdit,
  onDelete,
}: BuildCargasPublicasColumnsParams): ColumnDef<CargaRow>[] {
  const accionesColumn: ColumnDef<CargaRow> = {
    id: "acciones",
    header: "",
    cell: ({ row }) =>
      readOnly ? (
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Ver producto"
          title="Ver producto"
          onClick={() => onEdit(row.index)}
        >
          <Eye className="size-4" />
        </Button>
      ) : (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Editar producto"
            title="Editar producto"
            onClick={() => onEdit(row.index)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive"
            aria-label="Eliminar producto"
            title="Eliminar producto"
            onClick={() => onDelete(row.index)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    enableSorting: false,
    enableHiding: false,
    size: 30,
  };

  return [
    accionesColumn,
    {
      id: "estado",
      header: "",
      cell: ({ row }) => {
        const faltantes = getCamposFaltantesCarga(row.original);
        const completa = faltantes.length === 0;
        return completa ? (
          <CheckCircle2 className="size-4 text-emerald-500" aria-label="Completo" />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertTriangle className="size-4 text-amber-500" aria-label="Faltan datos" />
            </TooltipTrigger>
            <TooltipContent className="text-xs">Faltan: {faltantes.join(", ")}</TooltipContent>
          </Tooltip>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 30,
    },
    {
      id: "descripcion",
      header: "Descripción",
      accessorKey: "descripcion",
      enableSorting: false,
      cell: ({ getValue }) => (
        <span className="max-w-70 truncate" title={asText(getValue())}>
          {asText(getValue()) || "—"}
        </span>
      ),
    },
    {
      id: "valor",
      header: "Valor",
      accessorKey: "valor",
      enableSorting: false,
      cell: ({ getValue }) => <span>{asText(getValue()) || "—"}</span>,
    },
    {
      id: "cantidad",
      header: "# Bultos",
      accessorKey: "cantidad",
      enableSorting: false,
      cell: ({ getValue }) => <span>{asText(getValue()) || "—"}</span>,
    },
    {
      id: "pesoTotal",
      header: "Peso (kg)",
      accessorKey: "pesoTotal",
      enableSorting: false,
      cell: ({ getValue }) => <span>{asText(getValue()) || "—"}</span>,
    },
    {
      id: "cw",
      header: "CW (kg)",
      accessorKey: "cw",
      enableSorting: false,
      cell: ({ getValue }) => {
        const cw = asNumber(getValue());
        return <span>{cw > 0 ? cw.toFixed(2) : "—"}</span>;
      },
    },
  ];
}
