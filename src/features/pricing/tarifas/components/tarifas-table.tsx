"use client";

import { isBefore, startOfDay } from "date-fns";
import { Eye, EyeOff, Plus, SearchIcon } from "lucide-react";
import React from "react";
import { DataTable } from "@/shared/components/data-table/data-table";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/components/ui/sheet";
import { cn } from "@/shared/lib/utils";
import type { FilaServicioMetodo } from "../api/types-api";
import { useCatalogosTarifas } from "../hooks/use-catalogos-tarifas";
import { useReferenciaEstable } from "../hooks/use-referencia-estable";
import { FormularioTarifa, type TarifaSubmitPayload } from "./formulario-tarifa";
import { crearTarifasColumns } from "./tarifas-columns";

const gruposDeFiltro = ["alcance", "vigencia", "calculo"];

const camposDeFiltro = [
  "nombre",
  "siglas",
  "obligatorio",
  "incoterm",
  "metodoCalculo",
  "aplicaOrigenesDestinos",
  "aplicaCommodities",
  "tipoTarifa",
  "fechaInicio",
  "fechaFin",
  "fechaCreacion",
  "fechaModificacion",
  "usuario",
];

function obtenerValorFiltro(value: unknown): unknown {
  if (typeof value === "object" && value !== null && "value" in value) {
    return (value as { value?: unknown }).value;
  }

  return value;
}

const CATALOGOS_TARIFAS = {};

