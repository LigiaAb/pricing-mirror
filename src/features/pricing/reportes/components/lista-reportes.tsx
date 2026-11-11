"use client";

import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon,
  ChartColumnBig,
  ChevronDown,
  Filter,
  Loader2,
  Settings2,
  Table2Icon,
  X,
} from "lucide-react";
import React from "react";
import { type EmpleadoUsuario, empleadosUsuarios, type Tipo, tipos } from "@/features/catalogos";
import { useContextoOperativoStore } from "@/features/shell";
import { Panel, SectionHeader } from "@/features/wms-hn/components/reportes/panel-dashboard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Calendar } from "@/shared/components/ui/calendar";
import { Combobox, type ComboboxOption } from "@/shared/components/ui/combobox";
import { Field, FieldLabel } from "@/shared/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import { cn } from "@/shared/lib/utils";
import type { ConfiguracionReporte, Filtros, SelectOption } from "../lib/filtros-types";
import { HitRate } from "./hit-rate";
import RealizacionDePrecio from "./realizacion-de-precio";

const hoy = new Date();

const inicioDeSemana = format(startOfMonth(hoy), "yyyy-MM-dd");
const finDeSemana = format(endOfMonth(hoy), "yyyy-MM-dd");

const obtenerFecha = (valor: Date | string | null | undefined): Date | undefined => {
  if (!valor) return undefined;

  const fecha = valor instanceof Date ? valor : parseISO(valor);

  return Number.isNaN(fecha.getTime()) ? undefined : fecha;
};

export const REPORTES_CRM: readonly ConfiguracionReporte[] = [
  {
    value: "seleccione",
    label: "Seleccione una opcion",
    descripcion: "Seleccione un reporte para ver los filtros y resultados",
    campos: {},
    vista: "seleccione",
  },
  {
    value: "hit-rate",
    label: "HIT RATE (HR)",
    vista: "hit-rate",
    descripcion: "Reporte de hit rate, con filtros de fechas y estado de cotización",
    campos: { tipoTransporte: true, usuario: true, tipoPago: true, fechas: "opcionales" },
    graficas: true,
  },
  {
    value: "realizacion-de-precio",
    label: "Realizacion de Precio (RdP)",
    vista: "realizacion-de-precio",
    descripcion: "Reporte de realización de precio, con filtros de fechas y estado de cotización",
    campos: { fechas: "opcionales", cliente: true, tipoPago: true, usuario: true },
    tabla: true,
    graficas: true,
  },
];

const formatearTipos = (array: Tipo[]): SelectOption[] =>
  array.map((i) => ({ ...i, value: i.codTipo, label: i.nomTipo }));
const formatearUsuarios = (array: EmpleadoUsuario[]): SelectOption[] => {
  return array
    .map((i) => ({ ...i, value: i.codUsuario, label: i.nombreCompleto }))
    .reduce((acum, curr) => {
      if (acum.some((i) => i.value === curr.value)) return acum;
      acum.push(curr);
      return acum;
    }, [] as SelectOption[]);
};

