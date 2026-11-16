"use client";

import { Coordinacion, coordinacionesQueryOptions, useUpdateCoordinacion, useUpdateCoordinacionEstado } from "@/features/coordinaciones";
import { ActualizarEstadoTrackingPayload, TrackingDetalle } from "@/features/tracking";
import { useQueries } from "@tanstack/react-query";
import { ESTADOS_CONFIRMADAS } from "../../lib/constantes";
import { DataTable, DataTableColumnHeader } from "@/shared/components/data-table/data-table";
import { ColumnDef } from "@/shared/lib/tanstack-table";
import { Button } from "@/shared/components/ui/button";
import { ArrowRight, Eye, MenuIcon, MoreHorizontal, X } from "lucide-react";
import { useContextoOperativoStore } from "@/features/shell";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import React, { ReactNode } from "react";
import { format } from "date-fns";
import { tipos } from "@/features/catalogos";
import TrackingEmbarquesTable from "./tracking-embarques-table";
import { buildCoordPayload } from "@/shared/lib/payload-utils";
import { useActualizarEstadoEmbKb } from "@/features/tracking-embarques/api/mutations";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet";
import { useActualizarEstadoTrackingCoordinacion } from "@/features/gestion-aduanal/api/tracking/mutations";
import DetalleCtsClient from "@/app/(protected)/embarques/embarques/cts/[id]/detalle-cts-client";
import { DetalleCtsPage } from "../cts-detalle/detalle-cts-page";

const estadosCoordinacion = {
  INGRESADO: "INGRESADO",
  SALIDA_CONFIRMADO: "SALIDA CONFIRMADO",
  CERRADO: "CERRADO",
  GUIA_GENERADA: "GUIA GENERADA",
  CTS: "CTS",
};

