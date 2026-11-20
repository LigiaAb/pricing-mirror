"use client";

import { useQueryClient } from "@tanstack/react-query";
import { addDays, addMonths, addWeeks, format, isSameMonth } from "date-fns";
import { Download, Plus, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { configuracionActividades, estados } from "@/features/catalogos";
import {
  useContextoOperativoStore,
  useObtenerAccionesPorNombreOpcionActual,
  usePermisosCategoria,
} from "@/features/shell";
import { Button } from "@/shared/components/ui/button";
import { Loader } from "@/shared/components/ui/loader";
// import { encodeId } from "@/shared/lib/sqids";
import { useAuthStore } from "@/shared/stores/auth-store";
import { actividades } from "../../api/actividades";
import { useConteoActividades } from "../../api/conteo-actividades";
import {
  filtrarActividadesCalendario,
  filtrosCalendarioDesdeUrl,
  filtrosCalendarioUrl,
} from "../../lib/calendario-filtros";
import { actividadesDelDia } from "../../lib/calendario-rejilla";
import { AgendaDia } from "./agenda-dia";
import { DialogoExportarActividades } from "./dialogo-exportar-actividades";
import { FiltrosCalendario } from "./filtros-calendario";
import { NavegacionCalendario, type VistaCalendario } from "./navegacion-calendario";
import { RejillaMes } from "./rejilla-mes";
import { RejillaSemana } from "./rejilla-semana";
import { TablaActividadesDia } from "./tabla-actividades-dia";

function fechaDesdeUrl(valor: string | null): Date {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return new Date();
  const fecha = new Date(`${valor}T12:00:00`);
  return Number.isNaN(fecha.getTime()) ? new Date() : fecha;
}

function vistaDesdeUrl(valor: string | null): VistaCalendario {
  return valor === "semana" || valor === "dia" ? valor : "mes";
}

// El botón de detalle de cliente (tesorería y cobros) requiere la acción
// "ver-cxc-facturas" habilitada en la opción "Calendario" (getPermisosxRol),
// tal como está dada de alta para el árbol crm -> calendario -> actividades -> calendario.
const NOMBRE_OPCION_CALENDARIO = "Calendario";
const NOMBRE_ACCION_VER_CXC_FACTURAS = "ver-cxc-facturas";

export function CalendarioActividades() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const permisos = usePermisosCategoria("Calendario");
  const permisosLista = usePermisosCategoria("Lista de Actividades");
  const permisosInformacion = usePermisosCategoria("Información");
  const accionesCalendario = useObtenerAccionesPorNombreOpcionActual(NOMBRE_OPCION_CALENDARIO);
  const puedeVerCxcFacturas = accionesCalendario.some(
    (accion) => accion.nom_accion.trim().toLowerCase() === NOMBRE_ACCION_VER_CXC_FACTURAS,
  );
  const user = useAuthStore((state) => state.user);
  const authHidratado = useAuthStore((state) => state._hasHydrated);
  const currentCentroCosto = useContextoOperativoStore((state) => state.currentCentroCosto);
  const contextoHidratado = useContextoOperativoStore((state) => state._hasHydrated);
  const [dialogoExportar, setDialogoExportar] = useState(false);
  const [filterByUser, setFilterByUser] = useState(false);
  const fecha = fechaDesdeUrl(searchParams.get("fecha"));
  const vista = vistaDesdeUrl(searchParams.get("vista"));
  const diaUrl = fechaDesdeUrl(searchParams.get("dia"));
  const dia = vista === "mes" && !isSameMonth(diaUrl, fecha) ? fecha : diaUrl;
  const codUsuario = user?.cod_usuario;
  const filtrosServidor = useMemo(() => {
    return {
      ...(permisosLista.puedeVerTodo
        ? {}
        : { cod_asesor: codUsuario, cod_cc: currentCentroCosto?.cod_cc }),
    };
  }, [codUsuario, currentCentroCosto?.cod_cc, permisosLista.puedeVerTodo]);
  const habilitada =
    authHidratado && contextoHidratado && Boolean(currentCentroCosto) && Boolean(codUsuario);
  const consulta = actividades.useLista(filtrosServidor, { enabled: habilitada });
  const conteo = useConteoActividades(
    {
      ...((permisosLista.puedeVerTodo && filterByUser) || !permisosLista.puedeVerTodo
        ? { cod_usuario: Number(codUsuario) }
        : {}),
      fecha_inicial: format(fecha, "yyyy-MM-01"),
      fecha_final: format(addMonths(fecha, 1), "yyyy-MM-01"),
    },
    habilitada,
  );
  const { data: estadosData = [] } = estados.useLista();
  const { data: configuraciones = [] } = configuracionActividades.useLista(
    { cod_cc: currentCentroCosto?.cod_cc, cod_estado: 1 },
    { enabled: Boolean(currentCentroCosto) },
  );
  const estadosActividad = useMemo(
    () => estadosData.filter((estado) => estado.nom_tipo.toUpperCase() === "ACTIVIDAD"),
    [estadosData],
  );
  const tiposActividad = useMemo(() => configuraciones, [configuraciones]);
  const filtros = useMemo(
    () => ({
      ...filtrosCalendarioDesdeUrl(
        searchParams.get("estado"),
        searchParams.get("tipo"),
        estadosActividad.map((estado) => Number(estado.cod_estado)),
        tiposActividad.map((tipo) => Number(tipo.cod_tipo_actividad)),
      ),
      ...((permisosLista.puedeVerTodo && filterByUser) || !permisosLista.puedeVerTodo
        ? { codUsuario: Number(codUsuario) }
        : {}),
    }),
    [
      estadosActividad,
      searchParams,
      tiposActividad,
      codUsuario,
      permisosLista.puedeVerTodo,
      filterByUser,
    ],
  );
  const actividadesFiltradas = useMemo(
    () => filtrarActividadesCalendario(consulta.data ?? [], filtros),
    [consulta.data, filtros],
  );

  const actualizarUrl = (cambios: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor === null) params.delete(clave);
      else params.set(clave, valor);
    }
    router.replace(`/crm/calendario/actividad?${params.toString()}`, { scroll: false });
  };
  const cambiarFiltros = (siguientes: typeof filtros) =>
    actualizarUrl({
      estado: filtrosCalendarioUrl(
        siguientes.estados,
        estadosActividad.map((estado) => Number(estado.cod_estado)),
      ),
      tipo: filtrosCalendarioUrl(
        siguientes.tipos,
        tiposActividad.map((tipo) => Number(tipo.cod_tipo_actividad)),
      ),
    });
  const seleccionarDia = (siguiente: Date) =>
    actualizarUrl({ dia: format(siguiente, "yyyy-MM-dd") });
  // const abrirActividad = (codActividad: number) =>
  //   router.push(`/crm/calendario/actividad/${encodeId(codActividad)}`);
  const cambiarPeriodo = (direccion: -1 | 1) => {
    const siguiente =
      vista === "mes"
        ? addMonths(fecha, direccion)
        : vista === "semana"
          ? addWeeks(fecha, direccion)
          : addDays(fecha, direccion);
    actualizarUrl({ fecha: format(siguiente, "yyyy-MM-dd"), dia: format(siguiente, "yyyy-MM-dd") });
  };
  const exportar = async (inicio: string, fin: string) => {
    const datos = await queryClient.fetchQuery(
      actividades.listaOptions({ ...filtrosServidor, fecha_inicio: inicio, fecha_fin: fin }),
    );
    return filtrarActividadesCalendario(datos, filtros).filter((actividad) => {
      const fechaActividad = actividad.fecha_programada.slice(0, 10);
      return fechaActividad >= inicio && fechaActividad <= fin;
    });
  };

  if (!permisos.puedeVer) return <p>No tiene permisos para consultar el calendario.</p>;
  if (!authHidratado || !contextoHidratado || consulta.isLoading) return <Loader />;
  if (!currentCentroCosto)
    return <p>Seleccione un centro de costo para consultar el calendario.</p>;
  if (consulta.isError) {
    return (
      <Button onClick={() => consulta.refetch()} variant="outline">
        Reintentar calendario
      </Button>
    );
  }

  const actividadesDia = actividadesDelDia(actividadesFiltradas, dia);
  return (
    <div className="space-y-5">
      <header className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-xs backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <NavegacionCalendario
            fecha={fecha}
            vista={vista}
            onCambiarVista={(siguienteVista) => actualizarUrl({ vista: siguienteVista })}
            onFechaAnterior={() => cambiarPeriodo(-1)}
            onFechaSiguiente={() => cambiarPeriodo(1)}
            onHoy={() =>
              actualizarUrl({
                fecha: format(new Date(), "yyyy-MM-dd"),
                dia: format(new Date(), "yyyy-MM-dd"),
              })
            }
          />
          <div className="flex flex-wrap gap-2 xl:pb-0.5">
            <Button
              className="rounded-full"
              onClick={() => setDialogoExportar(true)}
              size="sm"
              variant="outline"
            >
              <Download className="size-3.5" /> Exportar
            </Button>
            <Button className="rounded-full" onClick={() => consulta.refetch()}>
              <RefreshCcw className="size-3.5" /> Refrescar
            </Button>
            {permisosInformacion.puedeAgregar && (
              <Button asChild className="rounded-full" size="sm">
                <Link href="/crm/calendario/actividad/nueva">
                  <Plus className="size-3.5" /> Nueva actividad
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
      <FiltrosCalendario
        conteo={conteo.data}
        setFilterByUser={setFilterByUser}
        filterByUser={filterByUser}
        puedeVerTodo={permisosLista.puedeVerTodo}
        estados={estadosActividad}
        filtros={filtros}
        onCambiar={cambiarFiltros}
        tipos={tiposActividad}
      />

      {vista === "mes" ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(38rem,1.1fr)_minmax(32rem,0.9fr)]">
          <RejillaMes
            actividades={actividadesFiltradas}
            diaSeleccionado={dia}
            fecha={fecha}
            onSeleccionarDia={seleccionarDia}
          />
          <TablaActividadesDia
            actividades={actividadesDia}
            fecha={dia}
            puedeVerDetalle={permisosInformacion.puedeVer}
            puedeVerCxcFacturas={puedeVerCxcFacturas}
          />
        </div>
      ) : null}
      {vista === "semana" && (
        <RejillaSemana
          actividades={actividadesFiltradas}
          diaSeleccionado={dia}
          fecha={fecha}
          // onAbrirActividad={
          //   permisosInformacion.puedeVer
          //     ? (actividad: Actividad) => abrirActividad(Number(actividad.cod_actividad))
          //     : undefined
          // }
          onSeleccionarDia={seleccionarDia}
        />
      )}
      {vista === "dia" ? (
        <AgendaDia
          actividades={actividadesDia}
          fecha={dia}
          puedeVerDetalle={permisosInformacion.puedeVer}
          puedeVerCxcFacturas={puedeVerCxcFacturas}
        />
      ) : vista !== "mes" ? (
        <TablaActividadesDia
          actividades={actividadesDia}
          fecha={dia}
          puedeVerDetalle={permisosInformacion.puedeVer}
          puedeVerCxcFacturas={puedeVerCxcFacturas}
        />
      ) : null}
      <DialogoExportarActividades
        abierta={dialogoExportar}
        fecha={fecha}
        obtenerActividades={exportar}
        onAbiertaChange={setDialogoExportar}
      />
    </div>
  );
}
