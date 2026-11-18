"use client";

import {
  aPayloadObjetivo,
  COD_ESTADO_OBJETIVO,
  objetivos,
} from "@/features/objetivos/api/objetivos";
import type { ObjetivoFila } from "@/features/objetivos/lib/objetivo-vista";
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

/**
 * El "eliminar" del legacy inactiva (`cod_estado: 2`) en vez de borrar la fila
 * (§3.3 del plan): los objetivos son referencia histórica de las actividades
 * evaluadas. Se conserva el efecto y se corrige el rótulo.
 */
export function DialogoInactivarObjetivo({
  objetivo,
  onOpenChange,
}: Readonly<{
  objetivo: ObjetivoFila | null;
  onOpenChange: (open: boolean) => void;
}>) {
  const actualizar = objetivos.useActualizar({
    meta: { successMessage: "Objetivo inactivado" },
  });

  const confirmar = async () => {
    if (!objetivo) return;
    await actualizar.mutateAsync({
      ...aPayloadObjetivo(objetivo),
      cod_estado: COD_ESTADO_OBJETIVO.INACTIVO,
    });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={objetivo !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Inactivar el objetivo?</AlertDialogTitle>
          <AlertDialogDescription>
            {objetivo?.descripcion} pasará a estado inactivo y dejará de aparecer disponible para
            evaluación.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmar}>Inactivar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
