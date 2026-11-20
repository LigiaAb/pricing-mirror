"use client";

import { Eye } from "lucide-react";
import type { useRouter } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { formatearFechaHora } from "@/shared/lib/date";
import { encodeId } from "@/shared/lib/sqids";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { Actividad } from "../../api/actividades";

export function actividadesColumns(router: ReturnType<typeof useRouter>): ColumnDef<Actividad>[] {
  return [
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => (
        <Button
          aria-label="Ver actividad"
          variant="ghost"
          size="icon"
          onClick={() =>
            router.push(`/crm/calendario/actividad/${encodeId(Number(row.original.cod_actividad))}`)
          }
        >
          <Eye className="size-3.5" />
        </Button>
      ),
    },
    { accessorKey: "cod_actividad", header: "No." },
    { accessorKey: "asunto", header: "Asunto" },
    { accessorKey: "nom_tipo", header: "Tipo" },
    { accessorKey: "nombre_cliente", header: "Cliente" },
    {
      accessorKey: "fecha_programada",
      header: "Fecha programada",
      cell: ({ row }) =>
        row.original.fecha_programada ? formatearFechaHora(row.original.fecha_programada) : "",
    },
    { accessorKey: "estado_desc", header: "Estado" },
    { accessorKey: "objetivo_actividad_desc", header: "Objetivo" },
  ];
}
