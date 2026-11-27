"use client";

import { format, subMonths } from "date-fns";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { centrosCosto, empleadosUsuarios, empresas, estados } from "@/features/catalogos";
import { useContextoOperativoStore } from "@/features/shell";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { useAuthStore } from "@/shared/stores/auth-store";
import { type Actividad, actividades } from "../../api/actividades";
import { actividadesSinAsignar, type ResumenAsignacion } from "../../api/actividades-sin-asignar";
import {
  construirFiltrosActividades,
  type FiltroActividades,
  type TipoUsuario,
  TODOS,
} from "../../lib/actividad-filtros";
import { actividadesColumns } from "./actividades-columns";
import { DialogoAsignarActividades } from "./dialogo-asignar-actividades";
import { FiltrosActividades } from "./filtros-actividades";

interface ListaActividadesClientProps {
  sinAsignar?: boolean;
  puedeVerTodo?: boolean;
  puedeAsignar?: boolean;
  puedeFiltrarContexto?: boolean;
  /** Usuario por el que se consulta al abrir (asignado o creador); el filtro "Ver por" lo cambia. */
  usuarioPorDefecto?: TipoUsuario;
}

export function ListaActividadesClient({
  sinAsignar = false,
  puedeVerTodo = false,
  puedeAsignar = false,
  puedeFiltrarContexto = false,
  usuarioPorDefecto = "asignado",
}: Readonly<ListaActividadesClientProps>) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const authHidratado = useAuthStore((state) => state._hasHydrated);
  const contextoHidratado = useContextoOperativoStore((state) => state._hasHydrated);
  const currentEmpresa = useContextoOperativoStore((state) => state.currentEmpresa);
  const currentCentroCosto = useContextoOperativoStore((state) => state.currentCentroCosto);
  const codUsuarioRaw = user?.cod_usuario;
  const codUsuario =
    typeof codUsuarioRaw === "string" || typeof codUsuarioRaw === "number" ? codUsuarioRaw : null;

  const [filtroElegido, setFiltroElegido] = useState<FiltroActividades | null>(null);
  const filtro: FiltroActividades = filtroElegido ?? {
    codEmp: currentEmpresa ? String(currentEmpresa.cod_empresa) : TODOS,
    codCc: currentCentroCosto ? String(currentCentroCosto.cod_cc) : TODOS,
    tipoUsuario: usuarioPorDefecto,
    codUsuario: sinAsignar ? TODOS : String(codUsuario ?? TODOS),
    codEstado: TODOS,
    // Por defecto los últimos 3 meses (y lo programado después) para no traer todo el historial.
    fechaInicio: sinAsignar ? "" : format(subMonths(new Date(), 3), "yyyy-MM-dd"),
    fechaFin: "",
  };
  const filtrosServidor = useMemo(
    () =>
      construirFiltrosActividades(filtro, {
        codUsuario,
        puedeVerTodo,
        sinAsignar,
      }),
    [filtro, codUsuario, puedeVerTodo, sinAsignar],
  );
  const consultaHabilitada =
    authHidratado &&
    contextoHidratado &&
    Boolean(currentCentroCosto) &&
    (sinAsignar || puedeVerTodo || codUsuario !== null);

  const consultaAsignacion = actividadesSinAsignar.useLista(filtrosServidor, {
    enabled: consultaHabilitada && sinAsignar,
  });
  const consultaLista = actividades.useLista(filtrosServidor, {
    enabled: consultaHabilitada && !sinAsignar,
  });
  const consulta = sinAsignar ? consultaAsignacion : consultaLista;

  const { data: empresasData = [] } = empresas.useLista();
  const { data: centrosData = [] } = centrosCosto.useLista();
  const filtrosEmpleados = useMemo(() => {
    const filtros: Record<string, unknown> = {};
    if (filtro.codEmp !== TODOS) filtros.cod_emp = Number(filtro.codEmp);
    if (filtro.codCc !== TODOS) filtros.cod_cc = Number(filtro.codCc);
    return filtros;
  }, [filtro.codEmp, filtro.codCc]);
  const { data: empleadosData = [] } = empleadosUsuarios.useLista(filtrosEmpleados);
  const { data: estadosData = [] } = estados.useLista();
  const empleadosUnicos = useMemo(
    () => [...new Map(empleadosData.map((item) => [String(item.codUsuario), item])).values()],
    [empleadosData],
  );
  const estadosActividad = useMemo(
    () => estadosData.filter((estado) => estado.nom_tipo.toUpperCase() === "ACTIVIDAD"),
    [estadosData],
  );

  const [seleccion, setSeleccion] = useState<Actividad[]>([]);
  const columns = useMemo(() => actividadesColumns(router), [router]);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const [resumen, setResumen] = useState<ResumenAsignacion | null>(null);

  if (!authHidratado || !contextoHidratado || consulta.isLoading) {
    return <div>Cargando actividades...</div>;
  }
  if (!currentCentroCosto) {
    return <div>Seleccione un centro de costo para consultar actividades.</div>;
  }
  if (!sinAsignar && !puedeVerTodo && codUsuario === null) {
    return <div>No se pudo identificar el usuario de la sesión.</div>;
  }
  if (consulta.isError) {
    return (
      <div className="flex items-center gap-2">
        <span>Error al cargar actividades.</span>
        <Button variant="outline" size="sm" onClick={() => consulta.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {resumen && (
        <p
          aria-live="polite"
          className={
            resumen.fallidas ? "text-sm text-destructive" : "text-sm text-muted-foreground"
          }
        >
          {resumen.asignadas} de {resumen.total} actividades asignadas
          {resumen.fallidas ? `; ${resumen.fallidas} no se pudieron asignar.` : "."}
        </p>
      )}
      <DataTable
        key={consulta.data?.map((item) => item.cod_actividad).join(",")}
        data={consulta.data ?? []}
        columns={columns}
        searchKeys={["asunto"]}
        searchPlaceholder="Buscar actividad..."
        onRefresh={() => consulta.refetch()}
        isRefreshing={consulta.isFetching}
        enableSelectAll={false}
        enableRowSelection={sinAsignar && puedeAsignar}
        onSelectionChange={setSeleccion}
        extraActions={
          <div className="flex flex-wrap items-end gap-2">
            <FiltrosActividades
              filtro={filtro}
              onCambiar={setFiltroElegido}
              empresas={empresasData}
              centrosCosto={centrosData}
              empleados={empleadosUnicos}
              estados={estadosActividad}
              puedeFiltrarContexto={puedeFiltrarContexto}
              puedeVerTodo={!sinAsignar && puedeVerTodo}
              mostrarEstado={!sinAsignar}
              mostrarTipoUsuario={!sinAsignar}
            />
            {sinAsignar && puedeAsignar && (
              <Button
                size="sm"
                disabled={!seleccion.length}
                onClick={() => setDialogoAbierto(true)}
              >
                Asignar ({seleccion.length})
              </Button>
            )}
          </div>
        }
      />
      {sinAsignar && (
        <DialogoAsignarActividades
          seleccion={seleccion}
          empleados={empleadosUnicos}
          open={dialogoAbierto}
          onOpenChange={setDialogoAbierto}
          onCompletado={(resultado) => {
            setResumen(resultado);
            setSeleccion([]);
          }}
        />
      )}
    </div>
  );
}
