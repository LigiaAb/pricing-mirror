"use client";

import { useMemo } from "react";
import type { HistorialActividad } from "@/features/actividades";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { formatearFechaHora } from "@/shared/lib/date";
import type { ColumnDef } from "@/shared/lib/tanstack-table";

const columnasHistorial: ColumnDef<HistorialActividad>[] = [
  { accessorKey: "nombre_cenco", header: "Departamento" },
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

interface ReporteSeguimientoClienteProps {
  clientes: Array<{ entidad_id: string | number; entidad_nombre: string }>;
  clienteId: string;
  setClienteId: (value: string) => void;
  onGenerar: () => void;
  consultado: boolean;
  filas: HistorialActividad[];
  cargando: boolean;
  empresaId: string;
  ccId: string;
}

export function ReporteSeguimientoCliente({
  clientes,
  clienteId,
  setClienteId,
  onGenerar,
  consultado,
  filas,
  cargando,
  empresaId,
  ccId,
}: Readonly<ReporteSeguimientoClienteProps>) {
  const ordenadas = useMemo(
    () =>
      filas
        .filter(
          (fila) =>
            (!empresaId || String(fila.cod_empresa ?? "") === empresaId) &&
            (!ccId || String(fila.cod_cenco ?? "") === ccId),
        )
        .sort(
          (a, b) => new Date(b.fecha_programada).getTime() - new Date(a.fecha_programada).getTime(),
        ),
    [ccId, empresaId, filas],
  );
  // La lista de clientes son miles de <option>: se memoiza para que los renders del
  // formulario de filtros (fechas, reporte) no vuelvan a reconciliarla entera.
  const opcionesClientes = useMemo(
    () =>
      clientes.map((cliente) => (
        <option key={cliente.entidad_id} value={cliente.entidad_id}>
          {cliente.entidad_nombre}
        </option>
      )),
    [clientes],
  );
  return (
    <div className="space-y-3">
      <div className="flex max-w-md items-end gap-2">
        <label className="min-w-0 flex-1 text-sm font-medium">
          Cliente
          <select
            className="mt-1 h-9 w-full rounded-md border bg-card px-2"
            value={clienteId}
            onChange={(event) => setClienteId(event.target.value)}
          >
            <option value="">Selecciona un cliente</option>
            {opcionesClientes}
          </select>
        </label>
        <Button onClick={onGenerar} disabled={!clienteId}>
          Generar reporte
        </Button>
      </div>
      {!consultado ? (
        <p className="text-muted-foreground">Selecciona un cliente y genera el reporte</p>
      ) : cargando ? (
        <p>Cargando…</p>
      ) : (
        <DataTable
          columns={columnasHistorial}
          data={ordenadas}
          searchKeys={["descripcion"]}
          searchPlaceholder="Buscar seguimiento…"
        />
      )}
    </div>
  );
}
