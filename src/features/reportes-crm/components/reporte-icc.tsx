"use client";

import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { type FilaIcc, type ParamsReporteIcc, useReporteIcc } from "../api/reporte-icc";
import {
  type ConteoIcc,
  calcularIcc,
  esAnulada,
  esFinalizada,
  type ResumenIcc,
  TIPOS_ICC,
} from "../lib/reporte-icc";

const formatoPorcentaje = (valor: number | null) => (valor == null ? "—" : `${valor.toFixed(2)}%`);

function formatoFecha(valor: string): string {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? valor : format(fecha, "dd/MM/yyyy HH:mm");
}

/**
 * Reporte ICC (Índice de Cumplimiento Comercial) de llamadas y visitas (#194): por persona,
 * programadas (sin anuladas), realizadas (finalizadas), pendientes y ICC %, también por tipo.
 * Al elegir una persona se ve el detalle de sus actividades. Los filtros los pone
 * `ReportesCrmClient`; `params = null` hasta que se pulsa Filtrar.
 */
export function ReporteIcc({ params }: Readonly<{ params: ParamsReporteIcc | null }>) {
  const [usuarioDetalle, setUsuarioDetalle] = useState<string | null>(null);
  const consulta = useReporteIcc(params ?? { fecha_inicio: "", fecha_fin: "" }, params !== null);

  const filas = consulta.data;
  const resumen = useMemo(() => calcularIcc(filas ?? []), [filas]);
  const detalle = useMemo(
    () =>
      usuarioDetalle == null
        ? []
        : (filas ?? [])
            .filter((fila) => String(fila.usuario) === usuarioDetalle)
            .sort((a, b) => a.fecha_programacion.localeCompare(b.fecha_programacion)),
    [filas, usuarioDetalle],
  );
  const personaDetalle = resumen.personas.find((persona) => persona.usuario === usuarioDetalle);

  if (params === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Selecciona las fechas (por fecha programada) y pulsa Filtrar para consultar el ICC.
      </p>
    );
  }
  if (consulta.isError) {
    return (
      <p className="text-sm text-destructive">
        Error al consultar el ICC: {consulta.error.message}
      </p>
    );
  }
  if (consulta.isLoading || !filas) return <div>Cargando el reporte...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Indicador titulo="ICC" valor={formatoPorcentaje(resumen.total.icc)} destacado />
        <Indicador titulo="Programadas" valor={resumen.total.programadas} />
        <Indicador titulo="Realizadas" valor={resumen.total.realizadas} />
        <Indicador titulo="Pendientes" valor={resumen.total.pendientes} />
        <Indicador titulo="Anuladas (no cuentan)" valor={resumen.total.anuladas} />
      </div>

      <p className="text-xs text-muted-foreground">
        ICC = realizadas (finalizadas) ÷ programadas (actividades con fecha programada en el rango,
        sin anuladas). Elija una persona para ver sus actividades.
      </p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowSpan={2}>Usuario</TableHead>
              {TIPOS_ICC.map((tipo) => (
                <TableHead key={tipo} colSpan={3} className="text-center">
                  {tipo === "LLAMADA" ? "Llamadas" : "Visitas"}
                </TableHead>
              ))}
              <TableHead colSpan={5} className="text-center">
                Total
              </TableHead>
            </TableRow>
            <TableRow>
              {TIPOS_ICC.flatMap((tipo) => [
                <TableHead key={`${tipo}-p`} className="text-right">
                  Prog.
                </TableHead>,
                <TableHead key={`${tipo}-r`} className="text-right">
                  Real.
                </TableHead>,
                <TableHead key={`${tipo}-icc`} className="text-right">
                  ICC
                </TableHead>,
              ])}
              <TableHead className="text-right">Programadas</TableHead>
              <TableHead className="text-right">Realizadas</TableHead>
              <TableHead className="text-right">Pendientes</TableHead>
              <TableHead className="text-right">Anuladas</TableHead>
              <TableHead className="text-right">ICC</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resumen.personas.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="text-center text-muted-foreground">
                  No hay llamadas ni visitas programadas en el rango.
                </TableCell>
              </TableRow>
            )}
            {resumen.personas.map((persona) => (
              <TableRow
                key={persona.usuario}
                data-state={persona.usuario === usuarioDetalle ? "selected" : undefined}
                className="cursor-pointer"
                onClick={() =>
                  setUsuarioDetalle(persona.usuario === usuarioDetalle ? null : persona.usuario)
                }
              >
                <FilaResumen resumen={persona} />
              </TableRow>
            ))}
          </TableBody>
          {resumen.personas.length > 0 && (
            <TableFooter>
              <TableRow className="font-semibold">
                <FilaResumen resumen={resumen.total} />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {personaDetalle && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Actividades de {personaDetalle.nombre} ({detalle.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetalleActividades filas={detalle} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Indicador({
  titulo,
  valor,
  destacado = false,
}: Readonly<{ titulo: string; valor: string | number; destacado?: boolean }>) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{titulo}</p>
        <p className={destacado ? "text-2xl font-bold text-primary" : "text-2xl font-semibold"}>
          {valor}
        </p>
      </CardContent>
    </Card>
  );
}

function CeldasConteo({ conteo, completo }: Readonly<{ conteo: ConteoIcc; completo: boolean }>) {
  return (
    <>
      <TableCell className="text-right">{conteo.programadas}</TableCell>
      <TableCell className="text-right">{conteo.realizadas}</TableCell>
      {completo && <TableCell className="text-right">{conteo.pendientes}</TableCell>}
      {completo && <TableCell className="text-right">{conteo.anuladas}</TableCell>}
      <TableCell className="text-right">{formatoPorcentaje(conteo.icc)}</TableCell>
    </>
  );
}

function FilaResumen({ resumen }: Readonly<{ resumen: ResumenIcc }>) {
  return (
    <>
      <TableCell>{resumen.nombre}</TableCell>
      {TIPOS_ICC.map((tipo) => (
        <CeldasConteo key={tipo} conteo={resumen.porTipo[tipo]} completo={false} />
      ))}
      <CeldasConteo conteo={resumen} completo />
    </>
  );
}

function DetalleActividades({ filas }: Readonly<{ filas: FilaIcc[] }>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Actividad</TableHead>
          <TableHead>Fecha programada</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Asunto</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Cuenta como</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filas.map((fila) => (
          <TableRow key={fila.actividad}>
            <TableCell>{fila.actividad}</TableCell>
            <TableCell>{formatoFecha(fila.fecha_programacion)}</TableCell>
            <TableCell>{fila.tipo}</TableCell>
            <TableCell>{fila.cliente}</TableCell>
            <TableCell>{fila.asunto}</TableCell>
            <TableCell>{fila.estado}</TableCell>
            <TableCell>
              {esAnulada(fila) ? "No cuenta" : esFinalizada(fila) ? "Realizada" : "Pendiente"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
