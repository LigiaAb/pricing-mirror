"use client";

import React from "react";
import { useContextoOperativoStore } from "@/features/shell";
import { Loader } from "@/shared/components/ui/loader";
import { useActualizarMetodo, useInsertarMetodo } from "../api/metodos";
import { useActualizarServicio, useInsertarServicio, useReplicarServicio } from "../api/servicios";
import type { FilaServicioMetodo } from "../api/types-api";
import { useCatalogosTarifas } from "../hooks/use-catalogos-tarifas";
import type { TarifaSubmitPayload } from "./formulario-tarifa";
import { TarifasTabs } from "./tab-tarifas";
import { TarifasTable } from "./tarifas-table";

export function CreacionTarifa() {
  const [tarifaSeleccionada, setTarifaSeleccionada] = React.useState<FilaServicioMetodo | null>(
    null,
  );

  const [accion, setAccion] = React.useState<"ingreso" | "edicion" | "lectura" | "filtro">(
    "edicion",
  );

  const [filtros, setFiltros] = React.useState<Partial<FilaServicioMetodo>>({});

  const [copiando, setCopiando] = React.useState(false);

  const ref = React.useRef<HTMLDivElement>(null);

  const insertarServicio = useInsertarServicio();
  const actualizarServicio = useActualizarServicio();
  const replicarServicio = useReplicarServicio();

  const insertarMetodo = useInsertarMetodo();
  const actualizarMetodo = useActualizarMetodo();

  const { refetchServicios, refetchMetodos } = useCatalogosTarifas();

  const centroCostoActual = useContextoOperativoStore((state) => state.currentCentroCosto);
  const empresaActual = useContextoOperativoStore((state) => state.currentEmpresa);
  const paisActual = useContextoOperativoStore((state) => state.currentPais);

  const ctx = React.useMemo(
    () => ({ empresaId: empresaActual, centroCostoId: centroCostoActual, paisId: paisActual }),
    [empresaActual, centroCostoActual, paisActual],
  );

  const filtrosIniciales = React.useMemo(
    () => ({
      cod_empresa: ctx?.empresaId?.cod_empresa ?? null,
      cod_cc: ctx?.centroCostoId?.cod_cc ?? null,
    }),
    [ctx?.empresaId?.cod_empresa, ctx?.centroCostoId?.cod_cc],
  );

  const handleGuardarTarifa = React.useCallback(
    async ({ values, servicio, metodo, anular }: TarifaSubmitPayload) => {
      /*
       * =====================================================
       * ANULAR
       * =====================================================
       *
       * Igual al código anterior:
       * servicio cambia a anulado.
       */
      if (anular) {
        await Promise.all([actualizarServicio.mutateAsync({ ...servicio, cod_estado: 4 })]);

        await Promise.all([refetchServicios()]);

        setTarifaSeleccionada(null);

        return;
      }

      /*
       * =====================================================
       * INGRESO
       * =====================================================
       *
       * 1. Insertar servicio.
       * 2. Obtener cod_servicio.
       * 3. Insertar método con ese cod_servicio.
       * 4. Reconsultar para obtener cod_metodo.
       * 5. Pasar el formulario a edición.
       */
      if (accion === "ingreso") {
        const codServicio = await insertarServicio.mutateAsync(servicio);

        await insertarMetodo.mutateAsync({
          ...metodo,
          cod_servicio: codServicio,
        });

        const [serviciosResult, metodosResult] = await Promise.all([
          refetchServicios(),
          refetchMetodos(),
        ]);

        const servicioCreado = serviciosResult.data?.find(
          (item) => String(item.cod_servicio) === String(codServicio),
        );

        const metodoCreado = metodosResult.data?.find(
          (item) => String(item.cod_servicio) === String(codServicio),
        );

        setTarifaSeleccionada({
          ...values,
          ...servicioCreado,
          ...metodoCreado,
          cod_servicio: codServicio,
        } as FilaServicioMetodo);

        setAccion("edicion");

        return;
      }

      /*
       * =====================================================
       * EDICIÓN
       * =====================================================
       *
       * Igual al código anterior:
       * servicio y método se actualizan en paralelo.
       */
      if (accion === "edicion") {
        await Promise.all([
          actualizarServicio.mutateAsync(servicio),
          actualizarMetodo.mutateAsync(metodo),
        ]);

        await Promise.all([refetchServicios(), refetchMetodos()]);

        setTarifaSeleccionada((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            ...values,
            ...servicio,
            ...metodo,
          } as FilaServicioMetodo;
        });
      }
    },
    [
      accion,
      insertarServicio,
      insertarMetodo,
      actualizarServicio,
      actualizarMetodo,
      refetchServicios,
      refetchMetodos,
    ],
  );

  const handleCopiarTarifa = React.useCallback(
    async (values: Partial<FilaServicioMetodo>, fechaInicio: Date, fechaFinal: Date | null) => {
      if (values.cod_servicio == null || values.cod_metodo == null) return;

      setCopiando(true);
      setTarifaSeleccionada(null);
      const resultado = await replicarServicio.mutateAsync({
        cod_servicio: values.cod_servicio,
        cod_metodo: values.cod_metodo,
        fecha_inicial: fechaInicio,
        fecha_final: fechaFinal,
      });

      const [serviciosResult, metodosResult] = await Promise.all([
        refetchServicios(),
        refetchMetodos(),
      ]);

      const servicioCopiado = serviciosResult.data?.find(
        (item) => String(item.cod_servicio) === String(resultado.codServicio),
      );

      const metodoCopiado = metodosResult.data?.find(
        (item) => String(item.cod_metodo) === String(resultado.codMetodo),
      );

      setTarifaSeleccionada({
        ...servicioCopiado,
        ...metodoCopiado,
      } as FilaServicioMetodo);

      setAccion("edicion");
      setCopiando(false);
    },
    [replicarServicio, refetchServicios, refetchMetodos],
  );

  const guardando = React.useMemo(
    () =>
      insertarServicio.isPending ||
      insertarServicio.isPending ||
      insertarMetodo.isPending ||
      actualizarServicio.isPending ||
      actualizarMetodo.isPending ||
      replicarServicio.isPending,
    [
      insertarServicio.isPending,
      insertarMetodo.isPending,
      actualizarServicio.isPending,
      actualizarMetodo.isPending,
      replicarServicio.isPending,
    ],
  );

  React.useEffect(() => {
    if (!tarifaSeleccionada) return;

    setTimeout(
      () =>
        ref.current?.scrollIntoView({
          behavior: "smooth",
          inline: "nearest",
        }),
      777,
    );
  }, [tarifaSeleccionada]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <TarifasTable
          setAccion={setAccion}
          setTarifaSeleccionada={setTarifaSeleccionada}
          setFiltros={setFiltros}
          filtros={filtros}
          filtrosIniciales={filtrosIniciales}
          editarRegistro={handleGuardarTarifa}
        />
      </div>

      {tarifaSeleccionada && (
        <div className="grid grid-cols-2 gap-2 border border-accent p-2 rounded-md mt-5 shadow-xl bg-card">
          <p>
            <span className="font-bold text-xl">
              [{" "}
              <span className="font-normal text-base">
                {tarifaSeleccionada.cod_servicio ?? "0"}
              </span>{" "}
              ]
            </span>
            &nbsp;&nbsp;
            <span className="font-arial">SERVICIO</span>{" "}
            {accion === "ingreso" ? "Nuevo" : (tarifaSeleccionada.nombre ?? "")}
          </p>

          <div className="gap-2 justify-end items-center">
            <p className="text-right text-sm text-primary">Modo {accion}</p>
            <p className="text-right text-sm">
              <span className="text-primary">Última modificación por: </span>
              {tarifaSeleccionada.ultimoUsuario ?? ""}
            </p>
          </div>
        </div>
      )}
      {/* <pre>{JSON.stringify(tarifaSeleccionada, null, 2)}</pre> */}

      {tarifaSeleccionada && (
        <div
          className="rounded-lg border bg-card p-4 shadow-sm"
          key={`${tarifaSeleccionada.cod_servicio ?? 0}-${tarifaSeleccionada.cod_metodo ?? 0}-${accion}`}
          ref={ref}
        >
          <TarifasTabs
            defaultValues={tarifaSeleccionada}
            tipoFormulario={accion}
            onGuardarTarifa={handleGuardarTarifa}
            onCopiarTarifa={handleCopiarTarifa}
            guardando={guardando}
          />
        </div>
      )}
      {copiando && <Loader texto="Copiando la Tarifa" />}
    </div>
  );
}