const trackingXEstado: Record<string, string> = {
  [estadosCoordinacion.CTS]: "OPERACIONES",
  [estadosCoordinacion.INGRESADO]: "OPERACIONES",
  [estadosCoordinacion.SALIDA_CONFIRMADO]: "OPERACIONES",
  [estadosCoordinacion.CERRADO]: "OPERACIONES",
  [estadosCoordinacion.GUIA_GENERADA]: "OPERACIONES",
};
export default function TrackingVista() {
  const currentEmpresa = useContextoOperativoStore((state) => state.currentEmpresa);
  const currentCentroCosto = useContextoOperativoStore((state) => state.currentCentroCosto);
  const mutation = useActualizarEstadoEmbKb();

  const { mutateAsync: actualizarCoordinacion } = useUpdateCoordinacion();
  const { mutateAsync: updateEstado } = useUpdateCoordinacionEstado();

  const tiposTrackingFetch = tipos.useLista({ tipo_tabla: "EMBARQUE_AEREO_EXPORTACIOES" });
  const tiposTransporteFetch = tipos.useLista({ tipo_tabla: "TRANSPORTE" });

  const [seleccionado, setSeleccionado] = React.useState<Coordinacion | null>(null);
  const [reconsultar, setReconsultar] = React.useState<number>(0);
  const [open, onOpenChange] = React.useState<boolean>(false);
  const [nuevo, setNuevo] = React.useState<boolean>(false);

  const id = React.useMemo(() => seleccionado?.seg_coord_id ?? seleccionado?.SEG_COORD_ID ?? null, [seleccionado]);

  async function onActualizarEstado(payload: ActualizarEstadoTrackingPayload) {
    await mutation
      .mutateAsync({
        cod_interno: id ?? 0,
        cod_estado: payload.codEstado,
        fecha_segui: payload.fechaSeguimiento,
        notificar_paso_actual: false /* payload.notificarPasoActual,
      ...(contactosAsignados.length > 0
        ? {
            contactos: contactosAsignados.map(({ id, correo }) => ({
              id,
              email: correo,
            })),
          }
        : {}) */,
        ...(payload.observacion ? { observacion: payload.observacion } : {}),
        ...(payload.descripcionPasoActual ? { paso_descripcion: payload.descripcionPasoActual } : {}),
        ...(payload.descripcionPasoNuevo ? { paso_descripcion_nuevo: payload.descripcionPasoNuevo } : {}),
        ...(payload.finalizando ? { estado_final: true } : {}),
      })
      .then(({ data }) => {
        console.log("actualizando estado", payload, data);
        if (!data?.success) {
          throw new Error(data?.message ?? "Error al actualizar el estado del embarque.");
        }
        return data;
      })
      .catch((error) => {
        console.error("Error al actualizar el estado del embarque:", error);
      });
  }

  const tracking = React.useMemo(() => {
    const tipoDeTransporte = tiposTransporteFetch.data?.find((i) => String(i.nomTipo) === String(seleccionado?.tipoEmbarque ?? ""));

    return (
      tiposTrackingFetch.data?.find((i) => {
        const tipoTransporte = i.nomTipo.split("-")[0];
        const tracking = i.nomTipo.split("-")[1];
        return tipoDeTransporte?.nomTipo === (tipoTransporte ?? "") && !tracking /* && tracking === trackingXEstado[seleccionado?.estado ?? ""] */;
      }) ?? null
    );
  }, [tiposTrackingFetch.data, seleccionado?.tipoEmbarque, tiposTransporteFetch.data]);

  return (
    <div className="flex min-h-full flex-col gap-4 p-4">
      <TrackingEmbarquesTable
        reconsultar={reconsultar}
        currentCentroCosto={currentCentroCosto?.cod_cc}
        currentEmpresa={currentEmpresa?.cod_empresa}
        setSeleccionado={setSeleccionado}
        selected={seleccionado}
        setNuevo={setNuevo}
      />

      {(seleccionado || nuevo) && (
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card w-full">
          <div className="flex items-center gap-2 w-full flex-row pb-4">
            <h2 className="shrink-0 text-3xl">Detalle de embarque</h2>
            <h2 className="flex-1 min-w-0" />
            <h2 className="shrink-0">
              <Button onClick={() => onOpenChange(true)}>Ver tracking</Button>
            </h2>
          </div>
          <div className="p-4">
            <DetalleCtsPage embarqueId={Number(seleccionado?.coordinacion ?? 0)} />
          </div>
        </div>
      )}

      <Sheet
        open={open}
        onOpenChange={(open) => {
          onOpenChange(open);
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-[60vw] bg-card p-0 rounded-xl pb-5"
          // showCloseButton={false}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <SheetHeader className="border-b px-4 py-3 pr-12 sm:px-6 sm:pr-14 bg-transparent text-primary-foreground">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <MoreHorizontal className="size-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <SheetTitle>
                  Embarque {seleccionado?.coordinacion} - {seleccionado?.cod_file ?? ""} - {seleccionado?.estado ?? ""}
                </SheetTitle>
                <SheetDescription>Seguimiento de embarque.</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="flex overflow-y-auto max-h-[calc(100%-60px)] max-w-full flex-col gap-4 p-5 my-2">
            <TrackingDetalle
              codInterno={seleccionado?.seg_coord_id ?? 0}
              codTipo={(tracking?.codTipo as number) ?? 0}
              estadoActual={seleccionado?.estado_id_tracking ?? 0}
              puedeRetroceder
              // renderEncabezadoProceso={(props) => <pre>{JSON.stringify(props, null, 2)}</pre>}
              // etiqueta={``}
              // ocupado
              onActualizarEstado={async (props: ActualizarEstadoTrackingPayload) => {
                onActualizarEstado(props);
                // // await actualizarCoordinacion(buildCoordPayload({ ...seleccionado, estado_id_tracking: props.codEstado }));
                await updateEstado({
                  embarque_id: Number(seleccionado?.coordinacion),
                  cod_file: String(seleccionado?.cod_file),
                  cod_estado_actual: Number(seleccionado?.estadoId),
                  cod_estado_siguiente: seleccionado?.estadoId ?? 0,
                  cod_estado_tracking: Number(props.codEstado),
                });

                setReconsultar((i) => i + 1);
                // console.log("actualizando estado", props);
              }}
              coordinacionId={seleccionado?.coordinacion ?? 0}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