export function ListaReportes() {
  const currentCentroCosto = useContextoOperativoStore((state) => state.currentCentroCosto);
  const currentEmpresa = useContextoOperativoStore((state) => state.currentEmpresa);
  const tiposTransporteFetch = tipos.useLista({ tipo_tabla: "TRANSPORTE" });
  const tiposPagoFetch = tipos.useLista({ tipo_tabla: "PAGO" });
  const usuariosFetch = empleadosUsuarios.useLista({ cod_cc: currentCentroCosto?.cod_cc });

  const transportes: SelectOption[] = React.useMemo(
    () => formatearTipos(tiposTransporteFetch.data ?? []),
    [tiposTransporteFetch.data],
  );
  const tiposPago: SelectOption[] = React.useMemo(
    () => formatearTipos(tiposPagoFetch.data ?? []),
    [tiposPagoFetch.data],
  );
  const usuarios: SelectOption[] = React.useMemo(
    () => formatearUsuarios(usuariosFetch.data ?? []),
    [usuariosFetch.data],
  );

  const codEmpresa = React.useMemo(
    () =>
      (currentEmpresa && {
        nombre: currentEmpresa.nombre_emp ?? "",
        codigo: currentEmpresa.cod_empresa,
      }) ??
      undefined,
    [currentEmpresa],
  );

  const codCc = React.useMemo(
    () =>
      (currentCentroCosto && {
        nombre: currentCentroCosto.nombre_cc ?? "",
        codigo: currentCentroCosto.cod_cc,
      }) ??
      undefined,
    [currentCentroCosto],
  );

  const defaultFiltros: Partial<Filtros> = {
    // formato yyyy-mm-dd
    reporte: REPORTES_CRM[0] as SelectOption,
    cod_empresa: codEmpresa,
    cod_cc: codCc,
    cod_tipo_transporte: null,
    cod_usuario: null,
    cod_cliente: null,
    cod_tipo_pago: null,
  };

  const [filtros, setFiltros] = React.useState<Filtros>({
    ...defaultFiltros,
    fecha_inicio: inicioDeSemana,
    fecha_fin: finDeSemana,
  } as Filtros);

  const [calendarioAbierto, setCalendarioAbierto] = React.useState<string | null>(null);
  const [reconsultar] = React.useState(0);
  const [descargar, setDescargar] = React.useState(0);
  const [errorPdf, setErrorPdf] = React.useState<string | null>(null);
  const [generandoPdf, setGenerandoPdf] = React.useState(false);

  const reporte = React.useMemo(() => filtros.reporte?.value, [filtros.reporte]);

  const reporteSeleccionado = React.useMemo(
    () => REPORTES_CRM.find((r) => r.value === reporte),
    [reporte],
  );

  React.useEffect(() => {
    setErrorPdf(null);
    setGenerandoPdf(false);
    // setFiltros(
    //   (old) =>
    //     ({
    //       ...defaultFiltros,
    //       fecha_inicio: old.fecha_inicio,
    //       fecha_fin: old.fecha_fin,
    //     }) as Filtros,
    // );
  }, []);

  const onInput = <K extends keyof Filtros>({ id, val }: { id: K; val: Filtros[K] }) => {
    setFiltros((filtros) => ({
      ...filtros,
      [id]: val,
    }));
  };

  function renderSelectCatalogo<T extends SelectOption>({
    id,
    label,
    options,
    className,
    esObligatorio = false,
    esLectura = false,
    esVisible = true,
  }: {
    id: keyof Filtros;
    label: string;
    options?: T[];
    className?: string;
    esObligatorio?: boolean;
    esLectura?: boolean;
    esVisible?: boolean;
  }) {
    const idGenerado = id;
    const opciones = options ?? [];
    const value = (filtros[id] as T | null | undefined) ?? null;
    const valorSeleccionado = value?.value == null ? "__NULL_OPTION__" : String(value.value);
    const opcionesCombobox: ComboboxOption[] = opciones.map((option) => ({
      value: option.value == null ? "__NULL_OPTION__" : String(option.value),
      label: String(option.label ?? ""),
    }));

    return (
      <Field className={cn("flex flex-col", className, !esVisible && "hidden")}>
        <FieldLabel htmlFor={idGenerado}>
          {label}
          {esObligatorio ? " *" : ""}
        </FieldLabel>

        <div className="relative">
          <Combobox
            value={value == null ? "" : valorSeleccionado}
            onChange={(nextValue) => {
              const nextOption =
                opciones.find(
                  (option) =>
                    (option.value == null ? "__NULL_OPTION__" : String(option.value)) === nextValue,
                ) ?? null;
              onInput({ id, val: nextOption });
            }}
            options={opcionesCombobox}
            placeholder="Seleccione..."
            disabled={esLectura}
            className={value != null && !esLectura ? "pr-16" : ""}
            popoverClassName="z-[9999]"
          />

          {value != null && !esLectura ? (
            <button
              type="button"
              aria-label={`Limpiar ${label}`}
              title="Limpiar"
              className="absolute right-8 top-1/2 z-10 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-destructive"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onInput({ id, val: null });
              }}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </Field>
    );
  }

  const renderizarDate = ({
    id,
    label,
    className,
    min,
    max,
  }: {
    id: keyof Filtros;
    label: string;
    className?: string;
    min?: Date | string;
    max?: Date | string;
  }) => {
    const valor = filtros[id] as Date | string | null | undefined;
    const fecha = obtenerFecha(valor);
    const fechaMin = obtenerFecha(min);
    const fechaMax = obtenerFecha(max);
    const hoy = new Date();

    const fechaPermitida = (date: Date) => {
      const valorFecha = format(date, "yyyy-MM-dd");

      return (
        (!fechaMin || valorFecha >= format(fechaMin, "yyyy-MM-dd")) &&
        (!fechaMax || valorFecha <= format(fechaMax, "yyyy-MM-dd"))
      );
    };

    return (
      <Field className={cn("w-full", className)}>
        <FieldLabel htmlFor={id}>{label} *</FieldLabel>

        <Popover
          open={calendarioAbierto === id}
          onOpenChange={(open) => setCalendarioAbierto(open ? id : null)}
        >
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              data-empty={!fecha}
              className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground w-full"
            >
              <span className="w-full">{fecha ? format(fecha, "dd-MM-yyyy") : "Pick a date"}</span>
              <CalendarIcon />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={fecha}
              {...(fecha ? { defaultMonth: fecha } : {})}
              disabled={[
                ...(fechaMin ? [{ before: fechaMin }] : []),
                ...(fechaMax ? [{ after: fechaMax }] : []),
              ]}
              locale={es}
              onSelect={(date) => {
                if (!date || !fechaPermitida(date)) return;

                onInput({
                  id,
                  val: format(date, "yyyy-MM-dd"),
                });

                setCalendarioAbierto(null);
              }}
            />

            <div className="border-t p-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={!fechaPermitida(hoy)}
                onClick={() => {
                  if (!fechaPermitida(hoy)) return;

                  onInput({
                    id,
                    val: format(hoy, "yyyy-MM-dd"),
                  });

                  setCalendarioAbierto(null);
                }}
              >
                Hoy
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </Field>
    );
  };

  React.useEffect(() => {
    setFiltros((filtros) => ({
      ...filtros,
      cod_tipo_transporte: transportes[0] ?? null,
    }));
  }, [transportes]);

  React.useEffect(() => {
    setFiltros((filtros) => ({
      ...filtros,
      cod_empresa: codEmpresa,
      cod_cc: codCc,
    }));
  }, [codEmpresa, codCc]);

  return (
    <section className="w-full max-h-[85vh] overflow-auto bg-surface-1 p-4 md:p-6 space-y-5 relative">
      {false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 bg-card rounded-lg px-4 py-3 shadow-lg">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">Cargando datos...</span>
          </div>
        </div>
      )}

      {/* ── Filtros requeridos: Tipo de Seguimiento + Desde + Hasta, misma fila ── */}
      <Panel>
        <SectionHeader
          icon={<Filter className="w-4 h-4" />}
          title="Filtros requeridos"
          subtitle="Tipo de seguimiento y rango de fechas para consultar el reporte."
        />
        <div className="p-5 flex flex-col sm:flex-row sm:items-end gap-x-4">
          <div className="w-full sm:w-1/3">
            {renderSelectCatalogo({
              id: "reporte",
              label: "Reportes",
              options: REPORTES_CRM as unknown as SelectOption[],
            })}
            {/* <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Reportes</p>
            <Select value={reporte} onValueChange={(value: ReporteCrmId) => cambiarReporte(value)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecciona un reporte..." />
              </SelectTrigger>
              <SelectContent>
                {(REPORTES_CRM as unknown as SelectOption[]).map((t) => (
                  <SelectItem key={t.value} value={String(t.value)}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}
          </div>

          <div className="w-full sm:w-1/3">
            {renderizarDate({
              id: "fecha_inicio",
              label: "Fecha de inicio",
              max: filtros.fecha_fin,
            })}
          </div>

          <div className="w-full sm:w-1/3">
            {renderizarDate({ id: "fecha_fin", label: "Fecha final", min: filtros.fecha_inicio })}
          </div>

          <div className="w-full sm:w-1/3">
            <Button
              disabled={generandoPdf || reporte === "seleccione"}
              onClick={() => {
                setErrorPdf(null);
                setDescargar((p) => p + 1);
              }}
            >
              {generandoPdf ? "Generando PDF..." : "Descargar"}
            </Button>
            {errorPdf ? (
              <p role="alert" className="text-sm text-destructive">
                {errorPdf}
              </p>
            ) : null}
          </div>

          {reporte && (
            <Badge
              className={
                "" // hayFiltrosActivos ? "bg-amber-100 text-amber-800 border-amber-300 font-semibold" : "bg-brand-50 text-primary border-brand-200 font-semibold"
              }
              variant="outline"
            >
              {/* {totalRegistros} registro{totalRegistros !== 1 ? "s" : ""} */}
              {/* {hayFiltrosActivos ? " (filtrado)" : ""} */}
            </Badge>
          )}
        </div>
      </Panel>

      <Panel>
        <Accordion type="single" collapsible defaultValue="filtros">
          <AccordionItem value="filtros" className="border-none">
            <AccordionTrigger className="bg-brand-50 hover:no-underline [&>svg]:hidden p-0">
              <div className="flex items-center justify-between w-full pr-5">
                <SectionHeader
                  icon={
                    <span className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <Settings2 className="w-4 h-4" />
                    </span>
                  }
                  title={"Filtros y Configuración"}
                  subtitle={""}
                />
                <ChevronDown className="w-4 h-4 text-primary transition-transform duration-200 shrink-0" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-5 pt-4 w-full flex flex-row gap-2">
              <Panel className="w-full">
                <SectionHeader
                  icon={
                    <span className="flex items-center gap-2">
                      <Settings2 className="w-4 h-4" />
                    </span>
                  }
                  title={"Personaliza tu reporte"}
                  subtitle={"Define cómo se agrupan y desglosan los datos"}
                />
              </Panel>
              <Panel className="w-full">
                <SectionHeader
                  icon={
                    <span className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                    </span>
                  }
                  title={"Filtros"}
                  subtitle={"Acota el universo de seguimientos a analizar"}
                />
                <div className="p-2">
                  {reporteSeleccionado?.campos.cliente &&
                    renderSelectCatalogo({ id: "cod_cliente", label: "Cliente", options: [] })}
                  {reporteSeleccionado?.campos.usuario &&
                    renderSelectCatalogo({
                      id: "cod_usuario",
                      label: "Usuario",
                      options: usuarios,
                    })}
                  {reporteSeleccionado?.campos.tipoPago &&
                    renderSelectCatalogo({
                      id: "cod_tipo_pago",
                      label: "Tipo de Pago",
                      options: tiposPago,
                    })}
                </div>
              </Panel>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Panel>

      {/* Una sola instancia recibe la descarga; las vistas visibles no generan el PDF. */}
      {reporte === "hit-rate" && (
        <HitRate
          filtros={filtros}
          reconsultar={reconsultar}
          tipo="descarga"
          descargar={descargar}
          onErrorPdf={setErrorPdf}
          onGenerandoPdf={setGenerandoPdf}
        />
      )}
      {reporte === "realizacion-de-precio" && (
        <RealizacionDePrecio
          filtros={filtros}
          reconsultar={reconsultar}
          tipo="descarga"
          descargar={descargar}
          onErrorPdf={setErrorPdf}
          onGenerandoPdf={setGenerandoPdf}
        />
      )}
      {reporteSeleccionado?.tabla && (
        <Panel key={`tabla-${reporte}`}>
          <SectionHeader
            icon={<Table2Icon className="w-4 h-4" />}
            title={reporteSeleccionado?.label ? "Tabla de Datos" : "Seleccione un reporte"}
            subtitle={reporteSeleccionado?.descripcion}
            // action={<></>}
          />

          {/* <pre>{JSON.stringify({ reporte }, null, 2)}</pre> */}
          <div className="p-4">
            {reporte === "seleccione" && <div />}
            {reporte === "hit-rate" && (
              <HitRate filtros={filtros} reconsultar={reconsultar} tipo="tablas" />
            )}
            {reporte === "realizacion-de-precio" && (
              <RealizacionDePrecio filtros={filtros} reconsultar={reconsultar} tipo="tablas" />
            )}
          </div>
        </Panel>
      )}

      {reporteSeleccionado?.campos.usuario && (
        <Panel key={`grafica-usuario-${reporte}`}>
          <SectionHeader
            icon={<ChartColumnBig className="w-4 h-4" />}
            title={reporteSeleccionado?.label ? "Gráfica de Usuarios" : "Seleccione un reporte"}
            subtitle={reporteSeleccionado?.descripcion}
            // action={<></>}
          />
          {/* <pre>{JSON.stringify({ reporte }, null, 2)}</pre> */}
          <div className="p-4">
            {reporte === "seleccione" && <div />}
            {reporte === "hit-rate" && (
              <HitRate filtros={filtros} reconsultar={reconsultar} tipo="grafica-usuario" />
            )}
            {reporte === "realizacion-de-precio" && (
              <RealizacionDePrecio
                filtros={filtros}
                reconsultar={reconsultar}
                tipo="grafica-usuario"
              />
            )}
          </div>
        </Panel>
      )}

      {reporteSeleccionado?.campos.tipoTransporte && (
        <Panel key={`grafica-transporte-${reporte}`}>
          <SectionHeader
            icon={<ChartColumnBig className="w-4 h-4" />}
            title={reporteSeleccionado?.label ? "Gráfica de Transportes" : "Seleccione un reporte"}
            subtitle={reporteSeleccionado?.descripcion}
            action={renderSelectCatalogo({
              id: "cod_tipo_transporte",
              label: "Tipo de Transporte",
              options: transportes,
            })}
          />
          {/* <pre>{JSON.stringify({ reporte }, null, 2)}</pre> */}
          <div className="p-4">
            {reporte === "seleccione" && <div />}
            {reporte === "hit-rate" && (
              <HitRate filtros={filtros} reconsultar={reconsultar} tipo="grafica-transporte" />
            )}
            {reporte === "realizacion-de-precio" && (
              <RealizacionDePrecio
                filtros={filtros}
                reconsultar={reconsultar}
                tipo="grafica-transporte"
              />
            )}
          </div>
        </Panel>
      )}

      {reporteSeleccionado?.graficas && (
        <Panel key={`grafica-otros-${reporte}`}>
          <SectionHeader
            icon={<ChartColumnBig className="w-4 h-4" />}
            title={reporteSeleccionado?.label ? "Gráfica de Datos" : "Seleccione un reporte"}
            subtitle={reporteSeleccionado?.descripcion}
            // action={<></>}
          />
          {/* <pre>{JSON.stringify({ reporte }, null, 2)}</pre> */}
          <div className="p-4">
            {reporte === "seleccione" && <div />}
            {reporte === "hit-rate" && (
              <HitRate filtros={filtros} reconsultar={reconsultar} tipo="grafica-otros" />
            )}
            {reporte === "realizacion-de-precio" && (
              <RealizacionDePrecio
                filtros={filtros}
                reconsultar={reconsultar}
                tipo="grafica-otros"
              />
            )}
          </div>
        </Panel>
      )}
      {/* <pre>{JSON.stringify({ reporte }, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(filtros, null, 2)}</pre> */}
    </section>
  );
}
