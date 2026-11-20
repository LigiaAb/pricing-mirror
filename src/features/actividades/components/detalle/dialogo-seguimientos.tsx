"use client";

import { DataTable } from "@/shared/components/data-table/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { formatearFechaHora } from "@/shared/lib/date";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import { type HistorialActividad, useHistorialActividades } from "../../api/historial-actividades";

const columnas: ColumnDef<HistorialActividad>[] = [
  { accessorKey: "nombre_cenco", header: "Centro de costo" },
  { accessorKey: "nom_tipo", header: "Seguimiento" },
  { accessorKey: "nombre_usuario", header: "Responsable" },
  {
    accessorKey: "fecha_programada",
    header: "Fecha",
    cell: ({ getValue }) => formatearFechaHora(getValue<string>()),
  },
  { accessorKey: "descripcion", header: "Descripción" },
  { accessorKey: "resultado", header: "Resultado" },
];

export function DialogoSeguimientos({
  abierto,
  clienteId,
  onAbiertoChange,
}: Readonly<{
  abierto: boolean;
  clienteId: string | number | null;
  onAbiertoChange: (abierto: boolean) => void;
}>) {
  const historial = useHistorialActividades(abierto ? clienteId : null);

  return (
    <Dialog open={abierto} onOpenChange={onAbiertoChange}>
      <DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seguimientos</DialogTitle>
          <DialogDescription>
            Historial de actividades registradas para el cliente asociado.
          </DialogDescription>
        </DialogHeader>
        {historial.isLoading ? (
          <p>Cargando seguimientos…</p>
        ) : (
          <DataTable
            columns={columnas}
            data={historial.data ?? []}
            searchKeys={["descripcion"]}
            searchPlaceholder="Buscar seguimiento…"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
