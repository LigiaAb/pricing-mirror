"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { ClienteDetalleTrigger } from "@/features/cxc";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { formatearFechaHora } from "@/shared/lib/date";
import { encodeId } from "@/shared/lib/sqids";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { Actividad } from "../../api/actividades";

export function TablaActividadesDia({
  actividades,
  fecha,
  puedeVerDetalle,
  puedeVerCxcFacturas,
}: Readonly<{
  actividades: Actividad[];
  fecha: Date;
  puedeVerDetalle: boolean;
  puedeVerCxcFacturas: boolean;
}>) {
  const router = useRouter();
  const columns: ColumnDef<Actividad>[] = [
    ...(puedeVerDetalle || puedeVerCxcFacturas
      ? [
          {
            id: "acciones",
            header: "",
            cell: ({ row }: { row: { original: Actividad } }) => (
              <div className="flex items-center gap-1">
                {puedeVerDetalle && (
                  <Button
                    aria-label="Ver actividad"
                    onClick={() =>
                      router.push(
                        `/crm/calendario/actividad/${encodeId(Number(row.original.cod_actividad))}`,
                      )
                    }
                    size="icon"
                    variant="ghost"
                  >
                    <Eye className="size-3.5" />
                  </Button>
                )}
                {puedeVerCxcFacturas && (
                  <ClienteDetalleTrigger
                    clicodCliente={row.original.cod_cropa}
                    nombreCliente={row.original.nombre_cliente}
                  />
                )}
              </div>
            ),
          } satisfies ColumnDef<Actividad>,
        ]
      : []),
    { accessorKey: "cod_actividad", header: "No." },
    {
      accessorKey: "fecha_programada",
      header: "Hora",
      cell: ({ row }) => formatearFechaHora(row.original.fecha_programada),
    },
    { accessorKey: "nom_tipo", header: "Tipo" },
    { accessorKey: "asunto", header: "Asunto" },
    { accessorKey: "nombre_cliente", header: "Cliente" },
    { accessorKey: "estado_desc", header: "Estado" },
  ];
  const ordenadas = [...actividades].sort((a, b) =>
    a.fecha_programada.localeCompare(b.fecha_programada),
  );
  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
      <div className="border-b border-border/60 px-4 py-4 sm:px-5">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Agenda del día
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight first-letter:uppercase">
          {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {actividades.length === 1
            ? "1 actividad programada"
            : `${actividades.length} actividades programadas`}
        </p>
      </div>
      <div className="p-3 sm:p-4">
        <DataTable
          columns={columns}
          data={ordenadas}
          pageSize={5}
          searchKeys={["asunto"]}
          searchPlaceholder="Buscar actividad..."
        />
      </div>
    </section>
  );
}
