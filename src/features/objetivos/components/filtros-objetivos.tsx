"use client";

import { centrosCosto, empresas } from "@/features/catalogos";
import { opcionesCentroCosto } from "@/features/objetivos/lib/objetivo-vista";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

export const TODAS_LAS_EMPRESAS = "todas";
export const TODOS_LOS_CENTROS_COSTO = "todos";

export interface FiltroObjetivos {
  codEmp: string;
  codCc: string;
}

/**
 * Filtro empresa → centro de costo, gobernado por la acción "Filtrar Empresa
 * Centro Costo" (cod_accion 11, §1.1/§6.3 del plan): no todos los roles la
 * tienen concedida.
 */
export function FiltrosObjetivos({
  filtro,
  onCambiar,
}: Readonly<{
  filtro: FiltroObjetivos;
  onCambiar: (filtro: FiltroObjetivos) => void;
}>) {
  const { data: empresasData = [] } = empresas.useLista();
  const { data: centros = [] } = centrosCosto.useLista();

  const opcionesCc =
    filtro.codEmp === TODAS_LAS_EMPRESAS ? [] : opcionesCentroCosto(centros, filtro.codEmp);

  return (
    <div className="flex items-end gap-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor="filtro-empresa" className="text-xs text-muted-foreground">
          Empresa
        </Label>
        <Select
          value={filtro.codEmp}
          onValueChange={(codEmp) => onCambiar({ codEmp, codCc: TODOS_LOS_CENTROS_COSTO })}
        >
          <SelectTrigger id="filtro-empresa" className="w-48">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS_LAS_EMPRESAS}>Todas las empresas</SelectItem>
            {empresasData.map((empresa) => (
              <SelectItem key={empresa.cod_empresa} value={String(empresa.cod_empresa)}>
                {empresa.nombre_emp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="filtro-centro-costo" className="text-xs text-muted-foreground">
          Centro de costo
        </Label>
        <Select
          value={filtro.codCc}
          onValueChange={(codCc) => onCambiar({ ...filtro, codCc })}
          disabled={filtro.codEmp === TODAS_LAS_EMPRESAS}
        >
          <SelectTrigger id="filtro-centro-costo" className="w-48">
            <SelectValue placeholder="Centro de costo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS_LOS_CENTROS_COSTO}>Todos</SelectItem>
            {opcionesCc.map((opcion) => (
              <SelectItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
