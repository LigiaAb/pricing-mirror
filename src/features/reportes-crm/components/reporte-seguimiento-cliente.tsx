"use client";

import { useMemo } from "react";
import type { HistorialActividad } from "@/features/actividades";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { Combobox } from "@/shared/components/ui/combobox";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { formatearFechaHora } from "@/shared/lib/date";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import { BotonLimpiar } from "./boton-limpiar";

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
  /** Respaldo del legacy: filas sin `cod_empresa` se comparan por nombre de empresa. */
  empresaNombre: string;
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
  empresaNombre,
  ccId,
}: Readonly<ReporteSeguimientoClienteProps>) {
  const ordenadas = useMemo(
    () =>
      filas
        .filter(
          (fila) =>
            (!empresaId ||
              (fila.cod_empresa
                ? String(fila.cod_empresa) === empresaId
                : fila.nombre_empresa === empresaNombre)) &&
            (!ccId || String(fila.cod_cenco ?? "") === ccId),
        )
        .sort(
          (a, b) => new Date(b.fecha_programada).getTime() - new Date(a.fecha_programada).getTime(),
        ),
    [ccId, empresaId, empresaNombre, filas],
  );
  // Miles de clientes: se memoizan las opciones (el Combobox virtualiza más de 1000).
  const opcionesClientes = useMemo(
    () =>
      clientes.map((cliente) => ({
        value: String(cliente.entidad_id),
        label: cliente.entidad_nombre,
      })),
    [clientes],
  );
  return (
    <div className="space-y-3">
      <div className="flex max-w-md items-end gap-2">
        <Field className="min-w-0 flex-1">
          <FieldLabel htmlFor="reportes-crm-cliente">Cliente</FieldLabel>
          <div className="relative w-full">
            <Combobox
              id="reportes-crm-cliente"
              value={clienteId}
              onChange={setClienteId}
              options={opcionesClientes}
              placeholder="Selecciona un cliente"
              searchPlaceholder="Buscar cliente..."
              popoverClassName="z-[9999]"
              className={clienteId ? "pr-16" : undefined}
              clearable
            />
            {clienteId ? <BotonLimpiar label="Cliente" onClick={() => setClienteId("")} /> : null}
          </div>
        </Field>
        <Button type="button" onClick={onGenerar} disabled={!clienteId}>
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
