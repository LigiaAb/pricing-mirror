import type { Coordinacion } from "@/features/coordinaciones";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import { accionesColumn, columnasCoordinacion } from "./coordinaciones-columns-base";

export function coordinacionesColumns({
  handleView,
}: {
  handleView: (row: Coordinacion) => void;
}): ColumnDef<Coordinacion>[] {
  return [
    accionesColumn(handleView),
    columnasCoordinacion.id,
    columnasCoordinacion.file,
    columnasCoordinacion.empresa,
    columnasCoordinacion.centroCosto,
    columnasCoordinacion.cliente,
    columnasCoordinacion.origen,
    columnasCoordinacion.destino,
    columnasCoordinacion.tipoEmbarque,
    columnasCoordinacion.servicio,
    columnasCoordinacion.estado,
    columnasCoordinacion.fechaInicio,
    columnasCoordinacion.responsable,
  ];
}
