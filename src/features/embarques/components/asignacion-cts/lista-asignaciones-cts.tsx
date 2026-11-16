"use client";

import { useState } from "react";
import { usePermisosCategoria } from "@/features/shell";
import { DataTable } from "@/shared/components/data-table/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import { type AsignacionCts, asignacionesCts } from "../../api/asignaciones-cts";
import { AsignacionCtsForm } from "./asignacion-cts-form";

export function ListaAsignacionesCts() {
  const permisos = usePermisosCategoria("Lista");
  const lista = asignacionesCts.useLista();
  const eliminar = asignacionesCts.useEliminar({
    meta: { successMessage: "Asignación CTS eliminada" },
  });
  const [seleccionada, setSeleccionada] = useState<AsignacionCts>();
  const [abierto, setAbierto] = useState(false);
  const [aEliminar, setAEliminar] = useState<AsignacionCts | null>(null);
  const columns: ColumnDef<AsignacionCts>[] = [
    { accessorKey: "cod_asignacion_cts", header: "ID" },
    { accessorKey: "nombre_cliente", header: "Cliente" },
    { accessorKey: "tipo_embarque_desc", header: "Tipo embarque" },
    { accessorKey: "empresa_nombre", header: "Empresa" },
    { accessorKey: "cencod_nombre", header: "Centro de costo" },
    { accessorKey: "nombre_completo", header: "Operador" },
    {
      id: "especial",
      accessorFn: (fila) => (fila.especial ? "Sí" : "No"),
      header: "Asignación vacía",
    },
    { accessorKey: "estado_desc", header: "Estado" },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {(permisos.puedeVer || permisos.puedeEditar) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSeleccionada(row.original);
                setAbierto(true);
              }}
            >
              {permisos.puedeEditar ? "Editar" : "Ver"}
            </Button>
          )}
          {permisos.puedeEliminar && (
            <Button size="sm" variant="outline" onClick={() => setAEliminar(row.original)}>
              Eliminar
            </Button>
          )}
        </div>
      ),
    },
  ];
  return (
    <>
      <DataTable
        data={lista.data ?? []}
        columns={columns}
        searchKeys={[
          "cod_asignacion_cts",
          "nombre_cliente",
          "tipo_embarque_desc",
          "empresa_nombre",
          "cencod_nombre",
          "nombre_completo",
          "especial",
          "estado_desc",
        ]}
        searchPlaceholder="Buscar asignaciones..."
        isLoading={lista.isLoading}
        hasError={lista.isError}
        onRetry={() => lista.refetch()}
        onRefresh={() => lista.refetch()}
        isRefreshing={lista.isFetching}
        extraActions={
          permisos.puedeAgregar && (
            <Button
              size="sm"
              onClick={() => {
                setSeleccionada(undefined);
                setAbierto(true);
              }}
            >
              Nueva asignación
            </Button>
          )
        }
      />
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{seleccionada ? "Asignación CTS" : "Nueva asignación CTS"}</DialogTitle>
            <DialogDescription>
              {seleccionada?.nombre_cliente ??
                "Configure el operador y la vigencia para el cliente."}
            </DialogDescription>
          </DialogHeader>
          <AsignacionCtsForm
            key={seleccionada?.cod_asignacion_cts ?? "nueva"}
            asignacion={seleccionada}
            soloLectura={seleccionada ? !permisos.puedeEditar : !permisos.puedeAgregar}
            onClose={() => setAbierto(false)}
          />
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!aEliminar}
        onOpenChange={(open) => {
          if (!open && !eliminar.isPending) setAEliminar(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar asignación CTS</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Desea eliminar la asignación de {aEliminar?.nombre_cliente}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {eliminar.isError && (
            <p role="alert" className="text-destructive">
              {eliminar.error.message}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminar.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={eliminar.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!aEliminar || !permisos.puedeEliminar) return;
                eliminar.mutate(
                  { cod_asignacion_cts: aEliminar.cod_asignacion_cts },
                  { onSuccess: () => setAEliminar(null) },
                );
              }}
            >
              {eliminar.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