export function TarifasTable({
  filtros = {},
  setFiltros,
  setTarifaSeleccionada,
  setAccion,
  filtrosIniciales,
  editarRegistro,
}: {
  filtrosIniciales?: Partial<FilaServicioMetodo>;
  filtros?: Partial<FilaServicioMetodo>;
  setFiltros: React.Dispatch<React.SetStateAction<Partial<FilaServicioMetodo>>>;
  setTarifaSeleccionada: React.Dispatch<React.SetStateAction<FilaServicioMetodo | null>>;
  setAccion: React.Dispatch<React.SetStateAction<"ingreso" | "edicion" | "lectura" | "filtro">>;
  editarRegistro: ({ values, servicio, metodo, anular }: TarifaSubmitPayload) => Promise<void>;
}) {
  const [mostrarVencidos, setMostrarVencidos] = React.useState(false);

  const [mostrarPorVencer, setMostrarPorVencer] = React.useState(false);

  const [abrirFiltro, setAbrirFiltro] = React.useState(false);

  const [mostrarAnular, setMostrarAnular] = React.useState(false);

  const [tarifaAAnular, setTarifaAAnular] = React.useState<FilaServicioMetodo | null>(null);

  const { mapWithCatalogo, catalogos, refetchMetodos, refetchServicios } =
    useCatalogosTarifas(CATALOGOS_TARIFAS);

  const porVencer = React.useCallback(
    (item: FilaServicioMetodo, dias = 30) =>
      item.fecha_final != null &&
      isBefore(
        startOfDay(item.fecha_final),
        startOfDay(new Date().setDate(new Date().getDate() + dias)),
      ),
    [],
  );
  const vencidos = React.useCallback(
    (item: FilaServicioMetodo) =>
      item.fecha_final != null && isBefore(startOfDay(item.fecha_final), startOfDay(new Date())),
    [],
  );

  const dataCalculada = React.useMemo<FilaServicioMetodo[]>(
    () =>
      (catalogos?.servicios ?? [])
        .filter((servicio) => servicio.cod_estado === 1)
        ?.map((servicio) => {
          const metodo = catalogos?.metodos?.find(
            (metodo) => metodo.cod_servicio === servicio.cod_servicio,
          );

          const item: FilaServicioMetodo = {
            ...servicio,
            ...metodo,
            cod_servicio: servicio.cod_servicio ?? metodo?.cod_servicio ?? null,
            cod_estado: servicio.cod_estado ?? metodo?.cod_estado ?? null,
            minimo: metodo?.minimo ?? null,
            metodo: metodo ?? null,
          };

          return { ...item, porVencer: porVencer(item), vencido: vencidos(item) };
        })
        .map(mapWithCatalogo)
        .filter((item) => {
          return mostrarVencidos
            ? item.vencido
            : mostrarPorVencer
              ? !item.vencido && item.porVencer
              : !item.vencido;
        })
        .filter((item) => {
          const filtrosActivos = Object.entries({ ...filtros, ...filtrosIniciales }).filter(
            ([key, value]) => {
              const valor = obtenerValorFiltro(value);

              if (valor === undefined || valor === null || valor === "") return false;

              if (key === "cod_tipo_pago" && String(valor) === "131") return false;
              if (key === "cod_usuario") return false;

              return true;
            },
          );

          return filtrosActivos.every(([key, value]) => {
            const valorFiltro = obtenerValorFiltro(value);

            const valorItem = obtenerValorFiltro(item[key as keyof FilaServicioMetodo]);

            if (valorItem === undefined || valorItem === null) {
              return false;
            }

            if (typeof valorFiltro === "string" && typeof valorItem === "string") {
              return valorItem.trim().toLowerCase().includes(valorFiltro.trim().toLowerCase());
            }

            return String(valorItem) === String(valorFiltro);
          });
        }),
    [
      catalogos?.servicios,
      catalogos?.metodos,
      mapWithCatalogo,
      mostrarVencidos,
      mostrarPorVencer,
      filtros,
      filtrosIniciales,
      porVencer,
      vencidos,
    ],
  );

  /*
   * La tabla solo recibe un arreglo nuevo cuando el CONTENIDO cambia.
   * Al consultar un registro se monta el formulario, que recarga métodos/servicios;
   * como métodos trae fechas (Date), React Query entrega arreglos nuevos aunque
   * nada haya cambiado, y DataTable regresaba a la primera página.
   */
  const data = useReferenciaEstable(dataCalculada);

  const handleAnular = React.useCallback(async () => {
    if (!tarifaAAnular) return;
    await editarRegistro({
      values: tarifaAAnular,
      servicio: tarifaAAnular,
      metodo: tarifaAAnular,
      anular: true,
    });

    setMostrarAnular(false);
    setTarifaAAnular(null);
  }, [editarRegistro, tarifaAAnular]);
  const onAnular = React.useCallback((row: FilaServicioMetodo) => {
    setMostrarAnular(true);
    setTarifaAAnular(row);
  }, []);
  const reconsultar = React.useCallback(() => {
    refetchServicios();
    refetchMetodos();
  }, [refetchServicios, refetchMetodos]);

  const notasColumns = React.useMemo(
    () =>
      crearTarifasColumns({
        onVerDetalle: setTarifaSeleccionada,
        mostrarVencidos,
        setAccion,
        onAnular,
      }),
    [setTarifaSeleccionada, mostrarVencidos, setAccion, onAnular],
  );

  // Memoizado para que la tabla no reciba un arreglo nuevo en cada render.
  const searchKeys = React.useMemo(
    () => notasColumns.map((col) => col.id ?? col.accessorKey ?? "") as string[],
    [notasColumns],
  );

  return (
    <div>
      <DataTable
        columns={notasColumns}
        data={data}
        searchKeys={searchKeys}
        onRefresh={reconsultar}
        isRefreshing={false}
        searchPlaceholder="Buscar resultado…"
        extraActions={
          <>
            <Button
              size="sm"
              onClick={() => {
                setTarifaSeleccionada({ cod_servicio: 0, cod_metodo: 0 } as FilaServicioMetodo);
                setAccion("ingreso");
              }}
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
            <Button
              size="sm"
              variant="default"
              className={cn(
                mostrarVencidos
                  ? "hover:bg-success/50 bg-success/20 border-success text-success"
                  : "hover:bg-destructive/50 bg-destructive/20 border-destructive text-destructive",
              )}
              onClick={() => {
                setMostrarVencidos((prev) => !prev);
                setMostrarPorVencer(false);
              }}
            >
              {mostrarVencidos ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Mostrar {`${mostrarVencidos ? "vigentes" : "vencidos"}`}
            </Button>
            {!mostrarVencidos && (
              <Button
                size="sm"
                variant="default"
                className={cn(
                  !mostrarPorVencer
                    ? "hover:bg-warning/50 bg-warning/20 border-warning text-warning"
                    : "hover:bg-destructive/50 bg-destructive/20 border-destructive text-destructive",
                )}
                onClick={() => setMostrarPorVencer((prev) => !prev)}
              >
                {!mostrarPorVencer ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {mostrarPorVencer ? "Ocultar" : "Mostrar"} por vencer
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              color="secondary"
              onClick={(ev) => {
                ev.stopPropagation();
                setTarifaSeleccionada(null);
                setAccion("ingreso");
              }}
            >
              Limpiar
            </Button>
            <Sheet open={abrirFiltro} onOpenChange={setAbrirFiltro}>
              <Button
                size="sm"
                variant="outline"
                className="border-teal-600 "
                onClick={() => setAbrirFiltro(true)}
              >
                Filtrar
              </Button>
              <SheetContent
                side="right"
                className="modal-solicitud-hero w-full overflow-y-auto border-l bg-card p-0 sm:max-w-2xl"
              >
                <SheetHeader className="border-b bg-muted/40 px-4 py-5 pr-12 sm:px-6 sm:py-6 sm:pr-14">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                      <SearchIcon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <SheetTitle>Filtrar Tarifas</SheetTitle>
                      <SheetDescription>Filtros para la búsqueda.</SheetDescription>
                    </div>
                  </div>
                </SheetHeader>
                <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
                  <FormularioTarifa
                    onSubmit={(value) => {
                      setFiltros(value);
                      setAbrirFiltro(false);
                    }}
                    onClear={() => {
                      setFiltros(filtrosIniciales ?? {});
                      setAbrirFiltro(false);
                    }}
                    defaultValues={filtros}
                    tipoFormulario={"filtro"}
                    inputsToHide={camposDeFiltro}
                    groupsToHide={gruposDeFiltro}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </>
        }
      />

      <AlertDialog open={mostrarAnular} onOpenChange={setMostrarAnular}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular Tarifa</AlertDialogTitle>
            <AlertDialogDescription>Esta acción cambiará su estado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={() => handleAnular()}>
              Anular
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex flex-row">
        {/* <pre>{JSON.stringify(catalogos?.rubros, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(catalogos?.tiposAplicacion, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(catalogos?.tipos, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(catalogos?.tiposRelacion, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(tarifaSeleccionada, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(data?.[100], null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(tipos.data, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(obtenerValorFiltro(filtros), null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(filtros, null, 2)}</pre> */}
      </div>
    </div>
  );
}
