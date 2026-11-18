"use client";

import { Ban, Eye } from "lucide-react";
import type { useRouter } from "next/navigation";
import { COD_ESTADO_OBJETIVO } from "@/features/objetivos/api/objetivos";
import type { ObjetivoFila } from "@/features/objetivos/lib/objetivo-vista";
import { rutaDetalle } from "@/features/objetivos/lib/objetivos-rutas";
import { Button } from "@/shared/components/ui/button";
import { formatearFechaHora } from "@/shared/lib/date";
import { encodeId } from "@/shared/lib/sqids";
import type { ColumnDef } from "@/shared/lib/tanstack-table";

interface ColumnasObjetivosOpciones {
  rutaBase: string;
  router: ReturnType<typeof useRouter>;
  puedeEliminar: boolean;
  onInactivar: (objetivo: ObjetivoFila) => void;
}

export function objetivosColumns({
  rutaBase,
  router,
  puedeEliminar,
  onInactivar,
}: Readonly<ColumnasObjetivosOpciones>): ColumnDef<ObjetivoFila>[] {
  return [
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ver"
            onClick={() =>
              router.push(rutaDetalle(rutaBase, encodeId(Number(row.original.codObjetivo))))
            }
          >
            <Eye className="size-3.5" />
          </Button>
          {puedeEliminar &&
            String(row.original.codEstado) === String(COD_ESTADO_OBJETIVO.ACTIVO) && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Inactivar"
                onClick={() => onInactivar(row.original)}
              >
                <Ban className="size-3.5" />
              </Button>
            )}
        </div>
      ),
    },
    { accessorKey: "descripcion", header: "Descripción" },
    { accessorKey: "nombreTipoActividad", header: "Actividad" },
    { accessorKey: "nombreTipoAsignacion", header: "Tipo Asignación" },
    { accessorKey: "nombreEmpresa", header: "Empresa" },
    { accessorKey: "nombreCentroCosto", header: "Centro de Costo" },
    { accessorKey: "nombrePeriodicidad", header: "Periodicidad" },
    {
      accessorKey: "fechaInicial",
      header: "Fecha Inicial",
      cell: ({ row }) => formatearFechaHora(row.original.fechaInicial),
    },
    {
      accessorKey: "fechaFinal",
      header: "Fecha Final",
      cell: ({ row }) => formatearFechaHora(row.original.fechaFinal),
    },
    { accessorKey: "cantidad", header: "Cantidad" },
    { accessorKey: "nombreEstado", header: "Estado" },
  ];
}
