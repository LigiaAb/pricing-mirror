"use client";

import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { type Actividad, actividades } from "@/features/actividades";
import { DataTable } from "@/shared/components/data-table/data-table";
import { Button } from "@/shared/components/ui/button";
import { formatearFechaHora } from "@/shared/lib/date";
import { encodeId } from "@/shared/lib/sqids";
import type { ColumnDef } from "@/shared/lib/tanstack-table";
import { asText } from "@/shared/lib/text";
import { useAuthStore } from "@/shared/stores/auth-store";

interface TablaActividadesCTSProps {
  readonly embarqueData?: Record<string, unknown> | null;
  readonly lineasVisibles?: number;
  readonly filtrarPorAsunto?: boolean;
  readonly codTipo?: number | string;
}

function obtenerEmbarqueId(embarqueData: Record<string, unknown> | null | undefined) {
  const embarqueId =
    embarqueData?.EMBARQUE_ID ??
    embarqueData?.embarque_id ??
    embarqueData?.embarqueId ??
    embarqueData?.id;

  return embarqueId === null || embarqueId === undefined || embarqueId === ""
    ? null
    : String(embarqueId);
}

function perteneceAEmbarque(actividad: Actividad, embarqueId: string) {
  const datosActividad = actividad as Record<string, unknown>;
  return (
    asText(actividad.asunto).includes(`[${embarqueId}]`) ||
    asText(
      datosActividad.embarque_id ?? datosActividad.EMBARQUE_ID ?? datosActividad.embarqueId,
    ) === embarqueId
  );
}

export function TablaActividadesCTS({
  embarqueData,
  lineasVisibles = 6,
  filtrarPorAsunto = true,
  codTipo = 332,
}: Readonly<TablaActividadesCTSProps>) {
  const router = useRouter();
  const codAsesor = useAuthStore((state) => state.user?.cod_usuario);
  const embarqueId = obtenerEmbarqueId(embarqueData);
  const filtros = useMemo(
    () => ({ cod_asesor: codAsesor, cod_tipo: codTipo }),
    [codAsesor, codTipo],
  );
  const consulta = actividades.useLista(filtros, {
    enabled: Boolean(codAsesor),
  });
  const actividadesEmbarque = useMemo(() => {
    const lista = consulta.data ?? [];
    if (!embarqueId) return filtrarPorAsunto ? [] : lista;

    return lista.filter((actividad) => perteneceAEmbarque(actividad, embarqueId));
  }, [consulta.data, embarqueId, filtrarPorAsunto]);
  const columnas = useMemo<ColumnDef<Actividad>[]>(
    () => [
      { accessorKey: "estado_desc", header: "Estado" },
      {
        accessorKey: "fecha_programada",
        header: "Fecha programada",
        cell: ({ row }) => formatearFechaHora(row.original.fecha_programada),
      },
      {
        id: "acciones",
        header: "",
        cell: ({ row }) => (
          <Button
            aria-label="Ver actividad"
            variant="ghost"
            size="icon"
            onClick={() =>
              router.push(
                `/crm/calendario/actividad/${encodeId(Number(row.original.cod_actividad))}`,
              )
            }
          >
            <Eye aria-hidden="true" className="size-3.5" />
          </Button>
        ),
      },
    ],
    [router],
  );

  if (consulta.isLoading) {
    return <p className="p-4 text-center text-sm text-muted-foreground">Cargando historial...</p>;
  }

  if (consulta.isError) {
    return (
      <div className="flex items-center justify-between gap-2 p-2 text-sm text-destructive">
        <span>No se pudo cargar el historial.</span>
        <Button size="sm" variant="outline" onClick={() => consulta.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <section aria-label="Historial de actividades CTS" className="space-y-2">
      <h3 className="text-sm font-medium">Historial</h3>
      <DataTable
        data={actividadesEmbarque}
        columns={columnas}
        pageSize={lineasVisibles}
        showColumnToggle={false}
        searchKeys={["estado_desc"]}
        searchPlaceholder="Buscar por estado..."
        emptyMessage="No hay actividades registradas para este embarque."
        onRefresh={() => consulta.refetch()}
        isRefreshing={consulta.isFetching}
      />
    </section>
  );
}
