"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { empleadosUsuarios, estados, tipos } from "@/features/catalogos";
import { useFetchEntidades } from "@/features/entidades";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { formatearFechaHora } from "@/shared/lib/date";
import { encodeId } from "@/shared/lib/sqids";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import type { ActividadObjetivo } from "../api/objetivos-reporte";
import {
  type ClienteActividadObjetivo,
  type FilaActividadObjetivo,
  filasActividadesObjetivo,
} from "../lib/objetivos-reporte-vista";

/** Columnas del legacy `tabla_actividades` (Código, Tipo, Asunto, Asesor, Cliente, Estado, Fecha). */
const columnas: ColumnDef<FilaActividadObjetivo>[] = [
  { accessorKey: "cod_actividad", header: "Código" },
  { accessorKey: "tipo", header: "Tipo" },
  { accessorKey: "asunto", header: "Asunto" },
  { accessorKey: "asesor", header: "Asesor" },
  { accessorKey: "cliente", header: "Cliente" },
  { accessorKey: "estado", header: "Estado" },
  {
    accessorKey: "fecha_programada",
    header: "Fecha programada",
    cell: ({ getValue }) => formatearFechaHora(getValue<string>()),
  },
  {
    id: "ver",
    header: "",
    cell: ({ row }) => (
      <Button asChild size="icon" variant="ghost">
        <Link
          aria-label="Ver actividad"
          href={`/crm/calendario/actividad/${encodeId(Number(row.original.cod_actividad))}`}
        >
          <Eye className="size-4" />
        </Link>
      </Button>
    ),
  },
];

/** Modal del reporte de objetivos: actividades de un empleado en un periodo. */
export function ModalActividadesObjetivo({
  actividades,
  onClose,
}: Readonly<{ actividades: ActividadObjetivo[]; onClose: () => void }>) {
  const abierto = actividades.length > 0;
  // Los catálogos se piden solo al abrir el modal, como en el legacy.
  const catalogoTipos = tipos.useLista({ tipo_tabla: "ACTIVIDAD" }, { enabled: abierto });
  const catalogoEmpleados = empleadosUsuarios.useLista({}, { enabled: abierto });
  const catalogoEstados = estados.useLista({}, { enabled: abierto });
  const clientes = useFetchEntidades(
    { tipo_entidad: "CLIENTE", cod_estado: 1 },
    { enabled: abierto },
  );
  const preClientes = useFetchEntidades(
    { tipo_entidad: "PRE-CLIENTE", cod_estado: 1 },
    { enabled: abierto },
  );

  const filas = useMemo(
    () =>
      filasActividadesObjetivo(actividades, {
        tipos: catalogoTipos.data ?? [],
        empleados: catalogoEmpleados.data ?? [],
        estados: catalogoEstados.data ?? [],
        clientes: [
          ...((clientes.data ?? []) as ClienteActividadObjetivo[]),
          ...((preClientes.data ?? []) as ClienteActividadObjetivo[]),
        ],
      }),
    [
      actividades,
      catalogoEmpleados.data,
      catalogoEstados.data,
      catalogoTipos.data,
      clientes.data,
      preClientes.data,
    ],
  );

  return (
    <Dialog
      open={abierto}
      onOpenChange={(estaAbierto) => {
        if (!estaAbierto) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[80vw]">
        <DialogHeader>
          <DialogTitle>Actividades del periodo</DialogTitle>
        </DialogHeader>
        <DataTable
          columns={columnas}
          data={filas}
          isLoading={catalogoTipos.isLoading || catalogoEmpleados.isLoading}
          searchKeys={["asunto"]}
          searchPlaceholder="Buscar actividad…"
        />
      </DialogContent>
    </Dialog>
  );
}
