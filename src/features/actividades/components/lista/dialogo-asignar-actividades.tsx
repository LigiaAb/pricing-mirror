"use client";

import { useState } from "react";
import type { EmpleadoUsuario } from "@/features/catalogos";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import type { Actividad } from "../../api/actividades";
import { type ResumenAsignacion, useAsignarActividades } from "../../api/actividades-sin-asignar";

export function DialogoAsignarActividades({
  seleccion,
  empleados,
  open,
  onOpenChange,
  onCompletado,
}: Readonly<{
  seleccion: Actividad[];
  empleados: EmpleadoUsuario[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompletado: (resumen: ResumenAsignacion) => void;
}>) {
  const [codAsesor, setCodAsesor] = useState("");
  const asignar = useAsignarActividades();

  const confirmar = async () => {
    if (!codAsesor || !seleccion.length) return;
    const resumen = await asignar.mutateAsync({ seleccion, codAsesor });
    onCompletado(resumen);
    onOpenChange(false);
    setCodAsesor("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar actividades</DialogTitle>
          <DialogDescription>
            Seleccione el asesor para las {seleccion.length} actividades marcadas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label htmlFor="asesor-asignacion">Asesor</Label>
          <Select value={codAsesor} onValueChange={setCodAsesor}>
            <SelectTrigger id="asesor-asignacion">
              <SelectValue placeholder="Seleccione un asesor" />
            </SelectTrigger>
            <SelectContent>
              {empleados.map((empleado) => (
                <SelectItem key={empleado.codUsuario} value={String(empleado.codUsuario)}>
                  {empleado.nombreCompleto || empleado.usuario || empleado.codUsuario}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={!codAsesor || asignar.isPending}>
            {asignar.isPending ? "Asignando..." : "Asignar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
