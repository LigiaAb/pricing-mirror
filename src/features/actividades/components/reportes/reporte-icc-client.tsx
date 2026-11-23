"use client";

import { endOfMonth, format, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import { centrosCosto, empleadosUsuarios, empresas } from "@/features/catalogos";
import { useContextoOperativoStore } from "@/features/shell";
import { Button } from "@/shared/components/ui/button";
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
import { useAuthStore } from "@/shared/stores/auth-store";
import { type FilaIcc, type ParamsReporteIcc, useReporteIcc } from "../../api/reporte-icc";
import { TODOS } from "../../lib/actividad-filtros";
import {
  type ConteoIcc,
  calcularIcc,
  esAnulada,
  esFinalizada,
  type ResumenIcc,
  TIPOS_ICC,
} from "../../lib/reporte-icc";
import { CampoFecha, CampoSelect } from "../lista/filtros-actividades";

interface FiltroIcc {
  codEmp: string;
  codCc: string;
  codUsuario: string;
  fechaInicio: string;
  fechaFin: string;
}

interface ReporteIccClientProps {
  /** Sin este permiso solo se consulta el usuario de la sesión. */
  puedeVerTodo?: boolean;
  /** Con este permiso se pueden cambiar empresa y centro de costo (si no, los del contexto). */
  puedeFiltrarContexto?: boolean;
}

const formatoPorcentaje = (valor: number | null) => (valor == null ? "—" : `${valor.toFixed(2)}%`);

function formatoFecha(valor: string): string {
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? valor : format(fecha, "dd/MM/yyyy HH:mm");
}

/**
 * Reporte ICC (Índice de Cumplimiento Comercial) de llamadas y visitas (#194): por persona,
 * programadas (sin anuladas), realizadas (finalizadas), pendientes y ICC %, también por tipo.
 * Al elegir una persona se ve el detalle de sus actividades.
 */
export function ReporteIccClient({
  puedeVerTodo = false,
  puedeFiltrarContexto = false,
}: Readonly<ReporteIccClientProps>) {
  const user = useAuthStore((state) => state.user);
  const authHidratado = useAuthStore((state) => state._hasHydrated);
  const contextoHidratado = useContextoOperativoStore((state) => state._hasHydrated);
  const currentEmpresa = useContextoOperativoStore((state) => state.currentEmpresa);
  const currentCentroCosto = useContextoOperativoStore((state) => state.currentCentroCosto);
  const codUsuarioRaw = user?.cod_usuario;
  const codUsuario =
    typeof codUsuarioRaw === "string" || typeof codUsuarioRaw === "number" ? codUsuarioRaw : null;

  const [filtroElegido, setFiltroElegido] = useState<FiltroIcc | null>(null);
  const [usuarioDetalle, setUsuarioDetalle] = useState<string | null>(null);
  const hoy = new Date();
  const filtro: FiltroIcc = filtroElegido ?? {
    codEmp: currentEmpresa ? String(currentEmpresa.cod_empresa) : TODOS,
    codCc: currentCentroCosto ? String(currentCentroCosto.cod_cc) : TODOS,
    codUsuario: puedeVerTodo ? TODOS : String(codUsuario ?? TODOS),
    fechaInicio: format(startOfMonth(hoy), "yyyy-MM-dd"),
    fechaFin: format(endOfMonth(hoy), "yyyy-MM-dd"),
  };

  const cambiarFiltro = (nuevo: FiltroIcc) => {
    setFiltroElegido(nuevo);
    setUsuarioDetalle(null);
  };

  // Sin permiso de filtrar contexto: empresa y CC del contexto. Sin ver todo: el usuario de la sesión.
  const codEmp = puedeFiltrarContexto
    ? filtro.codEmp
    : String(currentEmpresa?.cod_empresa ?? TODOS);
  const codCc = puedeFiltrarContexto ? filtro.codCc : String(currentCentroCosto?.cod_cc ?? TODOS);
  const codUsuarioFiltro = puedeVerTodo ? filtro.codUsuario : String(codUsuario ?? TODOS);

  const params = useMemo<ParamsReporteIcc>(
    () => ({
      fecha_inicio: filtro.fechaInicio,
      fecha_fin: filtro.fechaFin,
      ...(codEmp === TODOS ? {} : { cod_empresa: Number(codEmp) }),
      ...(codCc === TODOS ? {} : { cod_cc: Number(codCc) }),
      ...(codUsuarioFiltro === TODOS ? {} : { cod_usuario: Number(codUsuarioFiltro) }),
    }),
    [filtro.fechaInicio, filtro.fechaFin, codEmp, codCc, codUsuarioFiltro],
  );
  const fechasValidas =
    Boolean(filtro.fechaInicio && filtro.fechaFin) && filtro.fechaInicio <= filtro.fechaFin;
  const consultaHabilitada =
    authHidratado && contextoHidratado && fechasValidas && (puedeVerTodo || codUsuario !== null);
  const consulta = useReporteIcc(params, consultaHabilitada);

  const { data: empresasData = [] } = empresas.useLista();
  const { data: centrosData = [] } = centrosCosto.useLista();
  const filtrosEmpleados = useMemo(() => {
    const filtros: Record<string, unknown> = {};
    if (codEmp !== TODOS) filtros.cod_emp = Number(codEmp);
    if (codCc !== TODOS) filtros.cod_cc = Number(codCc);
    return filtros;
  }, [codEmp, codCc]);
  const { data: empleadosData = [] } = empleadosUsuarios.useLista(filtrosEmpleados, {
    enabled: puedeVerTodo,
  });
  const empleadosUnicos = useMemo(
    () => [...new Map(empleadosData.map((item) => [String(item.codUsuario), item])).values()],
    [empleadosData],
  );
  const centrosFiltrados = centrosData.filter(
    (centro) => codEmp === TODOS || String(centro.codEmpresaCc) === codEmp,
  );

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

  if (!authHidratado || !contextoHidratado) return <div>Cargando...</div>;
  if (!puedeVerTodo && codUsuario === null) {
    return <div>No se pudo identificar el usuario de la sesión.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        {puedeFiltrarContexto && (
          <>
            <CampoSelect
              id="icc-empresa"
              label="Empresa"
              value={filtro.codEmp}
              onValueChange={(valor) =>
                cambiarFiltro({ ...filtro, codEmp: valor, codCc: TODOS, codUsuario: TODOS })
              }
              opciones={[
                { value: TODOS, label: "Todas" },
                ...empresasData.map((empresa) => ({
                  value: String(empresa.cod_empresa),
                  label: empresa.nombre_emp,
                })),
              ]}
            />
            <CampoSelect
              id="icc-centro-costo"
              label="Centro de costo"
              value={filtro.codCc}
              onValueChange={(valor) =>
                cambiarFiltro({ ...filtro, codCc: valor, codUsuario: TODOS })
              }
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
            id="icc-usuario"
            label="Usuario"
            value={filtro.codUsuario}
            onValueChange={(valor) => cambiarFiltro({ ...filtro, codUsuario: valor })}
            opciones={[
              { value: TODOS, label: "Todos" },
              ...empleadosUnicos.map((empleado) => ({
                value: String(empleado.codUsuario),
                label: empleado.nombreCompleto || empleado.usuario || String(empleado.codUsuario),
              })),
            ]}
          />
        )}
        <CampoFecha
          id="icc-fecha-inicio"
          label="Desde (fecha programada)"
          value={filtro.fechaInicio}
          onChange={(valor) => cambiarFiltro({ ...filtro, fechaInicio: valor })}
        />
        <CampoFecha
          id="icc-fecha-fin"
          label="Hasta"
          value={filtro.fechaFin}
          onChange={(valor) => cambiarFiltro({ ...filtro, fechaFin: valor })}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!consultaHabilitada || consulta.isFetching}
          onClick={() => consulta.refetch()}
        >
          {consulta.isFetching ? "Consultando..." : "Actualizar"}
        </Button>
      </div>

      {!fechasValidas && (
        <p className="text-sm text-destructive">
          Seleccione las dos fechas; la inicial no puede ser mayor que la final.
        </p>
      )}
      {consulta.isError && (
        <p className="text-sm text-destructive">
          Error al consultar el ICC: {consulta.error.message}
        </p>
      )}
      {consulta.isLoading && <div>Cargando el reporte...</div>}

      {filas && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Indicador titulo="ICC" valor={formatoPorcentaje(resumen.total.icc)} destacado />
            <Indicador titulo="Programadas" valor={resumen.total.programadas} />
            <Indicador titulo="Realizadas" valor={resumen.total.realizadas} />
            <Indicador titulo="Pendientes" valor={resumen.total.pendientes} />
            <Indicador titulo="Anuladas (no cuentan)" valor={resumen.total.anuladas} />
          </div>

          <p className="text-xs text-muted-foreground">
            ICC = realizadas (finalizadas) ÷ programadas (actividades con fecha programada en el
            rango, sin anuladas). Elija una persona para ver sus actividades.
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
        </>
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
