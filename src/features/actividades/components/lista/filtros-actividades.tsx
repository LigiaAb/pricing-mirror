"use client";

import type { CentroCosto, EmpleadoUsuario, Empresa, Estado } from "@/features/catalogos";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { type FiltroActividades, TODOS } from "../../lib/actividad-filtros";

interface FiltrosActividadesProps {
  filtro: FiltroActividades;
  onCambiar: (filtro: FiltroActividades) => void;
  empresas: Empresa[];
  centrosCosto: CentroCosto[];
  empleados: EmpleadoUsuario[];
  estados: Estado[];
  puedeFiltrarContexto: boolean;
  puedeVerTodo: boolean;
  mostrarEstado?: boolean;
}

export function FiltrosActividades({
  filtro,
  onCambiar,
  empresas,
  centrosCosto,
  empleados,
  estados,
  puedeFiltrarContexto,
  puedeVerTodo,
  mostrarEstado = true,
}: Readonly<FiltrosActividadesProps>) {
  const centrosFiltrados = centrosCosto.filter(
    (centro) => filtro.codEmp === TODOS || String(centro.codEmpresaCc) === filtro.codEmp,
  );

  return (
    <div className="flex flex-wrap items-end gap-2">
      {puedeFiltrarContexto && (
        <>
          <CampoSelect
            id="actividad-empresa"
            label="Empresa"
            value={filtro.codEmp}
            onValueChange={(codEmp) => onCambiar({ ...filtro, codEmp, codCc: TODOS })}
            opciones={[
              { value: TODOS, label: "Todas" },
              ...empresas.map((empresa) => ({
                value: String(empresa.cod_empresa),
                label: empresa.nombre_emp,
              })),
            ]}
          />
          <CampoSelect
            id="actividad-centro-costo"
            label="Centro de costo"
            value={filtro.codCc}
            onValueChange={(codCc) => onCambiar({ ...filtro, codCc })}
            opciones={[
              { value: TODOS, label: "Todos" },
              ...centrosFiltrados.map((centro) => ({
                value: String(centro.codCc),
                label: centro.nombreCc,
              })),
            ]}
          />
        </>
      )}
      {puedeVerTodo && (
        <CampoSelect
          id="actividad-asesor"
          label="Asesor"
          value={filtro.codAsesor}
          onValueChange={(codAsesor) => onCambiar({ ...filtro, codAsesor })}
          opciones={[
            { value: TODOS, label: "Todos" },
            ...empleados.map((empleado) => ({
              value: String(empleado.codUsuario),
              label: empleado.nombreCompleto || empleado.usuario || String(empleado.codUsuario),
            })),
          ]}
        />
      )}
      {puedeVerTodo && (
        <CampoSelect
          id="actividad-creador"
          label="Creador"
          value={filtro.codCreador}
          onValueChange={(codCreador) => onCambiar({ ...filtro, codCreador })}
          opciones={[
            { value: TODOS, label: "Todos" },
            ...empleados.map((empleado) => ({
              value: String(empleado.codUsuario),
              label: empleado.nombreCompleto || empleado.usuario || String(empleado.codUsuario),
            })),
          ]}
        />
      )}
      {mostrarEstado && (
        <CampoSelect
          id="actividad-estado"
          label="Estado"
          value={filtro.codEstado}
          onValueChange={(codEstado) => onCambiar({ ...filtro, codEstado })}
          opciones={[
            { value: TODOS, label: "Todos" },
            ...estados.map((estado) => ({
              value: String(estado.cod_estado),
              label: estado.estado_desc,
            })),
          ]}
        />
      )}
      <CampoFecha
        id="actividad-fecha-inicio"
        label="Desde"
        value={filtro.fechaInicio}
        onChange={(fechaInicio) => onCambiar({ ...filtro, fechaInicio })}
      />
      <CampoFecha
        id="actividad-fecha-fin"
        label="Hasta"
        value={filtro.fechaFin}
        onChange={(fechaFin) => onCambiar({ ...filtro, fechaFin })}
      />
    </div>
  );
}

function CampoSelect({
  id,
  label,
  value,
  onValueChange,
  opciones,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  opciones: { value: string; label: string }[];
}>) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((opcion) => (
            <SelectItem key={opcion.value} value={opcion.value}>
              {opcion.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CampoFecha({
  id,
  label,
  value,
  onChange,
}: Readonly<{ id: string; label: string; value: string; onChange: (value: string) => void }>) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border bg-card px-3 text-sm"
      />
    </div>
  );
}
